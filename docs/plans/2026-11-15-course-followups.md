# Course follow-ups (from the 2026-11-15 multi-angle review)

An oversight review of career mode found 30 items. The owner wants new additions feature complete; this is the list,
with what was done. Related: [[2026-11-15-course-bosses]].

## Fixed (1.64.1)
- [x] 1. An adventure in a Security+ mode now offers "🏝️ Ready-made course" (parks the adventure, never deletes it).
- [x] 5. Course protection no longer covers any note tagged `sy0-701`: only `ebiki-course`, or `ebiki` + `sy0-701`
  (the first course build's own cards). User and shared decks stay deletable (protect.test.js).
- [x] 7. A lost boss's rematch (nemesis) belongs to that boss (`nodeId`); other bosses and the raid are untouched.
- [x] 8. A parked adventure is resumable from the start screen ("Resume my adventure").
- [x] The career tile described the old layout (checkpoints, one boss); it now names regions, raids and the final raid.

## To do: data and correctness
- [ ] 2. Link course items to the imported Anki notes (course tag + front) so Study reviews count toward mastery and
  Add to deck never duplicates; tag cards added from Legends `ebiki-course`.
- [ ] 3. Refresh card text in a started course when the package version changes (by item id, progress kept).
- [ ] 4. Migrate a course WITH progress to the boss layout (done lessons mapped by item ids). Today it keeps layout 1.
- [ ] 6. "Move it to Security+" should carry step files, rewards and the learner model to the new mode.
- [ ] 9. Deleting a mode should warn about and clean up its Legends files.

## To do: failure handling and access
- [ ] 10. Grading failures show the real cause (limit, credits, bad key), not "connection problem".
- [ ] 11. Grading calls time out at about 30 s with Cancel / Use choices, not 5 minutes.
- [ ] 12. Voice mode: go idle after 2 empty turns and cap a session (steady noise counted as speech).
- [ ] 13. Voice errors: readable messages; a missing mic is not "allow it".
- [ ] 14. Starting the course without an AI key: say so up front, or let lessons teach without one.
- [ ] 15. "Create the Security+ mode" button for first-time users (sets the deck); match "Sec+" and "CompTIA".
- [ ] 16. Quitting mid-fight: save and resume the generated fight instead of paying for a new one.
- [ ] 17. Accessibility: Modal focus trap, no per-percent screen reader alerts, boss-named labels, 44 px boss buttons.
- [ ] 18. Phone: Modal and arena pin use the visual viewport (iOS keyboard).
- [ ] 19. An older build reading a course map says "saved by a newer Ebiki, update", not "try again".

## To do: exam readiness (needs the owner's go; each is a feature)
- [ ] 20. Daily mixed review of due items from every cleared region.
- [ ] 21. Mastery per domain weighted by exam share, as one readiness %.
- [ ] 22. Timed mock exam in the real format (about 90 questions / 90 minutes, PBQ-style items).
- [ ] 23. Bosses ask typed answers by default (choices one click away); the exam is "which is BEST" multiple
  choice. Decide: scenario multiple choice by default in course fights?
- [ ] 24. Test out: take a region boss early to clear its region.
- [ ] 25. Exam date and daily pacing (today's target, on track or not).
- [ ] 26. A drill per region, open any time (Weak spots opens only with the raid).
- [ ] 27. An acronym track (the build already makes acronym cards for Anki).
- [ ] 28. Weight-first or mixed order for Continue.
- [ ] 29. Pre-built question sets in the package and "about N min" estimates.
- [ ] 30. A first-win reward for region bosses; the daily raid on course maps.
