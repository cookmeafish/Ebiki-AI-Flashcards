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
