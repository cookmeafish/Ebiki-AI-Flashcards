# Judge 4: "Ebi's models" card after the third round of fixes (2026-11-15)

Fourth independent judge, did not build it. Plan: [[../plans/2026-11-15-model-plan-settings]]. Earlier verdicts:
[[2026-11-15-model-plan-judge]], [[2026-11-15-model-plan-judge2]], [[2026-11-15-model-plan-judge3]].

**How it was walked**: agent server on 3001 (fresh page per run, so current code), Playwright's bundled Chromium
(`--mute-audio`), the owner's REAL config read-only: every non-GET `/api` answered 204, the inline "Set price" POST
answered by the harness with a fake reply, every provider host answered locally, nothing spent, no key printed. OpenAI
and Google walked with fake keys injected into the `/api/keys` answer. OpenAI's list: the owner's saved 71 ids plus a
current set (`gpt-6-luna`, `gpt-6.1-sol`, `gpt-6.1-terra`, `gpt-6-astra` with dated twins, `gpt-6-pro`, `gpt-6.1-pro`,
`gpt-6-codex`, `gpt-6.1-codex-mini`, plus tts/realtime/embedding/image/moderation ids). ChatGPT plan with a stubbed
signed-in status; measured costs with fake per-job and per-day usage injected into the `/api/usage` GET. Desktop
1280x900 light and dark, phone 390x844 dark and light, app zoom 1.35 and 2.0. Unit tests (modelPlan, factCheck, aiJobs,
i18n, aiReplyVariants, providers): 278/278.

