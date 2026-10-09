# Legends art: how the assets are made

Read this BEFORE drawing any Legends art (a new motif, a redraw, "make more bosses"): the owner's art direction plus
the technical rules the app enforces. Files: `public/assets/legends/` (`areas/<motif>.svg` banners,
`bosses/<motif>.svg`, `raids/<motif>.svg`); `public/assets/legends/README.md` is the short version for hand edits.
Each rule is stated once; the sections after the top rules give the details and the cases behind them.

## ⭐⭐ RAID BOSSES GO ALL OUT, EVERY TIME (the owner: "super crucial")

Read this before making a NEW raid boss, REDESIGNING one, or touching any raid boss phase, effect or animation. The
owner's words (2026-10-09), after several redraws came back broken or bland: "sloppy terrible job with this raid. this
is NOT the quality i EXPECT WITH RAID BOSSES"; "where the hell is the quality??? kitsune and ophanim are good examples
of quality. please go all out with them like kitsune and ophanim... put in a lot of effort into these raid bosses and
phases and animations and everything"; "IT DOESN'T MATTER HOW LONG IT TAKES, THEY MUST GO ALL THE WAY CRAZY AND TRIPLE
CHECK FOR QUALITY AND THAT ITS NOT BROKEN SVG"; "raid bosses must GO ALL OUT and all phases must be distinct and
animations should go hard for all of them and all animations for abilities are crazy distinct... so that if i tell it to
make another raid boss or to redesign or make a new one that it has the quality of kitsune and ophanim". Time is never
a reason to stop early. "Good enough" is a failure.

### The bar
**`raids/kitsune.svg` and the photo `raids/ophanim.svg` are the GOLD STANDARD of quality** (the owner: the standard
to match, NOT a test of placing renders beside them at some size). Every raid boss, at every phase, matches them in
anatomy quality, layered shading (3 to 4 values per material, rim light, ambient color), detail
density, clean joins, props gripped in hands, and as much alive at once. Weaker anywhere = not done.

### The character
- **One clear concept the owner can NAME at a glance**, one silhouette idea, big in frame (head and torso dominate;
  never zoom out to a tiny full figure).
- **One character across all three phases**: same face, proportions, fur/skin, line style, palette family, signature
  props. (Rejected: the Rat King's Chad phase that looked like "a different character entirely".)
- **Personality constant**: escalate with power, scale and swagger, never turn a smug or cool boss into a screaming
  monster. Villains look strong and charismatic: never a soft, weak, pretty-boy face (rejected Showman).
- **Anatomy that connects**: shoulder → upper arm → elbow → forearm → wrist → hand; necks grow out of shoulders;
  heads sit on necks; hands grip what they hold. NEVER floating gloves, tube arms, pasted heads or necks (rejected
  Hydra), stuck-on props, parts sliced by another shape (rejected sewer ears). Multi-part bosses (Hydra heads, Cerberus
  heads) are designed FROM those parts out: the ability's state (head slots, stumps) is part of the drawing's plan.
- **Minions and lackeys** (mice for the Rat King) are small, comic, each with its own character, never covering the boss.

### The phases: three DISTINCT pictures
Each phase changes CAMERA, POSE, HEAD ANGLE, FACE, LIGHT, PALETTE and usually SETTING; tellable apart by silhouette at
120 px. A story: P1 the boss at rest in its domain; P2 the fight turns (dynamic camera, the boss acts); P3 THE
SPECTACLE: the climax, the most happening on screen (moving lights, particles, magic, transformations, falling things),
the boss still the one dominant, readable figure, the most idle motion. "Phase 3 is boring af, nothing happens" is a
rejection. The backdrop is part of each phase and fills the frame (muted, no flat blobs, no rounded inset frame).

### Animations: go hard on ALL of them
- **Idle**: every part that would move moves (breath, fur/hair, cloth, eyes and blinks, props, lights, particles,
  backdrop), at LAYERED rhythms so it never reads as one thing bobbing. Loops seamless; time-based SMIL only.
- **Entrance** (`ENTRANCES`): its own movement, dramatic, ending on the file's pose.
- **The nine impact moments** (hit, crit, sharpen, strike, heavy, block, shield, second wind, knockout) and **the attack
  on the player**: the DRAWING's own parts act each one out hard (wind-up, blow toward the hearts, recoil), plus its own
  parts and glyph (`impact/bosses/<motif>.*`); the knockout is a themed cinematic held in a fallen pose.
- **Every ABILITY effect is CRAZY DISTINCT**: each `fx` key of each boss has its own big, unmistakable effect (its own
  shapes, motion, colors, sound-like juice) AND moves the boss's real parts (eyes open, heads snap, arms throw, wings
  beat). No two abilities, and no two bosses, share a look. Never a generic flash, never covering or hiding the boss.

### Process (mandatory, no time limit, for EVERY change: "EVEN EDITS TO A RAID BOSS SHOULD FOLLOW THE BEST QA")
A small fix (moving a table, fixing an ear, a pivot, one effect) gets the same full process as a redraw: a small edit
can break a join, a phase or an animation elsewhere in the file.
1. Read this section, then the rest of this guide, CLAUDE.md's raid sections and `impact/bosses/README.md`; back up
   the file.
2. Draw. Then at least THREE rounds of: render → written critique → fix. Each round: every phase zoomed 2 to 4x (every
   join, outline, draw order; nothing floating, clipped, popping or sliding), the three phases side by side (distinct?
   one character?), judged against the kitsune/ophanim quality standard.
3. Animation check: frames across the idle loop, the entrance, every moment, the attack and every ability; zoomed,
   looking for parts that detach, slide, pop or cover the face.
4. The TRIPLE CHECK (below), `check-art.mjs` 0 failures, tests green.
5. An INDEPENDENT REVIEW: a separate agent (who did not draw it) looks at the final renders against the owner's words
   and this guide and lists every defect; fix them and re-check. **A report without this review is not done and goes
   straight back** (two 2026-10 redraws skipped it; both had defects a fresh look caught at once: a rounded inset
   backdrop panel, tube necks, a box-shaped head and neck).
6. Report what was checked, the review's findings and fixes, and an honest list of what is still weaker.
7. The coordinator inspects the zoomed renders before the owner sees anything. Never relay art as done from one
   overview render.

## The owner's top rules, in short (2026-10)

Every boss, raid boss and banner brief starts from these.

1. **Quality bar: `raids/kitsune.svg`** ("basically the gold standard of quality"), then `raids/void.svg`, then
   `titan`/`hydra`. Super detailed, layered cel shading (3 to 4 values per material), rim light, materials that read
   (gold, steel, fur, feathers, cloth folds). Never flat shapes, never cute blobs. Legends bosses meet the same bar
   (raids must not make them look lackluster).
