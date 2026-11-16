# d1 knowledge chapter r7: source notes (2026-11-15/16)

Chapter: `knowledge/d1-knowledge.r7.md` (Domain 1: General Security Concepts, objectives 1.1 to 1.4).
Started from `knowledge/d1-knowledge.r4.md`, `cards/d1-cards.r4.json` (116 cards) and `cards/d1-extras.r2.json` (5 cards).
Every source below was fetched and read in this writing session (PDFs were converted to text and read locally). The
chapter's wording is our own; an 8-word overlap check against `outline.md` and the long PDF sources (K1, K7, K8, K9,
K10, K11, K12, K13, K33) reports 0 shared runs. The shorter web pages were paraphrased by hand and not machine-checked.

## Sources

| Key | Title | URL |
|---|---|---|
| K1 | NIST SP 800-207, Zero Trust Architecture (sections 2, 2.1, 3, 3.4) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf |
| K2 | NIST glossary: compensating security control | https://csrc.nist.gov/glossary/term/compensating_security_control |
| K3 | NIST glossary: non-repudiation | https://csrc.nist.gov/glossary/term/non_repudiation |
| K4 | NIST glossary: digital signature | https://csrc.nist.gov/glossary/term/digital_signature |
| K5 | NIST glossary: honeypot | https://csrc.nist.gov/glossary/term/honeypot |
| K6 | OWASP Password Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| K7 | NIST SP 800-57 Part 1 Rev. 5 (Table 2, 3TDEA footnote) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf |
| K8 | NIST SP 800-111, Guide to Storage Encryption Technologies for End User Devices (section 3.1) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-111.pdf |
| K9 | NIST IR 8202, Blockchain Technology Overview | https://nvlpubs.nist.gov/nistpubs/ir/2018/NIST.IR.8202.pdf |
| K10 | NIST SP 800-12 Rev. 1, An Introduction to Information Security (definitions, section 10.13) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-12r1.pdf |
| K11 | PCI SSC Information Supplement: PCI DSS Tokenization Guidelines | https://listings.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf |
| K12 | NIST SP 800-128, Guide for Security-Focused Configuration Management (2.3.3, 2.3.7 to 2.3.9, 3.1, 3.3) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-128.pdf |
| K13 | NIST CSWP 29, The NIST Cybersecurity Framework (CSF) 2.0 (Organizational Profiles, gap analysis steps) | https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf |
| K14 | RFC 6960, OCSP | https://www.rfc-editor.org/rfc/rfc6960 |
| K15 | RFC 5280, X.509 certificate and CRL profile (first part read: roles, fields, SAN, CRL) | https://www.rfc-editor.org/rfc/rfc5280 |
| K16 | RFC 6125 section 6.4.3 (wildcard matching) | https://www.rfc-editor.org/rfc/rfc6125 |
| K17 | RFC 2986, PKCS #10 certification request | https://www.rfc-editor.org/rfc/rfc2986 |
| K18 | RFC 2104, HMAC | https://www.rfc-editor.org/rfc/rfc2104 |
| K19 | RFC 6066 section 8 (certificate status request, stapling) | https://www.rfc-editor.org/rfc/rfc6066 |
| K20 | Let's Encrypt, Ending OCSP Support | https://letsencrypt.org/2024/12/05/ending-ocsp/ |
| K21 | RFC 8446, TLS 1.3 (sections 1.2, 2.2, 2.3) | https://www.rfc-editor.org/rfc/rfc8446 |
| K22 | Microsoft Learn, Trusted Platform Module Technology Overview | https://learn.microsoft.com/en-us/windows/security/hardware-security/tpm/trusted-platform-module-overview |
| K23 | Apple Platform Security, The Secure Enclave | https://support.apple.com/guide/security/the-secure-enclave-sec59b0b31ff/web |
| K24 | Microsoft Learn, Transparent Data Encryption (TDE) | https://learn.microsoft.com/en-us/sql/relational-databases/security/encryption/transparent-data-encryption |
| K25 | Microsoft TechNet Magazine, How IT Works: Encrypting File System | https://learn.microsoft.com/en-us/previous-versions/technet-magazine/cc160993(v=msdn.10) |
| K26 | NIST glossary: steganography | https://csrc.nist.gov/glossary/term/steganography |
| K27 | NIST glossary: key escrow | https://csrc.nist.gov/glossary/term/key_escrow |
| K28 | NIST glossary: hardware security module | https://csrc.nist.gov/glossary/term/hardware_security_module_hsm |
| K29 | NIST glossary: roots of trust | https://csrc.nist.gov/glossary/term/roots_of_trust |
| K30 | NIST glossary: salt | https://csrc.nist.gov/glossary/term/salt |
| K31 | RFC 8907, TACACS+ | https://www.rfc-editor.org/rfc/rfc8907 |
| K32 | CA/Browser Forum ballot SC-063 page, and Baseline Requirements (revision table: SC-063 effective 2024-03-15; validity schedule 200/100/47 days) | https://cabforum.org/2023/07/14/ballot-sc063v4-make-ocsp-optional-require-crls-and-incentivize-automation/ ; https://raw.githubusercontent.com/cabforum/servercert/main/docs/BR.md |
| K33 | NIST SP 800-38A, block cipher modes (IV requirements) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf |
| K34 | SDM Magazine, Back to basics on detector technology | https://www.sdmmag.com/articles/84870-back-to-basics-on-detector-technology |
| K35 | Pro Git, About Version Control | https://git-scm.com/book/en/v2/Getting-Started-About-Version-Control |
| K36 | NIST SP 800-63B-4 (factors, biometrics, fraud indicators, PSTN restriction) | https://pages.nist.gov/800-63-4/sp800-63b.html |
| K37 | RFC 2865, RADIUS | https://www.rfc-editor.org/rfc/rfc2865 |
| K38 | NIST glossary: application allowlisting | https://csrc.nist.gov/glossary/term/application_allowlisting |
| K39 | NIST SP 800-53 Rev. 5 AC-8 System Use Notification (csf.tools mirror) | https://csf.tools/reference/nist-sp-800-53/r5/ac/ac-8/ |
| K40 | NIST SP 800-53 Rev. 5 PE-3 and PE-3(8) (physical access control, access control vestibules) | https://csf.tools/reference/nist-sp-800-53/r5/pe/pe-3/ ; https://csf.tools/reference/nist-sp-800-53/r5/pe/pe-3/pe-3-8/ |
| K41 | NIST SP 800-53 Rev. 5 PE-6 Monitoring Physical Access | https://csf.tools/reference/nist-sp-800-53/r5/pe/pe-6/ |
| K42 | NIST SP 800-53 Rev. 5 SC-26 Decoys | https://csf.tools/reference/nist-sp-800-53/r5/sc/sc-26/ |
| K43 | NIST SP 800-53 Rev. 5 CM-3 Configuration Change Control | https://csf.tools/reference/nist-sp-800-53/r5/cm/cm-3/ |
| K44 | NIST SP 800-53 Rev. 5 CM-7(5) Authorized Software, Allow-by-exception | https://csf.tools/reference/nist-sp-800-53/r5/cm/cm-7/cm-7-5/ |
| K45 | Microsoft Learn, Dynamic Data Masking | https://learn.microsoft.com/en-us/sql/relational-databases/security/dynamic-data-masking |
| K46 | CISA, Zero Trust Maturity Model page | https://www.cisa.gov/zero-trust-maturity-model |
| K47 | NIST glossary: key management system | https://csrc.nist.gov/glossary/term/key_management_system |
| K48 | NIST glossary: initialization vector | https://csrc.nist.gov/glossary/term/initialization_vector |
| K49 | NIST glossary: perfect forward secrecy | https://csrc.nist.gov/glossary/term/perfect_forward_secrecy |
| K50 | NIST glossary: hash function | https://csrc.nist.gov/glossary/term/hash_function |
| K51 | NIST glossary: symmetric key algorithm; asymmetric cryptography; Diffie-Hellman; encryption | https://csrc.nist.gov/glossary/term/symmetric_key_algorithm ; https://csrc.nist.gov/glossary/term/asymmetric_cryptography ; https://csrc.nist.gov/glossary/term/diffie_hellman ; https://csrc.nist.gov/glossary/term/encryption |
| K52 | NIST glossary: security control; digital certificate; certificate revocation list; self-signed certificate | https://csrc.nist.gov/glossary/term/security_control ; https://csrc.nist.gov/glossary/term/digital_certificate ; https://csrc.nist.gov/glossary/term/certificate_revocation_list ; https://csrc.nist.gov/glossary/term/self_signed_certificate |
| K53 | A certification-training site's article on types of security controls (secondary; used only to confirm the usual control type definitions) | not linked (third-party training material) |
| K54 | USDA Forest Service, Electronic Physical Security Toolbox: point sensors, volumetric-motion sensors, principles | https://www.fs.usda.gov/t-d/phys_sec/alarms/point.htm ; https://www.fs.usda.gov/t-d/phys_sec/alarms/vol.htm ; https://www.fs.usda.gov/t-d/phys_sec/basics/prncipls.htm |
| K55 | Apple, Apple Pay security and privacy overview | https://support.apple.com/101554 |
| K56 | RFC 4648, Base encodings (security considerations) | https://www.rfc-editor.org/rfc/rfc4648 |
| K57 | Microsoft Learn, BitLocker overview | https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/ |
| K58 | RFC 6151, MD5 security considerations | https://www.rfc-editor.org/rfc/rfc6151 |
| K59 | RFC 8018, PKCS #5 (PBKDF2: salt and iteration count) | https://www.rfc-editor.org/rfc/rfc8018 |
| K60 | Web search result summaries (secondary, used only for wording of common ideas): honeytoken and canary token; honeynet; security lighting and CPTED; pressure mats; vehicle barrier crash ratings; vestibule naming | search results, 2026-11-15 |
| C | The reviewed course cards (`d1-cards.r4.json`, `d1-extras.r2.json`) | local |

