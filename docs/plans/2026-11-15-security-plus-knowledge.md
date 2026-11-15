# Security+ knowledge base: a master-level guide for every objective (2026-11-15)

The owner: "fill that knowledge base for security+ with a ton of information for every objective ... so that ebi can be
a master at security+". Ebi reads a mode's knowledge base in Chat, Help, question writing, grading, Learn it and Legends.

Related: [[2026-11-15-acronym-tiers]], `docs/career-mode-guide.md`, CLAUDE.md "Knowledge base" and "CAREER MODE".

## Angles (three separate agents, none saw the others)
- **L** = a learner asking Ebi "why X not Y", "give me a scenario", "how do I tell these apart".
- **W** = what can go wrong (accuracy, retrieval, copying, staleness, stale copies, shared folders).
- **F** = a first-time user and a phone user who start the course in a fresh mode.

## What is there today (measured)
- Six chapters, about 220k characters, very uneven: d2 87k with 173 headings, d1 22k for 5 objectives (L, W).
- Many terms are bold bullets under one heading with a semicolon-packed "Exam tip"; few comparisons or scenarios (L).
- The route keeps at most 400 outline entries, dropping whole levels past that: a bigger guide loses its term sections (W).
- Repeated titles ("Exam tips", "Check yourself") are ambiguous to the picker; "Check yourself" holds answers (W).
- Only a developer script copies chapters into one app-folder mode; the owner's mode holds an OLD pass; another user who
  starts the course gets NO knowledge base (W, F).
- The 8-word prose overlap check never runs on the chapters (W).

## Design

### Content (every chapter, our own words)
1. One chapter per domain (d1, d2a, d2b, d3, d4a, d4b, d5) plus `d0-reference`: the ONE home of exact numbers (ports and
   secure/insecure pairs, key and hash sizes, RAID levels, wireless standards, retention-free facts). Other sections
   name it instead of repeating numbers (L7).
2. Headings: `# Domain N: <name>`, `## N.x <objective in our words>` opening with one line on the depth asked (compare,
   summarize, explain, apply in a scenario) (L12), then one `###` per term or close group, NAMED with the term, its
   acronym and common synonyms (L1, L14). Every title unique across the course and readable without its parent (W7):
   no bare "Exam tips" or "Check yourself".
3. Each term section (about 1,500 to 3,500 characters, never over 4,000) (L2, W8):
   - a 2 to 3 sentence core: what it is, what problem it solves, where it sits (control type, CIA leg, layer) (L3);
   - how it works, in plain steps where it is a process (numbered, a reason per step, the common wrong order) (L8);
   - why it matters: the business consequence (L9);
   - common confusions, in full sentences, never semicolon chains (L10);
   - one realistic scenario: the clue, the answer, why the closest wrong answer fails (L5); self-written, never an exam item;
   - a worked mini-example where procedural: a log line, a firewall rule, a certificate field, a score (L15).
4. "X vs Y vs Z" sections with a short contrast table for every confusable cluster (L4), e.g. control categories and
   types, IDS/IPS, scan vs pen test, RTO/RPO/MTTR/MTBF, symmetric vs asymmetric, hashing vs encryption vs encoding vs
   obfuscation, the phishing family, malware types, access control models, recovery sites, backup types, federation
   and AAA protocols, WPA2 vs WPA3, risk treatments, policy/standard/procedure/guideline.
5. "Choosing the control" decision paths for the scenario-heavy objectives (2.5, 3.x, 4.x): goal or constraint to
   control, plus when NOT to use it (L6).
6. One home section per cross-domain term; elsewhere one line "in this objective it means..." naming the home (L11).
7. No padding: every sentence a fact, a contrast, a cue or a step (L16, TEACHING_STYLE_RULE). No question-and-answer
   blocks (their answers would reach live question writing and Help: W12).
8. Each chapter starts with "Checked as of 2026-11 for SY0-701" (W17). Legacy items (WEP, TKIP, PPTP) are labelled
   legacy, never current (L risk 2).
9. Our own words: no vendor or course wording, no names of courses or creators (W5); facts checkable against public
   standards (NIST, RFCs, vendor-neutral docs).

### Accuracy (cards get memorized; the guide grades answers)
10. Writers trace every fact to a source read while writing; source notes go in `reviews/`, never in the chapter (W1).
11. Two independent accuracy reviews per chapter, plus a numbers pass, PASS/FAIL per section, fails fixed and re-reviewed (W2).
12. The chapter never contradicts the shipped cards: a reviewer reads each card's key facts beside its section (W3).
13. The build runs BOTH overlap checks on the chapters (12-word runs against the outline, 8-word prose phrases) (W4),
    and `bannedNames.test.js` stays green (W5).

### Retrieval and cost
14. The outline route keeps up to 1,000 entries (was 400), so term sections stay pickable; a test runs the real outline
    on the shipped chapters and checks every heading is reachable and every title unique (W6, W7, W9).
15. A test slices every section alone and fails one over 4,000 characters (W8).
16. Picker check: real card fronts through the real picker on the owner's provider; the top pick contains the term in
    90%+ (W10). Cost per pick and per grading call measured before and after (W11).

### Delivery (F, W13 to W16)
17. Chapters ship with the course: `public/careers/security-plus-sy0-701/knowledge/<name>.md`, listed in the package
    (`knowledge: [{ file, title, version }]`), newest pass only.
18. Starting the course installs them into the mode's knowledge base through the server (dataPath, the data guard,
    writeFileAtomic), with the mode name resolved at write time from the pinned id; it never blocks the start, a failed
    install shows one quiet line with Retry (F1, F3, F9). No key needed (F10). No onboarding step: the guide comes with
    the course and asks nothing of the user (F15).
19. Course files use a reserved prefix (`course-<id>-`), so they never collide with a user's own notes, which are never
    touched (F7). An update replaces only course files whose version is older; a `.disabled` course file stays disabled;
    a deleted one is not put back by itself (F5, F6, W16); stale course files of an older layout are removed (W13).
20. Settings > Knowledge shows them as one group "Security+ course guide" with readable chapter titles and a 🎓 badge,
    a switch to disable the whole guide and "Restore the course guide" (F4, F5, F6); a line saying Ebi reads only the
    parts that match each question (F8). Phone: the group folds to one row (F14).
21. Two modes each get their own copy (F11); moving the course moves the guide's install too, the old copy kept unless
    the learner removes it (F12); Start over and parking keep it (F13).
22. Help can say where Ebi's Security+ facts come from (F15).

## Build order
1. Writers (one agent per chapter, parallel) write r7 from the r4/r6 pass and the cards, to this design.
2. Two independent reviewers per chapter + numbers pass; fixes; overlap checks.
3. Code: outline cap, section-size and heading tests, package listing, install route + course start, Settings group.
4. Judge: picker accuracy, real Chat / Learn it / grading replies on the owner's setup, desktop and phone.

## Judge table
(filled by the independent judge)
