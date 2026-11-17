# Fight fixes: independent judge (2026-11-16)

Reviewer did not write the code. Judged: the uncommitted diff for the six fixes asked for from raid screenshots in a
Spanish language mode, with fix 6 in its SECOND form (an open "write a sentence" question keeps its word hidden and
shows the prefix hint; nothing names the word).

## How it was checked

- **Diff read** in full (prefixHint.js, questionTier.js, letterCue.js, fightSettings.js, QuizRunner.jsx,
  LearnItPanel.jsx, itemSections.js, taunt.js, fightJudge.js, App.jsx, locales, tests).
- **Real app**, dev server on port 3001, Playwright's bundled Chromium, muted. Every AI host stubbed with canned
  replies (26 calls per run, none real), every non-GET `/api` call stubbed, `/api/feature-data` in memory, a fake Anki
  with 7 due cards. Practice > Daily raid, a full run each time:
  - Spanish (LatAm) mode, desktop 1280 dark and phone 390 light.
  - A variant where the model follows the fight prompt's own "one good model answer in accepted" rule for the open
    question, and its options do not share the hint.
  - A general mode (Security+), desktop dark.
- **Pure helpers** probed with edge cases (full-width parentheses, RTL, elisions, accents, capitals, an article
  option, two blanks, a hint with no blank, a sentence as the accepted answer).
- `npx vitest run`: 261 files, 4097 tests, all pass. `npx vite build`: ok.

