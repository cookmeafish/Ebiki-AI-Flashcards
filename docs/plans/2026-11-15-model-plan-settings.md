# Models in plain words, an Update button, and a teaching fact check (2026-11-15)

The owner, on the stale model plan: "make sure it's configurable in the AI settings and make it obvious what each one
is for in the app", and earlier "shouldn't this be configurable in the settings? ... it can be any ai provider".
A model plan decided on 2026-09-28 kept Chat on an older model for seven weeks and nothing on screen said so.

Angles run separately (each item below names who raised it): **N** first-time non-technical user, **O** the owner's
real saved data, **W** what can go wrong, **A** phone, keyboard and screen reader, **P** daily power user who watches
cost. Related: [[2026-11-15-voice-conversation]] (the fact check reaches voice), CLAUDE.md "AI providers" and
"Token and cost counter".

## What the owner's data showed (O)
- Anthropic, Optimized, no hand picks (`aiModels` empty). Plans for all three presets dated 2026-09-28 name
  `claude-haiku-4-5-20251001`, `claude-sonnet-4-6`, `claude-opus-4-6`; their `knownModels` lack every 5.5 id.
- An OpenAI plan from 2026-08 still names `gpt-3.5-turbo-1106`; a leftover `modelPresets.openai.cheap` pin.
- No 5.x model had a price in the table, so every current call showed as unpriced.
- Usage is kept per model only; nothing says which feature spent it.

## Part A: the "Ebi's models" card (Settings > AI & cost)

### A1. Status line first (N2, O2, W9, A8)
One line above everything: "Ebi uses the recommended models from <provider>. Planned <date>." plus, when it applies,
an INFO (never red) notice in the page flow, `role="status"`:
- "Newer models came out since this plan" when the live list has a newer model in a family the plan uses, or the
  plan names an id older than the provider's current presets in the same family.
- "Could not check for newer models" when the list call failed (never "up to date" on a failed read).
- "Never planned" when no plan exists (the presets apply).
Its action is the Update button.

### A2. Tasks, not 60 jobs (N3, N14, N15, P4)
The default view lists about 9 TASKS in plain words, each a group of jobs (`TASKS` in `src/config/modelPlan.js`):
Talking with Ebi (Chat, voice, Help), Explaining a card (Learn it, hooks, lookups), Checking your answers (grading,
fights), Writing questions, Second look at questions (review pass), Writing cards (deck), Reading pictures, Games and
practice (Legends, raids, practice), Small helpers (pose, glosses, tags, names). Each row shows:
- the purpose and WHEN it is used ("every time you study", "when you tap a word"),
- the model as a NAME ("Claude Haiku 5.5"), the id in the tip (N4),
- the level as Basic / Standard / Best (never "cheap") with one line why (N5),
- the cost per use (A3),
- "Your pick" when the owner chose it, and a ↺ "Back to recommended" (N9, O4, W10).
The full per-job list stays behind "Show every task (advanced)" (the existing `JobModelSettings`).

### A3. Honest cost per use (P1, P2, N6, N7, O5, A10)
- From the owner's OWN usage: usage now records the job of every call (`reportUsage({ job })` → `byJob`), so cost per
  use = their average tokens for that job × the model's price. Labelled "measured (N uses)".
- Fewer than 5 uses: a TYPICAL token size per task (data in `modelPlan.js`), labelled "typical".
- No price: "price not known · Set price" (the meter's price store), never $0 and never a guess.
- ChatGPT plan: "Included in your ChatGPT plan", no dollars.
- A small total at the top: "about $X a day at your pace (last 7 days)" from the daily buckets (`byDay`, 60 days
  kept), with "an estimate; your provider's bill is the real number" (P3).

### A4. Pickers that work for every provider (owner ask, N8, A2, P7)
Each task row has a picker: "Recommended (<model>)", then the provider's chat models (vision-only list for Pictures
and Chat), each option labelled with its name, level and cost per use for THAT task, so two models compare in place;
then "Other model…" (typed id, focus moves into the box: A11). A pick sets every job of the task (a group set, P6).
Works for Anthropic, OpenAI, Gemini, Grok and the ChatGPT plan ("auto, chosen by your plan" + typed ids).

### A5. "Update to the newest models" (owner ask, N10, W1, W3, W5, W7, O10, O12, O14, P9)
- Says what it does and roughly what it spends ("about N AI calls; about $X" from prices it knows, else "N AI calls").
- Re-plans the ACTIVE preset now (forced, even when the cached plan saw every model).
- Atomic: a failed or empty plan keeps the old one. Every stop has a plain reason: no key, offline, list failed, out
  of credit, rate limited (research already done is kept), unreadable decision.
