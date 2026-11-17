# Domain 2 (part 1): Threat actors, threat vectors and vulnerabilities
Checked as of 2026-11 for SY0-701.

## 2.1 Threat actors and what drives them
Depth asked: compare and contrast. A good answer names the actor, places it on the three attributes (internal or external, resources, sophistication) and ties it to a motive, and explains why a look-alike actor fits worse.

### Threat actor (threat source, adversary)
A threat actor is the person or group behind a harmful security event, whether it happens on purpose or by carelessness. NIST describes it simply as an individual or group that poses a threat, and risk documents call it the source that can cause harmful impact. Knowing the actor lets defenders predict what tools, patience and targets to expect, which shapes the controls they buy.

How to classify an actor, in order:
1. Decide where it sits: inside the organization with legitimate access, or outside needing a way in. This sets which controls even apply.
2. Estimate its resources: money, people, time and tooling. Resources limit how long and how custom an attack can be.
3. Estimate its sophistication: does it reuse public tools or write its own and find new flaws?
4. Name the motive: money, secrets, damage, a cause, a grudge or helping. The motive usually decides between two actors that look alike on skill.
The common wrong order is to jump to the motive from one clue (for example "they wanted money") without checking who is behind it.

This objective covers six actor types: two internal ones (insider threat and shadow IT) and four that are normally external (nation-state, organized crime, hacktivist and unskilled attacker).
**Why it matters:** Defending against a teenager running a downloaded tool and against a government team with custom malware are different budgets. Mismatching the actor wastes money on the wrong controls or leaves the real threat unaddressed.

**Common confusions:** A threat actor is not the same as a threat vector. The actor is who attacks, while the vector is the path used, such as email or a USB drive. Shadow IT counts as a threat actor in this objective even though the people involved usually mean no harm. An outsider who logs in with stolen credentials is still an external actor, because the access was never legitimately theirs.

**Scenario:** Clue: a security team finds that a breach used phishing, then months of quiet data theft with custom tools that antivirus never flagged. Answer: classify the actor as a well resourced, highly sophisticated external group, most likely a nation-state running an advanced persistent threat. The closest wrong answer, an unskilled attacker, fails because custom, undetected tooling and months of patience require skill and funding that group lacks.

### Nation-state actor and advanced persistent threat (APT)
A nation-state actor is a government, or a group working for one, that attacks other countries, companies or people to serve national goals. It sits at the top of every attribute scale: external, the most resources and the most sophistication. Its long, stealthy campaigns are called advanced persistent threats (APTs).

How an APT campaign typically unfolds:
1. Gain a foothold through any route that works, including cyber, physical and deception methods.
2. Widen the foothold quietly, because staying hidden keeps the access useful.
3. Pursue the goal over months or years: steal information, disrupt a mission, or position for future attacks.
4. Adapt when defenders react rather than giving up. Persistence is the defining trait, not speed.

US government guidance names several states as elevated cyber threats and describes goals that include espionage, theft of intellectual property, disruption and infiltration of critical infrastructure networks. It also notes that one state uses cyber operations to raise revenue, which is why motive alone cannot identify the actor.

**Why it matters:** A nation-state can afford zero-day exploits and custom implants, so prevention alone will fail at some point. Organizations that hold defense, government, energy or research data need detection, logging and response plans that assume an intruder may already be inside.

**Common confusions:** A rich, skilled criminal gang after money is organized crime, not a nation-state, even if its tools look similar. A state unit that steals money is still a nation-state actor, so decide by who is behind the attack. APT describes the style of campaign (advanced, persistent, adaptive), not a separate actor type, although in practice the label is most often applied to state-backed groups.

**Scenario:** Clue: investigators find an intruder that has sat inside a defense contractor's design network for two years, deleting its own logs and switching tools each time one is blocked. Answer: a nation-state APT motivated by espionage. The closest wrong answer, organized crime, fails because criminals usually cash out quickly through ransom or sale, while this actor stays hidden to keep collecting secrets.

### Unskilled attacker (script kiddie)
An unskilled attacker runs tools, scripts or exploits that other people wrote, often without understanding how they work. This objective uses the term in place of the older nickname script kiddie. On the attributes it is external, poorly funded and low in sophistication.

How an unskilled attack usually looks:
1. Download a ready-made tool: a denial-of-service script, a port scanner or a public exploit.
2. Point it at a target chosen for fun, notoriety or a personal grudge, often with no research.
3. Launch it loudly. These attacks are noisy and easy to log because the attacker does not hide.

**Why it matters:** Low skill does not mean low damage. A ready-made exploit against an unpatched server works no matter who runs it. Basic hygiene (patching, closing unused services, changing default passwords) stops most of these attackers, which is why it is the first spending priority.

**Common confusions:** "Unskilled" describes capability, not age. A hacktivist with low skill is still a hacktivist if the attack serves a cause. Motives for unskilled attackers are usually curiosity, bragging or chaos rather than money or politics.

**Scenario:** Clue: a school's website goes down for an afternoon; the traffic came from a free stress-testing tool, and a student boasted about it online. Answer: an unskilled attacker motivated by disruption or notoriety. The closest wrong answer, a hacktivist, fails because there is no cause or message, only bragging.

**Worked example:** a web server log shows thousands of identical requests per second from a single tool user agent with no attempt to vary them. The uniformity and lack of disguise point to a downloaded tool run by someone with little skill.

### Hacktivist (hacktivism)
A hacktivist hacks to promote a political, social or ideological cause rather than for profit. Hacktivism sits on the motive side of the comparison: the cause is the defining feature, while skill and funding vary widely from lone people with free tools to coordinated groups.

Common hacktivist methods and why each is chosen:
1. Distributed denial-of-service (DDoS): needs no stealth or persistence and can be timed to a news event.
2. Website defacement: replaces page content with a protest message, often through a known flaw in a content management system.
3. Hack and leak: steals internal documents and publishes them to embarrass the target.
4. Doxxing: publishes private details about executives or officials to intimidate them.

**Why it matters:** A company that takes a public stance, or works in a controversial sector, can become a target overnight. The damage is often reputational (a defaced home page, leaked emails) as much as technical, so communications and incident response plans need to cover it.

**Common confusions:** Hacktivism is defined by the cause, not the technique; the same DDoS by an extortionist is criminal. Some groups that present themselves as hacktivists are believed to be fronts for states, which makes attribution hard, so judge from the evidence at hand. A leak by an angry employee is an insider threat, not hacktivism, unless the clue stresses a cause.

**Scenario:** Clue: the day after an energy company announces a new pipeline, its home page shows a protest banner and internal memos appear on a public site. Answer: hacktivists motivated by philosophical or political beliefs. The closest wrong answer, organized crime, fails because nothing is sold or ransomed; the aim is public pressure.

### Insider threat (malicious, negligent and accidental insiders)
An insider is anyone who has or had authorized access to, or knowledge of, an organization's people, facilities, data or systems: employees, contractors, vendors, cleaners and repair staff. The insider threat is the risk that such a person uses that access to cause harm, whether deliberately or by mistake. It is the main internal actor, and it threatens all three legs of confidentiality, integrity and availability.

Types of insider threat:
1. Intentional (malicious): harms the organization for gain or to settle a grievance, such as leaking data, sabotage or theft of intellectual property.
2. Negligent: knows the rules but ignores them, for example letting someone follow them through a secure door or skipping patches.
3. Accidental: makes an honest mistake, such as emailing a sensitive file to the wrong person or clicking a phishing link.
4. Collusive: works with an outsider, often a criminal, to commit fraud, theft or espionage.
5. Third-party: a contractor or vendor granted access without being staff.

**Why it matters:** Insiders already pass the perimeter and know where valuable data lives, so firewalls do not stop them. Controls must work inside: least privilege, separation of duties, activity monitoring, data loss prevention and prompt removal of access when someone leaves.

**Common confusions:** An outsider who steals an employee's password is still an external actor using a stolen credential. A careless insider is still an insider threat even with no bad intent. Shadow IT is also internal, but it describes unapproved technology use, not misuse of granted access to cause harm.

**Scenario:** Clue: a database administrator who was passed over for promotion exports the customer table to a personal drive the week before resigning. Answer: a malicious insider threat motivated by revenge or financial gain. The closest wrong answer, shadow IT, fails because the personal drive is only the tool; the defining fact is deliberate misuse of legitimate access.

### Organized crime (cybercriminal groups)
Organized crime groups attack for profit and run like businesses, with specialist roles, budgets and customer support for their victims' payments. On the attributes they are external, well funded and highly skilled. Their defining motive is financial gain.

How a typical criminal operation earns money:
1. Get in cheaply and at scale: phishing, stolen credentials or exploiting known flaws.
2. Find what the victim will pay to recover or keep secret.
3. Monetize: ransomware that makes files and systems unusable, theft of data for sale, fraud such as business email compromise, or extortion.
4. Add pressure, for example threatening to publish stolen data if the ransom is not paid.

**Why it matters:** Ransomware stops hospitals, cities and factories, and US government guidance notes rising incidents against local governments and critical infrastructure. The business impact is downtime, recovery cost, possible ransom, legal exposure and lost trust.

**Common confusions:** Skill and funding do not separate organized crime from a nation-state; the money motive does. Blackmail by a criminal group is still financially motivated at heart. A lone fraudster after money is not "organized"; a professional, profit-driven group with roles and a budget is what the term describes.

**Scenario:** Clue: a city's servers are encrypted overnight and a note demands cryptocurrency, adding that stolen records will be posted if the city does not pay. Answer: organized crime with a financial gain motive, using blackmail as leverage. The closest wrong answer, hacktivist, fails because the demand is payment, not a political change.

### Shadow IT (unsanctioned technology)
Shadow IT is hardware, software or cloud services that staff use for work without the knowledge or approval of the IT or security team. It is an internal actor that is usually not malicious: people adopt it because it is faster or easier than the approved route. It counts only for tools that authorized users bring in, not malware planted by attackers.

How shadow IT creates risk:
1. A team signs up for a file sharing, messaging or project tool, or uses a personal device, to get work done.
2. Company data moves into it, outside backups, monitoring and access reviews.
3. Nobody patches or configures it to company standards, because nobody responsible knows it exists.
4. Compliance rules (such as payment card or privacy laws) are broken without anyone deciding to break them.

**Why it matters:** You cannot protect what you do not know about. Shadow IT causes data leaks, failed audits and fines, and gaps in incident response when the breached system was never on the asset list. Fixes are discovery (attack surface management, cloud access security brokers), clear policy and fast approval of good alternatives, because bans alone push use further underground.

**Common confusions:** Shadow IT is not an insider attack; intent is convenience, not harm. It is also not the same as an unsupported system, which IT knows about but can no longer patch.

**Scenario:** Clue: an audit finds the sales team storing customer lists in a free online spreadsheet tool linked to personal accounts. Answer: shadow IT. The closest wrong answer, insider threat, fails because nobody meant to harm the company; the risk comes from unmanaged, unapproved technology.

### Threat actor attributes: internal or external, resources and funding, sophistication and capability
Three attributes describe any threat actor and predict what it can do. Internal or external is about position: whether the actor already has legitimate access. Resources and funding are about money, people, time and tools. Sophistication and capability are about skill, from reusing other people's tools to writing custom malware and finding unknown flaws.

How to apply the attributes:
1. Position first: internal actors (insiders, shadow IT) bypass perimeter controls, so internal monitoring matters most; external actors need a vector, so perimeter and email controls matter most.
2. Resources second: well funded actors can sustain long campaigns and buy or build zero-day exploits; poorly funded ones rely on free tools.
3. Sophistication third: it usually follows funding, but not always, since a lone expert can be skilled and poor.

**Why it matters:** Attributes turn a vague fear into a plan. A highly capable, well funded external actor justifies investment in detection and response; a low capability actor is handled mainly with patching and configuration.

**Common confusions:** Funding and sophistication are separate attributes even though they often move together. An insider can be unskilled yet dangerous, because access substitutes for skill. "External with stolen credentials" stays external.

**Scenario:** Clue: a reviewer asks which attribute best explains why a disgruntled clerk could copy payroll files that a skilled outside group failed to reach. Answer: internal or external position; the clerk already had legitimate access. The closest wrong answer, sophistication, fails because the outsider was more skilled and still did not get in.

