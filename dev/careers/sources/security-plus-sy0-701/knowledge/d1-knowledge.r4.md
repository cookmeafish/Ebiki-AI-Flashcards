# 1.0 General Security Concepts

Domain 1.0 is 12% of the SY0-701 exam, the smallest domain, but its vocabulary appears everywhere else. It has four objectives: security controls (1.1), fundamental concepts (1.2), change management (1.3) and cryptographic solutions (1.4). Most questions are short scenarios asking you to classify something or pick the right tool.

## 1.1 Compare and contrast various types of security controls


**What the exam expects:** classify a control on two independent axes. Category = how it is implemented. Type = what it is meant to achieve. The same control has one category but may have several types.

### Categories

**Technical:** enforced by a system (hardware, software, firmware). Firewalls, antivirus, OS permissions, encryption. Also called logical controls.

**Managerial:** administrative controls about how security is designed and governed. Policies, standards, risk assessments, security plans.

**Operational:** carried out by people as part of daily work. Guards checking IDs, awareness training, log review done by staff.

**Physical:** protect the physical environment. Fences, locks, bollards, badge readers.

Trap: managerial writes the rule, operational is people performing it, technical is a system enforcing it.

### Control types

**Preventive:** stops the event from happening. Firewall deny rule, door lock, account lockout.

**Deterrent:** discourages, but does not block. Warning banner, visible reception guard, threat of disciplinary action.

**Detective:** identifies and records the event, does not stop it. Log review, IDS alert, motion sensor.

**Corrective:** applied after the event to limit damage and restore. Restoring backups, incident response removing malware.

**Compensating:** a substitute when the required control cannot be used. Isolating an unpatchable legacy system on its own segment.

**Directive:** tells people what to do and relies on compliance. Policies, "Authorized personnel only" signs.

| Look-alikes | How to tell them apart |
|---|---|
| Preventive vs deterrent | Preventive physically or technically blocks; deterrent only discourages |
| Detective vs preventive | IDS detects (alerts), IPS prevents (blocks) |
| Corrective vs compensating | Corrective acts after an incident; compensating replaces a control you cannot implement |
| Directive vs deterrent | Directive instructs ("do this"); deterrent warns of consequences ("or else") |

**Exam tips:** look for words like "cannot", "unable", "legacy" (compensating), "after the attack" (corrective), "alerts" (detective). A guard or a camera can satisfy several types; pick the one the scenario emphasizes.

**Check yourself**
1. A company cannot install agents on old medical devices, so it puts them on a separate VLAN with strict ACLs. Type? Compensating.
2. A login banner warns that activity is monitored and misuse prosecuted. Type? Deterrent.
3. Security awareness training: category? Operational.
4. Backups restored after ransomware. Type? Corrective.
5. A firewall that blocks traffic from known bad IPs: category and type? Technical, preventive.

## 1.2 Summarize fundamental security concepts


**What the exam expects:** define each concept, match tools to the CIA goal they serve, name the Zero Trust components and their roles, pick the right physical control or sensor, and distinguish the four deception technologies.

### Confidentiality, Integrity, and Availability (CIA)

- **Confidentiality:** only authorized parties can read data. Encryption, access controls, MFA.
- **Integrity:** data is not altered without detection. Hashing, digital signatures, certificates.
- **Availability:** systems and data are reachable when needed. Redundancy, fault tolerance, patching, backups. DDoS attacks target availability.

### Non-repudiation

Proof that a specific party sent or signed something, so they cannot deny it. Provided by digital signatures: a hash signed with the sender's private key. A plain hash proves integrity only; symmetric keys cannot give non-repudiation because two parties share the same key.

### Authentication, Authorization, and Accounting (AAA)

Identification (claiming an identity, such as a username), then **authentication** (proving it), **authorization** (what you may access), **accounting** (recording what you did: login times, data used, logs). RADIUS and TACACS+ servers commonly provide AAA.

