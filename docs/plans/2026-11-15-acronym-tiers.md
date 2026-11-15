# Acronyms by importance: Must know, Good to know, Not in the lessons (2026-11-15)

The owner: "what if you order it by most used and known acronyms and less known. knowing most of the main ones is most
likely enough for security+". Related: [[2026-11-15-domain-pictures]], CLAUDE.md "CAREER MODE" (acronyms per domain),
`docs/career-mode-guide.md`.

Angles run separately: **L** a learner with limited time, **O** the owner's saved course (and other computers), **W** what
can go wrong.

## Measured, never guessed
Two signals per acronym, computed at BUILD time (`dev/careers/build-career.mjs`) from the course's own sources:
- **outline**: the exam outline names it, by its letters (case-sensitive, word-bounded, plural/possessive allowed) or
  spelled out (case-insensitive, spaces and hyphens normalized) (W1, W4). Two-letter acronyms count by letters only in
  "(XX)" after a word or with their spelled-out form in the same line (W2).
- **uses**: how many course cards (not acronym cards) use it, by the same rules.
An acronym with two meanings is ranked by its better meaning (W3). Numbers for the 321 acronyms of the first course:
92 named in the outline; 32 used in 10+ cards, 92 in 3 to 9, 90 in 1 to 2, 107 in none.

## Tiers
- **Must know**: named in the outline, or used in 3+ cards. Nothing the outline names is ever lower (W5, tested).
- **Good to know**: used in 1 or 2 cards.
- **Not in the lessons**: on the exam's acronym list, used in no lesson. Worded as what was measured, never "not on the
  exam" or "safe to skip" (L7, W6); still learnable and drillable.
Order inside a tier: outline first, then uses, then first appearance, then the letters (W7, deterministic: two builds
give identical output, tested). The package ships only `tier` and `uses` per acronym, never outline text (W8).

## The track per island
- Lessons per TIER, never mixed (L4), about 8 each, a tiny last set folded into the one before (L8); titled by the app
  from the tier and number ("Must know 2/4"), not stored English.
- Three groups under "Learn the sets": Must know open, the other two folded but always there (L5).
- The main 🎯 drill asks the Must know tier (L6); a second "Drill all" over every acronym.
- Progress per tier ("Must know: 2/4 sets") and the island's must-know count in the title ("18 must-know of 64") (L1, L2).
- **Must know covered**: every must-know set done and the must-know drill passed: a stamp on the card (L3).
- The course header line names the course's must-know total (L13).
- Phone: the groups wrap; the lower tiers start folded (L12).

## Saved maps (O)
- Item ids never change; items keep `seen`, `right`, `grade`, `cardNoteId` (O1).
- A track with NO acronym progress (no acronym set done or attempted, no acronym item seen or carded) is rebuilt in
  tier order (O3). One WITH progress keeps its sets exactly as they are (O2): nothing re-taught, nothing lost.
- Marker `career.acronymOrder: 2` (O4); `version` stays 2 (O5: an older build reads it, keeps unknown fields).
- Through `updateMap` (fresh read, pure, idempotent: twice gives the same map) (O6); parked courses migrate when
  unparked (O8); saved step files of reordered sets are simply not matched again (O7).
- The owner's saved map has no acronym track yet (checked): it gets the tiered track on first open.
- A package without tiers (an older package) still builds the old single-order track (W9).

## Judge
To be filled by the independent judge: one row per item above, pass or fail with the reason.
