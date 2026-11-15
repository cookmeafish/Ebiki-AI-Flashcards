# Security+ Domain 1 (d1): full independent check (2026-11-15)

Checker: an independent reviewer that did not write or sweep these cards. Plan: [card full check](../plans/2026-11-15-card-full-check.md).

Input: `dev/careers/sources/security-plus-sy0-701/cards/d1-cards.r3.json` (116 cards), `cards/d1-extras.r2.json` (5 extras), `knowledge/d1-knowledge.r3.md`.
Output: `cards/d1-cards.r4.json` (116 cards, same order, obj, path and term), `knowledge/d1-knowledge.r4.md`. The extras needed no change, so no `d1-extras.r3.json` was written.

## Totals

| Checked | Correct | Minor | Wrong | Fixed |
|---|---|---|---|---|
| 116 cards + 5 extras | 114 cards + 5 extras | 2 | 0 | 2 |

## Fixes

### Card 82: File encryption (encryption level), MINOR
- Problem: the card names only Microsoft's spelling, "Encrypting File System". CompTIA's SY0-701 acronym list expands EFS as "Encrypted File System" (and Microsoft's own Win32 page uses that spelling too). The course rule is to give both names when the vendor's wording differs. The decryption claim had no exception noted.
- Before (keyPoints): "Per-file protection; EFS on NTFS is the common example; a copy moved to a non-NTFS drive (such as FAT32) or sent over the network is no longer EFS-encrypted"
- After (keyPoints): "Per-file protection; EFS on NTFS is the common example; Microsoft names it Encrypting File System, while CompTIA's acronym list says Encrypted File System, the same feature; a copy moved to a non-NTFS drive (such as FAT32) or sent over the network is no longer EFS-encrypted (Microsoft notes a WebDAV folder as the exception)"
- Sources: CompTIA SY0-701 acronym list (local `acronyms.txt`, "EFS|Encrypted File System"); https://learn.microsoft.com/en-us/windows/win32/fileio/file-encryption ; https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc782898(v=ws.10) ("decrypted if you copy it to a volume that is not an NTFS file system volume", WebDAV exception).
- Chapter: the "File" line under 1.4 Level now gives both names and the non-NTFS copy rule.

### Card 96: Secure enclave (cryptographic hardware), MINOR
- Problem: "stores fingerprint and face data" overstates it. Apple describes Touch ID and Face ID data as secrets the Secure Enclave protects (the Secure Neural Engine does part of the Face ID processing), not as data simply stored inside it. "Its own boot" is vaguer than Apple's "dedicated Boot ROM".
- Before (example): "Apple's Secure Enclave stores fingerprint and face data and protects keys on iPhones, so even a compromised OS cannot read them."
- After (example): "On iPhones, Apple's Secure Enclave protects Touch ID and Face ID data and device keys, so even a compromised OS kernel cannot read them."
- Before (keyPoints): "...has its own boot and true random number generator..." After: "...has its own Boot ROM and true random number generator..."
- Source: https://support.apple.com/guide/security/secure-enclave-sec59b0b31ff/web (isolated from the main processor, keeps data safe even if the Application Processor kernel is compromised, dedicated Boot ROM, TRNG, "Other protected device-specific secrets include Optic ID, Face ID, or Touch ID data").

## Main claims verified (sources read this turn)
- Domain weights 12/22/18/28/20 and the 1.0 to 1.4 item lists: local SY0-701 objectives outline (`outline.md`), plus search results agreeing on 12% for 1.0. Objective 1.4 has 42 outline items, 1.2 has 36, so "largest objective by item count" holds.
- Zero Trust (cards 22 to 32): NIST SP 800-207, https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf : PE "makes and logs the decision", grant/deny/revoke with threat intel input; PA establishes or shuts down the path and generates session tokens; PE + PA = PDP; some implementations merge PE and PA; PEP enables, monitors, terminates; subjects include nonhuman entities; airport boarding area analogy and "the implicit trust zone must be as small as possible".
- Non-repudiation (16): https://csrc.nist.gov/glossary/term/non_repudiation
- Key length equivalences (91): NIST SP 800-57 Part 1 Rev. 5, Table 2, https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf (112 bits = RSA 2048; 128 = RSA 3072, ECC 256 to 383; 256 = RSA 15360, ECC 512+).
- TLS 1.3 forward secrecy and PSK-only resumption (89, extra PFS): RFC 8446 section 1.2 and 2.2, https://www.rfc-editor.org/rfc/rfc8446
- Key stretching numbers (101, 104): OWASP Password Storage Cheat Sheet, https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html (Argon2id first choice, PBKDF2-HMAC-SHA-256 600,000 iterations, bcrypt cost factor).
- CRL/OCSP real-world shift (109, 110): CA/Browser Forum ballot SC-063, https://cabforum.org/2023/07/14/ballot-sc063v4-make-ocsp-optional-require-crls-and-incentivize-automation/ ; effective 2024-03-15 per https://openwall.com/lists/oss-security/2024/03/11/2 ; Let's Encrypt OCSP off 2025-08-06 for privacy, https://letsencrypt.org/2025/08/06/ocsp-service-has-reached-end-of-life
- TDE covers data and log files, backups encrypted, not data in transit, no app changes (84): https://learn.microsoft.com/en-us/sql/relational-databases/security/encryption/transparent-data-encryption
- Wildcard one label only, not the bare domain (115, extra SAN): RFC 6125 section 6.4.3, https://www.rfc-editor.org/rfc/rfc6125
- Apple Pay Device Account Number and per transaction dynamic security code (99): Apple Pay security overview, https://support.apple.com/101554 (via search result summary; the Apple Platform Security Apple Pay pages did not load as text).
- Extras: HMAC (RFC 2104, CompTIA acronym "Hashed Message Authentication Code"), PFS, SAN (RFC 5280 4.2.1.6), RA, IV (NIST SP 800-38A/D): claims consistent with the sources each extra already cites and with the acronym list; no change.

## Heads-up (not a card fix)
CompTIA's Security+ page says a new version (V8) is expected around 2026-11-17. The cards describe SY0-701, which stays correct for that exam, but the course will need a plan for the new version.

## Still weak
- The Apple Pay page and the CA/B ballot's own effective-date text were not read directly; both claims rest on Apple's support overview and a dated security list post that agree with each other.
- Sensor behavior details (microwave passing through drywall, not metal) rest on common vendor descriptions, not one primary standard; judged CORRECT as general guidance.

## Per-card verdicts

| # | Obj | Term | Verdict |
|---|---|---|---|
| 0 | 1.0 | SY0-701 Domain 1.0: General Security Concepts (12%) | CORRECT |
| 1 | 1.1 | SY0-701 1.1: Compare and contrast various types of security controls | CORRECT |
| 2 | 1.1 | Security control categories | CORRECT |
| 3 | 1.1 | Technical control (control category) | CORRECT |
| 4 | 1.1 | Managerial control (control category) | CORRECT |
| 5 | 1.1 | Operational control (control category) | CORRECT |
| 6 | 1.1 | Physical control (control category) | CORRECT |
| 7 | 1.1 | Security control types | CORRECT |
| 8 | 1.1 | Preventive control (control type) | CORRECT |
| 9 | 1.1 | Deterrent control (control type) | CORRECT |
| 10 | 1.1 | Detective control (control type) | CORRECT |
| 11 | 1.1 | Corrective control (control type) | CORRECT |
| 12 | 1.1 | Compensating control (control type) | CORRECT |
| 13 | 1.1 | Directive control (control type) | CORRECT |
| 14 | 1.2 | SY0-701 1.2: Summarize fundamental security concepts | CORRECT |
| 15 | 1.2 | Confidentiality, Integrity, and Availability (CIA triad) | CORRECT |
| 16 | 1.2 | Non-repudiation | CORRECT |
| 17 | 1.2 | Authentication, Authorization, and Accounting (AAA) | CORRECT |
| 18 | 1.2 | Authenticating people (AAA) | CORRECT |
| 19 | 1.2 | Authenticating systems (AAA) | CORRECT |
| 20 | 1.2 | Authorization models (AAA) | CORRECT |
| 21 | 1.2 | Gap analysis (security) | CORRECT |
| 22 | 1.2 | Zero Trust (security model) | CORRECT |
| 23 | 1.2 | Control plane (Zero Trust) | CORRECT |
| 24 | 1.2 | Adaptive identity (Zero Trust) | CORRECT |
| 25 | 1.2 | Threat scope reduction (Zero Trust) | CORRECT |
| 26 | 1.2 | Policy-driven access control (Zero Trust) | CORRECT |
| 27 | 1.2 | Policy Administrator (Zero Trust) | CORRECT |
| 28 | 1.2 | Policy Engine (Zero Trust) | CORRECT |
| 29 | 1.2 | Data plane (Zero Trust) | CORRECT |
| 30 | 1.2 | Implicit trust zones (Zero Trust) | CORRECT |
| 31 | 1.2 | Subject/System (Zero Trust) | CORRECT |
| 32 | 1.2 | Policy Enforcement Point (PEP, Zero Trust) | CORRECT |
| 33 | 1.2 | Physical security (security concepts) | CORRECT |
| 34 | 1.2 | Bollards (physical security) | CORRECT |
| 35 | 1.2 | Access control vestibule (physical security) | CORRECT |
| 36 | 1.2 | Fencing (physical security) | CORRECT |
| 37 | 1.2 | Video surveillance (physical security) | CORRECT |
| 38 | 1.2 | Security guard (physical security) | CORRECT |
| 39 | 1.2 | Access badge (physical security) | CORRECT |
| 40 | 1.2 | Lighting (physical security) | CORRECT |
| 41 | 1.2 | Sensors (physical security) | CORRECT |
| 42 | 1.2 | Infrared sensor (physical security) | CORRECT |
| 43 | 1.2 | Pressure sensor (physical security) | CORRECT |
| 44 | 1.2 | Microwave sensor (physical security) | CORRECT |
| 45 | 1.2 | Ultrasonic sensor (physical security) | CORRECT |
| 46 | 1.2 | Deception and disruption technology | CORRECT |
| 47 | 1.2 | Honeypot (deception technology) | CORRECT |
| 48 | 1.2 | Honeynet (deception technology) | CORRECT |
| 49 | 1.2 | Honeyfile (deception technology) | CORRECT |
| 50 | 1.2 | Honeytoken (deception technology) | CORRECT |
| 51 | 1.3 | SY0-701 1.3: Explain the importance of change management processes and the impact to security | CORRECT |
| 52 | 1.3 | Business processes impacting security operation (change management) | CORRECT |
| 53 | 1.3 | Approval process (change management) | CORRECT |
| 54 | 1.3 | Ownership (change management) | CORRECT |
| 55 | 1.3 | Stakeholders (change management) | CORRECT |
| 56 | 1.3 | Impact analysis (change management) | CORRECT |
| 57 | 1.3 | Test results (change management) | CORRECT |
| 58 | 1.3 | Backout plan (change management) | CORRECT |
| 59 | 1.3 | Maintenance window (change management) | CORRECT |
| 60 | 1.3 | Standard operating procedure (SOP, change management) | CORRECT |
| 61 | 1.3 | Technical implications (change management) | CORRECT |
| 62 | 1.3 | Allow lists/deny lists (change management impact) | CORRECT |
| 63 | 1.3 | Restricted activities (change management) | CORRECT |
| 64 | 1.3 | Downtime (change management) | CORRECT |
| 65 | 1.3 | Service restart (change management) | CORRECT |
| 66 | 1.3 | Application restart (change management) | CORRECT |
| 67 | 1.3 | Legacy applications (change management) | CORRECT |
| 68 | 1.3 | Dependencies (change management) | CORRECT |
| 69 | 1.3 | Documentation (change management) | CORRECT |
| 70 | 1.3 | Updating diagrams (change management documentation) | CORRECT |
| 71 | 1.3 | Updating policies/procedures (change management documentation) | CORRECT |
| 72 | 1.3 | Version control (change management) | CORRECT |
| 73 | 1.4 | SY0-701 1.4: Explain the importance of using appropriate cryptographic solutions | CORRECT |
| 74 | 1.4 | Public key infrastructure (PKI) | CORRECT |
| 75 | 1.4 | Public key (PKI) | CORRECT |
| 76 | 1.4 | Private key (PKI) | CORRECT |
| 77 | 1.4 | Key escrow (PKI) | CORRECT |
| 78 | 1.4 | Encryption (cryptographic solutions) | CORRECT |
| 79 | 1.4 | Encryption levels (data at rest) | CORRECT |
| 80 | 1.4 | Full-disk encryption (encryption level) | CORRECT |
| 81 | 1.4 | Partition encryption (encryption level) | CORRECT |
| 82 | 1.4 | File encryption (encryption level) | MINOR |
| 83 | 1.4 | Volume encryption (encryption level) | CORRECT |
| 84 | 1.4 | Database encryption (encryption level) | CORRECT |
| 85 | 1.4 | Record encryption (encryption level) | CORRECT |
| 86 | 1.4 | Transport/communication encryption | CORRECT |
| 87 | 1.4 | Asymmetric encryption | CORRECT |
| 88 | 1.4 | Symmetric encryption | CORRECT |
| 89 | 1.4 | Key exchange (cryptography) | CORRECT |
| 90 | 1.4 | Encryption algorithms (ciphers) | CORRECT |
| 91 | 1.4 | Key length (encryption) | CORRECT |
| 92 | 1.4 | Cryptographic tools (hardware and key management) | CORRECT |
| 93 | 1.4 | Trusted Platform Module (TPM) | CORRECT |
| 94 | 1.4 | Hardware security module (HSM) | CORRECT |
| 95 | 1.4 | Key management system (KMS) | CORRECT |
| 96 | 1.4 | Secure enclave (cryptographic hardware) | MINOR |
| 97 | 1.4 | Obfuscation (data protection) | CORRECT |
| 98 | 1.4 | Steganography | CORRECT |
| 99 | 1.4 | Tokenization (data obfuscation) | CORRECT |
| 100 | 1.4 | Data masking | CORRECT |
| 101 | 1.4 | Hashing (cryptography) | CORRECT |
| 102 | 1.4 | Salting (password hashing) | CORRECT |
| 103 | 1.4 | Digital signatures | CORRECT |
| 104 | 1.4 | Key stretching | CORRECT |
| 105 | 1.4 | Blockchain | CORRECT |
| 106 | 1.4 | Open public ledger (blockchain) | CORRECT |
| 107 | 1.4 | Digital certificates (PKI) | CORRECT |
| 108 | 1.4 | Certificates: Certificate authority (CA) | CORRECT |
| 109 | 1.4 | Certificates: Certificate revocation list (CRL) | CORRECT |
| 110 | 1.4 | Certificates: Online Certificate Status Protocol (OCSP) | CORRECT |
| 111 | 1.4 | Certificates: Self-signed certificate | CORRECT |
| 112 | 1.4 | Certificates: Third-party certificate | CORRECT |
| 113 | 1.4 | Certificates: Root of trust | CORRECT |
| 114 | 1.4 | Certificates: Certificate signing request (CSR) generation | CORRECT |
| 115 | 1.4 | Certificates: Wildcard certificate | CORRECT |

Extras (d1-extras.r2.json): HMAC, Perfect forward secrecy, SAN certificate, Registration authority, Initialization vector: all CORRECT.