2. **Silhouette and concept first.** Reads at 120 px (64 on the map), fills its frame, seen from below, bleeding past
   the edges. The owner must be able to NAME the creature at a glance ("i love phase 3 but i don't understand what the
   boss is trying to be"): one clear silhouette idea per boss.
3. **BIG in frame, always. Variety never comes from zooming out.** A full-body or far shot shrinking the face to a few
   pixels was rejected every time (rat king, sugar queen, showman). Head and torso fill most of the frame.
4. **Each raid phase is a new picture: new CAMERA ANGLE, HEAD ANGLE, POSE, FACE, LIGHT and COLOR**, often a new
   SETTING. Props swapped on the same crop, or the same pose recolored, is "lackluster" / "boring". Test: the three
   phases tell apart by silhouette alone at 120 px.
5. **Personality is constant across phases.** Escalate with status, scale, power and spectacle, never by turning a
   smug or sly character into a screaming maw. Approved exception (2026-10-03): phase 3 may change MOOD when it tells
   the boss's story, the character staying recognizable (the rat king's furious phase 3 was later redrawn smug; the showman's
   cool snapping into a manic grin). Ask the owner before doing this for another boss.
6. **The phases are ONE creature** ("they look like brothers", berserker): phase 2 is what phase 1 becomes when it
   breaks, phase 3 what phase 2 becomes. Keep head shape, eyes, signature mark, helm or crown; transform what makes it
   loved, never remove it.
7. **Distinct parts of one creature.** Repeated heads, minions or wings share the creature's features (eye color,
   skin, crest, brows, teeth) but each has its own character (size, shape, scars, expression, angle). Clones read lazy.
8. **The backdrop is subordinate.** Muted, darker, lower saturation, with depth; the boss is the brightest, most
   saturated thing. No rainbow bursts, no flat colored blobs or auras, no fake glows or hard light sticks.
9. **Faces:** mouths never where eyes go, no ring-shaped maws, no unibrows, no eyelash brows; teeth only where they fit
   the character (a smirk with a gold tooth beats a wall of teeth). Raid bosses terrifying or imposing from phase 1;
   Legends bosses vary in mood.
10. **Raid variants of loved Legends bosses go all out but stay recognizable** (same vibe and personality), and look
    clearly different from the Legends boss even in phase 1 (own costume, prop, setting, pose).
11. **Fire only where it belongs** (the arena knight has none). All-ages content (tasteful figures, no revealing
    designs), except where the owner asks otherwise: the Sugarplum Heiress's phase 3 has a deep V neckline with
    visible cleavage at the owner's request (2026-10-03), never explicit (fully dressed, no nudity). Don't raise it.
12. **Photo-real layers and gradients are opt-in per boss** (only the ophanim so far). Never on another boss unless the
    owner asks.
13. **Every change gets a backup and a before/after render**, and the owner gets an honest critique, not just praise.
14. **Phase 3 is the climax, never a letdown**: bigger, more alive and more spectacular than phase 2, as different from
    phase 1 as phase 2 is (ratking and showman phase 3 were sent back). An EVENT, not a pose. One dominant readable
    figure, never a pile of equal-weight parts.