## Sources per section

| Section | Sources |
|---|---|
| Technical controls (logical controls, control category) | K10, K52, K53, C |
| Managerial controls (administrative controls, control category) | K10, K52, K53, C |
| Operational controls (control category) | K10, K53, C |
| Physical controls (control category) | K10, K40, K41, K53, C |
| Technical vs managerial vs operational vs physical controls | K10, K53, C |
| Preventive controls (control type) | K53, C |
| Deterrent controls (control type) | K39, K53, K54, C |
| Detective controls (control type) | K41, K53, C |
| Corrective controls (control type) | K53, C |
| Compensating controls (control type) | K2, K53, C |
| Directive controls (control type) | K53, C |
| Preventive vs deterrent vs ... (control types compared) | K2, K53, C |
| Classifying one control by category and type | K10, K53, C |
| Confidentiality, Integrity, and Availability (CIA triad) | K10, C |
| Non-repudiation | K3, K4, K18, C |
| Authentication, Authorization, and Accounting (AAA framework) | K31, K37, C |
| Authenticating people (authentication factors and MFA) | K36, C |
| Authenticating systems (device authentication with certificates) | K1, K22, K15, C |
| Authorization models (in AAA) | C |
| RADIUS vs TACACS+ (AAA protocols compared) | K31, K37 |
| Gap analysis (security gap assessment) | K13, C |
| Zero Trust architecture (ZTA) | K1, K46, C |
| Zero Trust control plane vs data plane | K1, C |
| Adaptive identity (Zero Trust) | K1, K36, C |
| Threat scope reduction (Zero Trust) | K1, K42, C |
| Policy-driven access control (Zero Trust) | K1, C |
| Policy Engine (PE, Zero Trust) | K1, C |
| Policy Administrator (PA, Zero Trust) | K1, C |
| Policy Enforcement Point (PEP, Zero Trust) | K1, C |
| Policy Engine vs Policy Administrator vs Policy Enforcement Point | K1 |
| Implicit trust zones (Zero Trust) | K1, C |
| Subject and system (Zero Trust) | K1, C |
| Bollards (vehicle barriers) | K60, C |
| Access control vestibule (mantrap) | K40, K60, C |
| Fencing (perimeter barriers) | K40, K54, C |
| Video surveillance (CCTV, security cameras) | K41, C |
| Security guards | K40, K41, K54, C |
| Access badges (ID badges, proximity cards) | K40, K41, C |
| Security lighting | K60, C |
| Infrared sensors (passive infrared, PIR motion detectors) | K34, K54, C |
| Pressure sensors (pressure mats) | K54, K60, C |
| Microwave sensors (microwave motion detectors) | K34, K54, C |
| Ultrasonic sensors (ultrasonic motion detectors) | K34, K54, C |
| Infrared vs pressure vs microwave vs ultrasonic sensors | K34, K54 |
| Physical access controls compared | K40, K41, K54, C |
| Honeypot (decoy system) | K5, K42, C |
| Honeynet (decoy network) | K42, K60, C |
| Honeyfile (decoy file) | K5, K60, C |
| Honeytoken (decoy data, canary token) | K60, C |
| Honeypot vs honeynet vs honeyfile vs honeytoken | K5, K42, K60, C |
| Change management process (change control) | K12, K43, C |
| Approval process (change advisory board, CAB) | K12, K43, C |
| Ownership (change owner) | K12, C |
| Stakeholders (change management) | K12, C |
| Impact analysis (change impact and security impact analysis) | K12, C |
| Test results (change testing) | K12, K43, C |
| Backout plan (rollback plan) | K12, C |
| Maintenance window (change window) | C |
| Standard operating procedure (SOP) | K12, C |
| Impact analysis vs test results vs backout plan vs maintenance window | K12, C |
| Allow lists and deny lists in change management | K38, K44, C |
| Restricted activities (change scope) | K12, K43, C |
| Downtime (planned outage) | K12, C |
| Service restart (change management) | C |
| Application restart (change management) | C |
| Legacy applications (change management) | K2, C |
| Dependencies (change management) | C |
| Technical implications of a change compared | C |
| Updating diagrams (change documentation) | K12, C |
| Updating policies and procedures (change documentation) | K12, C |
| Version control (revision history ...) | K35, K12, C |
| Public key infrastructure (PKI) | K15, K17, K52, C |
| Public key and private key (asymmetric key pair) | K51, K4, C |
| Key escrow | K27, K25, C |
| Full-disk encryption (FDE) | K8, K57, K22, C |
| Partition encryption and volume encryption | K8, K57, C |
| File encryption (file and folder level) | K8, K25, C |
| Database encryption (transparent data encryption, TDE) | K24, C |
| Record encryption (column-level and field-level encryption) | K24, K45, C |
| Full-disk vs partition vs volume vs file vs database vs record encryption | K8, K24, K25, C |
| Transport encryption (communication encryption, data in transit) | K21, K24, K25, C |
| Symmetric encryption (shared secret key) | K51, K7, C |
| Asymmetric encryption (public key cryptography) | K51, K7, C |
| Symmetric vs asymmetric encryption | K51, K7, K25, C |
| Key exchange (in-band, out-of-band, Diffie-Hellman) | K51, K21, C |
| Perfect forward secrecy (PFS, ephemeral keys, DHE and ECDHE) | K21, K49, C |
| Encryption algorithms (ciphers) | K7, K58, K51, C |
| Key length (key size and strength) | K7, C |
| Initialization vector (IV) and nonce | K33, K48, C |
| Trusted Platform Module (TPM) | K22, K57, C |
| Hardware security module (HSM) | K28, C |
| Key management system (KMS) | K47, C |
| Secure enclave (isolated security processor) | K23, C |
| TPM vs HSM vs key management system vs secure enclave | K22, K23, K28, K47, C |
| Steganography (hiding data inside other data) | K26, C |
| Tokenization (token vault, data obfuscation) | K11, K55, C |
| Data masking (obfuscation of displayed data) | K45, C |
| Encryption vs hashing vs encoding vs obfuscation | K56, K50, K11, K45, K26, C |
| Hashing (cryptographic hash functions) | K50, K58, K6, C |
| Salting (password hashing with a salt) | K6, K30, K59, C |
| Key stretching (PBKDF2, bcrypt, Argon2) | K6, K59, C |
| HMAC (hash-based message authentication code) | K18, K58, C |
| Digital signatures | K4, K3, C |
| Hash vs HMAC vs digital signature | K4, K18, K50, C |
| Blockchain (hash-chained distributed ledger) | K9, C |
| Open public ledger | K9, C |
| Digital certificates (X.509) | K15, K52, K32, C |
| Certificate authority (CA) and the chain of trust | K15, K52, C |
| Registration authority (RA) | K15, C |
| Certificate revocation list (CRL) | K15, K52, K32, C |
| Online Certificate Status Protocol (OCSP) and OCSP stapling | K14, K19, K20, K32, C |
| CRL vs OCSP vs OCSP stapling | K14, K19, K32, C |
| Self-signed vs third-party (public CA) certificates | K52, K15, C |
| Root of trust | K29, K23, K57, C |
| Certificate signing request (CSR) generation | K17, C |
| Wildcard certificates | K16, C |
| Subject Alternative Name (SAN) certificates | K15, K16, C |

