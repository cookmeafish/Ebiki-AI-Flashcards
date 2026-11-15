# d1 sweeps: Domain 1.0 General Security Concepts (r2 to r3, 2026-11-15)

Files: `cards/d1-cards.r3.json` (116 cards, same order, obj and path as r2) and `knowledge/d1-knowledge.r3.md`.
Rule followed: fix only what a source read this session shows is wrong, add what is missing, keep every true helpful detail, all in our own words (no 12+ word run from any source or the outline).
Checks run: the r3 JSON parses, 116 cards, obj/path/term unchanged per position, no em or en dashes, no HTML; `npx vitest run dev/careers/verbatim.test.js dev/careers/coverage.test.js` passed (7 tests).

## Sources read this session
| Key | Source |
|---|---|
| S1 | NIST SP 800-207 Zero Trust Architecture, https://doi.org/10.6028/NIST.SP.800-207 (sections 2 and 3.1, read in full text) |
| S2 | a video course, Security Controls (SY0-701),  |
| S3 | a video course, Physical Security,  |
| S4 | a video course, Change Management,  |
| S5 | a video course, Technical Change Management,  |
| S6 | a video course, Zero Trust,  |
| S7 | a video course, Gap Analysis,  |
| S8 | a video course, Deception and Disruption,  |
| S9 | a video course, Encrypting Data,  |
| S10 | a video course, Encryption Technologies,  |
| S11 | Microsoft Learn, Trusted Platform Module Technology Overview, https://learn.microsoft.com/en-us/windows/security/hardware-security/tpm/trusted-platform-module-overview |
| S12 | Apple Platform Security, The Secure Enclave, https://support.apple.com/guide/security/the-secure-enclave-sec59b0b31ff/web |
| S13 | Apple, Apple Pay security and privacy overview, https://support.apple.com/101554 ; Apple Platform Security, Card provisioning, https://support.apple.com/guide/security/card-provisioning-security-overview-sec0f005981a/web |
| S14 | PCI SSC Tokenization Product Security Guidelines, https://listings.pcisecuritystandards.org/documents/Tokenization_Product_Security_Guidelines.pdf ; PCI DSS Tokenization Guidelines information supplement, https://listings.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf |
| S15 | OWASP Password Storage Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| S16 | NIST CSRC glossary, digital signature (FIPS 186-5, SP 800-63-4 and others), https://csrc.nist.gov/glossary/term/digital_signature |
| S17 | NIST SP 800-57 Part 1 Rev. 5, Table 2, https://doi.org/10.6028/NIST.SP.800-57pt1r5 |
| S18 | RFC 6960 OCSP, https://www.rfc-editor.org/rfc/rfc6960 |
| S19 | RFC 6066 (status_request, OCSP stapling), https://www.rfc-editor.org/rfc/rfc6066 |
| S20 | RFC 6125 section 6.4.3 (wildcards), https://www.rfc-editor.org/rfc/rfc6125 |
| S21 | RFC 5280 (X.509 profile, RA definition, certificate fields), https://www.rfc-editor.org/rfc/rfc5280 |
| S22 | RFC 2986 PKCS #10 certification request, https://www.rfc-editor.org/rfc/rfc2986 |
| S23 | CA/Browser Forum Baseline Requirements (BR.md: SC063 effective 2024-03-15, sections 4.9.7 and 4.9.9, CRL profile), https://github.com/cabforum/servercert/blob/main/docs/BR.md ; ballot page https://cabforum.org/2023/07/14/ballot-sc063v4-make-ocsp-optional-require-crls-and-incentivize-automation/ |
| S24 | Let's Encrypt, Ending OCSP Support, https://letsencrypt.org/2024/12/05/ending-ocsp/ |
| S25 | Microsoft Learn, Transparent Data Encryption, https://learn.microsoft.com/en-us/sql/relational-databases/security/encryption/transparent-data-encryption |
| S26 | Microsoft TechNet Magazine, How IT Works: Encrypting File System, https://learn.microsoft.com/en-us/previous-versions/technet-magazine/cc160993(v=msdn.10) |
| S27 | NIST IR 8202 Blockchain Technology Overview, https://nvlpubs.nist.gov/nistpubs/ir/2018/NIST.IR.8202.pdf ; NIST glossary blockchain, https://csrc.nist.gov/glossary/term/blockchain |
| S28 | RFC 6151 (MD5 security), https://www.rfc-editor.org/rfc/rfc6151 |
| S29 | RFC 8446 TLS 1.3 (section 1.2: static RSA and DH removed, forward secrecy), https://www.rfc-editor.org/rfc/rfc8446 |
| S30 | RFC 8907 TACACS+ (AAA separation), https://www.rfc-editor.org/rfc/rfc8907 |
| S31 | NIST glossary, compensating security control, https://csrc.nist.gov/glossary/term/compensating_security_control |
| S32 | NIST glossary, key escrow (CNSSI 4009), https://csrc.nist.gov/glossary/term/key_escrow |
| S33 | SDM Magazine, Back to basics on detector technology, https://www.sdmmag.com/articles/84870-back-to-basics-on-detector-technology |
| S34 | The local SY0-701 outline (`outline.md`), for coverage only |
| S35 | NIST glossary, confidentiality (FIPS 200 / 44 U.S.C. 3542), https://csrc.nist.gov/glossary/term/confidentiality |
| S36 | a video course, Authentication, Authorization, and Accounting,  |
| S37 | a video course, Certificates,  |
| S38 | a video course, Obfuscation,  |

