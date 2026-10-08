# Raid powers: how to design and add one

Raid powers are tools the player brings into raid fights. This guide is the checklist for adding a new one: its design,
its numbers, its art, its animations and its tests. Read it before touching `src/features/legends/powers.js`.

## The owner's rules (do not bend these)

- **Unlocked for good by beating DIFFERENT raid bosses.** Beating the same boss twice counts once (`bossesBeaten`).
  Powers never run out, are never bought, and never drop at random.
- **Bring up to 3** (`LOADOUT_MAX`) chosen on the raid intro (`features.legends.raidLoadout`). **Each brought power
  works once per fight** (a fight = one run; "Continue?" keeps the fight, "Fight again" starts a new one). One power
  per question.
- **Bosses are balanced WITHOUT powers** (`profiles.test.js`), so a power only ever makes a fight easier.
- **Fight numbers are variables**: a power reads the fight's resolved rules (`rulesOf(fight)`, from
  `raidProfile(motif, variant)`), never a literal, so a variant (a nightmare boss) changes the fight under the powers too.
- **Anki stays honest.** No power turns a wrong answer right, skips a question, reveals the whole answer or raises an
  Anki grade. A power that helps with the QUESTION itself (50:50, Hint) makes that card's review Hard (`aided`).
  Fight-only powers (damage, hearts) leave the grade alone; Focus changes the fight damage, never the verdict.
- **Fights stay fair and readable** (the abilities' rules): no timers, nothing hidden, nothing that punishes a right
  answer.
- **No em dashes** in any text. All text in all four locales.

## Progression (what makes a power "make sense")

Unlocks are spread across the whole roster: 1, 3, 5, 8, 11, 13, 15, 17, 19, 21, 23, 26 different bosses. The last
one needs every boss of the roster (`RAID_ORDER.length`). A test keeps unlocks increasing, distinct, gaps of at most
3, and the last at the roster size.

Power should grow with the unlock, because late bosses have 2 to 4 times the health of early ones:

| Tier | Unlocks | Shape | Examples |
|---|---|---|---|
| Early | 1 to 8 | saves ONE heart or helps ONE question | Shield, 50:50, Second wind, Sharpen (+2 once) |
| Mid | 11 to 17 | a bigger single effect, or a siege effect | Hint, Bandage, Focus, Siphon |
| Late | 19 to 26 | a 3-question window (`POWER_WINDOW`) or a whole-fight effect | Ward, Momentum, Fury, Steadfast |

Sanity limits (tested in `powers.test.js` "balance"):
- Over its window, no damage power adds more than 8 damage to 3 clean answers.
- Later damage powers are worth more than earlier ones (Sharpen < Momentum < Fury).
- The cap holds WITH every boss's ability too (`furycap.test.js`): a multiplier power multiplies the STRIKE'S own
  damage only, never an ability's banked burst (Fury once turned Chronos' Time Stop x2 into x4). An ability that
  lowers a hit (a bank, armor) lowers the extra too.
- "Clean" means Focus-aware clean everywhere (`hitClean` in `abilities/_rules.js`, `res.focused`): a slip Focus made
  hit clean also pays Fury, Sharpen and Siphon.
- Window powers still need RIGHT answers to do anything: a struggling player gets little, a strong one a lot.
- A survival power gives back at most what one bad answer cost (Shield 1 heart, Ward one attack, Second wind 1,
  Siphon at most 1 per clean answer in its window, Steadfast 2 for the fight).

When in doubt, compare a new power with the one unlocked just before it: it should feel like a step up, but not
replace it. Each power should be the best pick for SOME situation or boss, so the 3-of-12 choice is a real choice.

## The kinds

`POWERS[id]` = `{ icon, kind, unlock, normal, window? }`
- `kind`: `aid` (helps with the question; recorded Hard), `survival` (hearts), `offense` (damage), `siege` (used
  between runs, like Bandage), `passive` (works by being brought, like Steadfast). `isFightPower` = has a button.
- `normal: true` = only on a raid's OWN question (never on an attack or an ability's inserted question).
- `window: true` = lasts `POWER_WINDOW` raid questions counted from the one it is used on (armed value = questions
  left, counted down by `powerAfterAnswer` on every raid question, whatever the answer).

## Adding a power, step by step

