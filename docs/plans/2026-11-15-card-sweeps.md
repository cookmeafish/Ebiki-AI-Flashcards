# Security+ cards: 10 accuracy sweeps (2026-11-15)

The owner asked for it: "go through all the flashcards and make sure that any flashcard needed to be made is made and is accurate. Do research to assure that each is accurate. Do this sweep 10 times. Extra information is okay only if it gives better understanding."

## How it runs
- **One reviewer per card file**, in parallel: d1, d2, d3, d4a, d4b, d5 (`dev/careers/sources/security-plus-sy0-701/cards/`). Each also owns its knowledge chapter. Reviewers never edit another reviewer's files.
- **Output:** each reviewer writes the next pass as NEW files (`<prefix>-cards.r3.json`, `<prefix>-knowledge.r3.md`), never overwriting r2. The build picks the highest pass.
- **Logs:** each sweep is logged in `dev/careers/sources/security-plus-sy0-701/reviews/<prefix>-sweeps.md`, one section per sweep: what was checked, every change with its source URL, and the count of cards checked and changed.
- **Missing cards:** the course keeps exactly one card per outline line (the coverage test). A concept a learner truly needs that no line covers goes into the log under "Proposed new cards", with the reason and a source. The coordinator decides.

## The 10 sweeps (each over EVERY card in the file)
1. **Facts:** each definition is true. Check against primary sources: NIST SP/FIPS, RFCs, ISO/IEC, vendor documentation, MITRE ATT&CK/CWE/CAPEC, OWASP, CIS, laws' own text.
2. **Numbers and names:** ports, key sizes, standard numbers, versions, acronym expansions, dates, percentages.
3. **Examples:** each example is concrete, realistic, and actually an instance of the concept (not of a neighbouring concept).
4. **Key points:** each one is true, useful for the exam, not padded. Extra detail is kept only if it adds understanding.
5. **Confusables:** look-alike terms (e.g. IDS/IPS, MOU/MOA, RTO/RPO, hashing/encryption) are told apart correctly, consistently across cards.
6. **Coverage:** each card fully covers its own outline line (read outline.md). Nothing the line names is missing, and concepts a learner needs and no line covers are proposed.
7. **Consistency:** the same fact is stated the same way on every card and in the knowledge chapter; no contradictions.
8. **Clarity:** plain, fluff free, straight to the point, easy to understand on first read (the TEACHING_STYLE_RULE in `src/utils/questionTier.js`); no em or en dashes; no HTML.
9. **Exam fit:** the wording matches how SY0-701 expects the concept to be understood (current version, not older exams); outdated items are marked as such.
10. **Final adversarial pass:** try to prove each card wrong. Anything not confirmed by a source read this sweep gets fixed or flagged.

## Rules
- Own words only: no run of 12+ words copied from the outline (`docs/career-mode-guide.md`).
- Card shape is unchanged: `{ obj, path, term, definition, example, category, keyPoints }`. `obj` and `path` are never changed.
- Briefing cards (a domain's or objective's overview, `path: []`) are background: accurate and short, never quizzed.

## Coordinator checklist
- [ ] 6 reviewers done, logs read
- [ ] `node dev/careers/build-career.mjs security-plus-sy0-701` prints "no problems"
- [ ] `npx vitest run dev/careers src/features/legends/career.test.js` green
- [ ] a random sample checked by an independent reviewer who did not write the changes
- [ ] proposed new cards decided
- [ ] numbers reported to the owner (cards checked x10, changed, sources)