## Statements that rest on the cards or on general reasoning, not on a primary source read this session
These are consistent with the reviewed cards (source "C") but were not re-traced to a primary document; reviewers should
look at them first.
- Maintenance window, change freeze, service restart, application restart, dependencies, ownership, stakeholders: the
  definitions follow the cards and ordinary practice; NIST SP 800-128 supports only the surrounding process.
- Control type definitions (preventive, deterrent, detective, corrective, directive): NIST has no glossary entry for
  them; they follow the cards and one secondary page (K53). The folding of "recovery" into corrective is the exam's
  framing.
- Bollards, lighting, honeynet, honeyfile and honeytoken details: cards plus secondary search summaries (K60); NIST
  SC-26 names honeypots and honeynets only.
- Two-person integrity for guards, RFID/NFC badges, object detection and license plate reading in video analytics:
  from the cards.
- Illustrative log lines, rule snippets and file names in "Example" lines are invented for teaching; the two SQL
  statements follow the syntax shown on K24 and K45.
- "Somewhere you are" as a factor: SY0-701's list (objective 4.6); the chapter also gives NIST's view (K36) that
  location is a fraud signal, not a factor.
- HMAC giving no non-repudiation: reasoning from the shared key (RFC 2104 does not discuss it), matching the card.
- TPM also providing a random number generator, HSM clustering and acceleration: from the cards.
- Blockchain uses in supply chains: from the card.
- CRL "since 15 March 2024" date: from the Baseline Requirements revision table (K32); the body of sections 4.9.7 and
  4.9.10 was past the part of the page that was read.

## Cards that look wrong or need a note
None found wrong. Notes for the card reviewers:
- `Digital signatures` (#103): the definition keeps the "hash encrypted with the private key" picture; the chapter
  keeps it as the exam model and adds NIST's wording (K4). No change needed, but graders should accept both.
- `Certificates: OCSP` (#110) says Let's Encrypt turned OCSP off "in August 2025": confirmed, 6 August 2025 (K20).
- `Initialization vector (IV)` (extra): "AES-GCM normally uses a 96-bit IV" was not re-verified this session (the
  chapter leaves the number to the Reference chapter); the CBC unpredictability rule is confirmed by K33.
- `Tokenization` (#99): consistent with K11 and K55. K11 lists three ways to generate tokens (reversible cryptographic
  function, one-way function, random or index assignment); the chapter states the vault model as the exam case.
- `Digital certificates` (#107): fine; the chapter adds the new public TLS validity schedule (200 days from 2026-03-15,
  100 from 2027-03-15, 47 from 2029-03-15) from K32, which no card mentions.
- `Authenticating people` (#18): fine for the exam; NIST (K36) does not accept a biometric alone as an authenticator
  and treats location as a risk signal. The chapter states both views.
