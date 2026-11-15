# Judge 3: "Ebi's models" card and the fact check, after the second round of fixes (2026-11-15)

Third independent judge, did not build it. Plan: [[../plans/2026-11-15-model-plan-settings]]. Earlier verdicts:
[[2026-11-15-model-plan-judge]], [[2026-11-15-model-plan-judge2]].

**How it was walked**: agent server on 3001 (page reloaded per run, so current code), Playwright's bundled Chromium
(`--mute-audio`), the owner's REAL config read-only: every non-GET `/api` answered 204; the inline "Set price" POST to
`/api/usage` was answered by the harness with a fake reply (the real file never written); every provider host answered
locally; nothing spent; no key printed. OpenAI and Google walked with fake keys injected into the `/api/keys` answer
(OpenAI: the owner's saved 71-id list; Google: 7 Gemini ids). ChatGPT plan walked with a stubbed signed-in status. The
measured cost path walked with fake per-job and per-day usage injected into the `/api/usage` GET answer (the real file
still has no `byJob`/`byDay`). Desktop 1280x900 light and dark, phone 390x844 dark and light, app zoom 1.35 and 2.0.
Unit tests: modelPlan, factCheck, aiJobs, locales, templateKeys: 99/99.

Screenshots: `C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge3-mp\shots\`
Script `...\judge3-mp\judge3.mjs`, logs `...\judge3-mp\log-*.txt`.

## Judge 2's remaining defects, re-checked

| # | Defect (judge 2) | Now | Reason | Screenshot |
|---|---|---|---|---|
| 1 | "Set price" a dead end for unused models | PASS | "Set price" opens a form on the row itself (input/output per million, the model named); Save posted `{provider:'gemini', model:'gemini-3.8-flash', price:[0.3,2.5]}`; the row then read "about 0.2 cents per use (typical)" and the option "Gemini 3.8 Flash · Standard · 0.2¢". Weak: focus drops to `<body>` when the button is replaced by the form; a non-number shows "Could not save the price. Try again." instead of saying the value is wrong. | `price-desk-form.png`, `price-phone-form.png`, `price-phone-after.png` |
| 2 | Update cost sentence "about about 16 cents per use in all" | PASS | "Uses about 9 AI calls on your strongest model, about $0.16 in all." Weak: a total under a cent would read "about under 1 cent in all". | `desk-light-1-default-p0.png` |
| 3 | Auto-update toast: no buttons, gone in 4 s | PASS (deviation) | Toast "Ebi moved some tasks to newer models. You can see the changes and undo them in Settings > AI & cost." with "See what changed" and ×, still there after 15 s. Deviations: no Undo on the toast (design A6 names one); "See what changed" opens AI & cost at its TOP, the changes list is below the fold. | `auto-toast.png`, `auto-seechanges.png` |
| 4 | Picker options lost their cost | PASS | "Claude Sonnet 5.5 · Standard · 0.9¢", "Claude Opus 5.5 · Best · 2¢" per task, so two models compare in place. | log `log-desk.txt` |
| 5 | No vision filter outside xAI | PASS | OpenAI "Reading pictures" no longer offers GPT 3.5 Turbo, O1/O3 Mini or Codex; "Talking with Ebi" drops O3 Mini and Codex (GPT 3.5 Turbo stays only because it is the current plan model). | log `log-tabs.txt` |
| 6 | OpenAI levels arbitrary, Codex/Pro offered | FAIL | Codex gone. Still: "GPT 4.1 · Best" and "GPT 5.5 · Best" side by side, "GPT 4o · Standard", while GPT 5 Mini, 5.4 Mini, 5.6 Luna/Sol/Terra have no level; GPT 5 Pro, 5.2 Pro, 5.4 Pro, 5.5 Pro and O1 Pro are offered for "Talking with Ebi"; most GPT 5.x options have no cost. The level follows OpenAI's stale presets (Normal = gpt-4o, More intelligent = gpt-4.1). | `tabs-keys-OpenAI-p0.png`, log `log-tabs.txt` |
| 7 | Four overlapping model controls | PASS | "Choose a model per feature" and "Models per job" now sit in ONE closed fold "Advanced: models per feature and per job" under the card; the page shows preset tiles + this card. Weak: a task pick still flips the preset tile to "Custom". | `desk-dark-advanced.png` |
| 8 | OpenAI "newer" names GPT 4 Turbo; failed list never says "could not check" | PASS | OpenAI: "Newer models came out since this plan." (no wrong model named). Failed list: "Could not check for newer models right now." and Update says "Could not reach Anthropic (Claude) to see its models." | `tabs-keys-OpenAI-p0.png`, log `log-faillist.txt` |
| 9 | "What changed" ignores a task's second model | PASS | Listed now ("Talking with Ebi: Claude Haiku 5.5 → Claude Haiku 5.5 + Claude Sonnet 5.5"). Weak: a "+" list does not say which part moved (Feedback chat), so a newcomer reads the same name on both sides. | `desk-light-3-after-update-p0.png` |
| 10 | Phone: card narrow, pick cut, long rows | FAIL | No sideways scroll at 390 x 1.35 (the card's content stays inside). Still: card 291 px wide, a chosen model is cut ("Claude Sparkle 9 T", "Claude Sonnet 5.5" with its level and cost cut), rows 250 to 340 px. At 390 x zoom 2.0 the card is 242 px, every picker reads "Recomn", the fact-check label runs past the card's right edge, rows are 630 to 920 px. | `phone-dark-6-other-done.png`, `phone-dark-5-pick-row.png`, `phone-dark-z2-default-p0.png` |
| 11 | Model id in an `aria-label` on a span | PASS | The id is now visually hidden text in the name ("Claude Haiku 5.5 (claude-haiku-5-5)"), read in every mode. | log `log-desk.txt` ("model sr text") |
| 12 | Lowercase "choosing…" beside the old level and cost | FAIL | Unchanged: "choosing… [Basic] … about 1 cent per 24 uses (typical)" during Update. | `desk-light-2-updating.png` |
| 13 | Preset tiles say "Cheap models…" and show raw ids | FAIL | Unchanged: "Cheap models for simple tasks, strong only for card making.", "Balanced and fast (claude-sonnet-5-5)" (the id breaks over two lines). The fold's "Provider default (claude-haiku-5-5)" and raw-id options too. | `auto-seechanges.png`, `desk-light-2-updating.png` |
| 14 | Rate-limited Update sends 7 requests | FAIL (minor) | Still 7 requests into a 429 before stopping; the message is plain and correct. | log `log-rate.txt` |

## Part A

| Item | Verdict | Reason | Screenshot |
|---|---|---|---|
| A1 Status line first | PASS | Status line, then an info notice: "freshened" wording on the owner's plan, "Newer models came out since this plan." on OpenAI, "Could not check for newer models right now." on a failed list, "never planned" wording on Google. | `desk-light-1-default-p0.png`, `tabs-keys-OpenAI-p0.png`, log `log-faillist.txt` |
| A2 Tasks, not 60 jobs | PASS | 10 plain rows: purpose, when, the true model(s) ("Also … for: …"), level, what matters, cost, picker. The per-feature and per-job lists are behind one closed "Advanced" fold. | `desk-light-1-default-p0.png`, `desk-dark-advanced.png` |
| A3 Honest cost per use | PASS | Typical costs labelled "(typical)"; with injected usage: "about 1 cent per 33 uses (from your last 20 uses)", the fact check "(from your last 8 uses)", "About $0.03 a day at your pace (last 2 days). An estimate…"; no price = "price not known" + a working Set price; ChatGPT plan "Included in your ChatGPT plan". Weak: "Last answered by Claude Opus 5.5 (a stand-in while the planned model was not working)" states a cause the app cannot know (an earlier hand pick also explains it). Haiku 5.5 at $0.10/$0.50 per million (table) not verified here. | `measured-desk-p0.png`, `price-phone-after.png`, `chatgpt-p0.png` |
| A4 Pickers for every provider | FAIL (OpenAI) | Recommended + models with name, level, cost + "Other model…" (focus moves into the box, an unlisted id warns) + ↺, on Anthropic, Google and ChatGPT plan ("GPT 5.5", "GPT 5.5 Mini", typed ids). On OpenAI the levels mislead and Pro models are offered for conversation (defect 6). ChatGPT plan shows the model as a bare "auto" (design: "auto, chosen by your plan") and lists "auto" again below Recommended. | `tabs-keys-OpenAI-p0.png`, `chatgpt-p0.png`, `desk-light-6-other-done.png` |
| A5 Update to the newest models | PASS | Says what it does and costs ("about 9 AI calls … about $0.16 in all"), re-plans now, lists changes per task, keeps hand picks, stays after closing Settings, Undo restores the old plan and its date (Sep 27, 2026), plain failure messages (rate limit, list down), disabled with a reason on the ChatGPT plan. | `desk-light-3-after-update-p0.png`, `desk-light-3b-reopen.png`, `desk-light-4-after-undo-p0.png` |
| A6 Runs by itself | PASS (deviation) | Ran once with the daily stamp removed, quiet toast with "See what changed" that stays until closed; the card shows the changes and Undo. No Undo on the toast; lands at the top of the pane. | `auto-toast.png`, `auto-seechanges.png` |
| A7 Saved safely | PASS (code and tests) | Unchanged since judge 2; tests green. Two computers not simulated; writes refused in this walk. | n/a |
| A8 Phone, keyboard, screen reader | FAIL | Good: no sideways scroll at 390 x 1.35 or 1280 x 2.0; pickers and ↺ named with the task; id heard; Tab order status → Update → fact check → rows. Fails: chosen picks cut on phone; at 390 x 2.0 every picker cut and the fact-check label overflows; focus is lost to `<body>` after "Set price"; selects and the Update button show only a faint border on focus (`outline: none`). | `phone-dark-6-other-done.png`, `phone-dark-z2-default-p0.png`, `desk-light-9-focus.png` |
| A9 Not built, and why | PASS | Copying picks not built; the "Last answered by" line seen with injected usage. | `measured-desk-p0.png` |

## Part B

| Item | Verdict | Reason | Screenshot |
|---|---|---|---|
| B1 What it checks | PASS | One background check per reply on job `factcheck.reply` with its own row and picker; tests green. | log `log-fc.txt` |
| B2 Where the note lands | PASS (Chat) | ON: 1 check, 1 note under the reply. Voice and Learn it not walked (code only, as before). | `fc-on-chat.png` |
| B3 The setting | PASS | Real checkbox, ON by default, cost in the text (typical, measured, "price not known", "Included in your ChatGPT plan"), the Off line. | `desk-light-1-default-p0.png`, `measured-desk-p0.png` |
| B5 Built so far, in the app | PASS | ON: 1 check and 1 note; OFF: 0 checks, 0 notes. | `fc-on-chat.png`, `fc-off-chat.png` |

## The owner's words

| Quote | Verdict | Reason |
|---|---|---|
| "make sure it's configurable in the AI settings" | PASS | Every task has a working picker in Settings > AI & cost, plus Update, Undo, reset and Set price. |
| "make it obvious what each one is for in the app" | PASS | Each row says what the task is, when it runs, the model(s) that really run it, why the level matters and what it costs. The preset tiles above still speak in raw ids and "cheap". |
| "it can be any ai provider" | FAIL | Anthropic, Google and the ChatGPT plan work, and Set price now fills unknown prices. OpenAI still shows misleading levels (GPT 4.1 "Best" beside GPT 5.5 "Best", most 5.x with none) and offers Pro models for conversation. |

## Can a non-technical user tell what each model does and change it?

Yes, on Anthropic, Google and the ChatGPT plan. Each row names the task in plain words, when it runs, which model runs
it, why that level, and the cost; the picker compares models by name, level and cost; ↺, Update and Undo are clear;
an unknown price can be filled in on the row. Where they still stumble: on OpenAI the level words do not track how good
a model is, so "Best" is no guide; the preset tiles right above the card speak in ids and "cheap"; on a phone the chosen
model is cut off in its picker; and after an automatic update they land at the top of the pane and must scroll to find
the changes.

## Every remaining defect, most serious first

1. OpenAI levels mislead and Pro models are offered for conversation: "GPT 4.1 · Best" beside "GPT 5.5 · Best", GPT 5 Mini / 5.4 Mini / 5.6 Luna, Sol, Terra with no level, GPT 5 Pro / 5.2 Pro / 5.4 Pro / 5.5 Pro / O1 Pro in "Talking with Ebi". Root: OpenAI's presets are gpt-4o / gpt-4.1, and levels follow presets. (A4, defect 6, "any ai provider")
2. Phone: chosen model cut in its picker ("Claude Sparkle 9 T"); at 390 x zoom 2.0 every picker reads "Recomn", the fact-check label overflows the card, rows 630 to 920 px. (A8, defect 10)
3. Keyboard: focus lost to `<body>` after "Set price"; selects and Update show only a faint border on focus. (A8)
4. Preset tiles still "Cheap models…" and raw ids ("claude-sonnet-5-\n5" wraps); the Advanced role picker lists raw ids. (defect 13)
5. "See what changed" lands at the top of AI & cost, the changes list below the fold; no Undo on the toast. (A6)
6. "choosing…" lowercase beside the old level and cost during Update. (defect 12)
7. "What changed" with "+" lists does not say which part moved ("Claude Haiku 5.5 → Claude Haiku 5.5 + Claude Sonnet 5.5"). (defect 9)
8. "Last answered by … (a stand-in while the planned model was not working)" claims a cause the app does not know. (A3)
9. ChatGPT plan: the model shows as a bare "auto" and "auto" repeats in the picker under Recommended. (A4)
10. A task pick flips the preset tile to "Custom". (defect 7)
11. Set price: a non-number says "Could not save the price. Try again." instead of naming the bad value. (defect 1)
12. Rate-limited Update still sends 7 requests. (defect 14, minor)
13. "about under 1 cent in all" would show for an Update estimate under a cent (not seen, from the code). (defect 2, minor)

## Not verified
Two computers saving at once; the "Last update" panel across a full reload (writes refused); the fact check in voice
mode and Learn it (code only); B4 on the real provider (would spend credits); whether the table's Haiku 5.5 price
($0.10 / $0.50 per million) is the provider's published price.