### Comparing threat actors (nation-state, organized crime, hacktivist, unskilled, insider, shadow IT)
Use this table when two actors seem to fit. Read the motive and position first, then use funding and skill to break ties.

| Actor | Position | Resources | Sophistication | Decisive clue |
|---|---|---|---|---|
| Nation-state | External | Very high | Very high, APT style | Long, stealthy campaign for state goals such as espionage or war |
| Organized crime | External | High | High | Profit: ransom, fraud, data for sale |
| Hacktivist | Usually external | Low to medium | Varies widely | A cause or protest message |
| Unskilled attacker | Usually external | Low | Low | Ready-made tools, bragging, no plan |
| Insider threat | Internal | Uses existing access | Varies | Legitimate access misused, on purpose or by mistake |
| Shadow IT | Internal | Department budget | Usually low | Unapproved technology adopted for convenience |

APT means advanced persistent threat: a long, adaptive, hidden campaign.

How to pick the actor from a clue:
1. Does the person already have legitimate access? Then choose between insider threat (misuse, on purpose or by mistake) and shadow IT (unapproved tools for convenience).
2. Is there a cause or protest message? Hacktivist.
3. Is the goal payment? Organized crime, unless the clue names a state.
4. Is it long, stealthy and aimed at secrets or infrastructure? Nation-state.
5. Is it noisy, with downloaded tools and no plan? Unskilled attacker.

**Common confusions:** The table gives typical values, not rules. A state can steal money, and a hacktivist can be highly skilled. When clues conflict, the stated motive and who is behind the act win over skill level.

**Scenario:** Clue: an attack is technically advanced and demands ransom, with no political message and no sign of state links. Answer: organized crime. The closest wrong answer, nation-state, fails because nothing points to state direction and the goal is quick payment.

### Financial gain and blackmail (money motivations)
Financial gain means attacking to make money: ransom, fraud, theft of funds, or selling stolen data and access. It is the most common motive and the defining motive of organized crime, though insiders and some states also pursue it. Blackmail means forcing a victim to pay or act by threatening to release damaging information or to keep causing harm.

How the two connect in a typical extortion:
1. The attacker steals sensitive data or gains control of systems.
2. The attacker encrypts systems, or simply holds the stolen data.
3. The attacker threatens to publish or sell the data unless paid, which is blackmail.
4. Payment, if made, is the financial gain behind the blackmail.

**Why it matters:** Money-driven attackers choose victims who can pay and cannot tolerate downtime, such as hospitals and manufacturers. Defenses that remove leverage, such as tested offline backups and encryption of stored data, reduce the payoff.

**Common confusions:** Blackmail is the method of pressure; financial gain is usually the end goal. Blackmail can also demand an action rather than money, such as leaking more information. Data exfiltration is the act of moving data out; it becomes blackmail only when the stolen data is used as a threat.

**Scenario:** Clue: attackers email an executive saying they hold copies of private board messages and will post them unless paid within 48 hours. Answer: blackmail, with financial gain as the end goal. The closest wrong answer, espionage, fails because the attacker announces the theft to extract payment instead of keeping it secret.

### Data exfiltration and espionage (motivations for stealing secrets)
Data exfiltration is the unauthorized transfer of data out of an organization, whether to sell it, use it as leverage or exploit its intelligence value. Espionage is spying to obtain secret information, such as government intelligence or a rival's trade secrets. Both attack confidentiality.

How they differ in practice:
1. Exfiltration is an action that can serve many goals: a criminal sells card numbers, an extortionist uses them as leverage, a spy hands them to a government.
2. Espionage is a goal: gather intelligence while staying hidden, because discovery ends the flow of secrets.
3. Espionage is typical of nation-states and of corporate rivals; exfiltration appears in almost every breach where data leaves.

**Why it matters:** Stolen designs or negotiation plans can cost a company its market lead; stolen personal data brings breach notifications, fines and lawsuits. Data loss prevention, encryption of sensitive data and monitoring of unusual outbound traffic reduce both.

**Common confusions:** Exfiltration describes moving data out; espionage describes why. A large outbound transfer at 3 a.m. is an exfiltration clue, not proof of espionage. When a scenario stresses stealth and intelligence value, the motive is espionage; when it stresses data leaving, it is data exfiltration.

**Scenario:** Clue: a foreign group quietly copies a defense contractor's aircraft designs over many months, never demanding anything. Answer: espionage. The closest wrong answer, financial gain, fails because nothing is sold or ransomed; the value is the intelligence itself.

**Worked example:** a firewall log shows a workstation that normally sends a few megabytes a day uploading 40 gigabytes to an unfamiliar cloud address overnight. That pattern is an exfiltration indicator; the motive still has to be inferred from other clues.

### Service disruption, disruption and chaos, and war (motivations for causing damage)
Service disruption means making a system or service unavailable to its users, an attack on availability, often to serve another goal such as extortion or protest. Disruption and chaos means causing trouble for its own sake, with no money or cause behind it. War means cyber attacks by one nation against another as part of conflict or military strategy, frequently against critical infrastructure.

How to tell them apart:
1. Ask what the outage serves. A ransom demand or protest message makes it service disruption in support of that goal.
2. If nothing is asked for and no cause is named, and the attacker seems to enjoy the trouble, it is disruption and chaos.
3. If a state is attacking another state's power, communications, government or military systems, especially alongside armed conflict, it is war.

**Why it matters:** Downtime has a direct price: lost sales, missed patient care, halted production. Availability controls (redundancy, distributed denial-of-service (DDoS) protection, tested recovery plans) matter most against these motives.

**Common confusions:** Service disruption names the effect on availability; disruption and chaos names a motive with no further goal. A hacktivist DDoS is service disruption driven by philosophical beliefs, not chaos. War requires a nation-state behind it; a criminal outage of a power company is not war.

**Scenario:** Clue: during an armed conflict, malware shuts down parts of one country's power grid, and officials link it to the other side's military. Answer: war, carried out by a nation-state. The closest wrong answer, disruption and chaos, fails because the attack serves a military strategy rather than mischief.

### Philosophical or political beliefs, revenge and ethical hacking (belief and grievance motivations)
Philosophical or political beliefs drive attacks that advance a cause or ideology instead of earning money; this is the defining motive of hacktivists. Revenge drives attacks meant to get back at a person or organization for a perceived wrong, most often by current or former insiders. Ethical hacking is security testing done with good intent and permission, to find weaknesses so they get fixed.

How ethical hacking stays ethical:
1. Get authorization first, through a contract, a penetration test scope or a published vulnerability disclosure policy.
2. Stay inside the agreed scope and avoid harm, such as not keeping or sharing personal data found during testing.
3. Report findings to the owner, giving time to fix them before any public disclosure.
A US federal directive, for example, requires agencies to publish policies that treat good-faith research inside the policy as authorized and promise not to pursue legal action over it.

**Why it matters:** Revenge attacks are preventable with prompt account removal at termination and least privilege. Ethical hackers, through penetration tests and bug bounties, find flaws before criminals do, which is cheaper than a breach.

**Common confusions:** Ethical is a motivation, not an actor type; the people are usually penetration testers or researchers. Permission is what separates ethical hacking from a crime, not good intentions alone. Revenge can look like sabotage or data theft; the clue is a recent grievance such as firing or demotion.

**Scenario:** Clue: two days after being fired, a former engineer's still-active remote access account is used to delete project files. Answer: revenge by an insider threat. The closest wrong answer, philosophical beliefs, fails because the act is personal retaliation, with no cause or public message.

### Comparing threat actor motivations (money, secrets, disruption, war, beliefs, revenge, ethical)
Pick the motive from what the attacker wants at the end, not from the technique used.

| Motive | Decisive clue | Typical actor |
|---|---|---|
| Financial gain | Payment, fraud, data sold | Organized crime |
| Blackmail | "Pay or we release it" | Organized crime |
| Data exfiltration | Data moved out without authorization | Any external actor or insider |
| Espionage | Secret, long collection of intelligence | Nation-state, corporate rival |
| Service disruption | Availability lost to serve another goal | Hacktivist, extortionist, state |
| Disruption and chaos | Trouble for its own sake | Unskilled attacker |
| War | State against state, often infrastructure | Nation-state |
| Philosophical or political beliefs | A cause, protest message | Hacktivist |
| Revenge | Recent grievance | Insider threat |
| Ethical | Authorized, findings reported | Penetration tester, researcher |

**Common confusions:** One attack can show several motives: ransomware disrupts service, exfiltrates data, blackmails and earns money. Name the motive the clue emphasizes, usually the end goal.

**Scenario:** Clue: a group takes a bank's website offline and posts a manifesto against its lending policy. Answer: philosophical or political beliefs, with service disruption as the method. The closest wrong answer, disruption and chaos, fails because a stated cause is present.

## 2.2 Threat vectors and attack surfaces
Depth asked: explain. A good answer names the path an attacker uses, says how it widens the attack surface, and gives the main control that narrows it; for social engineering, it names the technique from its channel or its defining trick.

### Threat vector vs attack surface (attack vector)
A threat vector, also called an attack vector, is the route or method an attacker uses to reach a weakness: an email, a USB drive, an open port, a phone call. The attack surface is the full set of points where an attacker could try to get in, cause an effect or pull data out of a system or environment. Vectors are the doors being used; the attack surface is every door, window and vent that exists.

How the two relate when hardening:
1. Inventory the attack surface: services, open ports, installed software, accounts, devices, third-party connections, people who can be tricked.
2. Remove what is not needed: close ports, uninstall software, disable unused accounts, change defaults. Each removal shrinks the surface for good.
3. Control the vectors that must stay: filter email, scan files, require authentication on network ports, train people.
The common wrong order is buying vector-specific tools before removing unneeded exposure, which leaves more to defend.

**Why it matters:** Every added service, app, device and vendor connection is another place to attack. A smaller attack surface means fewer patches to apply, fewer logs to watch and fewer chances for a single mistake to become a breach.

**Common confusions:** The attack surface is not the same as a vulnerability; an open port is part of the surface whether or not the service behind it has a flaw. A vector is not an actor; a phishing email is the vector, the criminal gang sending it is the actor. Social engineering is a vector through people, so staff are part of the attack surface.

**Scenario:** Clue: a new web server runs a database, a mail service and remote administration, though it only needs to serve web pages. Answer: the attack surface is larger than necessary; disable the unneeded services. The closest wrong answer, "add an intrusion detection system," fails because it watches the extra doors instead of closing them.

### Email as a threat vector (message-based vector)
Email is one of the most used message-based vectors: messages carry fraudulent links, malicious attachments or requests that trick staff into paying money or sharing data. Message-based vectors as a group cover email, Short Message Service (SMS) text and instant messaging (IM). Email sits at the start of many attacks, giving initial access.

How an email attack usually works:
1. The attacker fakes or borrows a trusted sender: a spoofed address, a lookalike domain or a real hacked mailbox.
2. The message creates urgency or curiosity (an invoice, a password expiry, a delivery problem).
3. The victim opens an attachment that runs code, or clicks a link to a fake sign-in page that captures credentials.
4. The attacker uses the access or credentials for the next step: malware, account takeover or fraud.

Defenses work in layers: filtering for spam and malware, sender authentication records (Sender Policy Framework, DomainKeys Identified Mail and Domain-based Message Authentication, Reporting and Conformance, covered with email security in objective 4.5), blocking risky attachment types, multifactor authentication so stolen passwords are not enough, and user training. A large annual breach study for 2025 ranked phishing third among initial access routes, behind credential abuse (about 22 percent of breaches) and exploited vulnerabilities (about 20 percent).

**Why it matters:** One click can start ransomware or wire fraud. Email reaches every employee, so even a low success rate yields victims.

**Common confusions:** Email is the vector; phishing is the social engineering technique carried by it. A real compromised mailbox passes sender authentication checks, so those records stop spoofing but not account takeover.

**Scenario:** Clue: staff receive a message that appears to come from the internal help desk, saying their password expires today and linking to a sign-in page on an unfamiliar domain. Answer: an email-based phishing vector. The closest wrong answer, a watering hole, fails because the attacker contacts the victims directly instead of waiting for them on a site they already visit.

### Short Message Service (SMS) and instant messaging (IM) as threat vectors
Short Message Service (SMS) text messages and instant messaging (IM) platforms are message-based vectors that deliver malicious links, files and social engineering outside the email system. Phishing by SMS is called smishing. IM covers workplace chat, consumer messengers and social media direct messages.