Screenshots and logs (scratchpad, not in the repo):
`C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge-fight\`
(`raid2\` both sizes, `raid3\` the sentence variant, `raid4\` general mode, `*.log` the text of every question).

## Verdict per fix

| # | Fix | Verdict | Evidence |
|---|-----|---------|----------|
| 1 | The hint is drawn in the blank ("fu___") | PASS in fights, with gaps in Study | Raid, both sizes and themes: "El descanso es fu___ para rendir bien." (`raid2\desk-dark-q-fundamental-typed.png`, `phone-light-q-fundamental-typed.png`). "fu___" is one untappable token, the sense cue stays muted. A hint with no blank is left alone: "... una luz muy tenue (e…)." and `¿Cómo se dice "dog"? (pe…)`. Full-width parentheses, an elision ("l'e___") and Arabic text come out right. Three Study spots still draw the stored "___ (fu…)" (defect 4). Study itself was not driven. |
| 2 | Learn it panel in sections | PASS | `raid2\desk-dark-learn-fundamental.png`, `phone-light-learn-fundamental.png`: label per line with its icon, Ejemplo in a tinted box, text tappable. Two small flaws (defects 6, 7). |
| 3 | Taunt names the mistake; the note names the accepted answer | PASS on the prompt text only | Both prompts now carry the rule, and the taunt tests pass. Stubbed replies cannot show what a real model writes: NOT VERIFIED on real output. |
| 4 | The hint stays beside choices when every option shares it | PASS | Raid: after "Show choices" the prompt still reads "fu___" over fugitivo / fundamental / fulminante / furibundo (`raid2\*-q-fundamental-choices.png`). When no set shares the letters the question shows no hint in either view (madrugada: "de la ___."), as the choice pool already did. Accents, capitals, elisions and a two-option 50:50 keep it; an option with an article or one that does not share it strips it. One leak path for open questions (defect 2). |
| 5 | A missed open question shows what was wanted | PASS when the accepted answer is the word, FAIL otherwise | "Not quite. The word to use: etérico" (`raid2\desk-dark-fb-OPEN-full.png`, phone too); general mode "A good answer: etérico". With a model sentence as the accepted answer the screen says "The word to use: Una luz etérica llenaba la sala vacía." (`raid3\desk-dark-fb-OPEN-full.png`, defect 1). |
| 6 | An open language question keeps the word hidden and shows the prefix hint; a general one shows none | PASS for the raid's TIER 4 question, FAIL for every other open language question | Spanish raid: "Escribe una frase con el adjetivo que significa «...» para describir una luz muy tenue (e…)." General mode: the same question with no hint, and no hint on any question (`raid4.log`). But the gate was removed for ALL open language questions (defect 1). |

## Defects, most serious first

1. **Every open language question whose accepted answer is a sentence now gets a garbage hint, and the wrong
   label.** `src/features/kit/fightSettings.js:120` (`ensurePrefixHint` lost its `q.open` gate) and
   `src/utils/prefixHint.js:181` (`typedPrompt` lost its `open` gate). QuizRunner calls it for every typed question,
   and these prompts all ask for a SENTENCE or key points in "accepted" with `"open": true`:
   `src/features/legends/prompt.js:67` (`TIER_TYPES`, used by raids and Legends quizzes: "one good model answer in
   accepted"), `:97` (placement exam), `:253` (boss, Legendary), `src/features/listen-speak/prompt.js:25`.
   Seen in the real app (`raid3\desk-dark-fb-OPEN-full.png`):
   "... una luz muy tenue (U… l… e… l… … s… v…) (U… l… e… l… … s… v…)." It shows the first letter of every word of the
   model answer, twice (the hint has 7 tokens, `HINT_RE` at `prefixHint.js:94` reads at most 4, so it is never
   detected, never stripped, and added again on each pass: `raidQuestions.js:40` then QuizRunner), it stays in the
   choices view, and the feedback reads "The word to use: Una luz etérica llenaba la sala vacía."
   (`QuizRunner.jsx:330`). The raid prompt itself contradicts the new TIER 4 text ("the word FIRST") through
   `TIER_TYPES`, so a real model can land here in the owner's own raid.
   Needed: hint an open question only when its first accepted answer is a word or short phrase (and say so in
   `TIER_TYPES`), cap or refuse a hint over 4 tokens, and pick `kit_openWord` only in that same case.

2. **An open question's choices can be beaten by the hint the learner just saw.**
   `src/features/kit/fightChoices.js:19` leaves open questions with the model's own options, and nothing makes them
   share the prefix or sets `noHint`. The typed view shows "(e…)"; with options etérico / sutil / vaporoso / tenue only
   one tile starts with that letter. `choicePromptFor` hides the hint in the choices view, but it was already read.
   This is the "choices never beat the hint" rule, broken for the new case. Before the change open questions had no
   hint, so it could not happen.

3. **In a fight, "Show choices" on a "write a sentence" question is answered by picking a word.** Not new, but now
   more visible: the tiles are single words under a question that asks for a sentence, and after a miss by choice the
   strip says "The word to use: X" (`QuizRunner.jsx:330` uses the open label even when `asChoice`; it should be
   "Correct answer").

4. **Study still draws "___ (fu…)" in three places** (code reading; Study was not driven):
   `src/App.jsx:8808` (the collapsed graded row, plain `{gq}`), `:18237` (the choice flash) and `:18253` (the typed
   flash) render the stored text without `seamlessBlank`.

5. **Stale comments now say the opposite of the code**: `src/utils/questionTier.js:105` ("THE WORD IS NAMED"),
   `src/utils/prefixHint.js:12` ("never an open tier"), `src/features/legends/raidQuestions.js:39` ("never on an open
   question"), and the `fightChoices.test.js:28` title.

6. **Learn it on a phone clips the last section** (`LearnItPanel.jsx:82`, `maxHeight: 300`): at 390 px the Ejemplo
   box is cut mid-line with nothing showing that it scrolls (`raid2\phone-light-learn-fundamental.png`; scroll height
   314 over 300).

7. **Synonyms get no icon** (`src/features/kit/itemSections.js:6`: no role for Sinónimos / Synonyms), so one section
   in five looks different from the rest. Cosmetic.

## Checked and fine

- Locale keys `kit_openWord` / `kit_openModel` exist in en, es, ja, zh; no em dash in any added line.
- `itemSections` moved to `kit/` with its test; both Legends imports updated; tests pass.
- The leak-guard exemptions and `tierNamesAnswer` are gone (grep finds neither).
- The meaning-form choice view still shows its own prompt first (QuizRunner and Study).
- A choice-only question (no accepted answers) strips every hint as before.
- No page errors in any run.

## Not verified

- The Study tab in the running app (seamless question, "Show choices", saved question sets, graded rows, flashes):
  code reading only.
- Legends lessons, boss and Legendary, the placement exam, Listen & Speak: not driven. Defect 1 there is from the
  prompts and the shared QuizRunner path, proven in the raid.
- Real model output for the taunt and the feedback note (fix 3): prompts only.
- Desktop light, phone dark and other zoom levels: only desktop dark and phone light at the default zoom were shot.
- RTL and full-width forms in the app: helper output only.
- The 50:50 power on a hinted question in the app: helper output only (two options sharing the hint keep it).

## Re-check after fixes

Commit 60df716. Same setup as above (port 3001, bundled Chromium, muted, every AI host and every write stubbed, fake
Anki), desktop 1280 dark and phone 390 light. Four drives: a raid whose open question has a SENTENCE as its accepted
answer (`re1-sentence\`), a raid whose open question's word has studied deck words sharing its letters
(`re2-poolword\`, with a long card back), a raid whose open word has none (`re3-mixed-choicemiss\`, answered by a
wrong choice), and a Study session (`re4-study\`). No page errors in any of them. Logs: `re1.log` to `re4.log`.
All paths below are under
`C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge-fight\`.

| # | Finding | Verdict | Evidence |
|---|---------|---------|----------|
| 1 | Sentence answer: garbage hint, wrong label | PASS | Typed view and choices view both read "... para describir una luz muy tenue." with no hint of any kind; the miss reads "A good answer: Una luz etérica llenaba la sala vacía." Desktop `re1-sentence\desk-dark-q-OPEN-typed.png`, `desk-dark-q-OPEN-choices.png`, `desk-dark-fb-OPEN-full.png`; phone `re1-sentence\phone-light-q-OPEN-typed.png`, `phone-light-fb-OPEN-full.png`. The raid prompt's `TIER_TYPES` now carves out the TIER 4 case too. |
| 2 | Open word question: choices against the hint | PASS (with the accepted trade-off) | A set exists: "... «que sirve de base, lo más importante» (fu…)." keeps its hint over fundamental / furibundo / fulminante / fugitivo. Desktop `re2-poolword\desk-dark-q-OPEN-choices.png`, phone `re2-poolword\phone-light-q-OPEN-choices.png`. No set: the typed view keeps "(e…)", the choices view shows the model's options (vaporoso / etérico / tenue / sutil) with the hint taken out. Desktop `re3-mixed-choicemiss\desk-dark-q-OPEN-typed.png` and `desk-dark-choicemiss-OPEN.png`, phone `re3-mixed-choicemiss\phone-light-q-OPEN-typed.png` and `phone-light-choicemiss-OPEN.png`. Both render sensibly. In the second case one tile still starts with the letter the learner just read: that is the trade-off the coordinator decided, not a new defect. |
| 3 | Miss by choice labelled as an open answer | PASS on desktop, not captured on phone | "Not quite. Correct answer: etérico" under the tiles: `re3-mixed-choicemiss\desk-dark-choicemiss-OPEN.png`. On the phone my script picked the wrong tile but its Enter did not submit, so the shot shows the pick, not the feedback (`phone-light-choicemiss-OPEN.png`). Same code path as desktop. |
| 4 | Study still drew "___ (fu…)" in three places | PASS | Driven in the app. Typed flash: "En esta frase falta fu___ para que tenga sentido." (`re4-study\desk-dark-s0-typed-flash.png`, `phone-light-s0-typed-flash.png`). Choice flash: the same (`re4-study\desk-dark-s1-choice-flash.png`, `phone-light-s3-choice-flash.png`). Collapsed graded rows: "fu___" on every row (`re4-study\desk-dark-graded-rows.png`). Also seen: Study's own choices view keeps the hint when all four options share it (`re4-study\desk-dark-s1-choices.png`). Graded rows were not opened on the phone. |
| 5 | Stale comments | PASS | grep finds none of "THE WORD IS NAMED", "never an open tier", "never on an open question", or the old test title; `raidQuestions.js:39` and `prefixHint.js:12` now state the word-only rule. |
| 6 | Learn it clipped on phone | PASS | Long card (scroll height 555 over 300 on phone, 511 over 300 on desktop): a bottom fade while more is below (computed mask is a gradient), none after scrolling to the end (mask `none`), last bullet fully visible. Phone `re2-poolword\phone-light-learn-OPEN.png` and `phone-light-learn-OPEN-end.png`; desktop `re2-poolword\desk-dark-learn-OPEN.png` and `desk-dark-learn-OPEN-end.png`. |
| 7 | Sections without an icon | PASS | 🔗 Sinónimos, 🧩 Género, 🧩 Plural, ⭐ Notas as bullets: the same four screenshots as row 6. |

Still not verified: real model output for the taunt and the note; Legends boss, Legendary, placement and Listen &
Speak in the app (their open questions carry sentences, now covered by row 1's rule through the shared QuizRunner);
desktop light, phone dark and other zoom levels; the phone shot for row 3; graded rows on the phone.

One small thing seen, not part of the seven: in Study's typed and choice flashes the sense cue "(palabra del mazo)"
is drawn in the question's bold weight, while the live question draws it muted and italic. It was like that before
this work.

## Screenshot round 3

Same setup (port 3001, bundled Chromium, muted, AI hosts and every write stubbed). No real sign-in was started:
`/api/chatgpt/start` was aborted in the stub and the Continue link was never clicked. No page errors. All paths are under
`C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge-fight\`.

### A. Settings > AI & cost: the "uses an API key" line, its link, and the ChatGPT plan note (commit 1c2fac2)

Shot: desktop 1280 dark (English), phone 390 light (English), desktop 1280 light (Spanish), and the onboarding provider
step on phone 390 dark. Each run opened all four company tabs, then OpenAI > "ChatGPT plan (sign in)". Files:
`r3-settings\<run>-Anthropic.png`, `-OpenAI.png`, `-Google.png`, `-xAI.png`, `-OpenAI-plan.png`, with `<run>` one of
`desk-dark-en`, `phone-light-en`, `desk-light-es`, `onboarding-phone-dark`. Measurements: `r3-desk.log`, `r3-b.log`,
`r3-c.log`.

| Check | Verdict | Evidence |
|-------|---------|----------|
| The ChatGPT sign-in appears only under OpenAI | PASS | Sign-in block and Continue link count 0 on Anthropic, Gemini and Grok in all four runs, also after the plan option was picked on OpenAI; 1 under OpenAI > ChatGPT plan. |
| Each other company names only itself | PASS | Anthropic: "... Anthropic doesn't let other apps sign in with a Claude plan."; Google: "... (free tier available): Google doesn't let ... a Gemini plan."; xAI: "... xAI has no plan sign-in for other apps." One note per tab, never another company's. |
| The link sits on the row or wraps cleanly, no horizontal scroll on phone | PASS | Desktop: on the same line. Phone: the text wraps to 3 or 4 lines and "Their rules ↗" stays whole on the last line, inside the note's box; horizontal overflow 0 for the note's scroller and the page (`phone-light-en-Google.png`). Spanish desktop Gemini: the link drops to its own second line, cleanly (`desk-light-es-Google.png`). |
| Link href and target | PASS | anthropic `https://code.claude.com/docs/en/legal-and-compliance`, gemini `https://geminicli.com/docs/resources/tos-privacy`, grok `https://docs.x.ai`; all `target="_blank"`, `rel="noopener noreferrer"`. All three answer 200. |
| The amber "not yet tried" line is readable in both themes | PASS | Dark: rgb(242,169,58) on rgb(18,26,33), about 8.6:1 (`desk-dark-en-OpenAI-plan.png`, `onboarding-phone-dark-OpenAI-plan.png`). Light: rgb(156,92,0) on white, about 5.5:1 (`phone-light-en-OpenAI-plan.png`, `desk-light-es-OpenAI-plan.png`). It sits under the Continue button, above "The sign-in stays on this computer". |
| Spanish UI; keys in es, ja, zh | PASS | "Usa una clave de API: Anthropic no deja que ... Sus normas ↗" and "Nuevo: aún no se ha probado con una cuenta real de ChatGPT. ..." render in the Spanish run; `cg_source` and `cg_unverified` exist in en, es, ja and zh. |
| Onboarding provider step | PASS | Same component, same lines and link, sign-in only under OpenAI (phone dark). In `onboarding-phone-dark-xAI.png` the note sits partly behind the step's Back / Next bar at that scroll position; it scrolls clear. |