15. **The true form moves the most.** Idle life grows with the phases; phase 3 has the most motion (a pet, a jaw, a
    sway, spilling props, smoke), big enough to read at 120 to 340 px, on different rhythms ("not enough movement on
    phase 3", ratking).
16. **Anatomy must survive a glance.** A limb bends at one clear joint from a shoulder or hip and ends on something (a
    foot planted with a contact shadow); cloth must not read as a leg; no stick arms, peg shins, stumps, double knees,
    blob legs, box fists or floating legless bodies (tempest phase 3 took three rounds). Held objects read instantly
    and are GRIPPED (fingers wrap in front), or are removed (a yellow blob in a fist, a gold disc in a mouth read as
    nothing).
17. **Shapes stay sleek, not blocky.** Heads and necks taper and curve (arrowhead skulls, waisted necks); straight
    parallel sides and coffin outlines read "blocky" (hydra heads). Never round, puffy or rubbery either.
18. **Necklines read clearly in every phase**; props, bands and pendants never hide them (the sugar queen's pendant).
19. **Abilities animate the boss itself.** An effect moves the boss's REAL parts (the ophanim's lids open and blink,
    the seraph's wings spread and eyes turn gold, the hydra's heads rise) and is rich, not bare bones (seraph Grace was
    sent back). It never covers the boss (no stand-in eye over the real one) and the boss never disappears for a frame.
    Parts an ability is about get hook classes in the SVG.
20. **Light files.** Keep shapes economical (the asset view and fights must stay smooth on a high refresh monitor); a
    reshape that bloats a file is redone with fewer points.
21. **Voices are part of the design.** Every raid boss has its own way of talking (see "Raid boss voices"); a redesign
    updates its lore and voice to match the art.
22. **"Badass" is the owner's word.** When in doubt push harder: meaner face, bigger silhouette, sharper materials;
    "more badass in every way" is a valid whole brief. Never cute where it should be fierce.

> **Retired raid boss: the Glutton (the Bottomless Maw).** Removed by the owner in 2026-10 ("i dont even like the
> concept of glutton"). Never draw, recreate or propose it again. It stays in `RAID_ROSTER` only as a `RAID_RETIRED`
> index; it has no art file.

## What the owner wants from Legends bosses and banners

- **Real bosses, super detailed**: glowing eyes, a maw, claws, spikes, scars, armor, cracks of light; never a smiley
  blob with teeth. Reads at 64 px on the map and rewards a close look at 190 px on its intro card.
- **Mood: RAID bosses are all terrifying; Legends bosses VARY.** "Raid bosses should look super threatening but normal
  Legends bosses don't all need to be mean looking. Some mean looking ones, but also variety." Pick the mood from the
  area (mean, smug, playful, proud, eerie, sleepy, regal, sad, comic-menacing), then check the set for a spread. Mean
  stays where the design calls for it ("if it makes sense for the boss design then yea keep it mean": dread knight,
  lava wyrm, three-headed hound). Not every one gets the angry V brow.
- **Every boss and banner truly unique**, not a recolor: silhouette and pose (bust, full body, winged, profile, rising
  out of something), what is behind it (spotlight cone, storm cloud, turning sun, smoke, crystal halo, never the same
  round glow), number and kind of eyes, mouth type (maw, beak, mandibles, carved grin, jaw of rock), the entrance.
- **Detail stays readable when small**: layered shading, highlights, texture strokes (bark, scales, fur, rivets,
  stitches), small story props, strong ink outline, clear shapes first.
- **Each banner is its boss's LAIR, with the boss present** and recognizable as the same creature (eyes in the dark,
  its silhouette on the ridge, a tentacle holding a wreck, its face in the cliff). As detailed and alive as the boss:
  layered depth (far silhouettes, mid scenery, a framing foreground), moving weather and light, a small story (a path,
  a bridge, ruins, a warning sign). Same rules as bosses (no blob atmosphere, effects attached to their source,
  contrast in both themes and every palette, the important things inside y 28 to 112). A banner and its boss are
  designed TOGETHER: a redrawn boss updates its banner.

**Legends moods and redesigns so far** (the full current designs are in `dev/legends-gallery/catalog.js`):
- **mountains**: stern, ancient, a MOUNTAIN not a man: the Wandering Peak, a colossal tortoise whose shell IS the
  summit. Rejected: the rock-golem face block with a crystal crown ("cartoon rock mask", no body), a serene old man
  with a moss beard (too close to forest).
- **forest**: PROUD and NOBLE, never horror: the Elder Hart, a whole winged stag looking at you, a furred face with a
  closed mouth, BROWN feathered bird wings ("make this more like bird wings": coverts, secondaries, separated
  primaries, not a recolored bat membrane), moss and a glowing spirit leaf (the tinted part). Rejected: "evil",
  "goofy", "hippie" faces on a tree, a trunk "tiki mask", a stag skull in a hollow with root-claw hands, and a creepy
  winged stag (skull face, fangs, tear streaks, glowing ribs, bone spikes, green bat wings: "make him less creepy").
- **garden**: gleefully, greedily hungry. The round flytrap with eye stalks "looks like a big ball": now a towering
  plant with a BODY (a hinged trap head on a thorny stem from a cracked planter). Never a round head again.
- **arena**: cold, silent, menacing shadow knight. Rejected: a holy paladin "too skinny" with armor "like a flag", a
  noble one "ugly af", a muscular one without nobility. "Even more badass" gave a crown of thorns biting in, blood
  running. NO FIRE on him or his lair ("no fire": sword flames, eye fire and "shadow fire" all removed); runes glow cold
  blue. Greatsword planted point-down, never held across the body.
- **arcade**: evil but OVERLY happy, giddy to destroy you (manic grin, crazed crescent eyes, cackling). A cute
  star-eyed version was rejected.
- **sewer**: smug show-off flashing gold grillz, two rat courtiers.
- **sweets**: the Sugarplum Queen, sickly sweet and scheming. The goofy gingerbread man was hated.
- **junkyard**: "make this guy more badass", twice: a cold, arrogant robot WARLORD of junked vehicles (the vibe of a
  tyrant transforming robot without copying any character), now HUGE, from far below, backlit by a blast furnace. No
  traffic cone.
- **mine**: "cute in a dangerous way": a chubby crystal-crowned axolotl with slit pupils, a sly smug grin, small fangs,
  a lit stick of dynamite; no scars, no jagged rows of teeth. Rejected: drill-maw mole-worm, dwarf king, blind
  leviathan; no dwarf, miner-person, mole or drill.
- **ocean**: eerily polite octopus gentleman ("a walking human like octopus thing"), monocle, tentacle beard, lantern
  lure.
- **savanna**: proud, regal, a little smug: the WHOLE lion at ease on Pride Rock, everything soft and round. The spiky
  lion head was "too pointy".
- **swamp**: royally BORED toad king slumped on a sunken throne (replaced the crocodile with a lantern lure); no teeth.
- **stage**: smug, theatrical, sinister but charming ("more interesting and get rid of the unibrow"): two separate
  brows (painted mask brow, demon brow where the mask cracked). Kept apart from the puppeteer raid boss: no
  marionettes, no square curtain box, no row of footlights.
- **space**: the Roost Moon, a great horned owl perched in a crescent moon, sharing the Lunar Strix's owl face.
- Others: sakura enigmatic, sky playful, ice haughty, jungle smug, graveyard melancholy, crystal insufferably smug
  (three conceited heads), fungal drowsy and dreamy.

## The boss recipe (what made the 2026-09 raid redesign land)

The first raid bosses were "boring, uninspired and weak" (small figures in empty space, one neck, a boxy robot, a
skeleton in a robe, a lion like a house cat); the redesign got "YESS, much better". Every boss, Legends and raid, is
held to this. Worked example: `docs/raid-bosses-plan.md`.

**Plan before drawing**: per boss, the idea in one line, the backdrop, the face, what each phase (or the intro) breaks,
grows or opens, the idle motion, the SVG entrance beats and the card entrance. Every boss's answers differ.

**Size and presence**
- **Fill the frame and bleed past it** (horns, fins, wings, fists run off the edge into the 20% headroom). A figure
  floating small in its box reads weak whatever its detail.
- **Shoulders wider than the frame, seen from below**: low horizon, big upper body.
- **A backdrop that is part of the boss** (a maelstrom it rises from, a gear halo, a rune circle, a black hole's disk),
  animating on its own rhythm, never a plain glow.
- **Bosses look AT the player.** Bodies may be side or three-quarter for action, but HEADS turn to the camera (Zeus:
  "make the enemies focus on the user").

**Faces sell menace** (raids and mean Legends bosses; check at 420 px first)
- **Angry brows**: ONE solid bone or armor ridge in a V angled down to the middle, or a V visor slit. Thin brow
  wedges with a line through them read as eyelashes; round or browless eyes read friendly.
- **Slit or burning eyes** with a glow halo (same shape bigger, 0.4 to 0.5), a slit pupil, a tiny white hot spot.
- **Angular skulls**: faceted cel-shaded planes (a `#000` shadow plane at 0.2 to 0.3, a lit plane at 0.3), cheek
  spikes, swept ridged horns, plate or scale texture. Pointy beats rounded for teeth, claws, spikes (rounded teeth
  were reverted), but a design made only of spikes reads "too pointy": show a body when the creature has one.
- **Mouths**: one bold jagged opening, a dark inside, a glowing throat, a few BIG fangs, a jaw that moves. Not a thin
  slot with tiny teeth, pink squiggles, or a ring line across it. Small round mouths read as EYES at game size.
- **Eyes have a limit** ("void has too many eyes"): a few big ones over a sea of dots.

**Materials read as materials**
- Metal: rims, rivets, a lit edge line. Fists are gauntlets with knuckle plates and curled fingers, not boxes. A chain
  is interlocking LINKS (a ring and an edge-on bar alternating), never stacked ellipses (springs).
- Scales, fur, bone and robes get texture strokes kept inside their shape (the overdraw rule).
- Wings: lit panels between struts with a light edge (a dark wing on a dark sky vanishes); a wing of something real
  is built like it (feathers: coverts, secondaries, primaries).
- **Contrast against the backdrop in BOTH palettes.** A dark membrane on a dark sky, a translucent wraith over a busy
  rune circle all vanished: fix with a lit rim, a brighter mid-tone or a glow copy behind.

**Every phase is a transformation with a story** (raids; a Legends boss's rage too)
- Phase 1 controlled (sealed armor, one power). Phase 2 hurt and WORSE (armor cracks on molten veins, a cut neck grows
  two heads, more eyes open, the face rages). Phase 3 the true form (a skull under the split helm, a wraith hood
  framing the scene, a jaw unhinged to the chest), colors hot.
- Damage and menace only ESCALATE (a phase 3 with fewer teeth than phase 2 was caught; a phase 2 hourglass needed more
  cracks). Nothing only "added": something breaks, grows, opens or turns on.
- A new element READS at 120 px: big, bright, framed (a ghost face behind the figure showed only pale blobs; redrawn as
  a hood around the frame, it worked). Pick the two or three changes that tell the story and make them big: stacking
  ghost robe, fishbone ribs, rectangle mouth and scythe on the lich read "mega weird".
- Effects are ATTACHED to their source and move with it (flames rooted in the eyes they pour from, drips from the
  gash, sparks from the core), never floating loose.

**Motion with character**: every head, limb, flame on its own rhythm; idle is slow and small (the rex's twitchy arm
was rejected), big motion belongs to the entrance; teeth hold still unless the whole jaw moves. Own SVG entrance beats
and own card entrance (see Motion).

**No hard edges from the frame**: bands spanning the width (cloud layer, floor) end in organic shapes inside the
headroom, or they show as a rectangle when the boss scales in. Nothing cut off: measure every animated part's outline
over the idle loop (widest moment, not at rest) and keep it inside x and y -22 to 142 (seraph wings were sized so).

**Parts join organically**: no seam where a tentacle beard meets the face, no loose decorations on a forehead (blue
circles on the ocean boss were "weird"); accessories read as what they are (the banshee's bells read as "weird green
hair that floats").

## The owner's vision: approved and rejected

**Approved (do more of this)**
- Phases that change the creature: a head cut off and two growing back, armor bursting open on a molten core, a helm
  splitting on a skull, a crown shattering into orbiting shards, bony legs where the robe burned away, waterspouts
  rising from a whirlpool, a bolt striking the crowned head.
- **The face changes every phase** (the owner's idea). Lich: calm eyes, then a V brow ridge narrowing them, then
  blazing wide eyes over a dropped jaw. Titan: sealed visor, then the grille torn off a snarling molten mouth with
  flames from the eyes, then a split helm on a molten skull.
- Chunky, colorful, readable shapes with a strong outline, a darker depth edge and a highlight.
- Owner reference images are the brief: match their palette, materials, structure and mood in the flat cel style.

**Rejected (never again)**
- Flat semi-transparent color blobs or auras behind a boss (they read as stains). A glow is only the bright copy of one
  shape (an eye, a flame core).
- Labels or tags over the boss (the PHASE tag sits under it) or anything hiding the transformation.
- **Nose rings** ("I hate nose rings"); no piercings.
- **Circular spinning ring maws** (the lamprey or spiral tooth disc became a cliche). Each boss gets its own mouth.
- A sword in the hands of a raid boss (it boxes the pose in).
- Fire out of the eyes as a default: it worked rooted IN the visor slit (titan, castle knight), was removed from the
  frontier rider and the inferno. Use rarely.
- **Handsome means HANDSOME** ("ugly af" on a noble knight): a chiseled face, good proportions, layered armor, not a
  small flat head on a flat torso.
- A fierce boss that reads soft or flowery (a tree spirit went "goofy", then "hippie").
- Rejected concepts stay rejected. When the owner rejects a design twice, offer a sheet of distinct concepts.
- Ebi drafts far from the current Ebi ("way too different") or low detail ("a shitty low quality version"): variations
  are polished and only a little different.

## How the owner wants RAID bosses made (2026-10: "i love the new raid bosses")

**Art is half of it.** How the fight FEELS is the other half: nine unique impact moments per boss, a dramatic themed
knockout, power effects in the lower half never over the face, numbers from the game, fair crafted health and hearts.
Read "The owner's vision for the FIGHT" in `docs/raid-bosses-plan.md` before making or redesigning a raid boss.

The owner loved the third and fourth waves (leviathan to dreamer) and the 2026-10 redraws of lich, chimera, hydra,
titan, void and seraph. On top of everything above:
- **"Super crazy bonkers", "like WTF is that".** The most extreme drawings in the app: a creature nobody has seen, not a
  big Legends boss.
- **Detail is the point**: a 30 KB raid boss reads lackluster beside the set (today 124 KB void to 761 KB ophanim,
  kitsune 167 KB), but every addition must read at 120 px; cut what muddies the small read.
- **The backdrop fills the frame and changes with the phases** (a crypt throne of skulls, a foundry crucible, a black
  hole's disk).
- **Terrifying from PHASE 1**; the phases make it worse, not scary for the first time. Phase 3 is a true form, nearly a
  different creature that is still the same one.
- **Each phase a different POSE** ("Kitsune raid boss is a good example of phase variation"): phase 1 enthroned or
  composed, phase 2 lunging, rearing or arms flung wide, phase 3 a new silhouette.
- **Raid variations of loved Legends bosses** ("I LOVE THE DESIGN AND CONCEPT ... make a raid version that goes ALL
  OUT"): heavily inspired, NOT a copy. Keep the DNA (theme, loved signature props, palette, lair, PERSONALITY), redesign
  the creature (body, face construction, silhouette, bigger, crazier). The first rat raid was "too similar to the
  normal boss"; the second became a gritty plague warlord and "does not look pimpin like the regular boss".
- **"Inspired by X" does not mean drop what made X loved.** The first Thousand-Eyed Judge kept only "an angel" and lost
  the eyes ("where is the scary eyes and dangerous white celestial figure???"). Keep the loved signature, change the
  rest.
- **A beautiful boss stays beautiful** (the first kitsune: "very ugly ... compare it to sakura being so beautiful"):
  grander and more dangerous through scale, light and stillness, never by uglifying the face.
- **The ability shows in the art** (hydra's regrowing heads, titan's plating, the lich's phylactery in every phase) and
  has its own fight effect (`src/features/legends/fx/<motif>.jsx`).
- **Unique against the whole set**: silhouette, palette, backdrop, face, entrance movement.
- **Phase layers** (switched by the arena's `data-phase`, BossArena CSS): `lg-p1` phase 1 only, `lg-p2` / `lg-p3`
  shown from that phase on (start `style="display:none"`), `lg-p12` gone in phase 3. A phase redrawn as a whole scene
  wraps phase 1 in `lg-p1`, phase 2 in `lg-p12 > lg-p2`, phase 3 in `lg-p3`, each with its own backdrop, face and
  fx/ability layers. To hide a SHARED layer in some phases (a floor drawn for all), copy it into `lg-p1` and `lg-p3`
  groups instead of painting over it.
- **Process**: one agent per boss with a written plan (the brief lists these rules and the checks), a generator script
  kept OUTSIDE the repo, renders of every phase, vitest and `check-art.mjs`, then the owner looks in the asset viewer
  (Raid bosses tab: phases and every ability effect).

## What the 2026-10 review rounds taught

The cases behind the top rules, per boss (Legends and raid). Each lesson applies to every boss.
- **Rat king (`raids/ratking.svg`)**: a snarling phase 2 and a roaring phase 3 made of a muddy mass of rats were
  "terrible": "MAKE THIS RAT KING SMUG AND COOL THROUGHOUT THE WHOLE THING". Then "phase 2 and 3 aren't different
  enough ... different face too ... still smug tho"; then zooming out to a full figure or a small figure on a throne
  "look absolutely terrible" (stick legs, a blob claw, a lost face); then a plan escalating props around phase 1's head
  was "phase 1 plus stuff". What landed: BIG every phase with new camera, head angle, hands (a foreshortened claw at the
  viewer, a goblet), light and a new setting with its own palette (emerald and gold vault; magenta, cyan and black neon
  casino; all gold on purple treasure temple). A crowd is a few posed figures or one ordered structure, never a mass;
  small figures stand on something ("why are the mice floating"). A true form must not REPLACE the character: a gold
  statue rat read as "a gold cat statue"; his hoard rising as a gold dragon coiling round him landed. Sketch three
  120 px silhouette concepts per phase first. 2026-10-03: phase 3 low angle, chin up, a gold wyrm pet, violet treasury,
  then much more idle motion. 2026-10-08 "phase 3 is bad" (that wyrm scene, then a furious version: a cluttered mess,
  small lost face): redrawn as one clear picture, the smug Gold Emperor on his vault throne (big face, chin up, crown,
  scepter, goblet toast, coin rain); its head then read as jagged grey slabs (an oversized mirrored copy of phase 2's
  head with the shades removed: the far eye sat alone on the snout ridge, the crown and scepter ran off the frame).
  2026-10-09 "different design for phase 3", then "make this guy a chad on phase 3": the Chad Emperor, a poster shot
  from below (V-taper, bare furry chest, flexing bicep, fist on the hip, square stubbled jaw, shades, the calm "yes."
  smirk); the first chad drew a new long-snouted head in cold grey and "looks like a different character entirely", so
  phase 3 now REUSES phase 2's head markup and phase 1's paws, chains and henchmen in his warm palette. Keep one
  character by reusing the loved parts, not by redrawing them from memory. Small figures at the bottom edge stand on something that
  runs into the bleed (the arena shows below y 120). A rat is a wedge (long snout, nose at the TIP, high thin round ears, buck teeth); the
  sewer kingpin's round head and short muzzle read as a cat. Check the species at 120 px first. A bare chest is lit
  from the scene (here the gold hoard: warm bounce under the pecs and arms, cool shadow side, gold rim), with pecs,
  obliques and rounded ab PADS, never a flat grey slab ruled into boxes; a flexing fist shows its knuckles to the camera.
- **Infernal Impresario (`raids/showman.svg`, from stage, "I LOVE THE DESIGN OF STAGE ... GOES ALL OUT")**: keeping the
  parent's bust, costume and stage read as the parent through v1 to v6; a hellfire circus ringmaster was too close, then
  a flat red devil melting into his tent. Then "do a different magic trick per phase and also redesign the character",
  on a transparent background. Then (v9): a tall ash-grey demon conjurer in an emerald sequin tailcoat (the tinted part),
  one trick per phase: Ember Doves, the Levitation (cold mean face), the Infernal Encore (sawing himself in half, the
  manic face). A trick per phase gives each phase its own silhouette and event. Lessons from the passes: a full-figure
  phase needs a WHOLE body ("it's almost as if his lower body doesn't exist": 3.5 to 4 heroic heads tall, waist, hips,
  legs, shoes, coat tails behind the legs, a contact shadow); props carrying the concept are ARTIFACTS (masks with
  filigree, gems, carved brows), unique designs not recolors; "PHASE 3 IS REALLY UNEVENTFUL" on a frontal bust: a final
  phase is an event (diagonal action, something breaking open, things flying, foreground debris, idle that keeps it
  happening). v9 then got "the character looks weird ... what happened to him swapping masks for phase 2? ... phase 3
  has 2 of the same character ... looks broken" (thin stretched limbs, small head, odd bare hands, a ghosted second head
  and a sawn box read as two of him). v10: a big bust every phase (head ~1.3 to 1.4x, thick tapered sleeves with a round
  elbow, white gloves with claws through the tips, masks on gold batons or floating), ONE character per phase; the
  masks are the act: the Overture (presenting), the Swap (an earlier draft's mask carousel the owner remembered: masks
  float mid switch and the idle swaps them across his face), the Grand Finale (spotlights, card fan, masks raised like
  trophies, still smug). Never draw a second copy of a character's head or body as a "trick".
  2026-10-09 "this guy looks like a soyboy ... redesign him from scratch": the grey horned elf (narrow chin, long thin
  neck, wide doll eyes, small features, timid smile, tube arms, the same flat pose three times) was thrown away. v3 is
  a human-shaped ringmaster villain: a strong angular face (heavy V brows over deep-set glowing eyes, sharp cheekbones,
  a square stubbled jaw, a waxed moustache), a tall top hat, broad epaulette shoulders, thick sleeves and gloves that
  grip; Overture (straight on, footlights), Swap (dutch angle, brim pulled low, masks held at face size and swept
  across it), Grand Finale (scarlet quick change, cane crackling, card cascade, orbiting glowing masks, fireworks).
  The first v3 pass was then "broken": gloves floating with no sleeve, tube arms rising behind the head like
  antennae, epaulettes stuck on as separate blobs, flat sticker masks pasted at odd angles, and "phase 3 is boring af".
  Fixed by building every arm as one limb (shoulder, upper arm, elbow, forearm, cuff, glove; the forearm drawn over
  the upper arm, the epaulette sitting on the shoulder top), masks as thick rimmed carved plates HELD in the fist, and
  a phase 3 that is an event with layered motion. The next review still found a head and neck that read as one block
  (a jaw as wide as the temples on a neck as wide as the jaw), phase 3 masks pasted ON the epaulettes, a mask cropped
  by the frame, a hat crown lost in a dark backdrop, a mask covering the face most of the loop and on every strike, and
  three phases that matched in silhouette. Fixed with a jaw that narrows to the chin, cheek planes, ears and a neck
  narrower than the jaw (tendons, a cast shadow under the jaw, set into the collar); a rim light on the hat against
  dark backdrops; masks that FLOAT above the hands with a gap, an aura and trails; strikes that whip the arms OUTWARD
  so a flung mask drops low; and a camera per phase that changes the outline (upright, tilted lean, arms up in a V).
  **Never give a villain a soft, weak, pretty-boy face**: a narrow chin, a long thin neck, big doll eyes, small features
  and a timid smile read as weak whatever the costume. A villain needs a strong jaw and brow, eyes in shadow that
  glow, a confident smirk, thick limbs and hands that hold something.
- **Sugar queen (`raids/sugarqueen.svg`)**: one front half figure with a scepter, a sword, a halo was "boring"; a leap
  and a float keeping her head the same size in the same place still "need to be more interesting"; a small figure
  surfing a caramel wave was "too far away". The fix is a new camera ANGLE and pose at the SAME closeness. A villainess
  sells through face, styling and attitude. "The castles and background are too colorful": dusk plum, mauve,
  chocolate, small warm accents, farther = lower contrast. "Her hair is too long": a short styled cut; hair keeps one
  identity across phases (may whip or float, never grow). Her phase 3 pendant hid the neckline.
- **Hive empress (`raids/swarmqueen.svg`)**: phase 1 with cracked eyes and two fire bursts "isn't different enough".
  The redraw changed the BODY PLAN (sprawled wide and symmetric over her egg sac, then rearing tall on a tilt, gaster
  curled with the stinger at the viewer); same red eyes, V brow and crown.
- **Banshee (`raids/banshee.svg`)**: phase 2 was phase 1 plus frost stars, phase 3 the same crop with the face split
  ("more variation"). Redrawn as whole scenes, then an audit (2026-10-09, 4/10) found a long oval maw in all three
  phases (too close to the banned ring maw), tube arms on ball shoulders with floating claws, flat ice-white shading, a
  square inset and an arch. Rebuilt from scratch as one gaunt veiled woman: the same head construction in every phase
  (one generator function, so it can never drift), a real mouth whose EXPRESSION changes (moan, shriek, sneering wail),
  arms drawn as one continuous sleeve outline that bends at the elbow (outer contour rounds it, inner contour creases),
  every backdrop a full scene (organ loft, storm-burst nave, flooded ruin from below). Lessons: a scream reads from lips,
  teeth, a stretched face and nose folds, not from a hole's size; a pale figure needs a mid-dark gown or a backlit rim to
  separate from a teal or violet backdrop; small ghost minions turn cute the moment they get round eyes and smiles
  (hollow sockets and long mouths keep them eerie); a busy pipe backdrop must be darker than her.
- **Hydra (`raids/hydra.svg`)**: heads "all look too different, the eyes are different color", then "all the snakes are
  too similar to each other in every phase", then blocky coffin heads (2026-10-03). Shared features, then per-head
  character through skull and gear (snout length, view, horns, scars, frill, barbels, tusks, expression and pose),
  tapered skulls on waisted necks. Each head nameable by silhouette at 120 px.
  2026-10-09 "redesign the hydra entirely and make the head thing a priority": rebuilt from the heads out. Six fixed neck
  roots filled in order (King centre, inner pair, a low front head, outer pair), the same slot on the same root in every
  phase, a seared stump at every root a cut head leaves; heads are small faceted 3D meshes so each phase's camera and
  light turn them. The old art bolted heads onto each phase (the young head sat on a different neck per phase, extra
  heads left no stump, sideways necks sprouted from mid neck): never again.
- **Chronos (`raids/chronos.svg`)**: an audit (2026-10-09) graded it 3.5/10: segmented tube arms coming out from under
  pasted-on bells with fists floating at the sides, phases 1 and 2 the same picture with cracks, phase 1 nearly static,
  empty dark corners, phase 3 the same face crop. Redrawn from scratch from ONE set of parts (a generator places the same
  head, torso, bells, arms, hands and key per phase): an arm is upper arm, a cog at the elbow, vambrace, gauntlet, and
  its pauldron bell sits ON the shoulder (on a raised arm the bell goes behind it, never a cup the arm grows out of); a
  hand always does something (grips the key, cups sand, thrusts a HALT palm, raises an hourglass); a signature prop (the
  winding key) carries through all three phases; each phase is a new camera and setting (front at dusk, dutch angle in a
  storm, from below under an eclipse). Lessons: a brow made of clock hands must sit ABOVE the eyes or it reads as
  glasses; a palm needs its fingers rooted at its top edge or it reads as a cup; compose inside 0 to 120 (small still
  tiles show only the frame), let only extremities bleed.
- **Zeus, the Thunder God (`raids/tempest.svg`)**: "make zeus more muscular and handsome": V-taper (broad deltoids,
  pecs with a hard shadow, six-pack, obliques), thick arms, strong neck, a handsome face with real irises and a
  confident half smile, a beard short enough to show face and chest; outline only the outer arc of the deltoid or he
  reads as an action figure. Glowing visor eyes with a scowl read as a mask. Phase 3 riding: a figure on top of a
  head-on dragon "doesn't look like he is riding it"; mount in profile charging across, rider seated BEHIND the head,
  thigh along the neck, foot hanging below, one hand gripping, hair and cloak streaming; heads turned to the viewer.
  2026-10-03: a broken leg and unreadable held objects took three rounds (a short kilt, two bent bare legs on a serpent
  coil, a big gripped thunderbolt, a ball of lightning).
- **Thousand-Eyed Judge (`raids/seraph.svg`)**: a redraw into a calm cowled judge in a heavy robe was "lame" and "too
  bulky". Raising an older boss to the new bar means re-RENDERING it: keep the loved silhouette (tall, spiky, airy, many
  limbs, negative space), upgrade shading and structure, fix only what was wrong (a mouth under the eye became a gold
  mask plate; thin spider sticks became fewer, shaded bones). The one head eye stays in phase 3 (the owner asked for it
  back when a maw replaced it). Check effect faces: a closed lid drawn as a curve with lash ticks read as a grinning
  MOUTH; keep the whole almond, lid lowered. 2026-10-09 audit (3/10: a small figure in an empty frame, stick arms with
  ball joints ending in floating eye-orbs, cages hanging from nothing, a phase 3 that became a burning wheel with one eye
  like the ophanim): rebuilt from scratch as ONE big judge per phase (cowl, eye, mask, thorn crown, halo, crimson robe,
  six eyed wings, the Scales of Judgment it is named for). Arms that read: a gauntlet FIST gripping the scales' post or a
  lantern handle out of a crimson sleeve, a raised arm whose sleeve has fallen to the elbow on a porcelain vambrace,
  praying hands in phase 3; generic tube-limb arms read as sausages and were thrown away. White parts need value
  separation: white hands vanish on white wings (crimson sleeves and robe behind them), and a white pointed hood alone
  reads as a cone, so porcelain blades sweep out from its sides like a helm's wings. The ability is read on the drawing's
  own scales (wrath slams them, grace tips them, mercy swings them level), never on a ghost copy in front of it.
- **Hound of the Last Gate (`raids/cerberus.svg`)**: "svg looks broken too on this one and all phases are too similar"
  (three heads crammed side by side in an arch, slab bodies, a cropped jumble with a giant paw and a flat red circle,
  phase 3 the same row of heads again). Redrawn 2026-10-09 as one hound with three necks out of the shoulders, three
  heads on one 3D skull with their own features, and a different arrangement per phase: a resting triangle, a dutch
  lunge with a paw at the camera, a crowned fan from below. A multi-headed creature tells its phases apart by WHERE
  the heads are, not by what they wear: a row of heads in two phases reads as the same picture.
- **Divine bosses are perfect and omnipotent** (the Wheel of Eyes, `raids/ophanim.svg`, from the owner's reference
  images): an immaculate central eye, interlocking rings studded with eyes, layered parchment-feather wings, a white
  void, overwhelming scale. Serene and flawless is scarier for them than a snarl.
- **Lunar Strix (`raids/moonmaw.svg`)**: "i love the idea of a MOON boss but this design ain't it. redesign from
  scratch": a cratered ball with one eye and tentacles read as a pale Void and copied the Legends space boss. A loved
  theme on a weak creature becomes a new creature whose signature part IS the theme (the moon as an owl's facial disc,
  moon phases as the phases: silver, blood red, eclipse black and gold); check the set for the silhouette first. Moon
  readable above the brows (one V ridge, a narrow forehead wedge), craters soft and unoutlined (never extra eyes).
  2026-10-03 "doesn't look like an owl" (a round plate, then a heraldic shield): an owl reads from a two-lobed facial
  disc with feather-edged rims, two big round forward eyes (brow ridge cutting their tops), a short hooked beak in
  bristles, tall ear tufts. Stuck-on owl features or owlets peeking from craters read as an odd hybrid.
- **Liked concept, disliked character = redesign the character, keep the concept** (kaleido, chronos, tempest: ability
  and theme stay). "Redesign completely" means a new silhouette, pose and face. A color note is part of the brief
  ("more yellow because of lightning").
- **"Mutant" is not "creepy"** (the forest hart): a proud or noble boss gets no horror shorthand (skull face, snarl,
  tear streaks, exposed ribs, spine spikes); keep the strangeness in its SHAPE, give it a living face and details.
  Colors carry mood (green bat wings alien, brown feathered wings of the forest).
- **One creature, one set of features across phases** (the lich's phase 3 skeleton got the lich's own skull).
- **Anatomy and focus**: arms bend at an elbow from a shoulder ("arms are weird", ice); a hand doing something specific
  (clawed into its own chest, vampire) beats a hand flung out; eyes on stalks like a snail beat little eyes dotted
  around a face (lab).
- **A mouths boss** (since retired) read as "a monster of eyes": mouths are few, big, unmistakable slashes with teeth.
- **2026-10-03, also sent back**: a stand-in eye covering the ophanim's real eye; seraph Grace "bare bones".
- **Mirror Knight (`raids/kaleido.svg`, 2026-10-09 redraw)**: the audit found a faceless great helm, reflections that
  were flat copies, and a phase 3 that became a different flat knight with tube fingers and a stuck-on sword. Lessons:
  a helmed knight still needs a FACE the owner can read (here a living silver mirror face framed by cheek guards, the
  helm's brow plate as the angry V); a reflection reads as a reflection when it is MIRRORED, recolored as glass (darker,
  cooler, the fire kept warm) and its motion lags his (phase-shifted copies of his own loops), not when it is a pasted
  duplicate; arms are plate (rerebrace, a pointed couter, a flared vambrace with lames and a gold band), never a tube with
  a ball joint; a theme boss's phase 3 shows the theme (the hall becomes a turning kaleidoscope and his echoes flank him)
  instead of burying it under flame wings; ability overlays aim at the part the ability is about (his chest prism), never
  the face. The drawing comes from a generator (`.scratch/redraw-kaleido/`): parts are functions reused by every phase,
  so the three phases stay one character.

## Raid boss voices (what the owner wants when a boss talks)

Voices live in `src/features/legends/raidVoices.js` (persona per boss + `RAID_VOICE_RULES`), lore in
`lg_raidLore_<motif>`. They drive the taunts a boss says when the learner misses.
- **Every boss is its own character**: its own register (deadpan, comic, petty, quiet, formal, loud...), sentence
  shape, nickname for the learner (or none), word for a mistake, signature habit. No shared templates, openers,
  nicknames or distinctive phrases across bosses ("all must be unique"). If two personas could swap names unnoticed,
  rewrite one.
- **Not cheesy.** No stock villain talk ("delicious", "how sweet", "foolish mortal", gloating about eating or owning the
  learner, a pet name in every line).
- **Easy to understand.** Short (1 to 2 sentences), complete plain sentences: no fragments ("Eighty. The open door.
  Wrong." made no sense), riddles or archaic wording.
- **Never technical.** The joke is about the mistake, told with one everyday image; the neutral feedback note does the
  correcting.
- **Any subject.** A line works for a CompTIA, pilot license or language miss alike.
- **Mock the mistake, never the person.** PG; the missed question may be mentioned, an upcoming one never.
- **Matches the art.** A redesign updates persona and lore (the hydra has six named heads, the seraph wears a porcelain
  hood, not a mask). Live taunts never repeat a boss's recent lines.

## Process and checks (before the owner sees anything)

1. Plan per boss (see the boss recipe).
2. Draw, render ALL phases side by side at 300 and 120 px on dark AND light, and look. Does each phase read as a
   different moment? Does the face change? Anything floating, flat or weird? Fix, render again.
3. `npx vitest run src/features/legends` and `node dev/legends-gallery/check-art.mjs` (0 failures, no new warnings).
4. **Triple check** (asked for on every boss, raid boss and banner):
   - **Check 1, the drawing:** each asset alone at 420, 190, 120 and 64 px, dark and light, at rest and at a few
     entrance moments. Face right for its mood? Anything floating, flat, cut off, invisible on one theme, or moving for
     no reason? The second pass (sharper heads, real chains, a readable wraith, lit wings) is where "good" became
     "great".
   - **Check 2, the set:** a contact sheet of the WHOLE set (all bosses, or all raid bosses with their phases). Does
     any look like another (silhouette, backdrop, face)? Any weaker than the raid bosses? Do several share a habit
     (the same rectangular frame, glow or pose)?
   - **Check 3, in the app:** the intro card with its entrance, the fight arena, the map icon, the asset viewer, plus
     the tests and `check-art.mjs` after the last fix. Fix what any check finds, then run all three again.

## The current set (40 motifs)

The one list, a line per motif (boss, idea, entrance, lair), is `dev/legends-gallery/catalog.js` (a test keeps it
equal to `MOTIFS` in `src/features/legends/map.js`). Read it before adding a motif and add the new entry there. Raid
bosses: 26 active in `RAID_ORDER` (`src/features/legends/raid.js`), one file each in `raids/`.

**Every entrance is completely different**: no two bosses share a MOVEMENT, not only a keyframe name. A new entrance
tells the boss's own story (a kitsune blinks left, right, then appears; a poltergeist billows up like a sheet; a rex
leans in head first and roars). Set a pivot with `origin` when it matters. A new motif gets an idea none of the forty
uses.

## Technical rules (enforced by `src/features/legends/art.test.js`)

- **Sizes**: boss `viewBox="0 0 120 120"` (square; shown 64 to 190 px). Banner `viewBox="0 0 400 140"`, shown on the
  map at 620 x 132 and cropped (`slice`): only about **y 28 to y 112** is visible, so the boss's presence, focal point
  and story props go in that band. (The gallery shows both the map crop and the whole drawing.)
- **Plain drawing only**: shapes, paths, groups. No `<script>`, `<style>`, `<image>`, `<use>`, `<a>`, `href`, event
  attributes, and **no `url(...)`**: no gradients, patterns, filters, masks or clip paths. Depth comes from LAYERS: a
  shape, a `#000` shape at 0.15 to 0.3 for the shadow side, a `#fff` or light shape at 0.15 to 0.4 for the lit side, a
  glow halo (the same shape bigger, bright, 0.3 to 0.45).
- **No `id` attributes**: a file is inlined many times on one page.
- **Realistic opt-in** (only `raids/ophanim.svg`, "make this guy hyperrealistic"): files in `REALISTIC_ART` (art.jsx)
  may use local gradients (`<defs>`, `id`s, `url(#id)`; no filters, the sanitizer strips them); art.jsx renames the ids
  per mounted copy and art.test.js checks every reference stays local. Never add a file unless the owner asks.
- **Photo ophanim (an experiment)**: eye, wings, wheels, cloud bed and holy light are real photographs. The SVG only
  marks the places (empty `lg-photo-*` groups carrying their own transform; painted parts they replace tagged
  `lg-photo-hide`); `withPhotoEye` (art.jsx PHOTO LAYERS) injects the fixed sprites
  `raids/ophanim-{eye,wings,rings,cloud,light}.webp` after sanitizing. Each photo sits inside the painted part's motion
  group, so flaps, wheel spins, cloud drift and the gaze still play; each wheel is split into back and front halves to
  pass behind and in front of the eye. Phase and ability layers stay painted on top. The eye is masked to an almond
  with thin lid rims, framed by the wings (a porcelain bezel plate was rejected). Sky and light are HTML layers (PHOTO
  LIGHT: screen blending and blur); the painted backdrop is hidden. Revert: delete both blocks and their uses and the
  five webps, restore the painted `ophanim.svg` (backup `ophanim-backup-before-photo-eye`). Never put `<image>` or a
  URL in a file.
- **Colors** (palettes repainting whole bosses made some unrecognizable): paint every boss, banner and raid boss in its
  OWN ideal FIXED colors (palette `original`). A palette recolors exactly ONE part per boss: the least intrusive part
  still clearly noticed (fire, ice, a gem or orb, an aura, runes, a cape, crystals; never skin, face or body), using
  `var(--lg-tint, #orig)` (mid), `var(--lg-tint-hi, #orig)` (lit), `var(--lg-tint-lo, #orig)` (shade), in the boss
  AND the same part of its banner (raid bosses: every phase layer). Check every palette, dull sand and steel included.
  Outlines use `var(--lg-ink, #1d2230)`. The old `--lg-sky/far/near/deep/accent/light` fail the test.
- **Outline style**: ink strokes 1.5 to 2.2 on big shapes, 0.6 to 1.2 on details, `stroke-linejoin="round"`.

## Motion

Motion is SVG animation inside the file. The sanitizer keeps only `<animateTransform>` and `<animateMotion>`
(`<animate>` and `<set>` are dropped) and drops `calcMode` (timing is linear; pace with `keyTimes`). So animate
`translate`, `scale` and `rotate` only. No fade: hide by scaling to 0.02, or move far off the canvas
(`translate 0 -200`).

- **`keyTimes` must have exactly as many entries as `values`, start at 0 and END AT 1**, or the browser silently drops
  the animation (a list ending at `.46` left a boss's eyes shut forever). Tested.
- `class="lg-in"`: the ENTRANCE, played once on the intro card. `fill="freeze"`, start at `0s` so the hidden first
  frame shows at once, finish on the resting pose. Typical beats: eyes open (scale Y 0.05 to 1.3 to 1), jaw opens
  (scale Y 0.2 to 1.25 to 1), limbs, wings or tail swing in (rotate from far out, overshoot, settle), horns grow, fire
  bursts. Main beats around 55 to 70% of a 1.4 to 1.6 s run, so they land after the card's own motion.
- `class="lg-loop"`: IDLE life, `repeatCount="indefinite"`: breathing, blinking, swaying, flames, drips, sparks,
  falling snow, drifting fog, sweeping lights. Bosses AND banners have it; banners have no `lg-in`.
- **The file's own attributes are the resting pose.** The app strips animation where motion is not wanted; what remains
  must be the finished boss. Never rely on an animation to put a part in its place.
- **Scaling around a point**: `scale` scales around (0,0). Wrap:
  `<g transform="translate(cx cy)"><g><animateTransform .../><g transform="translate(-cx -cy)">...</g></g></g>`,
  or draw the part around (0,0) inside `translate(cx cy)`. `rotate` takes its center in the values: `"20 60 64"`.
- **One animation per target.** An entrance and a loop on the same element fight; nest a `<g>` for the loop.
- **The card motion** (the whole boss moving in) is CSS in `BossArena.jsx`: `ENTRANCES[motif]` names a keyframe in its
  `CSS` block (optional pivot `origin`). It starts at `ENTRANCE.slam` and lands at `ENTRANCE.impact`, where the quake
  and shockwave hit. Every motif and raid boss gets its own keyframe (tested).

Where each mode plays (`art.jsx`, `animated` prop): boss intro card = `'intro'` (entrance + loops); fight arena =
`'idle'` (loops); map boss icons and the result screen = still; area banners on the map = `'idle'`. Reduced motion or
a locked area = still.

## How to make and check a new asset

1. Pick the idea (make it different from the catalog), sketch the layers back to front: backdrop, back limbs, body,
   front armor and details, face, mouth, front limbs, particles.
2. Write the SVG by hand (the Write tool; never a shell heredoc, which mangles backslashes).
3. Add the motif to `MOTIFS` in `src/features/legends/map.js` and the catalog, and its entrance to `ENTRANCES` in
   `BossArena.jsx` (with a new `@keyframes` in the `CSS` block).
4. Render in headless Chrome at a few moments (e.g. 300 ms, 1100 ms, 3000 ms) on a light and a dark palette. Look for
   parts hidden behind others, anything invisible in dark mode, empty areas in a banner, anything off-mood. Fix, look
   again.
5. Run the checks in "Process and checks", then check the intro card in the app. Bump the version.

## Review gallery (where the owner looks at the set)

All Legends art is reviewed in ONE place: `npm run dev`, then `http://localhost:3000/dev/legends-gallery/`
(`dev/legends-gallery/`, not part of the build). Every motif shows its real intro entrance (Replay), the idle boss, the
map icon, the locked icon, the banner at its true map size and the whole drawing, in light or dark and any palette.
Each card has Good / Change / Bad plus a note (kept in that browser); "Copy my feedback" copies the notes to paste
back. When the owner pastes feedback, fix exactly what it names, then re-check in the gallery.