- Afterwards a "What changed" list per task ("Writing cards: Claude Opus 4.6 → Claude Opus 5.5"), or "Already up to
  date", in a polite live region (A7). `knownModels` is refreshed so the "never seen" trigger stops firing (O10).
- The previous plan is kept once: "Undo" puts it back (N12, P9).
- Hand picks are never changed; the list names the ones it left alone (W10).
- ChatGPT plan: disabled with "Your ChatGPT plan chooses its models" (W5).

### A6. It also runs by itself (owner ask, W4, N12)
When the provider lists a CHAT model the active plan never saw: at most once a day (its own stamp), never in the
overlay, never before onboarding, never while a data folder switch or the offline copy is active, never on the
ChatGPT plan. It shows a quiet toast "Ebi moved to newer models · See what changed · Undo", never a question.

### A7. Saved safely (W2, W8, O1, O3)
- A plan finishing after the provider changed is saved under ITS provider only, never shown as the current one.
- Before saving, a plan stored meanwhile with a NEWER `decidedAt` (another computer) wins.
- `freshenPlanId` lifts only APP-chosen ids (plan, presets) to a newer model of the same family; a hand pick is
  returned exactly as set (tested). Freshened ids never make the preset read "Custom".

### A8. Phone, keyboard, screen reader (A1 to A12)
A list of cards, never a wide table: each task an `<li>` whose facts stack below 440 px; every flex child `minWidth: 0`
and long ids break. Pickers and ↺ are labelled with the task name. Tips are focusable buttons, the "why" is visible
text. Tap targets 32 px on phones. The fact check is a real checkbox with its cost in the label. Order: status, Update,
fact check, tasks, advanced. Checked at 390 px and zoom 1.35 for no sideways scroll.

### A9. Not built, and why
- Copying picks to another provider (P6): models differ per provider; the presets already map tiers.
- A separate "last model used per job" column (P5): the cost line names the model that really answered when it
  differs from the plan (from `byJob` last model), which covers silent swaps without another column.

## Part B: "Double-check Ebi's explanations for mistakes" (peer and owner ask: configurable, any provider)

### B1. What it checks (W11, W12, P10, P11)
After a TEACHING reply has been shown (typed Chat, voice, Learn it chat, an answer explanation from grading), one
background call on the review model (role `qcheck`, job `factcheck.reply`, its own picker row, any provider) reads the
reply and the context it was given (the card, the question's checked explanation) and answers JSON: either nothing, or
up to 2 errors, each with the EXACT words quoted from the reply and a one-line correction.
- A note is shown only when its quote is really in the reply (a check that quotes nothing it can point to is dropped);
  style, dialect, register and opinion are not errors (the prompt says so; the parser drops "could be clearer").
- Fail-soft: an error or unreadable reply shows nothing; `silent: true`; a hard `maxTokens`.
- Counted under its own job, so its cost shows on its own row.

### B2. Where the note lands (W13, W14, W15, W16)
- Chat: a quiet "Ebi double-checked: …" line under THAT message, keyed by chat id + message index; dropped after a
  chat switch, a mode switch or a newer reply. Never saved as Ebi's words; `boundChatHistory` never sends it back.
- Voice: never spoken; shown under the turn after Ebi finished speaking; dropped if the learner already spoke again.
- Learn it: under that reply, same card only.
- Grading: only once the answer is on screen (never during a live question: a correction could give it away).
- Text through the dash strip and the shrimp-emoji strip, in the app language, all four locales.

### B3. The setting (N13, P10, O13)
`factCheck: { enabled: true }` in config (global, ON by default). In the models card: a checkbox "Double-check Ebi's
explanations for mistakes (recommended)", its measured or typical cost per reply, its model, and "Off: replies are
not checked; a slip can stay on screen". Off by surface is not offered (one switch; the per-task picker sets its
model).

### B4. Proof
The 11 slips in `docs/reviews/2026-11-15-accuracy-regressions.md` replayed through the checker on the owner's real
provider: each must be flagged, and 11 correct replies must stay unflagged.

## Judge (independent, on the real app with the owner's real config, desktop and phone)
To be filled in by the judge: one row per item above, pass or fail with the reason, and the question
"can a non-technical user tell what each model does and change it?"
