# Judge 2: "Ebi's models" card and the fact check, after fixes (2026-11-15)

Second independent judge, did not build it. Plan: [[../plans/2026-11-15-model-plan-settings]]. First verdict:
[[2026-11-15-model-plan-judge]].

**How it was walked**: agent server on 3001, Playwright's bundled Chromium (`--mute-audio`), the owner's REAL config
read-only (every non-GET `/api` answered 204, every provider host answered locally; nothing saved, nothing spent; no key
printed). The owner has only an Anthropic key, so the OpenAI and Google tabs were walked twice: as the owner has them
(no key) and with fake keys injected into the `/api/keys` answer so their model lists load (OpenAI: the owner's saved
71-id list; Google: 7 Gemini ids). Desktop 1280x900 light and dark, phone 390x844 dark and light, app zoom 1.35 and 2.0.
Walked: default, Update, close and reopen Settings (the "Last update" panel), Undo, a task pick, "Other model" with a
made-up id (`claude-sparkle-9-turbo`), reset, Tab through the card, a pick under "Choose a model per feature", the
OpenAI and Google tabs, a rate-limited Update (every call answered 429, requests counted), a failed model list, the
automatic update (daily stamp removed, toast polled and timed), "Set price", the fact-check checkbox, and Chat with a
stubbed mistake (on, desktop and phone) and with the check off. Unit tests: modelPlan, factCheck, aiJobs, i18n: 102/102.