## Sweep 1: Facts
Checked every definition against the sources above. Checked 116, changed 3.
- **Trusted Platform Module (TPM)**, definition. Before: "integrity measurement for secure boot". After: "measurements of each boot step (measured boot) that can later prove how the system started". Why: the TPM records boot measurements as evidence; it does not perform UEFI Secure Boot. Source S11. Knowledge chapter updated the same way.
- **Database encryption (encryption level)**, definition. Before: "including its data files and backups". After: "including its data files, log files and backups"; key point added "protects data at rest only, not data moving over the network". Source S25 (TDE encrypts data and log files; backups use the same key; no channel encryption).
- **Subject/System (Zero Trust)**, definition. Before: "the subject is the user or process". After: "the subject is the user, application or other non-human entity (such as a process or service)". Source S1 (subjects are end users, applications and other non-human entities); S6 agrees.

## Sweep 2: Numbers and names
Checked ports, key sizes, iteration counts, standard numbers, acronym expansions and dates. Checked 116, changed 5.
- **Key stretching**, example. Before: "PBKDF2 or bcrypt hashes a password thousands of times". After: "PBKDF2 runs a password through HMAC-SHA-256 hundreds of thousands of times (OWASP suggests at least 600,000 iterations) and bcrypt uses a tunable cost factor"; key point added that OWASP's first choice is Argon2id (memory-hard). Source S15.
- **Key length (encryption)**, key point added: NIST equivalents AES-128 = RSA-3072 = ECC 256-bit; AES-256 = RSA-15360 = ECC 512+. Existing "RSA-2048 about 112-bit" confirmed. Source S17 Table 2.
- **Certificates: Wildcard certificate**, key point. Before: "a SAN certificate lists". After: "a SAN (Subject Alternative Name) certificate lists". Source S37, S21. Wildcard one-label rule confirmed by S20.
- **Policy Engine (Zero Trust)**, key point added: NIST calls PE plus PA the Policy Decision Point (PDP), and the PE logs each decision. Source S1 (S6 also uses the PDP name).
- **Policy Administrator (Zero Trust)**, key point added: some products run PE and PA as one service, still two roles. Source S1.

## Sweep 3: Examples
Checked each example is concrete, realistic and an instance of its own concept. Checked 116, changed 1.
- **Tokenization (data obfuscation)**, example. Before: "A mobile payment sends a one-time token instead of the real card number; only the payment processor's vault maps it back." After: "A phone wallet pays with a device-specific token (Apple calls it a Device Account Number) plus a one-time security code instead of the real card number; only the card issuer or payment network can map the token back to the card." Why: Apple's own documentation says the Device Account Number is created by the issuer, stays on the device, and each purchase adds a transaction-specific dynamic code verified by the bank, issuer or network; the merchant's "payment processor" does not hold the mapping. Source S13. the video course's "single use token" teaching kept as a key point (see sweep 10).

