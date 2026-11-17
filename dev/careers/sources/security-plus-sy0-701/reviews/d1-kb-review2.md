# d1 knowledge chapter: independent accuracy review 2 (2026-11-16)

Reviewed: `knowledge/d1-knowledge.r8.md` (117 sections). Corrected pass: `knowledge/d1-knowledge.r9.md` (117 sections, 253,852 characters, largest section 2,800 characters, longest heading 110 characters, no duplicate headings, no dashes, no links, no HTML, no question-and-answer blocks, first two lines as required).
Reviewer 2 is not the writer and not reviewer 1. Every source below was downloaded and read this session (full text on disk, searched and read around each claim).
Compared with `cards/d1-cards.r5.json`, `cards/d1-extras.r3.json`, `outline.md`, `acronyms.txt` and the reference chapter `knowledge/d0-knowledge.r9.md`.

Result: 16 text edits in 14 sections. 6 correct or tighten a fact or an attribution, 3 soften a claim to what the source supports, 4 remove runs of 8 or more words copied from a source, 2 remove "trap" wording, 1 is a clarity fix. All other sections PASS. Work was interrupted once by a usage limit; on resuming, both files were checked complete and well formed and every check below was re-run on the final text.

## 1. Review 1's changes, re-checked against the source

| Review 1 change | Verdict | Source read |
|---|---|---|
| Guard can be physical or operational (4 sections) | Confirmed. PE-3 lists "guards" as a physical access control; PE-3(3) says guards give a more rapid response and human surveillance where video does not reach. The SY0-701 outline lists "Security guard" under Physical security. | S4, outline.md |
| PEP "must be able to send and receive messages on both planes" (2 sections) | Fact confirmed (SP 800-207 section 3.4, item 5). The new sentence copied 9 consecutive words from NIST, so it is reworded (see 3). | S2 |
| Bollards named in PE-3(7) | Confirmed: bollards, concrete slabs, jersey walls, hydraulic active vehicle barriers. | S4 |
| Fencing: removed the PE-3(7) attribution | Confirmed: PE-3(7) does not name fences. | S4 |
| Vestibule: "SY0-701 objectives use the newer name"; PE-3(8) facts | Confirmed: interlocking doors, piggybacking or tailgating, fully or partly automated. | S4, outline.md |
| Security guards: NIST credited only for PE-3(3); "delay or warn" credited to physical security guidance | Confirmed. The delay, warn and "trained humans who respond" idea is in the USDA Forest Service physical security toolbox. | S4, S27 |
| Two-person integrity wording | Confirmed (NIST glossary, CNSSI 4009 entry). | S6 |
| CAB "which NIST calls a configuration control board (CCB) or change control board" | Confirmed (SP 800-128 2.3.3 and the roles list). "Two or more individuals" and "check and balance" also confirmed. | S9 |
| File encryption: file names and metadata not protected | Confirmed (SP 800-111 section 3.1.3 summary). | S10 |
| Ultrasonic band softened to "above about 20 kHz" | Kept. No source gives a band; "above human hearing" is the definition. | S28 |
| Risk assessment type softened to "detective fits best" | Kept (no primary source assigns a type). | none |
| Blockchain opening rewritten | Confirmed: no 8-word overlap with NIST IR 8202 remains; facts match. | S15 |
| Certificate validity: 398, then 200 (15 March 2026), 100 (15 March 2027), 47 (15 March 2029) | Confirmed in the Baseline Requirements (effective-date table and 6.3.2). | S1 |
| CRL "since 15 March 2024" | Confirmed: ballot SC-063, effective 2024-03-15. | S1 |
| The 19 "exam" wording removals | Confirmed. Two leftovers ("is the trap") found and reworded (see 3). | n/a |

No review-1 fix was wrong. One (the PEP sentence) was correct in fact but too close to the source wording.

## 2. Review 1's "could not verify" list, now traced