How these channels are abused:
1. SMS: a text claims an urgent problem (a parcel fee, a locked bank account, a toll payment) and includes a link, phone number or email address that triggers action when tapped. Small phone screens make the real destination hard to inspect.
2. IM: the attacker uses a fake profile, such as a recruiter, or a hacked colleague's account, builds rapport, then sends a link or file.
3. Both channels often sit outside the organization's email filtering, so fewer automated checks see the message.
4. If the first lure fails, the attacker keeps chatting and tries again.

**Why it matters:** Organizations that invested heavily in email security can still be breached through a text or a chat message, especially on personal phones that also hold work accounts.

**Common confusions:** Smishing is the attack name; SMS is the channel. A message from a known contact on chat is not automatically safe, because the contact's account may be compromised. Phishing over IM is still phishing in the broad sense, while the word smishing is reserved for SMS text messages.

**Scenario:** Clue: an employee gets a chat message from a coworker's account with a "shared budget file" link; the coworker later says they never sent it. Answer: an instant messaging vector using a compromised account. The closest wrong answer, smishing, fails because the message came through a chat platform, not an SMS text.

### Image-based threat vector (SVG smuggling and steganography)
An image-based vector uses picture files to carry or hide malicious content. Two forms matter: scalable vector graphics (SVG) files, which are text in XML format and can contain scripts and web content, and steganography, which hides data or code inside ordinary looking images. People and some filters treat pictures as harmless, which is what makes this vector work.

How each works:
1. SVG smuggling: an "image" attachment opens in a browser and runs embedded JavaScript that redirects to a phishing page, shows a fake sign-in form, or assembles and downloads a payload.
2. Steganography for delivery: a malware loader downloads an innocent looking PNG or JPG and extracts hidden code from its pixel data.
3. Steganography for theft: malware hides stolen data inside an image before sending it out, so the traffic looks like a picture upload.

**Why it matters:** Filters that allow image types through, and users who would never open an executable but will open a picture, both create a gap. Sandboxing attachments, treating SVG like active content and watching for scripts or interpreters launched after an image opens reduce the risk.

**Common confusions:** Steganography hides that a message exists; encryption hides what a message says. An SVG is not a pixel image; its ability to carry script is the risk. An image is not dangerous just because it was emailed; the sign of this vector is hidden code or script behavior.

**Scenario:** Clue: users report that opening an emailed "invoice.svg" opened a browser tab showing a corporate sign-in page. Answer: an image-based vector using an SVG that carries script. The closest wrong answer, file-based macro malware, fails because no document macro ran; the picture file itself held the script.

### File-based threat vector (malicious files, macros and attachments)
A file-based vector delivers malicious code inside a file the user is persuaded to open: Office documents with macros, PDF and rich text files, executables disguised as documents, shortcut files, disk images and compressed archives. It depends on user execution, so social engineering usually comes with it.

How a typical file-based attack runs:
1. The file arrives as an attachment, on a shared folder or as a download, named to look routine ("Q3 report", "invoice").
2. Masquerading hides the real type, or a password-protected archive slips past scanners with the password in the email.
3. The document asks the user to "enable content", which runs a Visual Basic for Applications (VBA) macro.
4. The macro or executable downloads more malware or opens a remote session.

Microsoft changed Office on Windows to block macros by default in files carrying the Mark of the Web, the tag Windows adds to files from the internet, after noting that VBA macros are a common route for malware and ransomware. Further defenses: attachment scanning and sandboxing, blocking risky file types, application allow lists, and endpoint rules that stop Office apps from launching executables.

**Why it matters:** One opened attachment can give an attacker a foothold on the internal network, from which ransomware spreads.

**Common confusions:** File-based means the payload rides inside a file; image-based is a special case using pictures. A macro document is not a virus by definition; what the code does decides the malware type. Disabling macros entirely may break business work, so signed macros from trusted publishers are the usual middle path.

**Scenario:** Clue: an accounts clerk opens "Invoice_0425.docm", clicks Enable Content, and the endpoint tool then sees Word starting PowerShell. Answer: a file-based vector using a malicious macro. The closest wrong answer, drive-by download, fails because the user opened a file and enabled its code; nothing ran merely from browsing.

### Voice call threat vector
The voice call vector uses phone calls, voicemail and internet voice tools to deceive people into revealing information or taking an action. Phishing by voice is called vishing. It needs no malware: the victim does the work, such as reading out a code or installing a remote support tool.

How a voice attack usually runs:
1. The caller poses as a trusted role, often IT support, the bank or a senior manager, and may spoof the caller ID.
2. The caller creates urgency or alarm ("your account is being used for fraud right now").
3. The caller asks for a one-time code, a password reset, approval of a multifactor prompt, or installation of a remote management tool.
4. In callback phishing, an email or text first asks the victim to phone a number, so the victim feels they started the call.

**Why it matters:** Help desks that reset passwords by phone are prime targets; a convincing call can hand over an account protected by multifactor authentication. Call-back verification to a known number and strict identity checks for resets break the chain.

**Common confusions:** Vishing is the attack technique; voice call is the vector. Caller ID proves nothing, since it can be faked. A caller with a false story is also pretexting; when the phone channel is the point, the technique is vishing.

**Scenario:** Clue: a caller claiming to be from the service desk asks an employee to approve "a test push notification" while he fixes her mailbox. Answer: a voice call vector (vishing) used to defeat multifactor authentication. The closest wrong answer, smishing, fails because the contact came through a phone call, not a text message.

### Removable device threat vector (USB and removable media)
The removable device vector uses USB drives, external disks, memory cards and even phones connected by cable to bring malware in or carry data out. Because the media moves physically, it can cross into networks with no internet connection, including air-gapped ones.

How removable media attacks work:
1. The attacker places malware on media: by tampering with it, dropping branded or tempting drives where staff will find them, or infecting a machine used to prepare drives.
2. A user connects it, and autorun features or a disguised file name get the code executed.
3. The malware copies itself to other drives inserted later, spreading between systems, which is how some worms reached isolated industrial networks.
4. A related hardware vector uses devices that act like something else, such as a USB gadget that types commands like a keyboard (keystroke injection) or adds a network adapter.

**Why it matters:** An air gap protects only until someone carries a drive across it. Disabling autorun, blocking or restricting removable storage by policy, endpoint rules that stop untrusted executables running from USB, and training staff not to plug in found devices close this vector.

**Common confusions:** Removable device is a vector; a USB keystroke injector is a malicious hardware device, not storage, so blocking storage alone does not stop it (device control and port controls do). Data walking out on a USB drive is data exfiltration through this same vector.

**Scenario:** Clue: drives labeled "Salary review" are found in a parking lot; one employee plugs one in and a hidden program runs. Answer: the removable device vector, with baiting as the social engineering trick. The closest wrong answer, file-based email attachment, fails because the payload arrived physically, not through a message.

### Vulnerable software as a threat vector: client-based vs agentless
Vulnerable software is any program, on a client, server or device, with a flaw that an attacker can exploit; every installed program adds to the attack surface. The objective contrasts two ways software reaches users. Client-based software is installed on each device, so a flaw exists on every endpoint and every copy must be updated. Agentless software installs nothing on the device; users reach a central system, such as a web application, each time, so fixing the center fixes everyone, but a compromised center can reach everyone too.

How each fails and gets fixed:
1. Client-based: a flaw in an installed desktop app or browser plugin lets a malicious file or website run code on that endpoint. Fix: patch every copy, remove unneeded software, scan endpoints.
2. Agentless: a flaw in the central web application lets an attacker change what it serves, so every user who connects receives the attacker's content. Fix: patch and harden the central system once.
3. In both cases, an inventory of software and versions shows what to patch.

**Why it matters:** Client-based fleets need reliable patch distribution to thousands of devices; one missed laptop is enough. Agentless designs concentrate risk, so the central server deserves the strongest protection and monitoring.

**Common confusions:** Agentless does not mean "no attack surface"; it moves the surface to the server. Client-based does not mean the software is only on clients; it means a local install exists. The terms here describe software delivery, not vulnerability scanners, which also come in agent and agentless forms (objective 4.4).

**Scenario:** Clue: a flaw is announced in a chat program installed on 3,000 laptops, and the patch must be pushed to each one. Answer: a client-based vulnerable software vector. The closest wrong answer, agentless, fails because the flawed code runs locally on every device instead of on one central server.

### Drive-by download (drive-by compromise)
A drive-by download infects a device when the user simply visits a web page: scripts on the page probe the browser and its plugins for known flaws and, if one is found, deliver exploit code that installs malware, often with no file to open and sometimes no click. It is a web-borne vector that targets the client, and it often lands the attacker inside the internal network.

How it works:
1. The attacker plants code on a site the victim will load: by compromising a legitimate site, injecting script, buying malicious ads on real ad networks (malvertising), or altering scripts kept in a publicly writable cloud storage bucket.
2. The victim's browser loads the page and the script checks versions.
3. A vulnerable browser or plugin receives the exploit; a patched one may receive nothing.
4. The exploit runs code on the device, giving the attacker a foothold.

**Why it matters:** Even careful users who never open attachments can be infected while reading a trusted news site. Patching browsers and plugins, browser sandboxing, exploit protection, and script and ad blocking reduce it.

**Common confusions:** A drive-by is not phishing: the user is only browsing, not tricked into opening something. A watering hole attack is a targeted use of a drive-by on a site a chosen group visits. Typosquatting brings the victim to a wrong site through a typing mistake; a drive-by can then happen there.

**Scenario:** Clue: several employees' laptops were infected the same morning; all had visited the same industry news site, and only those with an outdated browser were hit. Answer: a drive-by download. The closest wrong answer, file-based attachment, fails because no file was opened; the page itself delivered the exploit.

### Unsupported systems and applications as a threat vector
Unsupported systems and applications have passed the end of their vendor's support period, so they no longer receive security updates. Any flaw found after support ends stays open permanently, and attackers keep using exploits for it because they keep working.

How support typically ends, using one large vendor's fixed lifecycle as the model:
1. Mainstream support: security updates, other fixes and feature requests are provided.
2. Extended support: security updates continue, but no new features or non-security fixes.
3. End of support: security updates stop, apart from a paid extended security update program for some products.
4. After that, every new vulnerability is permanent unless the system is upgraded, replaced or isolated.

**Why it matters:** Old systems often run critical processes (factory control, medical devices, a billing app that only works on an old OS), so they stay in service. Government secure-by-design guidance asks vendors to state support periods at the time of sale for this reason. Mitigations: plan upgrades before support ends, isolate what cannot be upgraded on segmented networks, and add compensating controls such as strict allow lists and monitoring.

**Common confusions:** Unsupported (no more patches) differs from unpatched (patches exist but were not applied). It overlaps with end-of-life and legacy hardware in objective 2.3; here the focus is the system as an entry path. Shadow IT is unknown to IT; an unsupported system is usually known and kept on purpose.

**Scenario:** Clue: a newly published flaw affects an old operating system still running on a lab workstation, and the vendor says no fix will be released. Answer: an unsupported system vector. The closest wrong answer, zero-day, fails because the flaw is publicly known; the problem is that no patch will ever come.

### Unsecure wireless networks as a threat vector (Wi-Fi)
Unsecure wireless networks let attackers within radio range listen to traffic, join without permission or trick users into connecting to the wrong network. Weaknesses include open networks with no encryption, legacy protection such as Wired Equivalent Privacy (WEP, broken and obsolete) and the original Wi-Fi Protected Access (WPA, legacy), weak shared passphrases, and rogue or evil twin access points.

How wireless attacks unfold:
1. The attacker sits within range, which can be outside the building.
2. On an open or legacy-protected network, traffic is captured and read, or a weak passphrase is guessed.
3. With an evil twin, the attacker broadcasts a network name copying the real one, so devices connect and traffic flows through the attacker.
4. A rogue access point, meaning any access point connected to the internal network without authorization (by an attacker or by a well-meaning employee), opens a wireless door past the perimeter.

Wi-Fi Protected Access 3 (WPA3) is required for current certified devices; it resists password guessing better, blocks outdated protocols and requires protected management frames. Wi-Fi Enhanced Open encrypts traffic on open networks without a shared password. Exact standards and settings are in the Reference chapter, and secure wireless design is covered in objective 4.1.