Notes, not fails:
- The xAI link goes to the docs home (`https://docs.x.ai`, which lands on `/overview`), not to a page that states a
  rule, so "Their rules" promises more than that page shows. The Anthropic and Gemini links go to specific pages.
- I checked that the three pages answer, not what they say.
- In Spanish the option reads "ChatGPT plan (iniciar sesión)" beside "Clave de API": half English.

### B. The two phone shots missed in the re-check

| Item | Verdict | Evidence |
|------|---------|----------|
| Miss BY CHOICE on an open question, phone | PASS | Wrong tile picked, Check clicked: "Not quite. Correct answer: etérico", the right tile in green. `r3-choicemiss\phone-light-choicemiss-OPEN.png`, `r3-raid.log`. |
| Collapsed graded rows in Study, phone | PASS | Rows read "✗ En esta frase falta fu___ p..." and "✓ En esta frase falta fu___ ..." (a card with no hint shows "___"). `r3-study\phone-light-graded-rows.png`, `r3-study.log`. |

One thing seen there, outside this round: in that phone shot the graded card's header row is cut at both ends (the
card's word on the left and the rating picker on the right are out of view). I did not check whether it scrolls or is
clipped, or whether my script's click caused it.

Not verified: what the three linked pages say; the ja and zh screens (keys only); a real ChatGPT sign-in (by
instruction, never started); other zoom levels.

