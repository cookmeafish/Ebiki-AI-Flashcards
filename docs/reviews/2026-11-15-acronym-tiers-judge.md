# Acronym tiers: independent judge (2026-11-15)

Judged: the Security+ acronym track grouped as Core / Good to know / Extra. Design:
[[2026-11-15-acronym-tiers]] (`docs/plans/2026-11-15-acronym-tiers.md`). I did not build it.

How judged: read `career.js` (`withAcronyms`, `addAcronymTrack`, `acronymProgress`, `mustKnowCovered`), `CareerMap.jsx`
`AcronymCard`, the four locales, `dev/careers/acronym-core.json`, and the package's tiers (node). Ran
`career.test.js` + `acronymRank.test.js` (56 passed). Walked the real screen on port 3001 with the owner's saved course
(writes stubbed), desktop 1280 dark, phone 390 light, and both again at app zoom 2.0. No console errors.

Package totals: 321 acronyms, Core 241 (75%), Good to know 14, Extra 66. Of the Core: 127 by 3+ card uses, 105 by the
reviewed list, 9 by the outline alone.

## Verdict table

| # | Item | Result | Why |
|---|------|--------|-----|
| 1a | Tiers help a learner find "the main ones" | **FAIL** | Core is 241 of 321 (75%); in Security Operations it is 77 of 84. The owner asked for "most of the main ones is most likely enough"; a Core that is three quarters of the list barely narrows anything. The 105 reviewed promotions are mostly sound one by one, but together they drown the signal. Consider a smaller first group (for example outline-named + 10+ uses + the truly basic ones), or show Core's count per island and order the Core sets by importance so the first sets are the most central. |
| 1b | Expansions are accurate | **FAIL** | Several expansions are wrong as taught (see list below). They come from the public acronym list's own errors, but a learner memorizes them as fact. |
| 1c | Non-Core picks reviewed one by one | PASS with promotions | Most Extra entries really are peripheral (RACE, RIPEMD, ESN, VTC, POTS, CSU...). Promote list below. |
| 1d | Core reasons in acronym-core.json | PASS, a few weak | Reasons are short and correct. Weak: LEAP and COOP (legacy/niche), AI and ISP (everyone knows them, harmless). MTU is weak for security but the owner named it, so keep. |
| 2 | No wording implies knowledge of the real exam questions | PASS for this change, **FAIL for the package** | New tier text and acronym-core.json are clean ("never a claim about what an exam asks"). But 25 course cards (pre-existing since 1.60.0) say things like "the usual exam answers", "frequently tested details", "heavily tested", "Classic exam trap", "Exam cue", "on the exam, input validation is the usual answer", "the exam case is vault-based tokens". These read as inside knowledge of the questions. Ids: i1-1-3aa6b30b i1-2-024a70a8 i1-4-27320b93 i1-4-4aba3000 i1-4-f292beae i2-1-34d297c4 i2-2-fd69e4ef i2-3-61f00942 i3-1-17ca7779 i3-2-bc34ed6b i3-2-ba7c584a i3-2-27f4a4bc i3-3-4e539371 i4-1-4b8e1b39 i4-1-69b108c0 i4-5-47f4364e i4-6-3b4791d7 i4-6-0848a4f6 i4-6-310c7982 i4-7-5ef760a2 i4-8-614cec4b i5-1-422ce829 i5-2-38313015 i5-2-a45ecaf5 i5-2-c7850409. Domain weights ("about 12% of the exam") come from the public outline and are fine. |
| 3 | Tier wording clear in en/es/ja/zh, no em dashes | PASS, small nits | No dashes. Natural in all four. Nits: the Good to know hint "Used in a lesson or two" explains where it came from, not how important it is ("Shows up in a lesson or two: learn after Core" would guide better). zh mixes 操练 (old keys) and 练习 (new keys) for "drill"; ja mixes ロックする and 閉ざす for the boss lock line. |
| 4 | Real screen, desktop + phone + zoom 2.0 | PASS, one confusion | Card reads "60 acronyms in this domain · 36 core", "Grouped by importance: start with Core". Core group open with "The foundations: learn these first."; Good to know and Extra folded with their hints. Phone wraps cleanly; zoom 2.0 desktop and phone fit (header crowding at phone zoom 2.0 is the app header, not this card). Confusion: "Drill the core (15 questions)" and "Drill all (15 questions)" show the same count, so the difference is only the label. Set titles stay "TLS to OCSP (1/5)": the letters run in importance order, not alphabetical, which a beginner may read as a broken A-Z range. |
| 4b | Plan item L13: course header names the course's core total | **FAIL** (not built) | No course-level core total found in CareerMap.jsx; only the per-island title has it. |
| 5 | Migration keeps a saved track with progress | PASS, gaps in tests | `addAcronymTrack` keeps an island with any acronym progress exactly (test checks identity, ids, idempotence). Not tested: progress that is only `cardNoteId` (an acronym added to Anki) or only `attempts` on a set; a package version that ADDS acronyms to an island whose track already exists (`withAcronyms` returns early, so new acronyms never appear there, tiered or not); a tiered map whose package later changes a tier (marker blocks any re-sort, by design, worth one test that says so). |