**Why it matters:** Staff on hotel or coffee shop Wi-Fi, or guests near the office, can expose credentials and data. Strong encryption, enterprise authentication with 802.1X, rogue access point detection and a virtual private network (VPN) on untrusted networks reduce exposure.

**Common confusions:** A rogue access point is any unauthorized access point on or near the organization's network, often plugged into a wired jack, and its danger is the back door it opens into the network. An evil twin is an attacker's access point that copies a legitimate network's name so that users connect to it, and its danger is interception of those users' traffic; it does not need any connection to the real network. Encryption on the wireless link protects only that hop, not the whole path.

**Scenario:** Clue: guests at a conference see two networks with the hotel's name; one has no password and its users' sign-ins are captured. Answer: an evil twin on an unsecure wireless network. The closest wrong answer, a wired network vector, fails because the attack happened entirely over radio.

### Unsecure wired networks as a threat vector (open network jacks)
An unsecure wired network lets anyone who plugs into a live network jack or switch port get network access, because nothing checks who or what the device is. Physical access to a cable becomes logical access to the internal network.

How it is abused and closed:
1. An attacker or careless visitor plugs a laptop, a small computer or a network tap into an open jack in a meeting room or lobby.
2. With no checks, the device gets an address and can scan, capture traffic or reach internal systems.
3. Controls close the gap: 802.1X port-based authentication, where the switch port stays unauthorized and passes essentially only authentication frames until the connecting device (the supplicant) proves who it is, through the switch (the authenticator), to a central authentication server; disabling unused switch ports; and limiting address assignment to registered devices.

**Why it matters:** One gadget hidden under a desk can give an outside attacker a permanent foothold. At least one tracked attack group has done exactly this, connecting small single-board computers and cheap laptops inside target offices to reach their networks.

**Common confusions:** A wired network is not automatically trusted just because cables are inside the building. 802.1X itself is explained with network access control in objective 3.2.

**Scenario:** Clue: a contractor's small device found behind a printer has been sending data out for weeks; it was plugged into an active wall jack. Answer: an unsecure wired network vector. The closest wrong answer, a rogue wireless access point, fails because the device used a cable, not radio.

### Bluetooth attack surface (bluejacking, bluesnarfing and BlueBorne)
Bluetooth is a short-range wireless technology for personal area networks, linking phones, headsets, keyboards, cars and Internet of Things (IoT) devices. It becomes a vector when devices are discoverable, accept transfers without authentication, pair weakly or run unpatched Bluetooth software.

Named Bluetooth attacks:
1. Bluejacking: sending unsolicited messages, such as contact cards or notes, to nearby devices; some object transfer needs no authentication. It is mostly a nuisance but can carry a social engineering lure.
2. Bluesnarfing: pulling data such as contacts or messages off a device without the user knowing; older devices had firmware flaws allowing it.
3. BlueBorne (2017): a set of flaws in the Bluetooth software of Windows, iOS, Android and Linux that let a nearby, unauthenticated attacker take over devices without pairing and, according to the researchers who found the flaws, even when the device was not set to discoverable. Vendors fixed it with operating system updates.

**Why it matters:** Phones and laptops carry corporate data and credentials everywhere. Turning Bluetooth off when unused, keeping it non-discoverable, refusing unexpected transfers and patching the operating system reduce the risk.

**Common confusions:** Bluejacking sends to the victim; bluesnarfing takes from the victim. Hiding a device (non-discoverable) does not stop every attack, as BlueBorne showed, so patching matters more than hiding.

**Scenario:** Clue: a manager's phone contacts appear on a stranger's laptop after a train journey, though the manager never paired with anything. Answer: bluesnarfing. The closest wrong answer, bluejacking, fails because data was taken from the phone instead of messages being pushed to it.

### Open service ports as a threat vector
An open service port is a network port where a program listens for connections. Each one is a service an attacker can reach and test, so unneeded open ports enlarge the attack surface. The port number tells which service probably listens; the Reference chapter lists common ports and their secure and insecure pairs.

How open ports become entry points:
1. The attacker scans the address range to find which ports answer.
2. The attacker identifies the service and version behind each one.
3. The attacker tries known exploits, default credentials or password guessing against those services.
4. Insecure clear-text services, such as Telnet, also expose passwords to anyone watching traffic.

**Why it matters:** Services left on after testing, management interfaces exposed to the internet and old protocols are among the easiest ways in. The Mirai botnet grew by finding Internet of Things devices with exposed login services, which is why US guidance told owners to watch the Telnet ports for takeover attempts. Closing ports is one of the cheapest controls.

How to shrink it: inventory listening ports with regular scans, disable unneeded services, block the rest at host and network firewalls, and place management interfaces on a separate network. Disabling ports and protocols is also a hardening technique in objective 2.5.

**Common confusions:** A port is open because a service listens; a firewall rule allowing a port with nothing listening exposes nothing until a service starts, but it is still a mistake waiting to happen. Closing a port is not the same as patching the service; both matter.

**Scenario:** Clue: an internet scan of the company's range shows a remote administration service answering on a branch router, though no one administers it from outside. Answer: an open service port vector; disable the service or block the port at the edge. The closest wrong answer, default credentials, fails because the clue describes the exposed service, not a password problem, though both often appear together.

### Default credentials as a threat vector (factory passwords)
Default credentials are the usernames and passwords set by the manufacturer or installer, such as an admin account with a published password, built-in operating system accounts like Guest or Administrator, and service accounts created automatically by a platform. They are documented in manuals and shared online, so leaving them unchanged lets anyone log in.

How default credential attacks work:
1. The attacker finds a device or management page, usually through scanning.
2. The attacker tries a short list of common factory username and password pairs.
3. On success, the attacker controls the device: joins it to a botnet, changes settings or pivots inward.

