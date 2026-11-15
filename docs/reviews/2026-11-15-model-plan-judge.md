# Judge: "Ebi's models" card (Settings > AI & cost), 2026-11-15

Independent judge, did not build it. Plan: [[../plans/2026-11-15-model-plan-settings]] Part A (Part B judged as not
present; a fact-check row appeared mid-review, see the note at the end).

**How it was walked**: the agent server on 3001, Playwright's bundled Chromium (`--mute-audio`), the owner's REAL
config read-only (every non-GET `/api` answered 204, every provider host answered locally; nothing saved, nothing
spent). Desktop 1280x900 light and dark, phone 390x844 dark and light, default zoom 1.35. Walked: default state, Update,
Undo, a pick per task, "Other model", Your pick, reset, Tab through the card, OpenAI and Google tabs, the automatic
update without the daily stamp (toast polled), a role pick from "Choose a model per feature", a failed model list and
a rate-limited decision. The main walk was run twice: once before and once after the builder's 14:10 edits; every
defect below is present in the second (current) run.

Screenshots: `C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge-mp\shots\`
(first run) and `...\judge-mp\shots2\` (current code). Script: `...\judge-mp\judge.mjs`. Names below are file names in
those folders.

## Verdict per item

| Item | Verdict | Reason | Screenshot |
|---|---|---|---|
| Owner: "configurable in the AI settings" | PASS | Every task has a picker in Settings > AI & cost; a pick sets the whole task; Your pick + ↺ reset work; "Other model" takes a typed id and focus moves into the box. | `desk-light-5-pick-row.png`, `desk-light-6-other-done.png`, `desk-light-8-reset-row.png` |
| Owner: "make it obvious what each one is for" | FAIL | The task names and "when" lines are clear, but the model a row names is only its FIRST job's model. On the owner's current plan "Explaining a card" says Claude Haiku 5.5 while Picture explain and word study run on the picture model (Sonnet); "Talking with Ebi" lists Help and photo chat, which run on other roles; "Reading pictures" says Sonnet while the word list runs on the cheap preset; "Setting things up" says Sonnet while Discover runs on Haiku. The row tells the user something untrue about what runs where. And the "why" text is fixed per task, so it contradicts the level ("Basic: explanations you will remember must be right and clear"). | `desk-light-1-default-p0.png` |
| Owner: "it can be any AI provider" | FAIL | OpenAI: 71 options, several with the SAME visible name ("GPT 3.5 Turbo" x3, "GPT 4" x2, "GPT 4 Turbo" x2) at different prices, so two cannot be told apart; levels are arbitrary (GPT 3.5 Turbo "Standard", GPT 4.1 "Best", GPT 4 Turbo "Standard"). Google: one model for every task, "Standard", "price not known" on every row. Worst: switching the provider tab keeps the ANTHROPIC "What changed: Claude Haiku 5.5 → Claude Sonnet 5.5" list on the OpenAI and Google cards. | `shots2/desk-light-10-OpenAI-p0.png`, `shots2/desk-light-10-Google-p0.png`, `phone-dark-10-OpenAI-p0.png` |
| A1 Status line first | FAIL | Line and info colour are right, and a failed list says so. But on the owner's default state it says "Newer models came out since this plan" while every row ALREADY shows the 5.5 models (the app lifted them); a user is told to update to what they already have. After Undo the restored September plan reads "Planned Nov 15, 2026" (`undoReplan` stamps `decidedAt: Date.now()`), so the date lies. | `desk-light-1-default-p0.png`, `desk-light-4-after-undo-p0.png` |
| A2 Tasks, not 60 jobs | FAIL | 9 plain task rows with name, when, model name, level, cost: good. Fails: the row's model is not what the task's jobs run on (see above); the "why" line does not follow the level; "Show every task (advanced)" is not there: the hint points to "Models per job below", and a THIRD overlapping picker set ("Choose a model per feature", per role) sits between them, plus the preset tiles above. Four places pick models on one page. | `desk-light-1-default-p2.png`, `desk-light-2-updating.png` |
| A3 Honest cost per use | FAIL | No usage is recorded per job yet, so every row is "(typical)" and the daily total line never shows (owner has 750+ past calls, none usable); this part could not be seen working. "Price not known" is text pointing to Token usage, not a Set price action. Numbers are wrong between 0.5 and 1 cent: `costWords` clamps to "1 cent per 2 uses", so Sonnet 5.5 for Talking (0.85 cents) and Haiku 4.5 for Writing cards (0.7 cents) both read "about 1 cent per 2 uses", understating by 30 to 40%. | `desk-light-1-default-p0.png`, options text in the log |
| A4 Pickers for every provider | FAIL | Recommended + models + Other model, each option with name, level, cost: present. Fails: no vision-only list for Pictures and Chat (same list everywhere); before the first Update the list is the stale saved one (Haiku 4.5, Sonnet 5, Opus 5, Opus 5.1), so Sonnet 5.5 and Haiku 5.5 cannot be picked for Writing cards without typing; duplicate OpenAI names; a role picked in "Choose a model per feature" shows in the row (Opus 5) while the picker says "Recommended", no Your pick, no ↺, and choosing Recommended changes nothing. On the phone the chosen option is cut mid-label ("Claude Opus 4.6 · |"). ChatGPT plan not walked (owner has none). | `rolepick-talk-after-role-pick.png`, `shots2/phone-dark-6-other-done.png` |
| A5 Update to the newest models | FAIL (partly works) | Works: forced re-plan, "Choosing a model for each task…", What changed list per task, Undo, hand picks kept and named, list failure has its own plain message. Fails: the cost line is a fixed "up to 18 AI calls, usually a few cents", not computed; a rate-limited decision is lumped as "no reply, no credit left, or too many requests" (design: each reason on its own) and the run kept going: 27 requests went out on a 429 (more than the "up to 18" it promised); the result list survives a provider switch (above). | `desk-light-3-after-update-p0.png`, `faildecide-p0.png` |
| A6 Runs by itself | FAIL | It does run once a day and stamps itself. The toast says "Ebi moved to newer models. See what changed in Settings > AI & cost." but Settings shows NO what-changed list after an automatic update (only Undo), so the toast points to nothing. No "See what changed" or "Undo" button on the toast; it vanishes in under 8 s. It fires on any saved plan, even one identical to the old. The offline-copy guard named in the design is not in the condition (only the data-folder switch). | `auto2-toast-seen.png`, `auto-card-p0.png` |
| A7 Saved safely | PASS (not end to end) | Code saves under the run's provider, refuses a newer `decidedAt`, `freshenPlanId` leaves hand picks; `modelPlan.test.js` 16/16 green. Two computers were not simulated. | n/a |
| A8 Phone, keyboard, screen reader | PASS with defects | No sideways scroll at 390 (card and page), facts stack, pickers and ↺ labelled with the task name, Tab order status → Update → Undo → each row → out, visible focus ring, ↺ 43 px. Defects: the model id lives only in `data-tip` on a span with no role or label, so a screen reader never hears it; a focused tip stays open over the next row's text; the phone card is only 290 px wide inside the modal so every row is 6 to 8 lines. | `desk-light-9-focus.png`, `phone-dark-1-default-p0.png`, `shots2/phone-dark-10-Google-p0.png` |
| A9 Not built, and why | FAIL | Copying picks to another provider: correctly not built. But the stated replacement ("the cost line names the model that really answered when it differs", from `byJob` last model) is not in the card: nothing shows a silent swap. | code: `ModelPlanCard.jsx` `costLine` |

## Can a non-technical user tell what each model does and change it?

Partly. They can read what each task is for and change it: the pickers work and Your pick / ↺ are clear. They cannot
trust what they read: the model shown for several tasks is not the one doing all of that task, the level word can
contradict the reason next to it, the status tells them to update to models they already have, the date is wrong after
Undo, costs between half a cent and a cent are understated, and after looking at another provider they see Anthropic's
changes listed under OpenAI. With four overlapping model pickers on one page (preset tiles, this card, per feature, per
job), a newcomer cannot tell which one wins.

## Every defect, most serious first

1. A task row names only its first job's model; other jobs in the same task run on other models (owner's current plan: Explaining a card, Talking with Ebi, Reading pictures, Setting things up). The card misreports what runs where, its central promise.
2. The "What changed" result of one provider stays on screen after switching to another provider (Anthropic changes shown on the OpenAI and Google cards).
3. A role pick from "Choose a model per feature" changes a row's model while the picker says "Recommended", with no Your pick and no reset; choosing Recommended does nothing. The two pickers contradict each other.
4. The automatic update's toast sends the user to a "what changed" that Settings never shows; no Undo or See button on the toast; it vanishes in seconds.
5. "Newer models came out since this plan" on the owner's default state while every row already shows the newest family.
6. Undo stamps today's date on the restored old plan ("Planned Nov 15, 2026").
7. Cost words clamp everything between 0.5 and 1 cent to "1 cent per 2 uses" (30 to 40% low on the owner's Sonnet rows).
8. OpenAI options: identical visible names for different models at different prices; arbitrary levels; 71 entries.
9. A rate-limited Update keeps sending (27 requests vs "up to 18"), and its message lumps three causes together; the cost hint is a fixed sentence, not an estimate.
10. Before the first Update the pickers offer the stale saved list (no Sonnet 5.5 or Haiku 5.5 for most tasks).
11. Level words do not fit the reason line ("Basic: … must be right and clear"); Fable 5.2, the most expensive model listed, is "Standard".
12. No daily total and no "measured" cost appear for the owner yet (no per-job or per-day usage recorded); the honest-cost feature is invisible until data builds up, and nothing says so.
13. Four overlapping model controls on one page; the card's advanced hint names only one of the other two.
14. No vision-only list for Pictures and Chat; a typed "Other model" id is never checked, so a typo shows as "Your pick" with level "Standard".
15. Phone: the chosen option is cut mid-label; rows run 6 to 8 lines in a 290 px card.
16. Screen reader: the model id is only in a tooltip attribute; a focused tooltip stays over the next row.
17. Wording mixes "cheap" ("a cheap model would miss", the preset tile "Cheap models for simple tasks") with the card's rule of never saying "cheap"; the preset tiles above still show raw ids ("claude-sonnet-5-5").
18. "choosing…" appears lowercase in the model slot during Update, beside a level and cost that are still the old model's.

## Not verified
ChatGPT plan (no plan on this computer), two computers saving at once, real provider replies (everything was stubbed),
the measured-cost and daily-total paths (no recorded data). Mid-review the builder added a "Double-check Ebi's
explanations" checkbox and task row (Part B); it was not judged.