## Sweep 4: Key points
Checked every key point for truth and exam use; added true details that help. Checked 116, changed 6.
- **Restricted activities (change management)**, added: some policies allow a small extra change only when the approved task cannot be finished without it. Source S5.
- **Allow lists/deny lists (change management impact)**, added: antivirus works like a very large deny list. Source S5.
- **Microwave sensor (physical security)**, key point. Before: "more prone to false alarms". After: adds the reason, it passes through glass, drywall and wood (not metal) and can pick up motion outside the intended area. Source S33; larger coverage confirmed by S3.
- **Gap analysis (security)**, added: results are often scored per area (green, yellow, red) so the biggest gaps go first. Source S7.
- **Video surveillance (physical security)**, added: license plate reading and central storage of many cameras' footage. Source S3.
- **Implicit trust zones (Zero Trust)**, added NIST's airport boarding area analogy, in our own words. Source S1.

## Sweep 5: Confusables
Checked IDS/IPS, preventive/deterrent, corrective/compensating, directive/deterrent, PE/PA/PEP, control/data plane, TPM/HSM/KMS/secure enclave, partition/volume, database/record, symmetric/asymmetric, hashing/encryption, salting/stretching, tokenization/masking, CRL/OCSP, self-signed/third-party. All consistent across cards and chapter. Checked 116, changed 2.
- **Hashing (cryptography)**, key point. Before: "MD5 is broken; SHA-256 is current; used to store passwords, together with salting and key stretching". After: "MD5 is broken where collision resistance matters; SHA-256 is current for integrity checks, but a fast hash alone is too quick for passwords: store them with a slow password hash (Argon2id, bcrypt, PBKDF2) plus a salt". Why: the old wording let a learner pick plain SHA-256 for password storage. Sources S28, S15.
- **Digital signatures**, key point added: "encrypt the hash with the private key" is the exam's simplified picture; NIST describes signing as its own private-key operation. Definition kept in the exam's form. Source S16.

## Sweep 6: Coverage
Read every outline line of 1.0 to 1.4 (S34) against the cards: 116 lines, 116 cards, each card covers everything its line names (all 4 categories, 6 types, every Zero Trust component, every sensor, every change step and implication, every encryption level and tool, all certificate items). Checked 116, changed 1.
- **Certificates: Certificate authority (CA)**, key point added: a registration authority (RA) can check identities for the CA, which still signs. Source S21 (RA is an optional system a CA delegates management work to). RA is on the SY0-701 acronym list and no card defined it.
Missing concepts that need their own card are listed under "Proposed new cards".

## Sweep 7: Consistency
Compared every fact stated on more than one card and in the chapter (key use for encrypt/sign/verify, factor types, PE/PA/PEP roles, CRL vs OCSP, salting vs stretching, TPM vs HSM). No contradictions found in r2. Every change above was carried into the chapter so cards and chapter agree: Subject/System, implicit trust zone analogy, PDP, TDE log files, TLS 1.3 forward secrecy, ECC equivalence, TPM measured boot and dictionary attack protection, tokenization (wallet example, PCI scope, cryptographic tokens), hashing for passwords, signature simplification, OWASP iterations and Argon2id, RA, OCSP statuses and the CRL/OCSP shift, wildcard bare-domain rule and SAN. Checked 116 cards plus the chapter, cards changed 0 (chapter changed in 14 places).

## Sweep 8: Clarity
Checked plain, fluff-free wording, no em or en dashes, no HTML (scripted check on r3: none). Checked 116, changed 1.
- **Public key (PKI)**, key point. Before: "cannot be used to derive the private key". After: "cannot practically be used to work out the private key". Why: the security is computational, not absolute (key strengths in S17 are measured as work to break), and the old wording reads as impossible.

## Sweep 9: Exam fit
Checked each card against how SY0-701 frames it (current names: access control vestibule with mantrap as the old name, managerial with administrative as the alias, directive as a type, the four sensors). Two cards needed a note on what changed in practice since the exam was written. Checked 116, changed 3.
- **Certificates: Online Certificate Status Protocol (OCSP)**, key point added: since March 2024 CA/Browser Forum rules make OCSP optional and CRLs required for public TLS CAs, and Let's Encrypt turned its OCSP service off in August 2025 for privacy; the exam still treats OCSP as the real-time check. Sources S23, S24. Status values (good, revoked, unknown) confirmed by S18, stapling by S19.
- **Certificates: Certificate revocation list (CRL)**, key point added: since March 2024 every public TLS CA must publish CRLs. Source S23.
- **Key exchange (cryptography)**, key point added: TLS 1.3 dropped static RSA and static Diffie-Hellman, so every session uses ephemeral keys and has forward secrecy. Source S29.