The Mirai botnet in 2016 tried a list of 62 common default username and password pairs against Internet of Things devices such as cameras and routers, and US government guidance recommended watching Telnet traffic on TCP ports 23 and 2323 for these attempts (the Reference chapter lists Telnet's standard port). One attack using such devices exceeded 620 gigabits per second.

**Why it matters:** One unchanged password can hand over a device that sits inside the network. Change every default credential at installation and before production use, add multifactor authentication where possible, and prefer products that ship with a unique password per device or force a new one at setup, which government secure-by-design guidance asks vendors to do.

**Common confusions:** Default credentials are a configuration weakness, not a software flaw; patching does not fix them. A hard-coded password that cannot be changed is worse, because changing defaults is impossible.

**Scenario:** Clue: hundreds of a company's lobby cameras start sending traffic to an unknown network after a technician installed them with factory settings. Answer: the default credentials vector. The closest wrong answer, an unsupported system, fails because the cameras are current models; the problem is the unchanged password.

### Supply chain as a threat vector: managed service providers (MSPs), vendors and suppliers
A supply chain attack reaches an organization through a third party it trusts, by manipulating products, updates or access before or while they reach the customer. The objective lists three kinds of third parties: managed service providers (MSPs), which run customers' IT remotely; vendors, which supply products or services and may hold network access; and suppliers, which provide hardware, components or materials.

How each path is abused:
1. MSP: breaking into one provider's remote management tools gives access to every client it manages. In July 2021 a flaw in an on-premises remote monitoring and management product used by many MSPs was used to push ransomware to those MSPs' downstream customers.
2. Vendor: credentials or a connection given to a vendor become the attacker's way in, or a vendor's software update carries malicious code.
3. Supplier: counterfeit or tampered hardware arrives already weakened.

Controls named in government guidance: least privilege for provider accounts, keeping them out of administrator groups and disabled when unused, multifactor authentication on every account, a dedicated connection for provider access, monitoring and logging of provider activity, and contracts requiring security controls and incident notification.

**Why it matters:** One breach upstream creates many victims downstream, and the traffic arrives from a trusted source, so normal defenses let it in. A large 2025 breach study found third parties involved in about 30 percent of breaches, double the previous year.

**Common confusions:** Supply chain appears twice: as a vector here (the path the attack takes) and as a vulnerability in objective 2.3 (the weakness of depending on providers). An MSP is a service provider; a supplier provides physical goods.

**Scenario:** Clue: ransomware hits forty small businesses on the same night; all use the same IT support company, whose remote management tool launched the malware. Answer: a supply chain vector through a managed service provider. The closest wrong answer, insider threat, fails because the IT company's staff did not act against customers; attackers abused the provider's trusted access.

### Social engineering (human vectors) and the levers it pulls
Social engineering is manipulating people into giving information, access or money, or into taking an action that helps an attacker. It treats people as part of the attack surface, and it gets past technical controls because the victim does the work. The techniques in this objective fall into four groups: messages that trick (phishing, vishing, smishing, business email compromise), false identities and stories (impersonation, brand impersonation, pretexting), web traps (watering hole, typosquatting) and false information (misinformation and disinformation).

How a social engineering attack is built:
1. Research the target: names, roles, vendors, current events, so the story sounds right.
2. Pick a channel: email, text, phone, chat, in person, or a website the victim will visit.
3. Pull a psychological lever: authority (a boss or IT), urgency (act now), fear (account locked), scarcity (limited offer), familiarity and trust (a known colleague or brand), or helpfulness.
4. Ask for one small action: click, open, read out a code, approve a prompt, change bank details.
5. Use what was gained for the next step.

Warning signs government guidance highlights: a sender address that imitates a real one, generic greetings, links whose real target differs from the text shown, lookalike domains and link shorteners, unexpected attachments and pressure to act fast.

**Why it matters:** A large 2025 breach study found a human element in roughly 60 percent of breaches. Security awareness training (objective 5.6), verification procedures that use a second, known channel, and technical backstops such as multifactor authentication and payment approval rules reduce the damage when someone is fooled.

**Common confusions:** Social engineering is the umbrella; each listed technique is a kind of it. The channel names the technique for phishing (email), vishing (voice) and smishing (SMS); the trick names the others (an invented story is pretexting, a misspelled domain is typosquatting).

**Scenario:** Clue: a caller who sounds like a senior manager pressures a new help desk worker to reset a password "before the board meeting starts." Answer: social engineering using authority and urgency, delivered by voice (vishing) with impersonation. The closest wrong answer, a technical exploit, fails because no system flaw was used; the worker was persuaded.

### Phishing, spear phishing and whaling
Phishing is social engineering delivered electronically, usually by email, in which the attacker poses as a trusted organization or person to steal credentials or money or to deliver malware. Spear phishing targets chosen individuals with tailored content. Whaling is spear phishing aimed at senior executives.

How a credential phishing attack runs:
1. The attacker sends a message styled as a trusted source, often tied to a current event, a holiday or an account problem.
2. A link leads to a fake sign-in page on a lookalike domain, or an attachment carries malware.
3. The victim enters a username and password, which the attacker captures.
4. The attacker signs in as the victim, reads mail, sends more phishing internally, or commits fraud.

Defenses: email filtering, sender authentication (covered with email security in objective 4.5), link checking, blocking risky attachments, multifactor authentication, user training with simulated campaigns (objective 5.6), and an easy way to report suspicious messages.

**Why it matters:** Phishing remains a top initial access route and feeds ransomware, account takeover and business email compromise. Each stolen credential can open email, files and cloud apps.

**Common confusions:** Phishing is email-based; vishing is voice and smishing is text. Spear phishing is about targeting, not the channel. Whaling is spear phishing of executives, not a separate channel. Business email compromise often begins with phishing but is defined by the fraud request from a business mailbox.

**Scenario:** Clue: only the finance director receives an email that mentions her real upcoming audit and links to a "shared audit folder" sign-in page. Answer: spear phishing (and, as she is a senior executive, whaling fits too). The closest wrong answer, generic phishing, fails because the message was built for one named person using researched details.

**Worked example:** the link text reads "portal.examplecorp.com" but hovering shows the real target "examplecorp-portal.sign-in-check.net". A mismatch between shown text and real destination, with the trusted name buried in a longer domain, is a classic phishing clue.

### Vishing (voice phishing)
Vishing is phishing carried out by voice: phone calls, voicemail or internet calls that trick people into revealing information, approving access or installing software. It belongs to the voice call vector and leaves no malicious attachment to scan.

How a vishing attack runs:
1. The attacker spoofs a caller ID or picks a believable role: the bank's fraud team, IT support, a supplier.
2. The attacker creates alarm or urgency so the victim does not stop to check.
3. The victim is asked for a code, a password reset, approval of a multifactor prompt, or to install a remote support tool.
4. In callback vishing, a message first asks the victim to phone a number, which makes the call feel self-initiated.

**Why it matters:** Criminal groups have phoned employees while posing as IT staff to get remote management tools installed or scripts run, gaining a foothold with no malware sent by email. Strict identity verification for resets and a rule to call back on a number from the directory, never one given by the caller, are the key controls.

**Common confusions:** Vishing equals voice; smishing equals Short Message Service (SMS) text; phishing equals email. A caller with an invented scenario is also pretexting, but when the phone channel is the point, the technique is vishing. Caller ID is not proof of identity.

**Scenario:** Clue: an employee receives a call showing the bank's real number; the caller asks her to confirm her card PIN to "stop a fraudulent charge." Answer: vishing with caller ID spoofing. The closest wrong answer, smishing, fails because the contact was a phone call, not a text.

### Smishing (SMS phishing)
Smishing is phishing sent by Short Message Service (SMS) text. Messages contain links, phone numbers or email addresses meant to trigger an action when tapped. It exploits the trust people place in texts and the small screen that hides full web addresses.

How a smishing attack runs:
1. A text claims an urgent, believable problem: an unpaid toll, a parcel held for a fee, a locked account, a prize.
2. A shortened link or lookalike domain leads to a fake payment or sign-in page.
3. The victim enters card details or credentials, or calls a number that leads to a vishing call.
4. The attacker uses the details for fraud or account takeover.

**Why it matters:** Personal phones often hold work email and authenticator apps, so a smishing victim can expose company accounts. Mobile threat defense, filtering where available, multifactor authentication and training to check texts through the official app or website reduce it.

**Common confusions:** Smishing equals SMS; phishing through chat apps is message-based phishing, but the name smishing belongs to SMS text. A text that only says "call this number" is still smishing even though the next step is a phone call.

**Worked example:** a text from an unknown number reads "Parcel held: customs fee 1.99 due, pay at the link" followed by a shortened address. Three clues stack up: an unexpected sender, a small urgent payment, and a link that hides its real destination. The safe action is to check the delivery in the courier's own app, never through the link.

**Scenario:** Clue: staff receive texts saying "Your road toll is overdue, pay within 24 hours to avoid a fine" with a short link. Answer: smishing. The closest wrong answer, phishing, fails because the channel named in the clue is SMS text, which has its own term.

### Misinformation and disinformation (and malinformation)
Misinformation is false information shared without intent to cause harm. Disinformation is false information that someone creates and spreads on purpose, in order to deceive, damage or manipulate its target, which can be a person, a group, an organization or a whole country. A related term, malinformation, is true information taken out of context to mislead or harm. These attack the trust in information rather than a system.

How a disinformation campaign typically spreads:
1. Create false content: a fake story, doctored image, forged document or fake reviews.
2. Seed it through fake or automated accounts on social media and forums.
3. Amplify it with likes, shares and coordinated posting until real people repeat it.
4. Let it reach the press or customers, at which point many sharers are spreading misinformation without knowing it is false.

**Why it matters:** False claims about a company's product safety, finances or a fake data breach can move stock prices, drive away customers and trigger costly responses. Monitoring for false claims, a prepared communications plan and a trusted public channel for corrections help.

**Common confusions:** The difference between misinformation and disinformation is intent, not content: the same false claim is disinformation from its author and misinformation from an unaware sharer. Malinformation is true, which separates it from both. Brand impersonation copies a company's identity; disinformation spreads false claims about it.

**Scenario:** Clue: a network of newly created accounts posts identical claims that a food company's product made children sick, citing a lab report that does not exist. Answer: disinformation, because the claims were fabricated and pushed deliberately. The closest wrong answer, misinformation, fails because the creators knew the claims were false; only the unaware people who reshared them spread misinformation.

### Impersonation and pretexting
Impersonation is pretending to be someone else, such as IT support, an executive, a vendor, an auditor or a delivery worker, to gain trust or access. Pretexting is inventing a believable scenario, the pretext, that explains why the victim should help. The two usually work together: the impersonated role supplies authority and the pretext supplies the reason.

How a combined attack is built:
1. Research names, roles, suppliers and internal jargon so the story holds up.
2. Choose a role (impersonation) and a reason (pretext), such as "I'm from your bank's fraud team and we're verifying a suspicious transfer."
3. Make the request feel routine or urgent, so checking seems unnecessary or rude.
4. Collect the information or access, often in small pieces from several people.

**Why it matters:** Help desks, receptionists and finance teams are trained to be helpful, which is exactly what this exploits. Rules that require verification through a separate known channel, badges and escorts for visitors, and call-back procedures stop most attempts.

**Common confusions:** Impersonation is about who the attacker claims to be; pretexting is about the story told. A clue stressing "a made-up scenario" points to pretexting; one stressing "posed as the CEO" points to impersonation. Brand impersonation copies a whole company's look, not a person.

**Scenario:** Clue: a person in a utility company vest says he must check the electrical panel in the server room because of "a fault reported on your street," and the receptionist lets him in. Answer: impersonation backed by a pretext. The closest wrong answer, tailgating, fails because he was let in after a story, not by following someone through a door unnoticed.

### Business email compromise (BEC)
Business email compromise is fraud in which an attacker uses a compromised or spoofed business email account, often an executive's or a supplier's, to trick staff into sending money or sensitive data. It targets organizations and people who routinely make legitimate payments. The goal is almost always financial.

How a BEC fraud runs:
1. Gain or fake a mailbox: take over a real account through phishing or an intrusion, or register a lookalike domain.
2. Watch real conversations, such as invoices with a supplier, to learn timing and wording.
3. At the right moment, ask finance to pay a "new" bank account, wire an urgent payment, or send employees' personal details for use in later scams.
4. Move the money quickly through other accounts, payment services or cryptocurrency exchanges.

The US Federal Bureau of Investigation reported about 55.5 billion dollars in exposed losses from BEC worldwide between October 2013 and December 2023. Its advice: verify any change to payment or account details through a second channel, use multifactor authentication, check sender addresses for misspellings and act fast with the bank if money was sent.

**Why it matters:** A single fraudulent transfer can cost a company millions, and recovery depends on reporting within hours.

**Common confusions:** BEC often uses phishing first, but it is defined by the fraud request from a business mailbox. When the message comes from the real hacked account, sender authentication checks pass, so only process controls (out-of-band verification, dual approval) stop it.

**Scenario:** Clue: accounts payable receives a message from a long-standing supplier's genuine address, in an existing invoice thread, asking that this month's payment go to a new bank account. Answer: business email compromise. The closest wrong answer, typosquatting, fails because the sender domain is the supplier's real one; the mailbox itself was taken over.

**Worked example:** a payment rule that blocks the attack: "Any change to supplier bank details requires a call to the supplier contact number already on file, made by someone other than the requester, before the next payment run."

### Watering hole attack
A watering hole attack compromises a website that a chosen group already visits, such as an industry association, a regulator or a local business portal, and uses it to infect members of that group. The attacker does not contact victims; it waits for them to come, like a predator at a water source. It is a targeted form of drive-by compromise.

How it works:
1. Identify the target group and the sites its members trust and visit.
2. Compromise one of those sites, often through a flaw in its content management system or an injected script.
3. Serve malicious code, sometimes only to visitors from the target's network addresses, so other visitors and researchers see a clean site.
4. Exploit visitors' browsers or offer a malicious download, gaining footholds inside the target organizations.

**Why it matters:** Users who would never click a phishing link still visit trusted professional sites. Browser patching, web filtering, browser isolation or sandboxing, and endpoint protection that watches for unusual behavior after browsing reduce the risk.

**Common confusions:** A watering hole infects a legitimate site the victims already use; typosquatting creates a fake site at a misspelled address; phishing sends the victim a lure. Drive-by download is the delivery technique; watering hole is the targeting strategy built on it.

**Scenario:** Clue: engineers at several aerospace firms are infected after visiting a trade association's events page, while visitors from other industries see nothing unusual. Answer: a watering hole attack. The closest wrong answer, brand impersonation, fails because the site was the real association site, compromised, not a fake copy.

### Brand impersonation
Brand impersonation is pretending to be a well known company by copying its name, logo, colors and style in emails, ads, social media accounts, apps or websites, to lower suspicion. It is a social engineering technique aimed at customers and employees who trust that brand.

How a brand impersonation attack works:
1. Copy the brand's look closely, often from its own public website.
2. Deliver it through phishing email, search or social media ads, fake support accounts or fake apps.
3. Ask the victim to sign in, pay, claim a prize or download "support software."
4. Capture credentials or payment details, or install malware.

**Why it matters:** For the impersonated company, the damage is lost customer trust, support costs and reputational harm even though its own systems were never touched. Defenses include monitoring for fake domains, accounts and apps, takedown requests, sender authentication for the company's own domains, and teaching customers how the real company contacts them.

**Common confusions:** Brand impersonation copies a company; impersonation copies a person or role. Typosquatting depends on a misspelled domain; brand impersonation depends on the look, and may use any domain. Disinformation spreads false claims; brand impersonation pretends to be the brand.

**Scenario:** Clue: customers receive an email with a parcel company's exact logo and colors saying a delivery failed, linking to a page that asks for card details. Answer: brand impersonation (delivered by phishing). The closest wrong answer, watering hole, fails because the victims were contacted directly and sent to a fake page, not infected on a real site they already visit.

### Typosquatting (URL hijacking and lookalike domains)
Typosquatting is registering domain names that are likely misspellings or close variants of a real one, so people who mistype or misread an address land on the attacker's site. It is also called URL hijacking. Related tricks register the same name under another top-level domain, or use internationalized characters that look identical to Latin letters (a homograph attack).

How it works:
1. Register variants: a swapped or doubled letter, a missing dot, a digit for a letter, the brand with ".co" instead of ".com".
2. Host a copy of the real site, a phishing sign-in page, ads or a drive-by exploit.
3. Wait for typing mistakes, or put the lookalike in phishing links where readers will not spot the difference.

**Why it matters:** Users and staff can hand credentials to a lookalike without noticing. Organizations defend by registering common variants of their own domains, monitoring new registrations that resemble them, using Domain Name System (DNS) filtering to block known lookalike domains, and teaching people to use bookmarks.

**Common confusions:** Typosquatting relies on the address; brand impersonation relies on the look, and the two are often combined. A watering hole uses the real site, compromised. Domain hijacking (taking control of the real domain's registration) is a different attack covered with DNS attacks in objective 2.4.

**Scenario:** Clue: an attacker registers "examp1ebank.com", with the digit one in place of a letter l, and hosts a copy of the bank's sign-in page. Answer: typosquatting. The closest wrong answer, domain hijacking, fails because the bank's real domain was never touched; the attacker bought a new, similar one.

### Comparing social engineering: phishing vs vishing vs smishing vs BEC vs pretexting vs impersonation
These techniques overlap, so name the one the clue stresses: the channel for the first three, the fraud for business email compromise (BEC), the story for pretexting and the claimed identity for impersonation.

| Technique | Decisive feature | Typical clue |
|---|---|---|
| Phishing | Email lure | Fake message with a link or attachment |
| Spear phishing or whaling | Targeted (whaling: executives) | Researched details about one person |
| Vishing | Voice | A call asking for a code, reset or action |
| Smishing | Short Message Service (SMS) text | A text with a link or number |
| Business email compromise | Fraud from a business mailbox | Request to change bank details or wire money |
| Pretexting | Invented scenario | A believable story that explains the request |
| Impersonation | Claimed identity of a person or role | "I'm from IT", "this is the CEO" |

How to name the technique:
1. If the channel is the point, use phishing (email), vishing (voice) or smishing (text).
2. If it stresses a payment or bank change from a business mailbox, use business email compromise.
3. If it stresses the story, use pretexting; if it stresses who the attacker claimed to be, use impersonation.
4. If it stresses one chosen person, use spear phishing, or whaling for an executive.

**Common confusions:** Several labels can fit one attack. A caller posing as IT with a made-up outage is vishing, impersonation and pretexting at once; name the one that matches what is being asked: the channel, the identity or the story.

**Scenario:** Clue: a trainer asks which technique is defined by an invented story, and offers vishing, pretexting, smishing and phishing. Answer: pretexting. The closest wrong answer, vishing, fails because it is defined by the voice channel, not the story.

### Comparing web-based lures: watering hole vs typosquatting vs brand impersonation vs drive-by download
These all involve websites or public content, so ask whose site it is and how the victim gets there.

| Technique | Whose site or content | How the victim arrives |
|---|---|---|
| Watering hole | A real, trusted site, compromised | Visits it as usual |
| Typosquatting | Attacker's site at a lookalike address | Mistypes or misreads the address |
| Brand impersonation | Attacker's copy of a brand's look | Lured by email, ad or social post |
| Drive-by download | Any site serving an exploit | Just loads the page |
| Disinformation | False content on social media or news | Sees it shared and amplified |

How to decide:
1. Is the site the real, legitimate one, now serving bad code to a chosen group? Watering hole.
2. Is the address a near copy of a real one? Typosquatting.
3. Does the page or message copy a company's logo and style to win trust? Brand impersonation.
4. Did merely loading a page install malware? Drive-by download, whatever site it was.
5. Is the harm false claims spreading among people, not code? Disinformation.

**Common confusions:** Drive-by download is the delivery mechanism; watering hole is a targeting strategy that uses it. A typosquatted page often uses brand impersonation too, but the misspelled address is the decisive clue for typosquatting.

**Scenario:** Clue: users who type a supplier's address with one letter doubled land on a page with no logo that immediately tries to exploit their browser. Answer: typosquatting, with a drive-by as the payload. The closest wrong answer, watering hole, fails because the site is not the real supplier's site.

### Comparing threat vectors: message-based vs image-based vs file-based vs voice vs removable vs network
Name the vector from how the attack reaches the target.

| Vector | Arrives through | Main control |
|---|---|---|
| Message-based | Email, SMS, IM | Filtering, sender checks, training |
| Image-based | SVG or picture hiding code or data | Treat SVG as active content, sandbox |
| File-based | Document, macro, archive, executable | Block internet macros, scan, allow lists |
| Voice call | Phone, voicemail, internet calls | Call-back verification |
| Removable device | USB and other media | Disable autorun, restrict media |
| Unsecure network | Wireless, wired, Bluetooth | Strong encryption, 802.1X, patching |
| Open service port | A listening network service | Close unneeded ports |
| Default credentials | Factory passwords | Change at installation |
| Supply chain | MSP, vendor, supplier | Least privilege and monitoring of providers |

In the table, SMS is Short Message Service, IM is instant messaging, SVG is scalable vector graphics and MSP is managed service provider.

**Common confusions:** One attack often uses two vectors: an email (message-based) carrying a macro document (file-based). Name the one the clue emphasizes. Removing a vector entirely (closing a port, changing a default password, disabling removable storage) shrinks the attack surface for good, while filtering a vector that must stay open (email) only lowers the odds, so both kinds of control are needed.

**Scenario:** Clue: malware reached a factory network that has no internet connection. Answer: a removable device vector is the most likely path. The closest wrong answer, message-based email, fails because the isolated network receives no email.

## 2.3 Types of vulnerabilities
Depth asked: explain. A good answer names the weakness, says where it lives (application, operating system, web, hardware, virtualization, cloud, supply chain, cryptography, configuration, mobile) and how an attacker uses it, gives the fix, and separates it from the look-alike weakness.

### Memory injection (process injection and DLL injection)
Memory injection is placing attacker code into the memory of another running process, usually a trusted one, so the code runs inside it with that process's access and privileges. It is an application-level vulnerability class used for defense evasion and privilege escalation. Dynamic-link library (DLL) injection on Windows is the classic form.

How classic DLL injection works:
1. The attacker, already running some code on the host, opens a legitimate target process.
2. It reserves memory inside that process and writes the path of a malicious DLL there.
3. It starts a new thread in the target that loads the DLL.
4. The DLL's code now runs as part of the trusted process, reaching its memory, network connections and privileges.
Variants load the code straight from memory without a file on disk, which helps it avoid file scanners.

**Why it matters:** Security tools that judge activity by process name see a trusted browser or system service, not malware. Injected code can steal what that process holds (passwords in a browser, tokens in a service) and can gain higher privileges by injecting into a more privileged process.

How to defend: endpoint detection and response tools that spot the telltale sequence of remote memory writes followed by remote thread creation, attack surface reduction rules (for example, stopping Office apps from injecting into other processes), least privilege so processes cannot open each other freely, and restricting debugging interfaces on Linux.

**Common confusions:** Memory injection puts new code into another process; a buffer overflow writes too much data into a buffer inside the vulnerable program. Injection usually needs code already running on the host, while an overflow can give the first foothold. Injection is often "fileless," which ties to the fileless malware indicator in objective 2.4.

**Scenario:** Clue: the endpoint tool shows a word processor opening a web browser process, writing into its memory and starting a thread there; the browser then connects to an unknown server. Answer: memory injection (process injection). The closest wrong answer, buffer overflow, fails because nothing overflowed a buffer; one process deliberately wrote code into another.

### Buffer overflow vulnerability
A buffer overflow happens when a program copies more data into a fixed-size memory area (a buffer) than it can hold, without checking the size, so the extra data overwrites memory next to it. It is an application vulnerability, mostly in languages that leave memory management to the programmer, such as C and C++. The result is a crash (a loss of availability) or, worse, the attacker's code running.

How exploitation works:
1. The program reserves, say, 64 bytes for a name and copies input into it with no length check.
2. The attacker sends far more than 64 bytes.
3. The extra bytes overwrite nearby memory, such as other variables or the saved address the program returns to.
4. If the attacker controls that address, execution jumps to code of the attacker's choosing; if not, the program usually crashes.

Defenses, from removing the root cause to added layers: memory-safe languages; bounds checking and input validation; safer copy functions; compiler protections such as stack canaries; address space layout randomization (ASLR), which makes memory locations hard to predict; and data execution prevention, which stops code running from data areas. Each is a layer, not a full cure. Government secure-by-design guidance urges vendors to move new products to memory-safe languages for this reason.

**Why it matters:** Overflows in network-facing services can let an attacker take over a server remotely, and even a failed attempt can knock a critical service offline.

**Common confusions:** An overflow writes past a buffer's end; memory injection places code into a different process. In objective 2.4, buffer overflow appears as an indicator (crashes, oddly long input); here it is the weakness.

**Scenario:** Clue: a login service crashes whenever a username of several thousand characters is submitted, and the crash log shows the return address overwritten with repeated letters. Answer: a buffer overflow vulnerability. The closest wrong answer, SQL injection, fails because the input attacked memory handling, not a database query.

**Worked example:** a crash report showing an instruction pointer of 0x41414141 means the program tried to jump to the bytes "AAAA", a sign that attacker-supplied letters overwrote the return address.

### Race condition vulnerability: time-of-check to time-of-use (TOCTOU)
A race condition is a flaw where the outcome depends on the timing of two or more operations that share a resource, so an attacker can act in the gap between them. The best known form is time-of-check to time-of-use (TOCTOU): the program checks something, then uses it, and the thing changes in between. It is an application vulnerability that can break integrity and confidentiality.

The two moments and the gap between them:
1. Time of check (TOC): the program verifies a condition, such as "this user may write this file" or "this account has enough money."
2. The gap: the attacker swaps the file, sends a second request or changes the state.
3. Time of use (TOU): the program acts on the result of the earlier check, now on something it never verified.
The common wrong idea is that the check itself is the flaw; the flaw is that check and use are separate steps.

Fixes: make check and use one atomic operation, take a lock before the check (not after it) so the resource checked is the resource used, avoid separate check-then-open sequences by working on an already opened file handle, and run with least privilege so a won race gains less.

**Why it matters:** TOCTOU flaws in privileged programs can let an ordinary user overwrite protected files, and in business logic they allow double spending or bypassing limits. At a 2023 hacking contest, researchers demonstrated a TOCTOU attack against a car's gateway system and won the car.

**Common confusions:** TOC is the check; TOU is the use that follows; the attack lands between them. A race condition is a timing flaw, not a memory size flaw like a buffer overflow. All TOCTOU flaws are race conditions, but some race conditions involve no check at all, such as two threads updating one counter.

**Scenario:** Clue: two withdrawal requests arrive within milliseconds; both read a balance of 100 before either subtracts, so 200 is paid out. Answer: a race condition. The closest wrong answer, SQL injection, fails because the input was normal; the flaw is the timing between reading and updating.

**Worked example:** a privileged program checks that a user may write to a temporary file, the attacker then replaces that file with a link to a protected system file, and the program writes to the protected file with its own privileges. The check passed honestly; the use hit a different file.

### Malicious update (compromised software update)
A malicious update is a software update that has been tampered with to carry malware, so the vendor's trusted update channel delivers the attack. It is an application vulnerability rooted in the trust customers place in their vendors, and it overlaps with the software supply chain.

How it happens:
1. Attackers break into the vendor's development or build environment, not the customers.
2. They insert malicious code into the product during the build, so the source repository can look clean.
3. The vendor signs and releases the update as normal, so signature checks pass.
4. Customers install it, often automatically, and the backdoor activates.

In the best known case, attackers compromised the build system of a network monitoring product and inserted a backdoor into updates released between March and June 2020; the vendor told regulators that fewer than 18,000 customers may have had an affected version installed.

**Why it matters:** One compromised vendor reaches thousands of organizations at once, through a channel defenders deliberately trust and often exempt from inspection.

Defenses: verify signatures and hashes (stops tampering in transit, but not a compromised build), test updates in a staging environment, watch vendor advisories, limit what monitoring and management tools can reach, monitor even trusted software for unusual outbound connections, and on the vendor side protect build systems and track components.

**Common confusions:** A signed update is not proof of a safe update; a signature proves who released it, not that their build was clean. A malicious update differs from a vulnerable update, which contains an honest bug. As a supply chain vector (objective 2.2) the focus is the path; here it is the weakness of trusting the update channel.

**Scenario:** Clue: a vendor-signed update for an IT monitoring tool begins making connections to an unknown domain two weeks after installation, at many unrelated companies. Answer: a malicious update. The closest wrong answer, zero-day, fails because no unknown flaw in the customer's software was exploited; the vendor's own product was tampered with.

### Operating system (OS)-based vulnerabilities
Operating system (OS)-based vulnerabilities are flaws in the operating system itself: its kernel, drivers, built-in services and permission checks. Because the OS controls every application, memory and device on the host, one OS flaw can expose everything running on it. The most common impacts are privilege escalation (a normal user or app gains administrator or system rights) and remote code execution through a network-facing OS service.

How OS flaws are handled:
1. The vendor publishes fixes, often on a regular monthly cycle, with severity ratings.
2. The organization tests patches on representative systems, because a bad patch can break business apps.
3. Patches are deployed, fastest for flaws known to be exploited.
4. Hardening removes unneeded OS features and services, so some flaws never apply.
5. Systems past end of support get no fixes and must be upgraded or isolated.

**Why it matters:** In May 2017 the WannaCry ransomware spread within hours to tens of thousands of systems in more than 150 countries through a Windows file sharing flaw whose patch had been available for two months. An OS flaw on servers, laptops and phones alike can turn a minor foothold into full control of the device.

**Common confusions:** An OS vulnerability is in the platform; an application vulnerability is in a program running on it. Unpatched (a fix exists, not yet applied) differs from unsupported (no fix will come) and from zero-day (no fix exists yet). On phones, OS flaws are one reason mobile management checks OS versions.

**Scenario:** Clue: a vendor bulletin describes a kernel flaw that lets any logged-in user gain full system rights; the fix has been released. Answer: an OS-based vulnerability (privilege escalation) to be patched after testing. The closest wrong answer, misconfiguration, fails because the weakness is in the OS code, not in settings someone chose.

### Structured Query Language injection (SQLi) vulnerability
Structured Query Language injection (SQLi) is a web and application vulnerability in which untrusted input becomes part of a database command, so the database runs the attacker's instructions. It sits at the application layer and attacks the database behind the app: data can be read, changed or deleted, logins bypassed and, with powerful database accounts, operating system commands run.

How it works:
1. The application builds a query by joining text, for example "SELECT * FROM users WHERE name = '" + input + "'".
2. The attacker enters input that closes the quote and adds logic, such as ' OR 1=1 --.
3. The query now reads "WHERE name = '' OR 1=1", which is true for every row, and the comment marks drop the rest.
4. The application returns all rows, or treats the attacker as logged in.

Fixes, in order of importance: parameterized queries (prepared statements), which keep the command and the data separate so input can never change the command; allow-list validation for things that cannot be parameters, such as sort order; least privilege for the application's database account; minimal error messages; and a web application firewall as a stopgap. Escaping input by hand is discouraged as error-prone.

**Why it matters:** Databases hold customer records, payment data and credentials. A single injectable field can expose the entire database and trigger breach notifications and fines.

**Common confusions:** SQLi attacks the server-side database; cross-site scripting attacks other users' browsers. Input validation helps but does not replace parameterized queries. Stored procedures are safe only if they do not build dynamic SQL from input inside.

**Scenario:** Clue: entering ' OR 1=1 -- into a login box logs the tester in as the first user in the table. Answer: SQL injection. The closest wrong answer, cross-site scripting, fails because no script ran in a browser; the database query logic was changed.

**Worked example:** a web log line "GET /search?q=shoes%27%20UNION%20SELECT%20username,password%20FROM%20users--" shows an encoded quote followed by UNION SELECT, a sign of an attempt to pull a second table through the search query.

### Cross-site scripting (XSS) vulnerability
Cross-site scripting (XSS) is a web vulnerability in which an application includes user-supplied input in its pages without validating or encoding it, so an attacker's script runs in other users' browsers as if the trusted site sent it. The script can read the site's cookies and session tokens, change the page and act as the user.

The three types:
1. Reflected (non-persistent): the script arrives in the request, usually a crafted link, and the page echoes it straight back, for example in a search result or error message. Each victim must be lured to the link.
2. Stored (persistent): the script is saved on the server, for example in a forum post or comment, and runs for everyone who views that content.
3. Document Object Model (DOM)-based: the page's own client-side code takes data, such as part of the address, and writes it into the page unsafely. The server's response is unchanged and the payload takes effect only inside the victim's browser, so the flaw is in the browser-side script, not in server-side page building.

Fixes: start with the protections built into modern web frameworks, encode output for the exact context where it is placed (HTML body, attribute, JavaScript, CSS, URL), sanitize any HTML users are allowed to submit, and validate input. A Content Security Policy limits which scripts may run, but it is an extra layer, not the main defense. Cookie attributes can limit what a script steals, but they do not stop the script running.

**Why it matters:** The worst cases steal session cookies and take over accounts, including administrators'. Altered pages can also show false information under the trusted site's name.

**Common confusions:** XSS runs in the victim's browser; SQL injection runs in the server's database. Stored XSS needs no link per victim; reflected XSS does. Cross-site request forgery (CSRF) is different: it tricks a logged-in user's browser into sending an unwanted request, such as a transfer, without running attacker script on the trusted site.

**Scenario:** Clue: a user posts a product review containing a script tag; afterwards, every visitor to that product page sends their session cookie to an outside address. Answer: stored XSS. The closest wrong answer, reflected XSS, fails because the script was saved on the server and hits everyone who views the page, with no crafted link.

**Worked example:** a tester types a script tag that calls alert(1) into a search box, and the results page shows a pop-up box. The input was placed in the page without encoding and the browser ran it, which demonstrates reflected XSS.

### Firmware vulnerabilities (hardware)
Firmware is the low-level software built into hardware: the system startup code (BIOS or UEFI), management controllers, network cards, drives and device controllers. Firmware vulnerabilities are flaws or tampering in that code. Firmware runs below the operating system, so operating system (OS)-level security tools may not see it, and malicious firmware can survive reinstalling the OS.

How firmware risk is managed, following NIST's platform firmware resiliency principles:
1. Protect: allow only authenticated, signed firmware updates and lock firmware against unauthorized changes.
2. Detect: verify firmware integrity at startup, for example with secure boot and measured boot.
3. Recover: be able to restore known good firmware quickly and securely after corruption or attack.
In practice, organizations also inventory firmware versions, apply vendor updates and buy from vendors that publish them.

**Why it matters:** A successful firmware attack can leave a system unusable, sometimes permanently, or require the manufacturer to reprogram it. Firmware flaws on network gear and servers can give attackers persistent, hidden control.

**Common confusions:** Firmware is software, but it is listed under hardware vulnerabilities because it ships in and controls the device, and only the manufacturer can fix it. An OS patch does not update firmware. End-of-life hardware stops getting firmware updates, which turns firmware flaws permanent.

**Scenario:** Clue: a server's remote management controller has a flaw that lets attackers control the machine even when the operating system is freshly reinstalled. Answer: a firmware vulnerability. The closest wrong answer, OS-based vulnerability, fails because the flaw lives below the operating system and survives its reinstallation.

### End-of-life (EOL) and legacy hardware vulnerabilities
End-of-life (EOL) hardware is equipment the manufacturer has stopped selling and developing. Support may continue for a set period; once support ends, often called end of service life (EOSL) or end of support, new security flaws are no longer fixed. Vendors label these stages differently (one large network vendor, for example, publishes an end-of-sale date and a last date of support, and calls the whole wind-down the end-of-life process), so read the dates, not only the label. Legacy hardware is old equipment still in use, usually because a critical system depends on it, that may lack modern security features whether or not its support has ended.

How the lifecycle runs, using a common vendor model:
1. Full (mainstream) support: security and other updates, new features.
2. Limited (extended) support: security updates only.
3. End of support: no more security updates, except through paid extension programs for some products.
4. After that, every new flaw stays open, and the device must be replaced, isolated or covered by compensating controls.

**Why it matters:** EOL and legacy devices often run important processes (medical imaging, factory control, old storage arrays). They cannot always be replaced quickly, so they become permanent weak points. Plan replacement before support ends, segment the network around old devices, restrict who and what can reach them, and monitor them closely.

**Common confusions:** EOL usually announces the end of sales; the security cliff is the end of support, so check both dates. Legacy means old and still in use; it may still be supported. Unsupported systems in objective 2.2 are the same problem seen as an entry path. Unpatched means a fix exists but was not applied; EOL after support means no fix will come.

**Scenario:** Clue: a hospital keeps a 20-year-old imaging controller because replacing it costs millions; its vendor stopped releasing fixes years ago. Answer: legacy hardware that is also past end of support; isolate it on its own network segment with compensating controls. The closest wrong answer, zero-day, fails because the flaws are known; the issue is that no fixes will be released.

### Virtual machine (VM) escape
Virtual machine (VM) escape is breaking out of a guest virtual machine to run code on, or reach the resources of, the hypervisor or host, and from there other VMs. It defeats the isolation that virtualization promises, where the hypervisor should give each guest access only to its own resources. It is the most serious virtualization vulnerability.

How an escape works:
1. The attacker gains code execution inside a guest VM, sometimes after first exploiting the guest's own operating system (OS).
2. The attacker targets a flaw in the hypervisor or the virtual hardware it emulates (graphics, network, storage devices), or a hypervisor configuration error.
3. Exploiting that flaw runs code on the host or reads host memory.
4. From the host, the attacker can reach every guest it runs.
At a 2017 hacking contest, two teams escaped a desktop hypervisor: one started from a browser flaw, added a Windows kernel flaw inside the guest and finished with a hypervisor flaw, and the other chained a guest kernel flaw with two hypervisor flaws to run code on the host.

**Why it matters:** In shared data centers and clouds, many customers' workloads sit on one host. An escape from one tenant's VM can expose others. Defenses: patch hypervisors promptly, disable unneeded virtual devices and features, keep management interfaces isolated, and keep high-value workloads on separate hosts.

**Common confusions:** VM escape breaks out to the host; resource reuse leaks leftover data between VMs without breaking out. An escape can also start from a hypervisor configuration error, not only a code flaw, so secure hypervisor settings matter as much as patches.

**Scenario:** Clue: code running in a test VM starts reading files from the physical server's disk and from another VM on the same host. Answer: VM escape. The closest wrong answer, resource reuse, fails because the attacker actively broke out of the guest instead of finding old data left in reassigned memory.

### Resource reuse vulnerability in virtualization (residual data)
Resource reuse is a virtualization vulnerability in which memory, storage or other resources move from one virtual machine (VM) or tenant to another without being fully cleared, so the new owner can read data left behind. It breaks confidentiality between tenants. NIST's control for this calls for preventing unauthorized and unintended transfer of information through shared resources, also known as object reuse or residual information protection.

How it happens:
1. A VM or tenant writes sensitive data to memory or disk blocks.
2. The VM is deleted or the resources are released back to the pool.
3. The hypervisor or storage system hands the same blocks to a new VM without wiping them.
4. The new VM reads the raw blocks and recovers fragments of the old data.

**Why it matters:** In multitenant clouds, leftover data can include another customer's files, keys or personal data. Providers must clear resources before reassignment, and customers can encrypt their own data so leftovers are unreadable.

**Common confusions:** Resource reuse is passive leakage of old data; VM escape is an active break-out. Resource reuse differs from data remanence on a physical disk being disposed of, which is handled by sanitization (objective 4.2). Overcommitting memory across VMs raises the stakes but is not the flaw itself.

**Scenario:** Clue: a new cloud VM's freshly attached disk contains readable fragments of another company's invoices. Answer: resource reuse. The closest wrong answer, misconfiguration of a storage bucket, fails because nothing was shared on purpose; the provider handed over blocks that were never wiped.

### Cloud-specific vulnerabilities
Cloud-specific vulnerabilities are weaknesses that arise from how cloud services are used: misconfigured storage and permissions, weak identity and access controls, exposed application programming interfaces (APIs), shared tenancy, and confusion over who secures what under the shared responsibility model (covered with the responsibility matrix in objective 3.1). Many of the most common problems sit on the customer's side of the model.

How cloud weaknesses typically arise:
1. A team creates resources quickly, often through scripts or a web console, with permissive defaults or copied settings.
2. Storage is left readable by anyone, a management key is published in code, or roles grant far more access than needed.
3. Nobody reviews the settings because "the provider handles security."
4. Attackers scan for exposed storage and keys, which needs little skill.

A US intelligence agency's cloud guidance from 2020 groups cloud vulnerabilities into four classes: misconfiguration, poor access control, shared tenancy and supply chain. It is widely reported as rating misconfiguration the most prevalent of the four, linked to policy mistakes and misunderstanding of shared responsibility, and shared tenancy and supply chain flaws as the least common, demanding the most attacker skill.

**Why it matters:** One public storage container can expose millions of records. Defenses: configuration baselines built with infrastructure as code, automated, continuous configuration checks, least privilege roles, multifactor authentication for every console and API user, keys kept in a secrets manager, and logging of API activity.

**Common confusions:** Moving to the cloud does not move all responsibility to the provider; data, identities and configuration stay with the customer in most service models. Breaches caused by a flaw on the provider's side are reported far less often than customer misconfiguration.

**Scenario:** Clue: a search engine indexes a company's cloud storage container full of scanned passports; the container was set to public during a test. Answer: a cloud-specific misconfiguration vulnerability. The closest wrong answer, a provider-side resource reuse flaw, fails because the data was exposed by the customer's own setting.

### Supply chain vulnerabilities: service providers, hardware providers and software providers
Supply chain vulnerabilities are weaknesses an organization inherits from the third parties it relies on. The objective names three: service providers (cloud, payroll, managed IT, which hold your data or access), hardware providers (devices that may be counterfeit, tampered with or built on flawed parts) and software providers (products and the libraries inside them, which may contain flaws or malicious code).

How each one bites, with known cases:
1. Service provider: a breach at a provider exposes every client's data or access; accountability for your data stays with you.
2. Hardware provider: in 2020, researchers examined counterfeit enterprise network switches built to bypass the genuine vendor's authentication checks; they were found only when a software update made them stop working.
3. Software provider: a widely bundled open-source logging library (Log4j) had a critical remote code execution flaw disclosed in December 2021, and many organizations did not know which of their products contained it.

Controls: assess vendors before and during the relationship (objective 5.3), set security terms in contracts, limit what providers can access, buy hardware through authorized channels and check it on arrival, keep a software bill of materials (SBOM), an inventory of the components inside each product, and monitor packages for new vulnerabilities (objective 4.3).

**Why it matters:** You cannot patch what you do not know you have. Organizations that already knew which products contained the vulnerable library could start fixing at once; the rest first had to find it.

**Common confusions:** In objective 2.2, supply chain is the path of an attack (managed service provider, vendor, supplier); here it is the weakness of depending on providers. A malicious update is one specific software provider problem. An SBOM lists components; it does not fix them.

**Scenario:** Clue: a newly announced flaw in a common open-source component affects hundreds of products, and the security team cannot tell which of its applications include it. Answer: a software provider supply chain vulnerability; an SBOM would answer the question. The closest wrong answer, zero-day, fails because the problem the team faces is not knowing where the known flaw lives, and patches for the component already exist.

### Cryptographic vulnerabilities
Cryptographic vulnerabilities are weaknesses in how cryptography is chosen, configured or managed, which let attackers read, change or forge data that should be protected. They usually come from implementation and management mistakes, not from the underlying math being broken. They threaten confidentiality and integrity.

Common forms, with the fix for each:
1. Weak or deprecated algorithms and protocols, such as the broken MD5 and SHA-1 hashes, legacy Secure Sockets Layer (SSL, all versions obsolete) and early Transport Layer Security (TLS) versions, or old ciphers: move to current standards. TLS 1.0 and 1.1 are formally deprecated, with TLS 1.2 the minimum, partly because their handshakes rely on SHA-1. Exact algorithm and key size guidance is in the Reference chapter.
2. Short, default, reused or exposed keys, including keys committed to source code: generate keys properly, store them in a key manager or hardware module, rotate them.
3. Not enforcing encryption, or sending data in clear text inside the network: require encryption everywhere sensitive data moves.
4. Skipping certificate validation, or using expired or untrusted certificates: validate the full chain.
5. Weak randomness, reused initialization values or unsafe modes: use cryptographically secure random number generators and authenticated encryption.
6. Storing passwords with fast or unsalted hashes: use slow, salted password hashing designed for the purpose.

**Why it matters:** Weak cryptography fails silently: data looks protected until an attacker reads it. Payment, health and privacy rules require strong protection, so weak crypto also brings fines.

**Common confusions:** A cryptographic vulnerability is usually about choices and handling, not "breaking the algorithm." A downgrade attack (objective 2.4) exploits support for old protocol versions, which is a cryptographic vulnerability in configuration. Encoding is not encryption.

**Scenario:** Clue: an audit finds a payment application that still allows Transport Layer Security (TLS) 1.0 (deprecated) and stores customer passwords as unsalted MD5 hashes (MD5 is broken and far too fast for passwords). Answer: cryptographic vulnerabilities (deprecated protocol, weak password hashing). The closest wrong answer, misconfiguration, is partly right but less precise, because the findings center on the strength of the cryptography chosen.

### Misconfiguration vulnerabilities
A misconfiguration is an insecure setting on a system that is otherwise sound: unneeded features, ports or services left on; default accounts and passwords kept; error messages that reveal internal details; security features left off after an upgrade; missing security headers; or cloud permissions set too loosely. It is one of the most common causes of breaches, at every layer of the stack.

How misconfiguration creeps in:
1. Systems are installed with defaults built for easy setup, not security.
2. Settings are changed for a test or a quick fix and never changed back.
3. Each environment is configured by hand, so they drift apart.
4. Nobody checks the settings again until an audit or a breach.

How to prevent it: a repeatable, automated hardening process that builds every environment the same way (with different credentials per environment); a minimal platform with unused features and samples removed; secure baselines checked automatically and enforced (objective 4.1); configuration review during patching; and segmentation so one mistake exposes less.

**Why it matters:** Misconfigurations need little skill to exploit and are easy to find with scanning, so they are often the first thing attackers try. They also cause compliance failures.

**Common confusions:** A misconfiguration is in the settings; a code vulnerability is in the software. Default credentials are a specific misconfiguration. Fixing a misconfiguration is a change to settings, not a patch.

**Scenario:** Clue: a database server reachable from the internet accepts connections with no password because remote access was enabled for a vendor demo months ago. Answer: a misconfiguration vulnerability. The closest wrong answer, zero-day, fails because there is no unknown software flaw; the setting itself is the weakness.

### Side loading on mobile devices
Side loading is installing an app from a source other than the platform's official app store, such as a downloaded Android package (APK) file or an unofficial store. It skips the store's security review, so malicious or tampered apps reach the device. It is a mobile device vulnerability, and it does not require removing the operating system's restrictions.

How it happens and is controlled:
1. A user wants an app that is not in the official store, or a "free premium" version of a paid one.
2. The user allows installs from unknown sources (easier on Android than iOS) and installs the file.
3. The app may carry spyware or steal data, with no store vetting to catch it.
4. Mobile device management (MDM, objective 4.1) policies can block installs from unofficial stores and flag harmful apps.
On iOS 17.4 or later, users in the European Union can install apps from approved alternative marketplaces, which distribute apps that Apple has notarized.

**Why it matters:** A side loaded app on a phone that holds work email and authenticator apps can expose company accounts. Enterprise policy usually treats third-party apps of unknown origin as untrusted.

**Common confusions:** Side loading installs outside apps but leaves the operating system (OS) security model in place; jailbreaking or rooting removes OS restrictions. Side loading often becomes easier after jailbreaking, which is why they appear together. Installing an approved app through the company's own managed store is not side loading in the risky sense.

**Scenario:** Clue: an employee installs a game on a company Android phone from a forum link because it is not in the store; the phone then starts sending contacts to an unknown server. Answer: side loading. The closest wrong answer, jailbreaking, fails because the employee did not remove the OS restrictions; they only installed an app from outside the store.

### Jailbreaking and rooting (removing mobile OS restrictions)
Jailbreaking is removing the manufacturer's restrictions on an Apple iOS device; rooting is the Android equivalent, gaining root (administrator) access. Both give the user, and any app, full control of the device, which seriously weakens the platform's security model. They are mobile device vulnerabilities.

How it weakens the device:
1. The user runs a tool that exploits a flaw in the OS or, on some Android devices, unlocks the bootloader, to get around the vendor's built-in security controls.
2. Apps can now run commands with root privileges and reach other apps' data and system files.
3. Protections such as app sandboxing and app store vetting can be bypassed, and the device may no longer install official updates cleanly.
4. Malware installed later has far more power than on a locked device.
Mobile device management (MDM) can detect many rooted or jailbroken devices, for example through hardware-backed attestation, and block them from company resources. Detection is not perfect, so it is paired with keeping devices patched, which also makes jailbreaking harder.

**Why it matters:** A jailbroken phone with access to company email and files is a high-risk endpoint. Policies usually forbid it on managed devices and remove access when detected.

**Common confusions:** Jailbreaking is iOS; rooting is Android. Side loading only installs outside apps; jailbreaking removes OS limits. In artificial intelligence security, "jailbreak" means a prompt that tricks a model past its safety rules, an unrelated meaning.

**Scenario:** Clue: the MDM console reports that an executive's iPhone fails its integrity check and has a third-party package manager installed. Answer: jailbreaking. The closest wrong answer, side loading, fails because the integrity failure shows the OS restrictions themselves were removed.

### Zero-day vulnerability
A zero-day vulnerability is a flaw in hardware, firmware or software that the vendor does not know about, or has not yet fixed, so defenders have had zero days to patch. An attack that uses it is a zero-day attack, and the code is a zero-day exploit. It is defined by timing, not by where the flaw lives.

How a zero-day progresses:
1. Someone finds the flaw: a researcher, a criminal or a nation-state.
2. If attackers use it before the vendor knows, no patch and often no detection signature exists.
3. The vendor learns of it (through attacks, research or disclosure) and develops a fix.
4. Once a patch is released, the flaw is a known vulnerability, and unpatched systems become the risk.
Hacking contests and bug bounty programs pay researchers to report such flaws so vendors can fix them before attackers use them.

**Why it matters:** Signature-based tools cannot catch what nobody has described yet. Defense in depth limits the damage: least privilege, segmentation, application allow lists, behavior-based detection, exploit protection, and fast patching the moment a fix appears. Well funded actors such as nation-states buy or develop zero-days, so high-value targets must assume they can be hit.

**Common confusions:** A zero-day has no patch yet; a known flaw that was never patched is an unpatched vulnerability. A flaw on an unsupported system that will never get a patch is not a zero-day once it is publicly known. "Zero-day" says nothing about severity.

**Scenario:** Clue: attackers exploit a browser flaw for weeks before the vendor learns of it and releases an emergency fix. Answer: a zero-day vulnerability. The closest wrong answer, an operating system (OS)-based vulnerability, fails because the clue is about the lack of any patch, and the flaw was in the browser, not the operating system.

### Comparing application vulnerabilities: memory injection vs buffer overflow vs race condition vs update
All four are application weaknesses; ask what the attacker manipulates.

| Weakness | What is manipulated | Decisive clue |
|---|---|---|
| Memory injection | Another process's memory | Trusted process running foreign code |
| Buffer overflow | Memory next to an undersized buffer | Crash or control from overly long input |
| Race condition (TOCTOU) | Timing between check and use | Results change when requests arrive together |
| Malicious update | The vendor's update channel | Signed update behaving badly everywhere |

How to decide:
1. Is the input simply too long for where it lands, followed by a crash or hijacked execution? Buffer overflow.
2. Does trusted software suddenly run code that came from another process? Memory injection.
3. Does the result depend on two things happening close together in time? Race condition.
4. Did the harmful code arrive through the vendor's own, often signed, update? Malicious update.

**Common confusions:** An overflow can be the way an attacker first gets code running, after which injection hides it; name the one the clue describes. Time of check is not the attack; the change between check and use is. A malicious update is also a supply chain problem; inside objective 2.3 it is listed under application weaknesses.

**Scenario:** Clue: a file permission check passes, then a different file is written because the attacker swapped it in between. Answer: race condition (TOCTOU). The closest wrong answer, buffer overflow, fails because no input was too long.

### Comparing web vulnerabilities: SQL injection (SQLi) vs cross-site scripting (XSS)
Both come from untrusted input that the application fails to handle safely, but they hit different targets.

| Feature | SQLi (Structured Query Language injection) | XSS (cross-site scripting) |
|---|---|---|
| Where the payload runs | The server's database | Other users' browsers |
| Typical input | Quotes, OR 1=1, UNION SELECT | Script tags, event handlers |
| Main harm | Data read, changed or deleted; login bypass | Session theft, account takeover, page changes |
| Primary fix | Parameterized queries | Output encoding for the context, with Content Security Policy as an added layer |

**Common confusions:** Input validation helps both but is the primary fix for neither. Stored XSS saves its payload in the database, yet it is still XSS because it runs in the browser. A web application firewall can block common patterns of both while code is being fixed, but it is a stopgap, not the cure.

How to decide in three steps:
1. Find where the attacker's input ends up executing: in a database query, or in a web page shown to someone.
2. Ask who is harmed directly: the data store (SQLi) or the people viewing the page (XSS).
3. Choose the fix that matches: separate command from data with parameters (SQLi), or encode output for its context (XSS).

**Scenario:** Clue: a comment field accepts an image tag whose error handler runs JavaScript, and every reader's browser then runs the code. Answer: XSS. The closest wrong answer, SQLi, fails because the database only stored the text; the harm happened in browsers.

### Comparing platform vulnerabilities: VM escape vs resource reuse, EOL vs legacy, side loading vs jailbreak
Use this table for the pairs that share a category. VM means virtual machine, EOL means end-of-life and OS means operating system.

| Pair | Decisive difference |
|---|---|
| VM escape vs resource reuse | Escape breaks out to the host; reuse leaks old data between VMs |
| End-of-life (EOL) vs legacy | EOL is a vendor lifecycle stage; legacy is old and still in use, supported or not |
| Unsupported vs unpatched | Unsupported will never get fixes; unpatched has fixes not yet applied |
| Zero-day vs unpatched | Zero-day has no fix yet; unpatched has one waiting |
| Side loading vs jailbreaking or rooting | Side loading installs outside apps; jailbreaking or rooting removes OS limits |
| Firmware vs OS-based | Firmware lives in the device below the OS; OS flaws are in the operating system |
| Supply chain vector (2.2) vs vulnerability (2.3) | Vector is the path through a third party; vulnerability is the inherited weakness |

**Common confusions:** Several labels can apply at once: a legacy device past end of support running unpatched firmware is EOL, legacy and a firmware risk. Answer with the label the clue stresses. The fixes differ too: unpatched means apply the patch, unsupported or EOL means upgrade or isolate, zero-day means layered defenses until a patch exists, and jailbroken means remove the device's access until it is restored.

**Scenario:** Clue: a vendor notice says it "will never release a fix" for a known flaw in an old product. Answer: unsupported or end-of-support system. The closest wrong answer, zero-day, fails because the flaw is already known.