Screenshots: `C:\Users\User\AppData\Local\Temp\claude\2a0b332a35f80abc\0f540200-c71b-4d96-bca7-5172cee217a4\scratchpad\judge4-mp\shots\`
Script `...\judge4-mp\judge4.mjs`, outputs `...\judge4-mp\out-*.txt`.

## Judge 3's 13 remaining defects, re-checked

| # | Defect (judge 3) | Now | Reason | Screenshot / log |
|---|---|---|---|---|
| 1 | OpenAI levels mislead, Pro models offered | PASS (weak) | No Pro, codex, tts, realtime or embedding model is offered for any task. Levels now come only from the presets: "GPT 6 Astra · Best", "GPT 6.1 Sol · Standard", "GPT 4o Mini · Basic"; GPT 4.1 and GPT 5.5 carry no level, so nothing old is called "Best". Weak: 15 of 25 options (every GPT 5.1 to 6.1 except the two presets) show neither a level nor a cost, so most current models cannot be compared in place; the "Basic" level is GPT 4o Mini because of the owner's leftover `modelPresets.openai.cheap` pin (`gpt-4o-mini-2024-07-18`, a snapshot the provider file calls deprecated), while the real Basic floor GPT 6 Luna shows none. The pin is not surfaced anywhere. | `tabs-keys-OpenAI-p0.png`, `out-tabs.txt` |
| 2 | Phone: chosen pick cut; z2 pickers "Recomn", fact-check label overflows | FAIL (z2) | 390 x 1.35: the chosen name now shows ("Claude Sparkle 9 Turbo" whole; "Claude Sonnet 5.5 · Stanc" cuts only level and cost, which the row states just above). 390 x 2.0: every picker still reads "Recomn", a pick reads "Claude !"; the fact-check label now wraps inside, but its description ("explanation") runs past its column; rows 631 to 922 px. | `phone-dark-5-pick-row.png`, `phone-dark-6-other-done.png`, `phone-light-z2-1-default-p0.png`, `phone-light-z2-5-pick-row.png`, `parts-phone-z2-fc.png` |
| 3 | Keyboard: focus lost after Set price; faint focus | PASS | "Set price" moves focus into the input price box. A focused select shows the brand border plus a 3 px ring in both themes (measured after the 0.16 s transition; judge 3's "faint border" reading was most likely taken mid-transition). Update shows a 1.5 px brand outline, offset 2 px (thin against the red button, but there). | `focus-desk-dark-focus-select.png`, `focus-desk-light-focus-update.png`, `out-focus.txt`, `out-price.txt` |
| 4 | Preset tiles "Cheap models…", raw ids; Advanced lists raw ids | PARTLY FIXED | Tiles: "Low-cost models for simple tasks…", "Balanced and fast (Claude Sonnet 5.5)", "(GPT 6.1 Sol)", "(Gemini 3.8 Flash)". Still raw inside the closed Advanced fold: "Provider default (claude-haiku-5-5)" and every option "claude-sonnet-5-5". | `chatgpt-p0.png`, `out-desk.txt`, `out-role.txt` |
| 5 | "See what changed" lands at top; no Undo on toast | PASS (weak) | Toast has See what changed, Undo, ×, stays after 15 s. See what changed scrolls the changes list into view; toast Undo restores the Sep 27 plan and the changes panel goes away. Weak: the scroll also shifts the whole Settings dialog up about 24 px, clipping its Close button at the top edge. | `auto-toast.png`, `auto-seechanges.png`, `autoundo-after-p0.png` |
| 6 | "choosing…" beside the old level and cost | FAIL (minor) | Now "Choosing…" (capital), but still beside the old "Basic" badge and the old "about 1 cent per 24 uses (typical)". | `desk-light-2-updating.png` |
| 7 | "+" changes don't say which part moved | FAIL (minor) | Unchanged: "Talking with Ebi: Claude Haiku 5.5 → Claude Haiku 5.5 + Claude Sonnet 5.5". The row below does say "Also Claude Sonnet 5.5 for: Feedback chat", so the answer is one scroll away. | `desk-light-3-after-update-p0.png` |
| 8 | "Last answered by … (a stand-in …)" claims a cause | PASS | "Last answered by Claude Opus 5.5, not the model planned here." No cause claimed. | `out-measured.txt` |
| 9 | ChatGPT plan: bare "auto", "auto" repeated in picker | PARTLY FIXED | Shown as "your plan's model" (tiles "Your plan's model"). Still: the picker lists "your plan's model" again under Recommended; the bold model name is lowercase; the screen-reader text still reads "(auto)"; the preset tiles above still say "Low-cost models… the strongest only for card making", which means nothing on a plan that picks every model. | `chatgpt-p0.png`, `out-chatgpt.txt` |
| 10 | A task pick flips the preset tile to "Custom" | FAIL (minor) | Unchanged: picking Writing cards makes "● Custom" and un-selects Optimized. | `out-desk.txt` |
| 11 | Set price: non-number says "Could not save" | PASS | "Type two numbers: the price in US dollars per million tokens, for input and for output." A comma decimal is accepted. | `out-price.txt`, `price-desk-form.png` |
| 12 | Rate-limited Update sends 7 requests | FAIL (minor) | Still 7 requests into a 429 before stopping (desktop and both phone runs). The message is correct and plain. | `out-rate.txt`, `rate.png` |
| 13 | "about under 1 cent in all" | PASS | The Update estimate is now dollars with a floor of "$0.01". | code, `ModelPlanCard.jsx` `estimate` |

## Items

| Item | Verdict | Reason | Screenshot |
|---|---|---|---|
| A1 Status line first | PASS | Owner's plan: "Planned Sep 27, 2026." + the freshened notice; OpenAI: "Newer models came out since this plan."; failed list: "Could not check for newer models right now."; Google: never planned; after Update: "These are the newest models Ebi knows of." | `desk-light-1-default-p0.png`, `tabs-keys-OpenAI-p0.png`, `out-faillist.txt` |
| A2 Tasks, not 60 jobs | PASS | 10 plain rows; per-feature and per-job behind one closed "Advanced" fold. | `desk-dark-advanced.png` |
| A3 Honest cost per use | PASS | Typical and measured labels, day cost "About $0.03 a day at your pace (last 2 days)", unknown price + working Set price, ChatGPT "Included in your ChatGPT plan". | `out-measured.txt`, `price-desk-after.png` |
| A4 Pickers for every provider | PASS (weak) | Anthropic, Google, OpenAI and ChatGPT plan all pick, type an unlisted id (focus moves into the box, an unknown id warns), reset with ↺. OpenAI no longer offers Pro/codex or misleading levels. Weak: most current OpenAI options have no level or cost (defect 1); ChatGPT plan repeats "your plan's model". | `tabs-keys-OpenAI-p0.png`, `desk-light-6-other-done.png`, `chatgpt-p0.png` |
| A5 Update | PASS | Cost said up front, changes listed per task, hand picks kept, panel survives closing Settings, Undo restores the Sep 27 plan, plain failures (rate limit, list down), disabled with a reason on the ChatGPT plan. | `desk-light-3-after-update-p0.png`, `desk-light-3b-reopen.png`, `desk-light-4-after-undo-p0.png` |
| A6 Runs by itself | PASS | Toast with See what changed (scrolls to the list) and Undo (works); stays until closed. Weak: dialog shifts up and clips Close. | `auto-toast.png`, `auto-seechanges.png` |
| A8 Phone, keyboard, screen reader | FAIL (zoom 2.0 phone only) | Keyboard and screen reader now pass (focus rings, focus into the price box, pickers named with the task, id read). 390 x 1.35 passes with a minor cut of level/cost in a chosen pick. 390 x 2.0 (about 195 layout px for all of Settings, the card about 121): every picker shows "Recomn" and a pick "Claude !", the fact-check description overflows its column. Judged fairly: at that width the select itself has about 45 px of text room because the dialog and card paddings take the rest; nothing on the card says what is chosen except the model name above each picker, which does show. | `phone-light-z2-1-default-p0.png`, `phone-light-z2-5-pick-row.png`, `parts-phone-z2-fc.png`, `focus-desk-dark-focus-select.png` |
| A9 Not built, and why | PASS | Copying picks not built; the "Last answered by" line seen with injected usage. | `out-measured.txt` |
| B1 What it checks | PASS | One check per reply (`factcheck.reply`) with its own row and picker. | `out-fc.txt` |
| B2 Where the note lands | PASS (Chat) | ON: 1 check, 1 note under the reply. Voice and Learn it not walked. | `fc-on-chat.png` |
| B3 The setting | PASS | Real checkbox, ON, cost in the text (typical, "price not known", "Included in your ChatGPT plan"), the Off line. | `desk-light-1-default-p0.png` |

## The owner's words

| Quote | Verdict | Reason |
|---|---|---|
| "make sure it's configurable in the AI settings" | PASS | Every task has a working picker, typed ids, ↺, Update, Undo (in the card and on the toast), Set price. |
| "make it obvious what each one is for in the app" | PASS | Each row: task, when it runs, every model that runs it, level, why, cost. Preset tiles now use names and "Low-cost". The Advanced fold still speaks in raw ids. |
| "it can be any ai provider" | PASS (weak) | Anthropic, Google, OpenAI and the ChatGPT plan all work; OpenAI no longer offers Pro/codex models or calls old models "Best". Weak: most current OpenAI models carry no level and no price, so the picker gives little to choose by; the owner's stale `gpt-4o-mini` pin sits under Basic unseen. |

## Can a non-technical user tell what each model does and change it?

Yes, on every provider walked. Each row says what the task is, when it runs, which model runs it, why it matters and
what it costs, and the picker changes it with ↺ to go back; Update, Undo and the toast are clear. Where they still
stumble: on OpenAI most current models in the picker have no level and no price, so they choose blind among names like
"GPT 5.6 Sol" and "GPT 6.1 Terra"; on a phone at 200% zoom no picker shows what it holds; on the ChatGPT plan the
picker repeats "your plan's model" and the preset tiles describe tiers that do not exist there.

## Remaining defects, most serious first

1. Phone at zoom 2.0: every picker reads "Recomn", a pick "Claude !"; fact-check description overflows its column. (A8)
2. OpenAI: 15 of 25 options (GPT 5.1 to 6.1 except the presets) show no level and no cost; the Basic level is the owner's leftover `gpt-4o-mini-2024-07-18` pin (deprecated snapshot), never surfaced, while GPT 6 Luna shows none. (A4, "any provider")
3. ChatGPT plan: "your plan's model" repeated under Recommended, lowercase as the row's model name, screen reader hears "(auto)", preset tiles describe low-cost/strongest tiers that don't apply. (A4)
4. Advanced fold: "Provider default (claude-haiku-5-5)" and raw ids in every option.
5. "Choosing…" beside the old level badge and old cost during Update.
6. "See what changed" shifts the Settings dialog up and clips Close.
7. "+" change rows don't say which part moved.
8. A task pick flips the preset tile to "Custom".
9. Rate-limited Update still sends 7 requests.
10. Phone 1.35: a chosen pick cuts its level and cost ("Claude Sonnet 5.5 · Stanc"); the name shows.

## Not verified
Two computers saving at once; the fact check in voice mode and Learn it (code only); B4 on the real provider (would
spend credits); whether GPT 6.x / 5.1 to 5.6 prices are published (none are in the table, so "not known" is honest);
OpenAI Update end to end (OpenAI calls stubbed 401); the phone OpenAI tab (not walked this round).