## Sweep 10: Final adversarial pass
Tried to prove each card wrong; every claim was traced to a source in the table below. Checked 116, changed 1 card (two key point edits).
- **Tokenization (data obfuscation)**, key points. Before: "reduces PCI DSS scope". After: "can reduce PCI DSS scope because fewer systems hold card numbers, but does not remove PCI DSS duties" (S14 supplement says tokenization can help reduce the number of components in scope and does not remove the need to validate PCI DSS). Added: the exam case is vault-based tokens with no mathematical link; PCI also describes cryptographic tokens made from the card number with a key (S14 guidelines). Added: study guides call mobile tokens single use (S38); with Apple Pay the token stays the same per device and the per-purchase part is the security code (S13).
Confirmed and left as is (examples): EFS copies to FAT/FAT32 and over SMB are decrypted (S26); Secure Enclave has its own boot ROM and TRNG and protects Face ID and Touch ID data (S12); key escrow (S32); compensating control (S31); blockchain blocks hold the previous header's hash (S27); RFC 2986 CSR signed with the requester's private key, which stays with the requester (S22); MD5 collision weakness (S28).

## Totals
- 116 cards checked in each of 10 sweeps (1,160 card checks).
- 22 cards changed (27 edits: 3 definitions, 2 examples, 22 key point edits or additions); 0 cards removed; no true detail removed.
- Knowledge chapter: 14 sections updated to match.

## Proposed new cards
| Concept | Why it is needed | Source |
|---|---|---|
| HMAC (hash-based message authentication code) | On the SY0-701 acronym list; no card in any domain defines it; it is the shared-key way to get integrity plus authenticity, and it is the classic confusable with a digital signature (no non-repudiation) | RFC 2104, https://www.rfc-editor.org/rfc/rfc2104 (not read this session; the acronym list and RFC 6151's HMAC section were read) |
| Perfect forward secrecy (PFS, DHE, ECDHE) | PFS, DHE and ECDHE are all on the acronym list; only a d4a card mentions forward secrecy and no card explains ephemeral key exchange | S29 |
| Subject Alternative Name (SAN) certificate | On the acronym list; now only named inside the wildcard card; exam questions contrast SAN and wildcard | S37, S21 |
| Registration authority (RA) | On the acronym list; now only a key point on the CA card | S21 |
| Initialization vector (IV) | On the acronym list; no card defines it | not researched this session |
The outline has no line for these, so per the plan the coordinator decides; options are a line-less card or keeping them as key points.

## Unsure
- **Mobile payment tokens single use vs device token.** a video course (S38) teaches that each mobile payment token is single use; Apple's documentation (S13) describes a per-device token plus a per-transaction code. Other wallets (cloud-based) may use limited-use keys; not verified. The card now states both.
- **Tokenization "no mathematical relationship".** True for vault-based tokens (the exam sense) but PCI also allows cryptographic tokens derived with a key (S14). Kept the exam sense and named the other, as the career guide asks.
- **Digital signature definition** keeps the exam's "hash encrypted with the private key" wording; NIST does not describe it that way (S16). Kept for exam fit, with a key point.
- **Physical control vs operational guard.** Card #6 says a guard can be counted as physical or operational by framing; the video course (S2) files guard actions under operational and a guard shack under physical. Left as is.
- **The video course's TPM "persistent memory"** detail is not on the TPM card; it is true but was not added because the card already names secure key storage.

## Per-card sources
Each card's facts came from these sources (keys in the table at the top).