| Item | Verdict | Source |
|---|---|---|
| Control type definitions (preventive, deterrent, detective, corrective, directive), "recovery folded into corrective" | Still no primary definition: a search of standards and regulator sites returned only secondary pages. Compensating is the one type NIST defines (S5, confirmed again). Kept: standard usage, matches the cards and the six types in outline.md. | none |
| Change management steps and terms | Confirmed in SP 800-128 3.3.2: request, record, decide if control is needed (pre-approved changes exist), analyze security impact, test, approve (CCB, may require extra controls), implement and update documentation and notify stakeholders, verify, close. Unscheduled (emergency) changes are still managed and reviewed afterwards. User and help desk training when function changes: confirmed. Rollback requirement, older baselines kept for rollback, network diagrams as configuration items, access restrictions for change (which lists change windows): confirmed. | S9 |
| Change freeze, service restart, application restart, dependencies, ownership, standard change | Not in a primary source. Ordinary practice, matches the cards. Kept. | none |
| Passive infrared: passive, plastic Fresnel lens because glass attenuates infrared, zones or "fingers", dual element and pulse count, best at movement across the pattern, no range adjustment | All confirmed. | S27, S28 |
| Microwave: Doppler, passes through glass, plywood, plastic, fiberboard and sheet rock, metal reflects, range gating, best at movement toward the sensor | All confirmed. | S27, S28 |
| Ultrasonic: reflected sound, contained in the room, drafts cause alarms, seldom used today | All confirmed. | S27, S28 |
| Dual-technology detectors: both must trigger, fewer false alarms, slightly lower detection | Confirmed. | S27, S28 |
| Pressure mats: step on, hide under carpet, easy to bridge, pressure switch under an object | Confirmed. "Many mats include a tamper loop" was not found: softened. | S27 |
| Security lighting: deter, make detection likely, even light, avoid glare for staff | Confirmed. CPTED as a name: not traced, well established, kept. | S27 |
| Fencing: defines boundary, toppings only delay a determined climber | Confirmed. | S27 |
| Layered goals deter, delay, detect, respond | Confirmed. | S27 |
| Honeypot, honeynet, isolation, legal counsel | Confirmed (SC-26 text and NIST glossary: "a file on a server" is given as an example of a honeypot resource). | S4, S5 |
| Honeyfile | MITRE D3FEND defines Decoy File (a file created to deceive an adversary). Callback content and canary token as a name: common practice, not traced. | S29 |
| Apple Secure Enclave: isolated from the main processor, protects data even if the kernel is compromised, Boot ROM as root of trust that verifies the enclave software, AES engine, true random number generator, public key accelerator, encrypted and authenticated memory, device-unique key | Confirmed. "Hardware keys software cannot extract" was not stated in those words: reworded to what the page says (UID fused in at manufacture). | S30 |
| Biometrics kept as a mathematical representation, matched inside the enclave | Confirmed. | S31 |
| Apple Pay: device-specific account number plus a transaction-specific security code, never the card number | Confirmed. | S32 |
| BitLocker: encrypts entire volumes, maximum protection with a TPM | Confirmed. | S33 |
| EFS: random file key, wrapped with the user's public key in the file header, recovery agent copy, plaintext over a file share, temporary plaintext copy when a single existing file is encrypted | Confirmed. "FAT copy is stored unencrypted" not found in the pages read: reworded to the documented fact (EFS exists only on NTFS volumes). Microsoft itself uses both "Encrypting" and "Encrypted" File System: sentence corrected. | S34 |
| SQL Server TDE: symmetric database key protected by a certificate in master or an EKM asymmetric key, page-level real-time encryption, backups encrypted with the same key, no protection of communication channels, certificate loss means data loss | All confirmed. | S35 |
| Dynamic data masking: stored data unchanged, UNMASK permission, partial function syntax, inference by guessing (salary example), complements other controls | All confirmed. | S36 |
| TPM: keys not exposed outside the TPM, sealing, measured boot and attestation, anti-hammering lockout, TCG specifications, tamper resistance | Confirmed. Built-in random number generator: not in the pages read, well established, kept. | S37 |
| RFC 2986 (CSR): subject name, public key, optional attributes, signed by the requester; the CA authenticates the requester, verifies the signature and adds issuer, serial number and validity | Confirmed. | S38 |
| RFC 6066 (stapling): status request in the client hello, CertificateStatus message from the server | Confirmed. | S39 |
| NIST glossary: signatures give no confidentiality or replay protection | Confirmed. | S5 |
| HSM clustering, FIPS 140 | Not traced. General knowledge, kept. | none |
| 8-word overlap check (not run by review 1) | Run by script against outline.md and every source below. Four runs found and rewritten (see 3). None remain. | script |

