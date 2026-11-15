# Security+ cards: full independent check (2026-11-15)

**Why:** after 10 sweeps, an independent random sample of 118 cards still found 1 wrong and 10 imprecise
(`docs/reviews/2026-11-15-security-plus-independent-check.md`). At that rate, roughly 75 of the 853 cards could still
have problems. So every card gets an independent check before the course is called accurate.

**Who:** one fresh reviewer per card file (d1, d2, d3, d4a, d4b, d5; the extras ride with their file). Each reviewer did
not write or sweep those cards.

**What each reviewer does, for EVERY card:**
- verifies every claim against official sources read now: the CompTIA SY0-701 objectives, NIST, RFCs, vendor docs,
  MITRE, OWASP, the laws' own text;
- judges each card CORRECT, MINOR (imprecise or misleading) or WRONG (false);
- names the source that settles every fix;
- keeps every true, helpful detail, in its own words.

**Output:**
- `cards/<prefix>-cards.r4.json`: same shape, order, obj and path;
- `knowledge/<prefix>-knowledge.r4.md`: the chapter, with the same fixes;
- `docs/reviews/2026-11-15-full-check-<prefix>.md`: per-card verdicts, every fix with its source, and totals.

## Coordinator checklist
- [ ] 6 reviewers done
- [ ] build "no problems", tests green
- [ ] the owner gets per-domain numbers (checked, wrong, minor, fixed), and a plain note that the 10 sweeps missed these