1. **powers.js**: an entry in `POWERS` (keep unlocks increasing; move later ones if needed and update the table above
   and `SIEGE_RULE` in raid.js), its condition in `powerUsable`, how it is spent in `powerAfterAnswer` (and its `proc`
   flag if it can visibly fire on an answer). Any number goes in a named constant at the top.
2. **The effect**:
   - Changes a strike: an `opts.<id>` in `strike()` (fight.js), set before `applyRes` so phase lines it crosses fire
     the ability's `onPhase` on that strike; mark it on `res` and copy it into `s.last` (like `focused`, `fury`,
     `warded`). Passed from `raidStep` (raid.js), which decides when it applies (own question vs attack).
   - **Overturns stay fair**: a window power that changes damage also goes into `raidStep`'s `boost` (what it would
     give a RIGHT answer to this question); `fight.refundFor` pays it when a re-check or appeal finds a miss was
     right (the window already ticked down on that answer). A Shield spent on a wrongly judged answer comes back
     (`strikeCost.shielded` → `applyRefund` → RaidRun re-arms it). Focus also stops a glancing slip coming back as
     an attack (it hit like a clean answer).
   - A rally (a run that lost every heart heals the boss back) calls the ability's optional `onRally(dayAb, {healed,
     damage, hp})`, so any saved day state tied to the wounds shrinks with the bar.
   - Changes hearts after a strike: in `raidStep` after `strike` (like Siphon), never past full, never after the fight
     is decided.
   - Changes the fight's start: in RaidRun (like Steadfast's `extraHearts`, lost first and subtracted before the siege
     write).
   - Between runs: a pure `apply<Name>(state, date)` in raid.js (like `applyBandage`), once a day.
3. **RaidRun.jsx**: `usePower` arms it (`setPA`), `record` passes it to `raidStep`. The button, the loadout tile and
   the armed line come for free from `POWER_IDS`/`armedList`.
4. **Text** (all four locales): `lg_pow_<id>` (name), `lg_powDesc_<id>` (what it does, plainly, with its numbers),
   `lg_fxCast_<id>` (cast label), `lg_fxProc_<id>` if it procs, `lg_powUp_<id>` if it is armed without a count.
5. **Icon**: `public/assets/legends/powers/<id>.svg` (see below). Check it at `/dev/raid-powers/`.
6. **Animations** in `src/features/legends/impact/PowerFx.jsx`: a CAST (plays when used), an ARMED look if it stays
   up (window powers show their pips), a PROC flourish if it fires on an answer. Each pairwise distinct from every
   other power (shape, motion, timing, color); `powerfx.test.js` checks they exist and differ. Add its buttons to the
   asset view's Powers demo.
7. **Tests**: `powers.test.js` (usable conditions, the effect through `raidStep`, spent/count-down, the balance
   limits), then `npx vitest run src/features/legends src/i18n`.
8. **Help**: `helpContext.js` and `SIEGE_RULE` list powers from `POWERS`/`unlockedPowers`; reread them so Ebi
   describes the new one right.
9. **Docs**: this table, CLAUDE.md's Raids > Powers bullet, `NEW-RAID-FEATURES.txt` if the owner tracks it.

## Icon style (the set must look like one set)

- `viewBox="0 0 64 64"`; a rounded-square metal bezel in the power's own color, a dark inner panel, a soft layered
  glow made of opacity layers, a white rim highlight, the emblem in bold outlines with lighter left-side shading.
- Readable at 24px and at 96px; a distinct silhouette AND dominant color from every other power.
- No `url()`, gradients, filters, `<image>`, `<use>`, scripts or text (letter shapes as paths only). Idle motion with
  `<animateTransform>` only, subtle, `keyTimes` matching `values` and ending at 1, pivots with
  `transform-box:fill-box;transform-origin:center`; the file's own attributes are the finished pose.
- Rendered with `<img>` (`PowerIcon` in RaidRun), the emoji in `POWERS[id].icon` as the fallback.

## Animation style

Same rules as every raid effect: fixed bright hex colors, container units inside the boss box, deterministic, never
`position: fixed`, skipped in focus mode, Still bosses and reduced motion, at most 2 flashes a second. A cast is big
and short (about 1s), an armed look is calm and persistent, a proc is a quick punch on the answer that triggered it.
Look at every one in headless Chrome over several bosses, light and dark, before calling it done.
