# Voice mode: talk like a person (2026-11-15)

The owner: spoken Spanish came back in English, and replies were "too much fluff. A normal person would casually
talk ... like talking to any person, not a robot that needs to give a ton of information." Done under the rule "angles,
build whole, independent judge" (CLAUDE.md).

## Angles (four separate agents, none saw the others)
- **L** = an intermediate adult learner practicing spoken Spanish (18 items)
- **E** = a certification learner using it hands-free (15 items)
- **A** = phone and accessibility (18 items)
- **W** = what can go wrong (18 items)

## Merged design (an item raised by more than one angle is listed once, with every angle that raised it)

### 1. How Ebi talks (the prompt rule `VOICE_TURN_RULE`, utils/voiceStyle.js)
The rule comes LAST in the system prompt and overrides the typed-chat rules above it (for example the deck menu
"Would you like me to: (1)... (2)...").
- 1.1 Same language as the learner just spoke, even with an English word inside; a "how do I say X" gets the line,
  then back to the talk; an English vent gets a short English answer and an invite back (L1, L4, L17, W1, W14).
- 1.2 One or two short casual sentences, at most one easy question back, no lists, no "Great question" (L2, E4).
- 1.3 Speaks at the learner's level, everyday words (L3).
- 1.4 Fixes at most one important mistake, as a recast inside the reply; small slips pass (L5).
- 1.5 Quiz: one question in one sentence, then stops; choices only when asked; says right or wrong in the first
  words, then one sentence at most; grades meaning, not wording (E1, E2).
- 1.6 A misheard term (the transcript is speech recognition) is read charitably from context; if unsure, "Did you
  say X?" instead of marking wrong (E3).
- 1.7 "Tell me more / why / example" gets the next layer only (2 to 3 sentences); short again next turn (E5).
- 1.8 "Quiz me" uses the learner's own cards from the context, one at a time, a why or when follow-up only after the
  basic recall is right (E11).
- 1.9 Offers a card once, in one sentence, after the same miss twice; the card is shown, added on a tap or a spoken
  yes (E12, L10).
- 1.10 A recap request: 2 to 3 sentences out loud (what went well, up to 3 fixes with the right form, one next step);
  the cards for new words appear on screen (L14, E13).
- 1.11 Pronunciation questions: says honestly it only has the transcript (L15).
- 1.12 Role-play or topic on request ("let's do a job interview"): stays in it until the learner ends it (L13).
- 1.13 Writes numbers and acronyms so a voice reads them right (E6, E7): handled by the voices themselves, see
  Declined.

### 2. Turn taking and commands (VoicePanel.jsx, voiceCommands.js pure + tested)
- 2.1 Spoken commands handled ON THE DEVICE with no AI call: repeat ("repeat", "¿puedes repetir?", "otra vez"),
  slower, faster, pause/stop, end ("end session", "terminar"), recap (four app languages plus the learned language
  where it is Spanish, French, Portuguese, German, Italian) (L7, E8, E10, E13).
- 2.2 Speed control 0.75x / 1x / 1.25x in the panel, remembered per device, applies from the next sentence (device
  voice rate and clip playback rate) (L8, A7, E10).
- 2.3 Push-to-talk mode beside hands-free: the turn ends only on "I'm done" (button, Space, Enter); remembered per
  device (A2, W18, L11).