Also re-read and confirmed this session: SP 800-131A (three-key TDEA deprecated through 2023, disallowed after), SP 800-57 Part 1 Table 2 (all four rows), SP 800-38A (IV not secret; CBC and CFB unpredictable; OFB unique), NIST IR 8202 section 7.1 (immutability, tail blocks, 51 % attack), RFC 6151 (both statements), RFC 6960 (good, revoked, unknown; CRL fall-back), RFC 8446 (static RSA and DH removed; PSK-only and 0-RTT not forward secret), RFC 7296 (PFS through a new Diffie-Hellman exchange for a child SA), RFC 4648 (no confidentiality), RFC 8907 (obfuscation, secured network), RFC 2865 (password hidden), RFC 2104 (inner and outer hash), RFC 5280 (RA), OWASP Password Storage Cheat Sheet (all numbers), PCI tokenization guidance, SP 800-63B-4 (biometric not an authenticator by itself, PSTN restricted, geolocation as a fraud indicator), CSF 2.0 (profiles, action plan), SP 800-86 (steganography), Let's Encrypt (6 August 2025).

## 3. Changes made in r9 (before -> after, source)

1. **Detective controls**: "NIST lists log review that spots out-of-hours or out-of-sequence access as a core part of monitoring physical access" -> "NIST's guidance on monitoring physical access gives access outside normal working hours and out-of-sequence access as examples of suspicious events to look for in access logs". PE-6 gives these as examples in its discussion, not as a "core part" (S4).
2. **Corrective controls**: "Corrective vs compensating is the trap." -> "Corrective and compensating are the pair most often mixed up." (rule: no exam-trap wording).
3. **Authenticating people**: "Calling it MFA is the trap" -> "Calling it MFA is the mistake" (same rule).
4. **Zero Trust control plane vs data plane**: "NIST notes that PEPs must be able to send and receive messages on both planes." -> "NIST notes that a PEP has to be able to exchange messages on both planes." (9 words copied from SP 800-207; S2).
5. **Access control vestibule**: added "Many sources, NIST included, use the two words for the same act, so either word is correct unless a clue separates them by consent." PE-3(8) says "piggybacking or tailgating" as one activity; the chapter's consent distinction alone would mark a correct answer wrong (S4).
6. **Pressure sensors**: "Many mats include a separate tamper loop so a cut cable is also reported." -> "Some installations add tamper detection so that a cut cable is also reported." (not supported by S27).
7. **Secure enclave**: "an AES engine whose hardware keys software cannot extract, a true random number generator, and a public key accelerator" -> "an AES engine for fast encryption, a true random number generator, and a public key accelerator for asymmetric operations. A unique device key is fused into the chip when it is made." (S30).
8. **File encryption**: "a copy moved to a FAT or FAT32 drive is stored unencrypted, and files sent over a network file share are decrypted before transmission" -> "EFS works only on NTFS volumes, so a copy placed on a drive with another file system (such as a FAT32 USB stick) is no longer protected by it, and a file opened from or saved to an ordinary network file share crosses the network decrypted" (S34).
9. **File encryption**: "Microsoft's name is Encrypting File System; the SY0-701 acronym list expands EFS as Encrypted File System" -> "Microsoft's documents use both Encrypting File System and Encrypted File System for this feature; the SY0-701 acronym list uses Encrypted File System." Microsoft's developer page is titled with "Encrypted File System" (S34, acronyms.txt).
10. **Key stretching**: "bcrypt reads only the first 72 bytes" -> "Most bcrypt implementations read only the first 72 bytes" (OWASP: "for most implementations"; S22).
11. **Key stretching**: "The PBKDF2 standard notes that an iteration count of c multiplies an attacker's cost per guess by c." -> "The PBKDF2 standard (RFC 8018) states that an iteration count of c adds log2(c) bits of strength against guessing attacks, which is another way of saying each guess costs c times more work." (RFC 8018 4.2; S23).
12. **Wildcard certificates** (most serious): "Matching rules (RFC 6125)" -> "Matching rules (RFC 9525, which replaced RFC 6125 in 2023)". RFC 9525 (November 2023) obsoletes RFC 6125. Rule 1 now says the asterisk must be the whole leftmost label. Rule 4 "should not be matched" -> a wildcard elsewhere, or as part of a label (such as `w*.example.com`), "makes the name invalid and it must be ignored". RFC 6125 allowed partial-label wildcards; RFC 9525 does not (S25, S40).
13. **Blockchain**: "stores that hash of its predecessor's header" -> "stores the hash of its predecessor's header" (clarity).
14. **Root of trust**: NIST sentence reworded ("very dependable components (hardware, firmware or software) that carry out a small set of critical security functions"): 11 words were copied from the NIST glossary (S5).
15. **Steganography**: NIST sentence reworded ("a way of communicating that conceals the fact that any communication is taking place"): 10 words were copied from the NIST glossary (S5).
16. **Registration authority**: RFC 5280 sentence reworded ("an optional component that takes over some management functions from the CA"): 11 words were copied (S24).
17. **Ultrasonic sensors**: no text change; "seldom used" and "drafts" are now backed by S27 and S28 (listed here because review 1 had it open).