| # | obj | term | sources |
|---|---|---|---|
| 0 | 1.0 | SY0-701 Domain 1.0: General Security Concepts (12%) | S34, S2, S4, S10 |
| 1 | 1.1 | SY0-701 1.1: Compare and contrast various types of security controls | S2 |
| 2 | 1.1 | Security control categories | S2 |
| 3 | 1.1 | Technical control (control category) | S2 |
| 4 | 1.1 | Managerial control (control category) | S2 |
| 5 | 1.1 | Operational control (control category) | S2 |
| 6 | 1.1 | Physical control (control category) | S2 |
| 7 | 1.1 | Security control types | S2 |
| 8 | 1.1 | Preventive control (control type) | S2 |
| 9 | 1.1 | Deterrent control (control type) | S2 |
| 10 | 1.1 | Detective control (control type) | S2 |
| 11 | 1.1 | Corrective control (control type) | S2 |
| 12 | 1.1 | Compensating control (control type) | S2, S31 |
| 13 | 1.1 | Directive control (control type) | S2 |
| 14 | 1.2 | SY0-701 1.2: Summarize fundamental security concepts | S34, S1, S3, S8 |
| 15 | 1.2 | Confidentiality, Integrity, and Availability (CIA triad) | S35 |
| 16 | 1.2 | Non-repudiation | S16 |
| 17 | 1.2 | Authentication, Authorization, and Accounting (AAA) | S36, S30 |
| 18 | 1.2 | Authenticating people (AAA) | S36, S30 |
| 19 | 1.2 | Authenticating systems (AAA) | S36, S30 |
| 20 | 1.2 | Authorization models (AAA) | S36, S30 |
| 21 | 1.2 | Gap analysis (security) | S7 |
| 22 | 1.2 | Zero Trust (security model) | S1, S6 |
| 23 | 1.2 | Control plane (Zero Trust) | S1, S6 |
| 24 | 1.2 | Adaptive identity (Zero Trust) | S1, S6 |
| 25 | 1.2 | Threat scope reduction (Zero Trust) | S1, S6 |
| 26 | 1.2 | Policy-driven access control (Zero Trust) | S1, S6 |
| 27 | 1.2 | Policy Administrator (Zero Trust) | S1, S6 |
| 28 | 1.2 | Policy Engine (Zero Trust) | S1, S6 |
| 29 | 1.2 | Data plane (Zero Trust) | S1, S6 |
| 30 | 1.2 | Implicit trust zones (Zero Trust) | S1, S6 |
| 31 | 1.2 | Subject/System (Zero Trust) | S1, S6 |
| 32 | 1.2 | Policy Enforcement Point (PEP, Zero Trust) | S1, S6 |
| 33 | 1.2 | Physical security (security concepts) | S3 |
| 34 | 1.2 | Bollards (physical security) | S3 |
| 35 | 1.2 | Access control vestibule (physical security) | S3 |
| 36 | 1.2 | Fencing (physical security) | S3 |
| 37 | 1.2 | Video surveillance (physical security) | S3 |
| 38 | 1.2 | Security guard (physical security) | S3 |
| 39 | 1.2 | Access badge (physical security) | S3 |
| 40 | 1.2 | Lighting (physical security) | S3 |
| 41 | 1.2 | Sensors (physical security) | S3 |
| 42 | 1.2 | Infrared sensor (physical security) | S3, S33 |
| 43 | 1.2 | Pressure sensor (physical security) | S3 |
| 44 | 1.2 | Microwave sensor (physical security) | S3, S33 |
| 45 | 1.2 | Ultrasonic sensor (physical security) | S3, S33 |
| 46 | 1.2 | Deception and disruption technology | S8 |
| 47 | 1.2 | Honeypot (deception technology) | S8 |
| 48 | 1.2 | Honeynet (deception technology) | S8 |
| 49 | 1.2 | Honeyfile (deception technology) | S8 |
| 50 | 1.2 | Honeytoken (deception technology) | S8 |
| 51 | 1.3 | SY0-701 1.3: Explain the importance of change management processes and the impact to security | S34, S4, S5 |
| 52 | 1.3 | Business processes impacting security operation (change management) | S4 |
| 53 | 1.3 | Approval process (change management) | S4 |
| 54 | 1.3 | Ownership (change management) | S4 |
| 55 | 1.3 | Stakeholders (change management) | S4 |
| 56 | 1.3 | Impact analysis (change management) | S4 |
| 57 | 1.3 | Test results (change management) | S4 |
| 58 | 1.3 | Backout plan (change management) | S4 |
| 59 | 1.3 | Maintenance window (change management) | S4 |
| 60 | 1.3 | Standard operating procedure (SOP, change management) | S4 |
| 61 | 1.3 | Technical implications (change management) | S5 |
| 62 | 1.3 | Allow lists/deny lists (change management impact) | S5 |
| 63 | 1.3 | Restricted activities (change management) | S5 |
| 64 | 1.3 | Downtime (change management) | S5 |
| 65 | 1.3 | Service restart (change management) | S5 |
| 66 | 1.3 | Application restart (change management) | S5 |
| 67 | 1.3 | Legacy applications (change management) | S5 |
| 68 | 1.3 | Dependencies (change management) | S5 |
| 69 | 1.3 | Documentation (change management) | S5 |
| 70 | 1.3 | Updating diagrams (change management documentation) | S5 |
| 71 | 1.3 | Updating policies/procedures (change management documentation) | S5 |
| 72 | 1.3 | Version control (change management) | S5 |
| 73 | 1.4 | SY0-701 1.4: Explain the importance of using appropriate cryptographic solutions | S34, S9, S10 |
| 74 | 1.4 | Public key infrastructure (PKI) | S21, S37 |
| 75 | 1.4 | Public key (PKI) | S21, S37 |
| 76 | 1.4 | Private key (PKI) | S21, S37 |
| 77 | 1.4 | Key escrow (PKI) | S32 |
| 78 | 1.4 | Encryption (cryptographic solutions) | S9 |
| 79 | 1.4 | Encryption levels (data at rest) | S9 |
| 80 | 1.4 | Full-disk encryption (encryption level) | S9 |
| 81 | 1.4 | Partition encryption (encryption level) | S9 |
| 82 | 1.4 | File encryption (encryption level) | S9, S26 |
| 83 | 1.4 | Volume encryption (encryption level) | S9 |
| 84 | 1.4 | Database encryption (encryption level) | S9, S25 |
| 85 | 1.4 | Record encryption (encryption level) | S9 |
| 86 | 1.4 | Transport/communication encryption | S9 |
| 87 | 1.4 | Asymmetric encryption | S17, S29 |
| 88 | 1.4 | Symmetric encryption | S17, S29 |
| 89 | 1.4 | Key exchange (cryptography) | S17, S29 |
| 90 | 1.4 | Encryption algorithms (ciphers) | S17, S29 |
| 91 | 1.4 | Key length (encryption) | S17 |
| 92 | 1.4 | Cryptographic tools (hardware and key management) | S10 |
| 93 | 1.4 | Trusted Platform Module (TPM) | S10, S11 |
| 94 | 1.4 | Hardware security module (HSM) | S10 |
| 95 | 1.4 | Key management system (KMS) | S10 |
| 96 | 1.4 | Secure enclave (cryptographic hardware) | S10, S12 |
| 97 | 1.4 | Obfuscation (data protection) | S38 |
| 98 | 1.4 | Steganography | S38 |
| 99 | 1.4 | Tokenization (data obfuscation) | S38, S13, S14 |
| 100 | 1.4 | Data masking | S38 |
| 101 | 1.4 | Hashing (cryptography) | S28, S15 |
| 102 | 1.4 | Salting (password hashing) | S15 |
| 103 | 1.4 | Digital signatures | S16 |
| 104 | 1.4 | Key stretching | S15 |
| 105 | 1.4 | Blockchain | S27 |
| 106 | 1.4 | Open public ledger (blockchain) | S27 |
| 107 | 1.4 | Digital certificates (PKI) | S37, S21 |
| 108 | 1.4 | Certificates: Certificate authority (CA) | S37, S21 |
| 109 | 1.4 | Certificates: Certificate revocation list (CRL) | S37, S21, S23 |
| 110 | 1.4 | Certificates: Online Certificate Status Protocol (OCSP) | S37, S18, S19, S23, S24 |
| 111 | 1.4 | Certificates: Self-signed certificate | S37, S21 |
| 112 | 1.4 | Certificates: Third-party certificate | S37, S21 |
| 113 | 1.4 | Certificates: Root of trust | S37, S21 |
| 114 | 1.4 | Certificates: Certificate signing request (CSR) generation | S37, S22 |
| 115 | 1.4 | Certificates: Wildcard certificate | S37, S20, S21 |
