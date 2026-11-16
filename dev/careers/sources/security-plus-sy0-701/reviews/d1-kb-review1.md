# d1 knowledge chapter: independent accuracy review 1 (2026-11-16)

Reviewed: `knowledge/d1-knowledge.r7.md` (117 sections). Corrected pass: `knowledge/d1-knowledge.r8.md` (117 sections, 253182 characters, largest section under 2,900 characters, no heading over 110 characters, no duplicate titles, no dashes, no links).
Compared with `cards/d1-cards.r5.json` (116 cards), `cards/d1-extras.r3.json` and the reference chapter `knowledge/d0-knowledge.r7.md`.

Result: 25 sections FIXED (33 edits), 92 PASS. Of the edits, 9 change or soften a fact or an attribution, 4 remove a conflict with the cards (guard category), 1 rewrites wording that sat too close to a source, 19 remove wording that implied knowledge of the exam's questions.

## The writer's flagged items
- Control type definitions (preventive, deterrent, detective, corrective, directive): no primary definition found (NIST glossary has none; a search of standards bodies returned only secondary pages). They match the cards and common usage, so they stay; compensating is confirmed by the NIST glossary (S5).
- CRL "since 15 March 2024": confirmed (S1).
- Public TLS validity schedule: confirmed, 398 days before 15 March 2026, then 200, 100 (15 March 2027), 47 (15 March 2029) (S1). d0 is right; d1 now names the 398-day starting point too.
- NIST comparable strength table: confirmed row by row (S19). d0 is right.
- "96-bit IV" for AES-GCM: the chapter does not state a size. The card and d0 are right: SP 800-38D 5.2.1.1 recommends restricting IVs to 96 bits (S26).
- Two-person integrity: NIST glossary definition found (S6); chapter wording aligned.
- Bollards: NIST PE-3(7) names them (S4), added. Maintenance window: SP 800-128 uses "scheduled maintenance window" (S9). Change freeze, service and application restarts, dependencies, lighting, honeyfile, badge RFID/NFC: see "Could not verify".