#### Authenticating people
Passwords plus additional factors (something you know, have, are, somewhere you are). MFA means different factor types, not two of the same.

#### Authenticating systems
Devices cannot type passwords, so they present a digital certificate signed by the organization's CA. Used for VPN, Wi-Fi and network access control to confirm a device is company-owned.

#### Authorization models
An abstraction between users and resources (roles, groups, attributes, rules) so permissions scale and can be audited. Assigning every user to every resource directly does not scale. Specific models (RBAC, ABAC, MAC, DAC, rule-based) are detailed in objective 4.6.

### Gap analysis

Compare where security is now with where it should be, usually against a framework (NIST, ISO/IEC 27001), list the gaps, and produce a plan to close them. Often takes weeks or months and covers people, processes and technology.

### Zero Trust

"Never trust, always verify": no implicit trust based on network location; every request is authenticated, authorized and evaluated. Based on NIST SP 800-207.

#### Control plane
Where decisions are made and policies are managed.
- **Adaptive identity:** context (location, device, behavior, risk) changes how much verification is required.
- **Threat scope reduction:** fewer entry points, least privilege, smaller attack surface.
- **Policy-driven access control:** access decided by rules combining identity and context.
- **Policy Engine:** makes the grant, deny or revoke decision.
- **Policy Administrator:** executes that decision by telling the PEP to open or close the path (tokens, credentials).

#### Data plane
Where traffic flows and decisions are enforced.
- **Subject/System:** the user, application or other non-human entity such as a process (subject) and the device or application (system) requesting access.
- **Policy Enforcement Point (PEP):** the gatekeeper; enables, monitors and terminates connections as instructed.
- **Implicit trust zones:** the area behind the PEP where entities are trusted after passing it; keep them small. NIST compares it to an airport: once past security, everyone in the boarding area is trusted.

| Component | Plane | Job |
|---|---|---|
| Policy Engine | Control | Decides |
| Policy Administrator | Control | Relays the decision, sets up or tears down the session |
| Policy Enforcement Point | Data | Enforces, gatekeeper for traffic |

Memory aid: Engine decides, Administrator acts on it, Enforcement Point enforces. NIST SP 800-207 calls the Policy Engine and Policy Administrator together the Policy Decision Point (PDP).

### Physical security

- **Bollards:** posts that stop vehicles but let people pass.
- **Access control vestibule:** two doors, only one open at a time; stops tailgating (formerly mantrap).
- **Fencing:** perimeter barrier, transparent or opaque, possibly razor wire.
- **Video surveillance:** CCTV with motion detection, object detection, facial recognition; detective and deterrent.
- **Security guard:** flexible, can judge situations; two-person integrity for sensitive areas.
- **Access badge:** photo ID plus RFID/NFC for door access; usage can be logged.
- **Lighting:** deters intruders, removes shadows, improves camera footage.

#### Sensors
| Sensor | Detects |
|---|---|
| Infrared | Heat (body heat moving through the field) |
| Pressure | Weight or force on a surface (floor mats) |
| Microwave | Motion, by reflected microwave pulses; large areas |
| Ultrasonic | Motion, by echoes of high-frequency sound |

### Deception and disruption technology

| Technology | What it is |
|---|---|
| Honeypot | One decoy system that attracts attackers |
| Honeynet | A network of decoys (several honeypots, servers, workstations) |
| Honeyfile | A bait file (e.g. passwords.txt) that alerts when opened |
| Honeytoken | Fake traceable data (credential, API key, email address) that reveals a breach when used or seen |

Any interaction with a decoy is suspicious because legitimate users have no reason to touch it.

**Exam tips:** IDS-like alerting from a fake file is a honeyfile; tracking leaked data across the internet is a honeytoken. "Who decides" in Zero Trust is the Policy Engine. Vestibule answers tailgating questions; bollards answer vehicle questions.