Screenshots: `C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge2-mp\shots\`
(file names below). Script: `...\judge2-mp\judge2.mjs`, logs `...\judge2-mp\log-*.txt`.

## The first judge's defects, re-checked

| # | Defect (first judge) | Now | Reason | Screenshot |
|---|---|---|---|---|
| 1 | A row names only its first job's model | PASS | The row names the model most of its jobs run on and adds "Also Claude Sonnet 5.5 for: Roleplay scorecard", "Also Claude Haiku 5.5 for: Exercise check". What runs where is now true. (The "what changed" list still compares only each task's main model: Talking's Feedback chat moved Haiku → Sonnet and is not listed.) | `desk-light-1-default-p1.png`, `desk-light-3-after-update-p0.png` |
| 2 | One provider's "What changed" shown on another | PASS | After an Anthropic Update, the OpenAI and Google cards show no changes list. | `tabs-keys-OpenAI-p0.png`, `tabs-keys-Google-p0.png` |
| 3 | A per-feature (role) pick contradicts the task picker | PASS | Badge "Your pick (per feature)", the picker's first option reads "Your pick per feature", a line says where to change it; a task pick on top shows Your pick and ↺. | `rolepick-talk-row.png`, `rolepick-talk-row-taskpick.png` |
| 4 | Auto update toast points to nothing, no buttons, vanishes | FAIL | Fixed half: Settings now shows "Last update: what changed" with Undo after an automatic update. Still: the toast has only × (no "See what changed", no "Undo" as the design says) and was gone after about 4 s. | `auto-toast.png`, `auto-card-p0.png` |
| 5 | "Newer models came out" while rows already run the newest | PASS | Default now reads "This plan is older than the models it runs on: Ebi already moved each task to the newer version…". True, though three lines long. | `desk-light-1-default-p0.png` |
| 6 | Undo stamps today's date | PASS | After Undo: "Planned Sep 27, 2026". | `desk-light-4-after-undo-p0.png` |
| 7 | Costs between 0.5 and 1 cent clamped | PASS | "about 0.6 cents per use", "about 0.4 cents per use". But see new defect N1 (the Update estimate sentence). | `desk-light-3-after-update-p1.png` |
| 8 | OpenAI: identical names, arbitrary levels, 71 entries | FAIL | Duplicates gone (36 distinct names). Levels still arbitrary: "GPT 4 · Best" (a 2023 model), "GPT 5 Mini", "GPT 5.5 Pro", "GPT 3.5 Turbo", Codex models have no level at all; Codex and Pro models are offered for "Talking with Ebi". | `tabs-keys-OpenAI-p0.png`, log `log-tabs.txt` |
| 9 | Rate-limited Update keeps sending, lumped message | PASS | 7 requests then a plain "Anthropic (Claude) says too many requests right now, so the update stopped… Your current models stay." (the hint says about 9 calls). A second click: 7 more. Still 6 more requests than needed into a rate limit (the failover tries other models), minor. | `rate.png` |
| 10 | Stale saved model list before the first Update | PASS | The card reads the list on open: Haiku 5.5, Sonnet 5.5, Opus 5.5 are offered at once. | log `log-desk.txt` |
| 11 | Level word contradicts the "why" | PASS | "What matters here: …" plus a level; Fable 5.2 (no preset family) shows no level instead of a wrong one. | `desk-light-1-default-p0.png` |
| 12 | No measured cost or daily total, and nothing says so | PASS | "Costs below use typical sizes until Ebi has seen your own use for a while; it counts from now on." The measured path itself was not seen: the running 3001 server started before `usageMerge` was committed, so `logs/token-usage.json` still has no `byJob`/`byDay`. | `desk-light-1-default-p0.png` |
| 13 | Four overlapping model controls | FAIL | Still four (preset tiles, this card, "Choose a model per feature", "Models per job"); one dense hint paragraph at the bottom of the card explains the order. The design's "Show every task (advanced)" inside the card was not built. A task pick flips the preset tile to "Custom". | `desk-light-1-default-p3.png` |
| 14 | No vision-only list; a typo id accepted silently | FAIL | Fixed half: a made-up id now warns "\"claude-sparkle-9-turbo\" is not in this provider's model list…". Not fixed: "Reading pictures" and "Talking with Ebi" on OpenAI offer GPT 3.5 Turbo, O1/O3 Mini and Codex models (text only); the filter only knows xAI's text-only presets. | `desk-light-6-other-done.png`, log `log-tabs.txt` |
| 15 | Phone: option cut, long rows | FAIL | "Recommended" no longer cut, but a chosen model is ("Claude Sparkle 9 T…" beside ↺). The card is still 291 px wide inside the modal, rows run 8 to 10 lines. | `phone-dark-6-other-done.png`, `phone-dark-1-default-p1.png` |
| 16 | Screen reader never hears the model id | FAIL | The id moved to `aria-label` on a plain `<span>`; ARIA does not allow a name on a generic element and screen readers in reading mode ignore it, so the id is still not reliably heard. | code `ModelPlanCard.jsx` TaskRow |
| 17 | "cheap" wording; raw ids in preset tiles | FAIL | Unchanged above the card: "Cheap models for simple tasks…", "Balanced and fast (claude-sonnet-5-5)". | `desk-light-2-updating.png` |
| 18 | Lowercase "choosing…" beside the old level and cost | FAIL | Unchanged: "choosing…" next to "Basic" and "about 1 cent per 24 uses" during Update. | `desk-light-2-updating.png` |

## Part A

| Item | Verdict | Reason | Screenshot |
|---|---|---|---|
| A1 Status line first | PASS | Status line, then an info (never red) notice; "Newer models came out since this plan: …" on OpenAI; "never planned" wording on Google. Minor: with the model list failing, the notice says "older than the models it runs on" instead of "Could not check for newer models" (a saved list stands in for the failed read); on OpenAI it calls GPT 4 Turbo "newer" than GPT 3.5 Turbo while GPT 5.5 exists. | `desk-light-1-default-p0.png`, `tabs-keys-OpenAI-p0.png`, `faillist-p0.png` |
| A2 Tasks, not 60 jobs | FAIL | 10 plain rows with purpose, when, true model(s), level, what matters, cost: good. "Show every task (advanced)" not built; four model controls on one page (defect 13). | `desk-light-1-default-p0.png`..`p3.png` |
| A3 Honest cost per use | FAIL | Typical costs are labelled and decimals honest; the "no data yet" line is there. But "Set price" only scrolls to Token usage, whose list holds only models already used: for Gemini 3.8 Flash (or any new or typed model) there is no row to price, so "Set price" is a dead end. On Google 9 of 10 rows say "price not known". Measured cost and the daily total not seen (no data recorded, see defect 12). | `extra-desk-setprice.png`, `tabs-keys-Google-p0.png` |
| A4 Pickers for every provider | FAIL | Recommended + models + "Other model…" with focus moving into the box, a pick sets the whole task, ↺ resets: work on Anthropic, OpenAI, Google. But options no longer carry a cost per use (design: "so two models compare in place"; only name and level remain), and Pictures/Chat are not vision-filtered outside xAI. ChatGPT plan not walked (owner has none). | `desk-light-5-pick-row.png`, log `log-desk.txt` |
| A5 Update to the newest models | FAIL | Works: forced re-plan, plain progress, changes per task, kept hand picks, Undo, rate-limit and list-failure messages each on their own, the panel stays after closing and reopening Settings. Fails: the cost sentence reads "Uses about 9 AI calls on your strongest model, about about 16 cents per use in all" (a per-use string inside "about {cost} in all"), the same in es/ja/zh. | `desk-light-3-after-update-p0.png`, `desk-light-3b-reopen.png`, `rate.png` |
| A6 Runs by itself | FAIL | Runs once (stamp), honors the offline copy now (`dataOffline` in the guard), the card shows the changes and Undo afterwards. The toast has no "See what changed" or "Undo" and lasts about 4 s. | `auto-toast.png`, `auto-card-p0.png` |
| A7 Saved safely | PASS (code and tests) | Saved under the run's provider, refuses a newer `decidedAt`, Undo keeps the old date; `modelPlan.test.js` green. Two computers not simulated; persistence across a reload not testable with writes refused. | n/a |
| A8 Phone, keyboard, screen reader | FAIL | No sideways scroll at 390 x 1.35 or 1280 x 2.0; pickers and ↺ named with the task; Tab order status → Update → (Undo) → fact check → each row → out. Fails: card 291 px on phone, chosen value cut, id in a generic span's `aria-label`, focus ring on selects is a faint border. At 390 px and zoom 2.0 the settings content scrolls sideways (modal-wide, not this card alone). | `phone-dark-6-other-done.png`, `desk-light-9-focus.png`, `extra-phone-zoom2.png` |
| A9 Not built, and why | PASS (code) | Copying picks not built, as written. The "Last answered by …" line exists in code; not seen, no `byJob` data. | code |

## Part B

| Item | Verdict | Reason | Screenshot |
|---|---|---|---|
| B1 What it checks | PASS | One background call on job `factcheck.reply` (own row and picker), quote must be in the reply, style-only fixes dropped, `maxTokens` 500, silent on failure; unit tests green. | `fc-on-desk-chat.png` |
| B2 Where the note lands | PASS (Chat), not walked elsewhere | Chat: "Ebi double-checked this:" under THAT reply, desktop and phone; the next request to the model does not contain the note. Deviations from the design: notes are keyed by reply TEXT (not chat id + index) and stay after a newer reply (harmless; the design said dropped). Voice and Learn it read in code only; grading not wired (stated in B5). | `fc-on-desk-chat.png`, `fc-on-phone-chat2.png` |
| B3 The setting | PASS | Real checkbox, ON by default, its cost in the text, "Off: replies are not checked, so a slip can stay on screen." The model is in its own task row, not beside the checkbox. | `extra-desk-fc-off.png`, `desk-light-1-default-p0.png` |
| B4 Proof on the real provider | NOT VERIFIED | Would spend the owner's credits; the builder's 9/11 and 10/11 numbers were not re-run. | n/a |
| B5 Built so far, in the app | PASS | ON: 1 check, 1 note (desktop light, phone dark); OFF: 0 checks, 0 notes. | `fc-on-desk-chat.png` |

## The owner's words

| Quote | Verdict | Reason |
|---|---|---|
| "make sure it's configurable in the AI settings" | PASS | Every task has a working picker in Settings > AI & cost, plus Update, Undo and reset. |
| "make it obvious what each one is for in the app" | PASS | Each row says what the task is, when it runs, which model(s) really run it ("Also … for: …"), what matters and the cost. Some job names in "Also" lines are app jargon ("Exercise check", "Feedback chat"). |
| "it can be any ai provider" | FAIL | Picking works on OpenAI and Google, but: Google shows "price not known" on 9 of 10 rows and "Set price" cannot price them; OpenAI levels are arbitrary and text-only models are offered for pictures; the OpenAI notice calls GPT 4 Turbo "newer". |

## Can a non-technical user tell what each model does and change it?

Mostly yes on Anthropic now. Each row says in plain words what the task is, when it runs, which model runs it (and
which other model handles part of it), why the level matters, and about what it costs; the picker changes it and ↺
undoes it; Update shows what changed and Undo puts it back. Where they still get lost: four model controls on one page
explained only in small print, a garbled cost sentence under the Update button, a toast that disappears before it can be
read, and on other providers costs they cannot fill in and level words that do not track how good a model is.

## Every remaining defect, most serious first

1. "Set price" is a dead end for any model not yet used (all current Gemini models, typed ids): the Token usage list it scrolls to has no row for them. (A3)
2. Update cost sentence broken in all four locales: "about about 16 cents per use in all" (`mp_updateHint` gets a per-use string). (A5, N1)
3. Automatic update toast: no "See what changed" / "Undo", gone in about 4 s. (A6, defect 4)
4. Picker options lost their cost per use, so two models cannot be compared in place. (A4)
5. No vision filter outside xAI: GPT 3.5 Turbo, O1/O3 Mini, Codex offered for "Reading pictures" and "Talking with Ebi". (A4, defect 14)
6. OpenAI levels arbitrary ("GPT 4 · Best", most 5.x models no level) and Codex/Pro models offered for chat tasks. (defect 8)
7. Four overlapping model controls; "Show every task (advanced)" not built. (A2, defect 13)
8. OpenAI status names GPT 4 Turbo as "newer" than GPT 3.5 Turbo; with a failed list the notice never says "Could not check". (A1)
9. The "what changed" list ignores a task's secondary jobs (Feedback chat Haiku → Sonnet not listed).
10. Phone: card 291 px, chosen model cut beside ↺, rows 8 to 10 lines; settings content scrolls sideways at 390 px and zoom 2.0. (defect 15, A8)
11. Model id in `aria-label` on a generic span: not reliably read. (defect 16)
12. "choosing…" lowercase beside the old level and cost during Update. (defect 18)
13. Preset tiles above still say "Cheap models…" and show raw ids. (defect 17)
14. A rate-limited Update still sends 7 requests (failover into an account-wide limit). (defect 9, minor)

## Not verified
ChatGPT plan; two computers saving at once; persistence of the "Last update" panel across a reload (all writes refused
by design of this walk); measured cost, daily total and "Last answered by" (the running dev server predates per-job
recording, so no data exists); the fact check in voice mode and Learn it (code read only); B4 on the real provider.
Side note: `logs/token-usage.json` gained about 100 calls during this walk from some other client of the 3001 server
(this harness refused every `/api` write), so another session is spending on the shared server.