## Always-on note check

Commit 8185361. Same stubbed raid (port 3001, bundled Chromium, muted, every AI host stubbed and recorded, writes
stubbed), Spanish (LatAm) mode, desktop 1280 dark. `/api/config` was served with `"factCheck": false`. In each run the
first question ("El descanso es fu___ para rendir bien.") got the typed answer "zzz": no local match, so the AI grader
ran (verdict stub: a miss). The note stub's first note holds a false claim on purpose ("viene del griego antiguo y
significa trivial"); its rewrite starts "REESCRITA:". Calls were labelled by their system prompt and listed in the
order they reached the stub. Script `notecheck.mjs`, logs `r4.log` and `r4b.log`, screenshots in `r4-notecheck\`, all
under `C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge-fight\`.

Two other calls run in parallel in every raid run and are not part of the note path: the background re-check ("You
are a careful, fair second grader...") and the boss taunt. They show up between the note call and the first check.

| Run | Fact-check stub | Calls after the answer, in order | On screen | Verdict |
|-----|-----------------|----------------------------------|-----------|---------|
| A | `{"mistakes": []}` | verdict, note, (re-check), (taunt), fact check | "Not quite. Correct answer: fundamental" and the note | PASS: one check, with the setting off; the note shows. `r4-notecheck\run-A-feedback.png` |
| B | flags a quote copied from the note the first time, then none | verdict, note, (re-check), (taunt), fact check, note again with "FALSE claims" in its user prompt, fact check | the answer line and the REWRITTEN note ("REESCRITA: ..."); the first note never appears | PASS. `r4-notecheck\run-B-feedback.png` |
| C | always flags | verdict, note, (re-check), (taunt), fact check, rewrite note ("FALSE claims"), fact check | "Not quite. Correct answer: fundamental" with no note text | PASS: two checks, then no note; the answer line stays. `r4-notecheck\run-C-feedback.png` |
| D (extra) | as A, but the check's reply held 6 s | verdict, note, (re-check), (taunt), fact check | at 3.5 s: the answer line and "Ebi is writing a short explanation..."; after the check: the note | PASS: the note is not on screen before its check answers. `r4-notecheck\run-D-while-checking.png`, `run-D-feedback.png` |

Control, the setting still governs other replies (Chat tab, one typed message, a stubbed 50-word teaching reply):

| Config | Calls after sending | Fact-check calls | Verdict |
|--------|---------------------|------------------|---------|
| `factCheck: false` | chat reply, pose pick | 0 | PASS. `r4-notecheck\chat-factcheck-false.png` |
| `factCheck: true` (shows the stub would catch one) | chat reply, pose pick, fact check | 1 | PASS. `r4-notecheck\chat-factcheck-true.png` |

No page errors in any run. No fails.

Not verified: a glancing answer's note and its follow-up attack through this path; the same check in a Legends boss
fight (same `judgeStrike` code, not driven); a fact check that throws or times out (the code keeps the note; not
exercised); phone width (nothing in this change is layout). The boss taunt is not fact checked, which this change does
not claim.

## Joint note and taunt check

Commits 9131586 (one fact check per miss, `kit/missCheck.js`) and 55d697c (a checked taunt may still show one
question late, `LATE_TAUNT_QUESTIONS` 1). Same stubbed raid (port 3001, bundled Chromium, muted, every AI host stubbed
and recorded in order with arrival and answer times, writes stubbed), Spanish (LatAm), desktop 1280 dark,
`"factCheck": false` served in config. Scripts `joint.mjs`, `late.mjs`, `leakcount.mjs`; logs `r5.log`, `r5b.log`,
`r6-*.log`; screenshots in `r5-joint\` and `r6-late\`; all under
`C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge-fight\`.

### Runs A to E (stub delays: verdict 0.3 s, taunt 0.8 s, note 1.5 s, fact check 1.2 s)

Times are from the typed answer. The background re-check ("careful, fair second grader") also runs on every typed
miss; it is left out below. Run A's first attempt was reset when 55d697c changed FightExtras.jsx and the dev server
reloaded it; A and C-500 were run again on the settled code (`r5b.log`).

| Run | Stub | Requests in order (sent → answered) | On screen | Verdict |
|-----|------|-------------------------------------|-----------|---------|
| A | check clean | verdict 0.01 → 0.33; note 0.33 → 1.84; taunt 0.33 → 1.15; ONE check (note + taunt in its reply) 1.85 → 3.05 | note and taunt both at 3.08 s | PASS (`r5-joint\run-A.png`) |
| B | first check flags a quote from the TAUNT only, second clean | verdict; note; taunt; joint check 1.84 → 3.05; taunt rewrite ("FALSE claims" in its user prompt) 3.06 → 3.86; taunt-only check 3.86 → 5.07 | note at 3.07 s (unchanged), rewritten taunt at 5.10 s; the first taunt never showed | PASS (`run-B.png`) |
| C-unreadable | the check answers prose ("Sorry, I cannot check this right now.") | verdict; note; taunt; joint check 1.85 → 3.06 | at 3.08 s: no note, the boss's generic line ("Tick, tock: that reply ran two minutes slow..."), "Correct answer: fundamental" | PASS (`run-C-unreadable.png`) |
| C-500 | the check answers HTTP 500 | verdict; note; taunt; joint check 1.84 → 500; the same check sent again by the provider layer at 3.06 → 500 | at 4.29 s: no note, the generic line, the answer line | PASS (`run-C-500.png`). A hang was not tested: the request timeout is 5 minutes (`CALL_TIMEOUT_MS`), so a 500 and unreadable text stood in. |
| D | miss BY CHOICE | taunt 0.52 → 1.32; taunt-only check 1.33 → 2.54; no verdict or note call | taunt at 2.55 s, answer line, no note | PASS (`run-A-choice.png`) |
| E | as A, Continue 1 s after the answer | as A; Continue at 1.04 s; joint check answered 3.05 | the checked taunt appears at 3.06 s on the NEXT question ("... donde iba «fundamental» ..." over the furibundo question), not the answer of the question on screen | PASS (`run-A-fast.png`) |

**Taunt delay.** Before 9131586 the bubble appeared when the taunt reply arrived (no check in `tauntStore.js`). Now it
appears after the joint check: with the delays above the taunt reply arrived at 1.15 s and the bubble at 3.08 s, 1.9 s
later (0.7 s waiting for the note, then 1.2 s for the check). With the realistic delays below (taunt 1.5 s, note 3 s,
check 2 s) that wait is about 3.5 s (note minus taunt, plus the check). This is computed from the request times, not
measured as one interval.

### Dropped taunts, before and after 55d697c

Stub delays: verdict 0.3 s, taunt 1.5 s, note 3 s, fact check 2 s. The learner presses Continue 1 s after the feedback
and answers the next question 2 s after it shows. 10 typed misses per run (extra test cards so the raid lasts; a fight
that ends is fought again). "Before" = 9131586's rule, reproduced by serving FightExtras.jsx with
`LATE_TAUNT_QUESTIONS = 0` through the browser route only (the run logs "rule rewritten in the served module: true"; no
repo file changed). Pattern "alternate": a miss, then a right answer, then a miss...

| Pattern | Rule | Taunts shown | Dropped | Generic lines | Shown during a question naming ITS answer |
|---------|------|--------------|---------|---------------|-------------------------------------------|
| 10 misses in a row | before | 2 | 8 | 0 | 0 |
| 10 misses in a row | after | 2 | 8 | 0 | 0 |
| miss / right, 10 misses | before | 1 | 9 | 0 | 0 |
| miss / right, 10 misses | after | 2 | 8 | 0 | 0 |

In every run the lines shown were the last miss of a fight (nothing came after it), plus, after 55d697c in the
alternating pattern, one late line on the next question ("T10 ... «furtivo»" over a question whose answer is
"fusionar": no giveaway). At this pace a checked taunt is ready about 5.3 s after its miss, and by then the learner has
either missed again (a newer miss's line wins, by design) or moved two questions on. The late rule only adds a line
when the learner spends about 4 s or more on the next question. So it is correct, but at this pace it brings back about
one line in ten.

### Defect found: the next question's answer is drawn when Continue is pressed

`src/features/kit/QuizRunner.jsx:122-129` resets `phase` to `'answer'` in a `useEffect` on `idx`. So the commit that
shows the new question still has `phase === 'feedback'`, and the feedback strip renders `reveal`, which is the NEW
question's `accepted[0]`, plus the old verdict. A requestAnimationFrame watcher saw that state on screen after every
Continue that follows a miss: 8 of 8 such Continues in the all-miss runs, 9 in the alternating runs, before and after
55d697c alike. Example from `r6-after-all-miss.log`: at 3446 ms "Correct answer: furibundo" sits under the new question
"El jefe salió fu___ de la reunión.", which the learner only answered at 5.8 s. It lasts one frame (about 16 ms at
60 Hz, less on fast screens). The screen-reader live region (`data-quiz-announce`) is computed from the same state, so
it may also announce the new answer. This predates every fix in this review and affects every QuizRunner quiz (raids,
Legends lessons, boss and Legendary fights).
Fix: reset the phase in the same update that changes `idx` (inside `next()`), or derive the feedback from a per-index
record so a new index can never show an old verdict.

### Verdict

Joint check, rewrite, fail-closed and choice-miss paths: PASS. The late-taunt rule: works as written (no line ever
showed over a question it could give away), but at realistic pace it brings back one line in ten. Defect: the next
question's answer is painted for one frame on Continue (above).

Not verified: a check that hangs until the 5-minute timeout; a glancing answer's note and attack through the joint
check; Legends boss fights (same code, not driven); phone width.