**Check yourself**
1. Fake API keys are planted in a repository to detect theft. What are they? Honeytokens.
2. Which Zero Trust component grants or denies access? Policy Engine.
3. A data center wants to stop people following an employee through a door. Control? Access control vestibule.
4. A sensor must detect a person by body heat in a dark room. Which? Infrared.
5. Which provides non-repudiation: a hash or a digital signature? A digital signature.

## 1.3 Explain the importance of change management processes and the impact to security


**What the exam expects:** know why changes must be controlled (unplanned changes cause outages and open security holes), each step of the business process, the technical side effects to plan for, and the need to keep documentation and versions current.

### Business processes impacting security operation

- **Approval process:** formal review and sign-off, typically by a change advisory board (CAB), based on purpose, scope, risk and schedule.
- **Ownership:** the person or group accountable for the change and the affected system; the owner requests and is informed, IT may do the work.
- **Stakeholders:** everyone affected; involve them early, since small changes can reach many departments.
- **Impact analysis:** risks of making the change and of not making it; side effects; rated high, medium or low.
- **Test results:** evidence from a sandbox or test environment that the change works; test the backout too.
- **Backout plan:** how to return to the previous state if it fails; usually relies on backups or snapshots.
- **Maintenance window:** scheduled low-impact time for changes; change freezes during critical business periods.
- **Standard operating procedure (SOP):** written steps for routine tasks, including the change process itself.

### Technical implications

- **Allow lists/deny lists:** a change may require updating them; a new app version may be blocked by an allow list, or a rule change may open unintended access.
- **Restricted activities:** stay within the approved scope; extra fixes need their own change.
- **Downtime:** plan it, minimize it with failover, communicate it.
- **Service restart:** background services may need restarting and may not come back cleanly.
- **Application restart:** users may be interrupted and lose unsaved work.
- **Legacy applications:** fragile and often unsupported; need extra care, documentation or compensating controls.
- **Dependencies:** a change to one component can require changes or restarts elsewhere; map them first.

### Documentation

- **Updating diagrams:** network and system diagrams must match the new reality.
- **Updating policies/procedures:** new systems and processes need revised procedures.

Documentation updates should be part of closing every change.

### Version control

Track changes to code, configurations and documents with who, what and when, so you can compare and roll back. Supports backout plans and audits.

**Exam tips:** "how do we undo it" is the backout plan; "when do we do it" is the maintenance window; "who signs off" is the approval process or CAB; "what could break" is impact analysis.

**Check yourself**
1. An upgrade failed and the team restored the server snapshot. Which part of the plan was used? Backout plan.
2. A technician fixes an extra issue outside the approved change. What was violated? Restricted activities (scope).
3. After a patch, a new executable will not run because of application control. Implication? Allow list needs updating.
4. Which step weighs the risk of not making the change? Impact analysis.
5. A firewall config was changed badly; how can the previous config be found and restored? Version control.

## 1.4 Explain the importance of using appropriate cryptographic solutions


**What the exam expects:** choose the right cryptographic tool for a scenario: which key does what, which encryption level fits, symmetric vs asymmetric, which hardware stores keys, obfuscation vs encryption, hashing vs encryption, salting vs key stretching, and how certificates are issued and checked.

### Public key infrastructure (PKI)

The policies, roles, hardware, software and procedures for issuing, managing and revoking certificates that bind public keys to identities.

- **Public key:** shared openly; encrypts data for the owner, verifies the owner's signatures.
- **Private key:** kept secret; decrypts what the public key encrypted, creates signatures. If compromised, revoke the certificate.
- **Key escrow:** a trusted third party or protected store holds copies of keys for recovery or legal access.

| Goal | Key used |
|---|---|
| Send someone confidential data | Encrypt with recipient's public key |
| Read data sent to you | Decrypt with your private key |
| Sign data | Sender's private key |
| Verify a signature | Sender's public key |

### Encryption

