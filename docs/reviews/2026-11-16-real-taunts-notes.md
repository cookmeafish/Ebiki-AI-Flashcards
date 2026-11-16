# Boss taunts and feedback notes judged on real generated lines (2026-11-16)

What was run: the app's own prompts (`buildTauntPrompt`, `buildExplainPrompt`) on the owner's provider and
configured models (taunts on the cheap preset, notes on the normal one), 10 invented misses of a Spanish learner
with Ebi speaking Spanish, one taunt and one note each. Two rounds, 40 model calls in total. Token counts were not
recorded by the script. An independent judge (who wrote neither the prompts nor the lines) scored every line.

| Rule | Round 1 | Round 2 (prompts tightened) |
|---|---|---|
| Taunt states the wrong answer | 10 of 10 | 10 of 10 |
| Taunt says the mix-up in plain words | 8 of 10 | 9 of 10 |
| Taunt mocks the mistake, no lecture | 10 of 10 | 10 of 10 |
| Taunt in natural Spanish, no stage direction | 7 of 10 | 9 of 10 |
| Note names the exact accepted answer | 10 of 10 | 10 of 10 |
| Note is one or two short neutral sentences | 10 of 10 | 10 of 10 |
| Note makes only correct claims about the words | 7 of 10 | 8 of 10 |

Round 1 found: English persona words and a speaker label inside a Spanish line, a stage direction said aloud, a word
defined with itself, a wrong verb FORM read as a different word, a loose definition, a gloss in a third language.
The prompts now forbid each (kit/taunt.js, kit/fightJudge.js).

## Still weak after round 2 (not fixed)
- A wrong verb form that is also a real noun was still explained as the noun by the taunt (the note for the same
  miss explained it correctly, so the two disagreed).
- One taunt used an unnatural phrase for "means".
- Two notes defined a word loosely (married as "having a legal partner"; a masculine adjective defined with "a
  woman").
- Smaller: a boss's character names appeared half translated; one preposition slip.

These are model slips on the cheap and normal presets, not prompt gaps we could close with one more rule. The fact
check that runs after teaching replies does not cover fight notes; extending it there is the next lever if these
keep showing up.

Not verified: other learned languages, a general (non-language) mode, and lines in the app language English.