## Per section
- **Technical controls (logical controls, control category)**: PASS.
- **Managerial controls (administrative controls, control category)**: FIXED (rule): "the exam's \"managerial\"" -> "the SY0-701 term \"managerial\"".
- **Operational controls (control category)**: FIXED (card conflict + rule): "Exam questions about a guard usually stress the activity, so operational fits..." -> a guard can be called physical (NIST lists guards among physical access controls, S4) or operational (the work a person does); accept either. The cards call a guard physical in one place and operational in another.
- **Physical controls (control category)**: PASS.
- **Technical vs managerial vs operational vs physical controls (control categories compared)**: FIXED (card conflict): "A guard is operational" -> the guard's work is operational and guards also count as a physical security measure.
- **Preventive controls (control type)**: PASS.
- **Deterrent controls (control type)**: PASS (AC-8 banner content (S4).)
- **Detective controls (control type)**: PASS (PE-6 suspicious access list (S4).)
- **Corrective controls (control type)**: PASS.
- **Compensating controls (control type)**: PASS (NIST glossary definition (S5).)
- **Directive controls (control type)**: PASS.
- **Preventive vs deterrent vs detective vs corrective vs compensating vs directive (control types compared)**: FIXED (rule): "IDS vs IPS is the most tested pair" -> "the pair most often mixed up". Type definitions: not traceable to a primary source (see "Could not verify"); consistent with the cards.
- **Classifying one control by category and type (worked method)**: FIXED: "Most exam errors" -> "Most classification errors"; guard row now notes both categories; risk assessment type softened from "Detective" / "often treated as detective" to "detective fits best" (no primary source assigns a type).
- **Confidentiality, Integrity, and Availability (CIA triad)**: PASS.
- **Non-repudiation**: PASS.
- **Authentication, Authorization, and Accounting (AAA framework)**: PASS.
- **Authenticating people (authentication factors and MFA)**: PASS (SP 800-63B-4: two distinct factors at AAL2 and AAL3, PSTN restricted, geolocation as fraud indicator (S3).)
- **Authenticating systems (device authentication with certificates)**: PASS.
- **Authorization models (in AAA)**: PASS.
- **RADIUS vs TACACS+ (AAA protocols compared)**: FIXED (rule): "is the exam's wording" -> "is common study wording". Facts PASS against RFC 8907 (TCP port 49, body obfuscated, MUST run over networks that ensure privacy and integrity) and RFC 2865 (UDP, password hidden) (S7, S8).
- **Gap analysis (security gap assessment)**: PASS (CSF 2.0 Current and Target Profile, action plan examples (S11).)
- **Zero Trust architecture (ZTA)**: PASS (seven tenets of SP 800-207 2.1 (S2).)
- **Zero Trust control plane vs data plane**: FIXED (overstated): "NIST notes the PEP is the one component that must talk on both planes" -> "PEPs must be able to send and receive messages on both planes" (SP 800-207 section 3.4 says only that, S2).
- **Adaptive identity (Zero Trust)**: PASS.
- **Threat scope reduction (Zero Trust)**: PASS.
- **Policy-driven access control (Zero Trust)**: PASS.
- **Policy Engine (PE, Zero Trust)**: PASS (SP 800-207 3.1 (S2).)
- **Policy Administrator (PA, Zero Trust)**: PASS (SP 800-207 3.1 (S2).)
- **Policy Enforcement Point (PEP, Zero Trust)**: FIXED (overstated): "the only Zero Trust component that must talk on both" -> "must be able to communicate on both" (S2).
- **Policy Engine vs Policy Administrator vs Policy Enforcement Point (Zero Trust components compared)**: FIXED (rule): "questions often describe one action and ask which component..." reworded without reference to questions.
- **Implicit trust zones (Zero Trust)**: PASS (airport example, SP 800-207 section 2 (S2).)
- **Subject and system (Zero Trust)**: PASS (SP 800-207 section 2 (S2).)
- **Bollards (vehicle barriers)**: FIXED (added source fact): NIST SP 800-53 PE-3(7) names bollards among physical barriers (S4). Crash rating detail stays general (not verified to a standard).
- **Access control vestibule (mantrap)**: FIXED (rule): "the exam uses the newer name" -> "the SY0-701 objectives use the newer name". PE-3(8) facts PASS (interlocking doors, piggybacking or tailgating, fully or partly automated) (S4).
- **Fencing (perimeter barriers)**: FIXED (wrong attribution): removed "NIST lists physical barriers among the ways to limit access (PE-3(7))": PE-3(7) lists bollards, concrete slabs, jersey walls and vehicle barriers, not fences (S4).
- **Video surveillance (CCTV, security cameras)**: PASS (PE-6 and PE-6(3) (S4).)
- **Security guards**: FIXED (wrong attribution + card conflict): the "physical measures only delay or warn" idea was credited to NIST; PE-3(3) says guards give faster response and human surveillance (S4). Now split: NIST for PE-3(3), "physical security guidance" for the delay idea. Category now "operational, and also counted among physical security controls". Two-person integrity aligned with the NIST glossary wording (at least two authorized persons, each able to detect a wrong step) (S6).
- **Access badges (ID badges, proximity cards)**: PASS.
- **Security lighting**: PASS.
- **Infrared sensors (passive infrared, PIR motion detectors)**: PASS.
- **Pressure sensors (pressure mats)**: PASS.
- **Microwave sensors (microwave motion detectors)**: PASS.
- **Ultrasonic sensors (ultrasonic motion detectors)**: FIXED (unverified number): "roughly 20 to 40 kHz" -> "above about 20 kHz" (the band could not be re-read this session).
- **Infrared vs pressure vs microwave vs ultrasonic sensors (physical sensors compared)**: PASS.
- **Physical access controls compared (bollards vs fencing vs access control vestibule vs guards vs badges)**: FIXED (rule): opening sentence about "physical security questions" reworded.
- **Honeypot (decoy system)**: PASS (NIST glossary and SC-26 (S4, S5).)
- **Honeynet (decoy network)**: PASS (SC-26 (S4).)
- **Honeyfile (decoy file)**: PASS.
- **Honeytoken (decoy data, canary token)**: PASS (vendor documentation confirms honeytoken accounts that alert on any sign-in (S17); the rest is card-level.)
- **Honeypot vs honeynet vs honeyfile vs honeytoken (deception technologies compared)**: PASS.
- **Change management process (change control)**: PASS (nine steps of SP 800-128 3.3.2 in the same order (S9).)
- **Approval process (change advisory board, CAB)**: FIXED (precision): "also called a configuration control board" -> "which NIST calls a configuration control board (CCB) or change control board" (SP 800-128 2.3.3 and glossary, S9). "Two or more individuals" and "check and balance" PASS.
- **Ownership (change owner)**: PASS.
- **Stakeholders (change management)**: PASS.
- **Impact analysis (change impact and security impact analysis)**: PASS.
- **Test results (change testing)**: PASS (SP 800-128 step v (S9).)
- **Backout plan (rollback plan)**: PASS (SP 800-128 rollback requirement (S9).)
- **Maintenance window (change window)**: PASS.
- **Standard operating procedure (SOP)**: PASS.
- **Impact analysis vs test results vs backout plan vs maintenance window (change steps compared)**: FIXED (rule): "exam clues usually contain" -> "a scenario usually contains".
- **Allow lists and deny lists in change management**: PASS (CM-7(5) deny-all, permit-by-exception (S4).)
- **Restricted activities (change scope)**: PASS (SP 800-128 access restrictions for change (S9).)
- **Downtime (planned outage)**: PASS.
- **Service restart (change management)**: PASS.
- **Application restart (change management)**: PASS.
- **Legacy applications (change management)**: PASS.
- **Dependencies (change management)**: PASS.
- **Technical implications of a change compared (allow lists, scope, downtime, restarts, legacy, dependencies)**: PASS.
- **Updating diagrams (change documentation)**: PASS (SP 800-128 configuration items include network diagrams (S9).)
- **Updating policies and procedures (change documentation)**: PASS.
- **Version control (revision history for code, configurations and documents)**: PASS (SP 800-128 older baselines kept for rollback (S9).)
- **Public key infrastructure (PKI)**: PASS.
- **Public key and private key (asymmetric key pair)**: PASS.
- **Key escrow**: PASS (CNSSI 4009 definition in the NIST glossary (S5).)
- **Full-disk encryption (FDE)**: PASS (SP 800-111 3.1.1 (boot drive, hardware FDE keys stay out of memory, suspend modes) (S10).)
- **Partition encryption and volume encryption**: PASS (SP 800-111 3.1.2 (volume, container portability, boot and system volume note) (S10).)
- **File encryption (file and folder level)**: FIXED (unclear + rule): the "transparent in a specific sense" sentence -> "does not hide everything: NIST notes it cannot protect file names and other file metadata" (SP 800-111 section 3.1.3 summary, S10); "the exam's acronym list" -> "the SY0-701 acronym list".
- **Database encryption (transparent data encryption, TDE)**: PASS.
- **Record encryption (column-level and field-level encryption)**: PASS.
- **Full-disk vs partition vs volume vs file vs database vs record encryption (encryption levels compared)**: PASS.
- **Transport encryption (communication encryption, data in transit)**: PASS.
- **Symmetric encryption (shared secret key)**: PASS.
- **Asymmetric encryption (public key cryptography)**: PASS.
- **Symmetric vs asymmetric encryption**: PASS.
- **Key exchange (in-band, out-of-band, Diffie-Hellman)**: PASS (RFC 8446 (S18).)
- **Perfect forward secrecy (PFS, ephemeral keys, DHE and ECDHE)**: PASS (RFC 8446 (static RSA and DH removed, PSK-only and 0-RTT lack forward secrecy) (S18).)
- **Encryption algorithms (ciphers)**: PASS (3TDEA deprecated through 2023 then disallowed (SP 800-57 footnote, S19); RFC 6151 "must not be used for digital signatures" is the RFC's own wording in 2.3 (S12).)
- **Key length (key size and strength)**: PASS (SP 800-57 Part 1 Rev. 5 Table 2, every row (S19). d1 and d0 agree; both match the source.)
- **Initialization vector (IV) and nonce**: PASS (SP 800-38A 5.3 and Appendix C (not secret; CBC and CFB unpredictable; OFB unique) (S20). The chapter gives no GCM IV size.)
- **Trusted Platform Module (TPM)**: PASS.
- **Hardware security module (HSM)**: PASS.
- **Key management system (KMS)**: PASS.
- **Secure enclave (isolated security processor)**: PASS.
- **TPM vs HSM vs key management system vs secure enclave (cryptographic tools compared)**: PASS.
- **Steganography (hiding data inside other data)**: PASS (NIST glossary (S5).)
- **Tokenization (token vault, data obfuscation)**: FIXED (rule): "In the exam's model" and "the exam case" reworded. PCI facts PASS (card data vault, reversible cryptographic tokens also described) (S16).
- **Data masking (obfuscation of displayed data)**: PASS.
- **Encryption vs hashing vs encoding vs obfuscation (tokenization, masking, steganography)**: PASS (RFC 4648 security considerations (S21).)
- **Hashing (cryptographic hash functions)**: PASS (RFC 6151 (S12).)
- **Salting (password hashing with a salt)**: PASS (OWASP (S22).)
- **Key stretching (PBKDF2, bcrypt, Argon2)**: PASS (OWASP numbers (Argon2id 19 MiB, t=2, p=1; PBKDF2-HMAC-SHA256 600,000; bcrypt 72 bytes) and RFC 8018 iteration count (S22, S23).)
- **HMAC (hash-based message authentication code)**: FIXED (rule): "The exam's acronym list" -> "The SY0-701 acronym list". RFC 6151 statement PASS (S12).
- **Digital signatures**: FIXED (rule): "(the exam's model)" -> "(the usual teaching model)"; "The exam describes this as" -> "This is commonly described as".
- **Hash vs HMAC vs digital signature (integrity mechanisms compared)**: PASS.
- **Blockchain (hash-chained distributed ledger)**: FIXED (too close to source wording): first sentence rewritten in our own words (was a near copy of the NIST IR 8202 abstract, S15). Facts PASS.
- **Open public ledger**: PASS.
- **Digital certificates (X.509)**: FIXED (completeness, agrees with d0): validity schedule now "from a 398-day maximum to 200 days for certificates issued from 15 March 2026, 100 from 15 March 2027, 47 from 15 March 2029" (Baseline Requirements 6.3.2, S1). d1 and d0 agree; both match the source.
- **Certificate authority (CA) and the chain of trust**: PASS.
- **Registration authority (RA)**: PASS (RFC 5280 (S24).)
- **Certificate revocation list (CRL)**: FIXED (rule): "the exam still presents the CRL as the older, slower method" reworded. "Since 15 March 2024" PASS: ballot SC-063 (make OCSP optional, require CRLs) effective 2024-03-15; section 4.9.7 requires CRL updates at least every 7 days (4 days when certificates carry no OCSP pointer) and within 24 hours of a revocation (S1).
- **Online Certificate Status Protocol (OCSP) and OCSP stapling**: FIXED (rule): "on the exam OCSP remains" -> "in the SY0-701 objectives OCSP remains". RFC 6960 good/revoked/unknown and nonce PASS (S13); Let's Encrypt 6 August 2025 PASS (S14).
- **CRL vs OCSP vs OCSP stapling (revocation checking compared)**: PASS (RFC 6960 (S13).)
- **Self-signed vs third-party (public CA) certificates**: PASS (NIST glossary (S5).)
- **Root of trust**: PASS (NIST glossary (S5).)
- **Certificate signing request (CSR) generation**: PASS.
- **Wildcard certificates**: PASS (RFC 6125 6.4.3 (leftmost label only; not bar.foo.example.com or example.com) (S25).)
- **Subject Alternative Name (SAN) certificates**: PASS (RFC 5280 4.2.1.6 (S24).)

## Sources read this session
| Key | Source | URL |
|---|---|---|
| S1 | CA/Browser Forum Baseline Requirements (revision table, 4.9.7, 4.9.9, 4.9.10, 6.3.2, 7.1.2.11.2) | https://raw.githubusercontent.com/cabforum/servercert/main/docs/BR.md |
| S2 | NIST SP 800-207 (sections 2, 2.1, 3, 3.1, 3.4) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf |
| S3 | NIST SP 800-63B-4 | https://pages.nist.gov/800-63-4/sp800-63b.html |
| S4 | NIST SP 800-53 Rev. 5 control catalog (AC-8, CM-7(5), PE-3(3), PE-3(7), PE-3(8), PE-6, PE-6(3), SC-26), official machine-readable copy | https://github.com/usnistgov/oscal-content (SP 800-53 rev5 catalog JSON) |
| S5 | NIST glossary: compensating security control, key escrow, steganography, self-signed certificate, roots of trust, honeypot | https://csrc.nist.gov/glossary/term/compensating_security_control (and the sibling term pages) |
| S6 | NIST glossary: two-person integrity | https://csrc.nist.gov/glossary/term/two_person_integrity |
| S7 | RFC 8907 TACACS+ | https://www.rfc-editor.org/rfc/rfc8907.txt |
| S8 | RFC 2865 RADIUS | https://www.rfc-editor.org/rfc/rfc2865.txt |
| S9 | NIST SP 800-128 (2.3.3, 2.3.6, 3.1.1, 3.2.1, 3.3.2, 3.4) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-128.pdf |
| S10 | NIST SP 800-111 (section 3.1) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-111.pdf |
| S11 | NIST CSWP 29, CSF 2.0 (section 3.1) | https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf |
| S12 | RFC 6151 | https://www.rfc-editor.org/rfc/rfc6151 |
| S13 | RFC 6960 OCSP | https://www.rfc-editor.org/rfc/rfc6960.txt |
| S14 | Let's Encrypt, Ending OCSP Support | https://letsencrypt.org/2024/12/05/ending-ocsp/ |
| S15 | NIST IR 8202 | https://nvlpubs.nist.gov/nistpubs/ir/2018/NIST.IR.8202.pdf |
| S16 | PCI SSC Tokenization Guidelines | https://listings.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf |
| S17 | Microsoft Learn, Entity tags in Defender for Identity (honeytoken accounts) | https://learn.microsoft.com/en-us/defender-for-identity/entity-tags |
| S18 | RFC 8446 TLS 1.3 | https://www.rfc-editor.org/rfc/rfc8446.txt |
| S19 | NIST SP 800-57 Part 1 Rev. 5 (Table 2 and footnote) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf |
| S20 | NIST SP 800-38A (5.3, Appendix C) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf |
| S21 | RFC 4648 | https://www.rfc-editor.org/rfc/rfc4648.txt |
| S22 | OWASP Password Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html |
| S23 | RFC 8018 | https://www.rfc-editor.org/rfc/rfc8018.txt |
| S24 | RFC 5280 | https://www.rfc-editor.org/rfc/rfc5280.txt |
| S25 | RFC 6125 (6.4.3) | https://www.rfc-editor.org/rfc/rfc6125 |
| S26 | NIST SP 800-38D (5.2.1.1, 8.2) | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf |

Sections marked plain PASS were read in full for internal consistency, agreement with the cards, clarity and the format rules; their facts are either covered by a source above through a neighbouring section or are listed under "Could not verify".

## Cards
No card found wrong. Notes for the card reviewers:
- The objective 1.1 card's example calls a security guard "a physical category control", while the Operational control card lists "security guards checking IDs" as its example and the Physical control card says a guard can be either. Not an error, but the three cards should say the same thing; the chapter now accepts both.
- Extra card "Initialization vector (IV)": the 96-bit GCM IV is confirmed (S26).
- Cards for CRL and OCSP (March 2024, August 2025): confirmed (S1, S14).

## Reference chapter d0
No error found in the items compared: TLS validity schedule, comparable key strengths, GCM 96-bit IV recommendation.

## Could not verify against a primary source this session
- Definitions of the preventive, deterrent, detective, corrective and directive control types, and "recovery folded into corrective" (kept: standard usage, matches the cards).
- Change freeze, service restart, application restart, dependencies, ownership, stakeholders (kept: ordinary practice, matches the cards).
- Sensor behaviour (passive infrared zones and lens, microwave passing through glass and light walls, ultrasonic staying in the room, dual-technology detectors, pressure mat tamper loops): the writer's sources were not re-read; the ultrasonic frequency band was softened.
- Security lighting and CPTED, badge RFID and NFC, crash ratings for bollards, honeyfile and canary token details, turnstile comparison.
- Vendor specifics not re-read: Apple Secure Enclave components and Apple Pay token behaviour, Microsoft BitLocker, EFS, TDE and dynamic data masking statements, TPM anti-hammering, RFC 2986 and RFC 6066 details, NIST glossary wording for digital signature replay, HSM clustering.
- Not run: a machine check for 8-word overlaps against the source pages (only the blockchain opening was caught by eye and rewritten).