## 1b. Wrong or misleading expansions

| Acronym | Taught as | Correct |
|---|---|---|
| DES (Core) | Digital Encryption Standard | Data Encryption Standard |
| CVE (Core) | Common Vulnerability Enumeration | Common Vulnerabilities and Exposures |
| URL (Core) | Universal Resource Locator | Uniform Resource Locator |
| PHI (Core) | Personal Health Information | Protected Health Information |
| STIX (Core) | Structured Threat Information eXchange | Structured Threat Information eXpression |
| SFTP and FTPS (Core) | both "Secured File Transfer Protocol" | SFTP = SSH File Transfer Protocol; FTPS = FTP Secure (FTP over TLS). Identical text makes them impossible to tell apart in a drill. |
| ISO (Core) | International Standards Organization | International Organization for Standardization |
| DPO (Good) | Data Privacy Officer | Data Protection Officer (GDPR term) |
| VBA (Extra) | Visual Basic | Visual Basic for Applications |
| Minor | SHA "Hashing", ESP "Encapsulated", RFID "Identifier", FIM "Management", SRTP "Secure Real-Time Protocol", CRC "Cyclical", SAML "Assertions" | Secure Hash Algorithm, Encapsulating Security Payload, Radio Frequency Identification, File Integrity Monitoring, Secure Real-time Transport Protocol, Cyclic, Security Assertion Markup Language |

Suggested fix: teach the correct name, and where the public list differs add "also written as ...", so a learner
recognizes both.

## 1c. Promote from Good to know / Extra

- **SAN** (Good): Subject Alternative Name is central to certificates (wildcards, multi-domain); Storage Area Network is common too.
- **RA** (Good): Registration Authority is a basic PKI role next to CA/CSR/CRL, all Core.
- **MSCHAP** (Extra): CHAP and PAP are Core; MS-CHAPv2 is the one actually met (PEAP) and the one that is cracked.
- **RTP** (Extra): SRTP is Core; RTP is what it secures.
- **HDD** (Extra): SSD is Core; consistency.
- **PIV** (Extra): smart card identity, a standard MFA example.
- **KEK** (Extra): key hierarchy, sits with HSM/TPM.
- **CCTV** (Good): the plainest physical-security control.
- Worth Good to know rather than Extra: GRE, DNAT, ROI, CIO/CSO/CTO, AIS (sits with STIX/TAXII), BASH, P2P.

## Fails, most serious first

1. Wrong expansions taught as fact, several in Core (DES, CVE, URL, PHI, STIX, SFTP = FTPS, ISO, DPO).
2. 25 course cards imply knowledge of what the real exam asks ("usual exam answers", "frequently tested", "exam trap").
   Pre-existing, but against the owner's rule.
3. Core is 75% of all acronyms, so "learn the main ones first" barely narrows the work.
4. Plan item L13 (course-wide core total) not built.
5. Drill buttons show the same question count; migration tests miss card-only progress and added acronyms.