#### Level
From a whole drive down to specific data (not a strict order: a volume can span disks):
- **Full-disk:** whole drive including OS (BitLocker, FileVault). Protects lost or stolen devices.
- **Partition:** one partition of a drive.
- **Volume:** a logical volume, which may span disks or be part of one (BitLocker To Go on USB).
- **File:** individual files or folders (Windows EFS; Microsoft says Encrypting File System, CompTIA's acronym list says Encrypted File System). A copy moved to a non-NTFS drive loses its EFS encryption.
- **Database:** the whole database at rest, including data files, log files and backups (Transparent Data Encryption); not data in transit.
- **Record:** individual records or columns, the most granular (field-level).

**Transport/communication:** data in transit; TLS (HTTPS), IPsec VPNs, SSH.

**Asymmetric:** key pair, slower, used for key exchange and signatures (RSA, ECC; Diffie-Hellman agrees on a key, it does not encrypt).

**Symmetric:** one shared key, fast, used for bulk data (AES). Weakness: getting the key to the other side.

**Key exchange:** out-of-band (another channel such as phone or courier) or in-band (over the network, protected by asymmetric crypto or Diffie-Hellman). Typical pattern: asymmetric crypto establishes a temporary symmetric session key. TLS 1.3 uses only ephemeral (fresh) Diffie-Hellman in every full handshake, which gives forward secrecy: a server key stolen later cannot decrypt old recorded sessions. A resumed session that uses only a pre-shared key has no forward secrecy.

**Algorithms:** the public, tested math; secrecy comes from the key. Use current ones (AES, RSA, ECC); avoid deprecated ones (DES, RC4; for hashing, MD5 is broken).

**Key length:** more bits, harder to brute force. Asymmetric keys must be much longer than symmetric for similar strength (RSA-2048 is only about as strong as a 112-bit symmetric key; matching AES-256 would take RSA-15360); ECC reaches RSA strength with shorter keys (NIST: a 256-bit ECC key is about as strong as AES-128 or RSA-3072).

| Symmetric | Asymmetric |
|---|---|
| One shared secret key | Public/private key pair |
| Fast, bulk data | Slow, small data, key exchange, signatures |
| Key distribution problem | Public key can be shared freely |
| No non-repudiation | Signatures give non-repudiation |
| AES | RSA and ECC (encrypt, sign); Diffie-Hellman only agrees on a shared key, it does not encrypt or sign |

### Tools

- **Trusted Platform Module (TPM):** chip on one device's motherboard; key storage, random number generator, measurements of each boot step (measured boot); resists password guessing with dictionary attack protection; seals full-disk encryption keys and releases them only when the boot measurements match. Many computers use a firmware TPM built into the processor instead of a separate chip.
- **Hardware security module (HSM):** dedicated, tamper-resistant appliance or card for many keys and many systems; clustered, high availability, crypto acceleration; protects CA root keys.
- **Key management system:** centralized lifecycle management: create, store, distribute, rotate, expire, revoke, audit.
- **Secure enclave:** hardware-isolated processor inside a system on a chip that protects keys and biometric data from the main OS (Apple Secure Enclave).

| Scenario | Tool |
|---|---|
| Laptop BitLocker key storage | TPM |
| Certificate authority root key, payment keys, enterprise scale | HSM |
| Rotating and auditing keys centrally, cloud storage keys | Key management system |
| Phone fingerprint data isolated from the OS | Secure enclave |

### Obfuscation

- **Steganography:** hides the existence of data inside other data (image pixels, audio, network traffic).
- **Tokenization:** replaces sensitive data with a random token that has no mathematical link to it; the original lives in a token vault. Not reversible by decryption. Common in payments (a phone wallet pays with a device-specific token plus a one-time code). Can shrink PCI DSS scope, but does not remove PCI DSS duties. PCI also describes cryptographic tokens made from the card number with a key; the exam case is the vault kind.
- **Data masking:** hides part of the displayed value (**** 4321).

### Hashing

One-way, fixed-length digest; same input gives same output; cannot be reversed. Provides integrity (file verification); also used for password storage, with salting and key stretching. A collision is two inputs with the same hash; MD5 is broken where collision resistance matters, SHA-256 is current for integrity. A fast hash alone is too quick for passwords: use a slow password hash (Argon2id, bcrypt, PBKDF2) with a salt.

### Salting

A random, per-password value added before hashing so identical passwords produce different hashes. Defeats rainbow tables. The salt is stored with the hash and is not secret.

### Digital signatures

Hash the message, encrypt the hash with the sender's private key; the recipient verifies with the sender's public key. Gives integrity, authentication and non-repudiation, not confidentiality. "Encrypt the hash with the private key" is the exam's simplified picture; NIST describes signing as its own private-key operation.

### Key stretching

Run a password through a hash or key derivation function many times (PBKDF2, bcrypt) so each brute-force guess costs more. OWASP suggests at least 600,000 PBKDF2-HMAC-SHA-256 iterations, and its first choice is Argon2id, which also needs a lot of memory per guess.

| Salting | Key stretching |
|---|---|
| Random value added per password | Many hashing rounds |
| Stops precomputed (rainbow table) attacks | Slows every brute-force guess |
| Used together in good password storage | Used together in good password storage |

### Blockchain

A distributed ledger of blocks, each holding the hash of the previous block, so changing old data breaks the chain and is detected. Provides integrity without a central authority.

### Open public ledger

The shared, public record of all blockchain transactions, held by every participant so anyone can verify it.

### Certificates

X.509 digital certificates bind a public key to an identity, signed by a CA. They contain the subject, public key, issuer, serial number and validity dates, never the private key.

- **Certificate authorities:** verify identity and issue, sign and revoke certificates; root CA, intermediate CAs, end-entity certificates form the chain of trust. A registration authority (RA) can check identities for the CA.
- **Certificate revocation lists (CRLs):** CA-published list of revoked serial numbers; downloaded periodically, not real-time.
- **Online Certificate Status Protocol (OCSP):** real-time status check of one certificate (answers good, revoked or unknown); OCSP stapling lets the server include a signed status in the TLS handshake. Real-world shift: since March 2024 CA/Browser Forum rules require public TLS CAs to publish CRLs and make OCSP optional, and Let's Encrypt turned OCSP off in August 2025 for privacy reasons. The exam still treats OCSP as the real-time check.
- **Self-signed:** signed by its own key; not trusted by default; internal or test use.
- **Third-party:** issued by a public CA; trusted by browsers automatically.
- **Root of trust:** the inherently trusted base of a trust chain: a root CA or hardware such as a TPM or HSM.
- **Certificate signing request (CSR) generation:** the requester creates a key pair and a CSR (public key plus identity details) and sends it to the CA; the private key never leaves the requester.
- **Wildcard:** *.example.com covers any single-level subdomain (www, mail, shop) but not deeper levels or the bare domain; one key compromise affects all of them. A SAN (Subject Alternative Name) certificate lists specific names instead.

| CRL | OCSP |
|---|---|
| Whole list downloaded | One certificate queried |
| Periodic, can be stale | Real-time |
| Can grow large | Lightweight; stapling reduces client lookups |

**Exam tips:** "integrity only" is hashing; "integrity plus proof of sender" is a digital signature. "Hide that a message exists" is steganography. "Replace card number, keep original in a vault" is tokenization. "Real-time revocation check" is OCSP. "Many subdomains, one certificate" is wildcard.

**Check yourself**
1. A CA needs its root private key protected in tamper-resistant hardware. Tool? HSM.
2. Users share the same password but their stored hashes differ. Why? Salting.
3. Only the credit card column in a database must be encrypted. Level? Record.
4. Alice wants Bob to be the only one who can read her message. Which key does she use? Bob's public key.
5. A browser must check whether a server's certificate was revoked right now. Protocol? OCSP.