- 2.4 Hands-free waits longer in the learned language (a learner's pauses): 1.8 s of quiet, 1.2 s otherwise (L11, W12).
- 2.5 Empty, filler or noise transcripts ("uh", "[music]", "(silence)", the recognizer's known silence phrases such as
  "Thank you for watching") never reach the AI; "I didn't catch that"; three in a row pause the session (W3, W18).
  A real one-word answer ("sí", "no", "ok") is kept (W13).
- 2.6 A long silence: no nagging speech; it stops listening and shows "Still there? Tap to talk" (E14, L11).
- 2.7 "That's not what I said" while Ebi thinks: drops the reply (never spoken) and listens again (L12).
- 2.8 Esc while Ebi speaks interrupts first; a second Esc (or End) closes. Space ends a turn or interrupts when focus
  is not in the text box (A6, A8, E9).

### 3. What is on screen
- 3.1 Ebi's reply text appears sentence by sentence as it is spoken; the learner's line as "You: ..." (A1). Exists.
- 3.2 Reply words tappable for their meaning in language modes, like other screens (L9).
- 3.3 A text box in the panel: a typed turn goes through the same conversation (A3).
- 3.4 Cards Ebi made show as chips with "+ Add" (mode deck, no duplicate add) (L10, E12).
- 3.5 Recap button after two turns (L14, E13).
- 3.6 Retry after a failed reply resends the same words; the error is the translated one, never read aloud (W6).
- 3.7 Mic errors told apart: permission refused, no mic found, mic busy in another app (W4).
- 3.8 Download note in MB, not an alert per percent; cleared once ready (W7, A10).
- 3.9 Status line carries an icon per state (never colour alone) and is the one polite live region (A10, A13).
- 3.10 Footer and notes at AA contrast (inkDim, not inkFaint) (A18).
- 3.11 Phone 390x844: whole panel without page scroll, buttons 44 px high with 8 px gaps, End set apart (A4, A5).
- 3.12 Another window opening voice mode pauses this one with "Voice mode is active in another window" (W16).
- 3.13 Hidden window pauses with "Paused while the window was hidden. Tap to continue." (A15, W15).

### Already true before this work (re-checked by the judge, not rebuilt)
W2 (everything released on every exit, check-voice.mjs), W5/A14 (silent-mic note after 4 s, level bar), W8 (model
cached by the browser after the first download), W9/L16/E15 (speakableText strips markup), W11 (never listens while
speaking), W12 (a 45 s turn is sent, never dropped; "I'm done" sends what was heard), W17/L18 (every turn is the real
Chat, saved like a typed chat), A8 focus trap and return (Modal), A12 reduced motion, A17 the language switch is a
radio group.

### Declined, with why
- E9/W11/A6 voice barge-in: Ebi would hear its own voice without headphones (an echo loop). Tap, Esc or Space instead,
  and the status says "Tap to interrupt".
- A16 headphone detection: no reliable browser signal; output follows the system's own route already.
- W5 device name: the browser gives it only after permission and it adds nothing the "check your mic" note lacks.
- E6/E7 rewriting acronyms and numbers for speech: modern voices already say "TPM" as letters and "TLS 1.3" right,
  and a rewrite would mangle words read as words (RADIUS, SCADA). The text on screen stays exact.
- W10 speaking before the whole reply arrives: replies are now one or two sentences, so the wait is the model's
  answer time; streaming speech is phase 2 of docs/plans/2026-11-14-voice-mode.md.
- L6 a more natural voice: the Kokoro choice waits on the owner's go (a separate download).

## Judge (four independent rounds, the owner's real provider and modes, real Spanish speech)
| Item | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| Spanish in, Spanish out | PASS | PASS | PASS | PASS |
| Talks like a person | FAIL (6 of 17) | PASS (14 of 14 planned) | PASS | PASS (13 of 16, see below) |
| Commands without an AI call | PASS | | | |
| Recap | FAIL (55 words, English) | FAIL (English, last turns only) | FAIL (invented an answer) | FAIL (one run-on sentence) |
| Closers caught | | FAIL (a verb form missed) | PASS on output, hole in the check | PASS |
| One form of address | | | FAIL (tú and vos) | PASS |
| Slips recast | | | FAIL (one missed) | PASS (one said as "no X") |
| Phone and desktop, End on screen | FAIL | PASS | PASS | |
| Error once, Retry | PASS | PASS | | |
| Keyboard, leaving releases all | PASS | | | |

What the prompt alone could not hold is now checked in code (`spokenReplyProblems`, one rewrite naming the problem,
then a trim): length, sentences, a run-on sentence, praise openers, assistant closers by shape, menus, vos when the
learner uses tú, a spoken-out correction, an all-English reply in a Spanish talk. Round 5 judges the R4 fixes.
