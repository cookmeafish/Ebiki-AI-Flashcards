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

## Rounds 3 and 4 (the same day): fixed at the source
Changes: a code check (`kit/mistakeKind.js`) tells both prompts when the answer is another FORM of the right word;
the note prompt gets the card's own meaning and may state only certain facts about the wrong word.
Round 3 (independent judge): every rule 10 of 10 for taunts and notes, no fails. The verb-form miss is now explained
as a wrong form by both the taunt and the note. Side effect the judge flagged: five notes no longer said what the
wrong word means. Round 4 rebalanced that rule and regenerated the 10 notes: all ten name the wrong word's meaning
again. Round 4 was NOT judged independently (usage limit); by the author's read, one note still defines a masculine
adjective with "a woman" and one says "partner by marriage".
Calls on the owner's key: about 100 in all (round 3 measured: 30 calls, 35,924 input and 10,323 output tokens, the
cheap model retrying about once per taunt; rounds 1 and 2 not measured; round 4: 10 calls).