## 4. Guard category across the cards (not edited, chapter accepts both)

- `d1-cards.r5.json`, "SY0-701 1.1: Compare and contrast various types of security controls": example calls a security guard "a physical category control".
- `d1-cards.r5.json`, "Operational control (control category)": example lists "Security guards checking IDs".
- `d1-cards.r5.json`, "Physical control (control category)": example lists "guard shacks"; key points say a guard can be counted as physical or operational.
- `d1-cards.r5.json`, "Security guard (physical security)": gives types only (preventive, deterrent, detective), no category.

The chapter says: operational when the focus is the person's work, physical when the focus is protecting the site, accept either (sections Operational controls, control categories compared, worked method, Security guards). Both readings have a source: NIST PE-3 lists guards as a physical access control; the outline lists the guard under Physical security.

## 5. Cards and other files

- No card found wrong.
- Card note (not an error): cards that separate tailgating (no consent) from piggybacking (consent) should accept either word, because NIST uses them for one activity. The chapter now says so.
- Card note: any card that cites RFC 6125 for wildcard matching should name RFC 9525.
- `acronyms.txt` has EFS as Encrypted File System and HMAC as Hashed Message Authentication Code; the chapter notes both.

## 6. Reference chapter d0 (r9)

Numbers compared and equal in d1 and d0, and both match the source: public TLS validity (398, 200, 100, 47 days and their dates; d0's "version 2.3.1, October 2026" matches the Baseline Requirements revision table), comparable key strengths (112, 128, 192, 256 rows), 3DES disallowed after 2023, OWASP password settings (Argon2id 19 MiB, 2, 1; PBKDF2 600,000; bcrypt 72 bytes), TACACS+ obfuscation, RADIUS hides only the password. d1 states no port numbers. d1 does not mention IPsec AH or Windows logon types, so the two d0 review notes do not apply here. No error found in d0.
Small wording difference only: d0 says bcrypt "reads at most 72 bytes"; OWASP says this holds "for most implementations". Not wrong.

## 7. Still not verified against a primary source

- Definitions of the preventive, deterrent, detective, corrective and directive control types, and "SY0-701 folds recovery into corrective". Kept as standard usage that matches the cards.
- Change freeze, pre-approved "standard change" as a name, service restart, application restart, dependencies, ownership. Kept as ordinary practice.
- CPTED as the name for lighting and visibility design; badge RFID and NFC; bollard crash ratings; turnstile comparison; cameras' analytics features.
- Honeyfile callback content and "canary token" as a name; honeytoken account alerting (review 1 read the vendor page; not re-read).
- TPM random number generator; "firmware TPM inside the processor"; the remark that Secure Boot is a separate feature.
- HSM clustering and acceleration; key management system lifecycle list beyond the NIST glossary's (generation, storage, establishment, entry and output, use, destruction).
- "Hardware FDE has little performance cost" (NIST confirms only that keys stay out of memory).
- Let's Encrypt: the page read announces the 6 August 2025 shutdown as a plan; that it happened on that date was not re-confirmed from a later page.
- Tailgating versus piggybacking by consent: a training convention, not in a primary source (now flagged in the chapter).

## Sources read this session

| Key | Source | URL |
|---|---|---|
| S1 | CA/Browser Forum Baseline Requirements (revision table, effective dates, 4.9.7, 6.3.2) | https://raw.githubusercontent.com/cabforum/servercert/main/docs/BR.md |
| S2 | NIST SP 800-207 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf |
| S3 | NIST SP 800-63B-4 | https://pages.nist.gov/800-63-4/sp800-63b.html |
| S4 | NIST SP 800-53 Rev. 5 (AC-8, CM-7(5), PE-3, PE-3(3), PE-3(7), PE-3(8), PE-6, PE-6(3), SC-26) | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf |
| S5 | NIST glossary: compensating security control, key escrow, steganography, self-signed certificate, roots of trust, honeypot, digital signature, hash function, Diffie-Hellman, key management | https://csrc.nist.gov/glossary/term/digital_signature (and sibling term pages) |
| S6 | NIST glossary: two-person integrity | https://csrc.nist.gov/glossary/term/two_person_integrity |
| S7 | RFC 8907 | https://www.rfc-editor.org/rfc/rfc8907.txt |
| S8 | RFC 2865 | https://www.rfc-editor.org/rfc/rfc2865.txt |
| S9 | NIST SP 800-128 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-128.pdf |
| S10 | NIST SP 800-111 | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-111.pdf |
| S11 | NIST CSWP 29 (CSF 2.0) | https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.29.pdf |
| S12 | RFC 6151 | https://www.rfc-editor.org/rfc/rfc6151.txt |
| S13 | RFC 6960 | https://www.rfc-editor.org/rfc/rfc6960.txt |
| S14 | Let's Encrypt, Ending OCSP Support | https://letsencrypt.org/2024/12/05/ending-ocsp/ |
| S15 | NIST IR 8202 | https://nvlpubs.nist.gov/nistpubs/ir/2018/NIST.IR.8202.pdf |
| S16 | PCI SSC Tokenization Guidelines | https://listings.pcisecuritystandards.org/documents/Tokenization_Guidelines_Info_Supplement.pdf |
| S18 | RFC 8446 | https://www.rfc-editor.org/rfc/rfc8446.txt |
| S19 | NIST SP 800-57 Part 1 Rev. 5; NIST SP 800-131A Rev. 2 | https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf ; https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-131Ar2.pdf |
| S20 | NIST SP 800-38A | https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38a.pdf |
| S21 | RFC 4648 | https://www.rfc-editor.org/rfc/rfc4648.txt |
| S22 | OWASP Password Storage Cheat Sheet (source file) | https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/cheatsheets/Password_Storage_Cheat_Sheet.md |
| S23 | RFC 8018; RFC 2104 | https://www.rfc-editor.org/rfc/rfc8018.txt ; https://www.rfc-editor.org/rfc/rfc2104.txt |
| S24 | RFC 5280 | https://www.rfc-editor.org/rfc/rfc5280.txt |
| S25 | RFC 6125 | https://www.rfc-editor.org/rfc/rfc6125.txt |
| S27 | USDA Forest Service, Physical Security Toolbox (volumetric motion sensors, point sensors, lighting, fences, entry control, principles, objectives) | https://www.fs.usda.gov/t-d/phys_sec/alarms/vol.htm (and sibling pages) |
| S28 | Perimeter Security Sensor Technologies Handbook (US government handbook, copy held by the US Department of Justice library) | https://www.ojp.gov/pdffiles1/Digitization/206415NCJRS.pdf |
| S29 | MITRE D3FEND, Decoy File | https://d3fend.mitre.org/technique/d3f:DecoyFile/ |
| S30 | Apple Platform Security, Secure Enclave | https://support.apple.com/guide/security/secure-enclave-sec59b0b31ff/web |
| S31 | Apple Platform Security, Face ID and Touch ID security | https://support.apple.com/guide/security/face-id-and-touch-id-security-sec067eb0c9e/web |
| S32 | Apple, Apple Pay security and privacy overview | https://support.apple.com/en-us/101554 |
| S33 | Microsoft Learn, BitLocker overview | https://learn.microsoft.com/en-us/windows/security/operating-system-security/data-protection/bitlocker/ |
| S34 | Microsoft: How Encrypting File System Works; The Encrypting File System; File Encryption (Win32) | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc781588(v=ws.10) ; https://learn.microsoft.com/en-us/previous-versions/tn-archive/cc700811(v=technet.10) ; https://raw.githubusercontent.com/MicrosoftDocs/win32/docs/desktop-src/FileIO/file-encryption.md |
| S35 | Microsoft, Transparent data encryption (source file) | https://raw.githubusercontent.com/MicrosoftDocs/sql-docs/live/docs/relational-databases/security/encryption/transparent-data-encryption.md |
| S36 | Microsoft, Dynamic data masking (source file) | https://raw.githubusercontent.com/MicrosoftDocs/sql-docs/live/docs/relational-databases/security/dynamic-data-masking.md |
| S37 | Microsoft Learn, TPM fundamentals; TPM technology overview | https://learn.microsoft.com/en-us/windows/security/hardware-security/tpm/tpm-fundamentals ; https://learn.microsoft.com/en-us/windows/security/hardware-security/tpm/trusted-platform-module-overview |
| S38 | RFC 2986 | https://www.rfc-editor.org/rfc/rfc2986.txt |
| S39 | RFC 6066 | https://www.rfc-editor.org/rfc/rfc6066.txt |
| S40 | RFC 9525 | https://www.rfc-editor.org/rfc/rfc9525.txt |
| S41 | RFC 7296; NIST SP 800-86 | https://www.rfc-editor.org/rfc/rfc7296.txt ; https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-86.pdf |

Not reachable this session: the US Department of Defense electronic security systems criteria (access denied) and the US Nuclear Regulatory Commission intrusion detection report (not found at the address tried). S27 and S28 covered the same sensor facts.

## Method notes

- Sections were read in full, once, as a learner would: each stands alone, expands its acronyms, has one answer to its scenario, and labels legacy items (DES, 3DES, RC4, MD5, SSL, mantrap as an older name).
- Format check by script on r9: 122 headings, none repeated, longest 110 characters; 117 sections, largest 2,800 characters; no "http", no em or en dash, no HTML tag, no question-and-answer lines, no "exam" or "trap" wording.
- Overlap check by script: every 8-word run of the chapter (code spans excluded) against outline.md and all sources above; zero runs remain.
- Not done: the app and its build were not run (out of scope); the cards were not edited.
