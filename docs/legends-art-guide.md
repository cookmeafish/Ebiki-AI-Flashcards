# Legends art: how the assets are made

Read this BEFORE drawing any Legends art (a new motif, a redraw, "make more bosses"): the owner's art direction plus
the technical rules the app enforces. Files: `public/assets/legends/` (`areas/<motif>.svg` banners,
`bosses/<motif>.svg`, `raids/<motif>.svg`); `public/assets/legends/README.md` is the short version for hand edits.
Raid bosses: the RAID BOSSES section first. Every boss: "Rules for every boss and banner". The sections after give
the details and the cases behind them.

## ⭐⭐ RAID BOSSES (read before ANY raid boss work, even a one-line edit)

**The goal:** every raid boss as good as `raids/kitsune.svg` (and `raids/ophanim.svg`), the GOLD STANDARD of quality
(a standard to match, not a side-by-side render test). **"Go all out" means QUALITY and IMPACT, never MORE STUFF.** No
time limit ("IT DOESN'T MATTER HOW LONG IT TAKES"); "good enough" is a failure; even a one-line edit gets the full
process ("EVEN EDITS TO A RAID BOSS SHOULD FOLLOW THE BEST QA").

### Why the Kitsune is the gold standard
The owner: "simple yet beautiful... clear background. simple yet elegant and beautiful design. It's easy to see what
she is doing and what is going on in the picture. her eye blinks once in a while to show that she is present. every
phase is very unique yet elegant and yet the user can easily tell its the same character but evolved. every animation
is also very unique and animated to give it a certain feeling." "there is detail on kitsune but its all very
intentional. the beauty is in its simplicity and beauty without compromising on detail."

What she does, concretely:
- **No background.** Only her own aura (nine tails, a thin gold ring, foxfire, petals), all part of her. Her
  silhouette is the edge of the picture; the app shows around it. No square tile, no scenery.
- **One bust, face centered, the same framing in every phase.** The face is always the focus.
- **A fixed anchor**: face construction, red markings, the bell, the purple kimono with gold crests. Every phase is
  obviously her.
- **SHE changes, the scene doesn't:**
  - P1 Courtly: one eye winking, fan at her lips, mask pushed up, soft pink tails folded. Sly and composed.
  - P2 Unveiled: mask cracked and hanging, hair whipped loose, a fanged grin, crimson tails flung wide, tipped in
    violet foxfire, a petal storm. Her true nature breaks out.
  - P3 Celestial: face and tails turn white-gold (the tails a corona of flame), a rope halo, a third eye, eyes of
    light, a serene closed smile; the purple kimono stays. Ascended.
- **The silhouette changes through her own aura** (tails: folded fan, flung spikes, flame corona), so the phases tell
  apart at a glance without moving the camera.
- **One mood and one palette per phase** over the fixed kimono: pink and red; crimson and violet; white and gold.
- **Intentional detail, all on her**: hairpins, markings, crests, the bell. Clean ink outlines, cel shading with few
  values.
- **Her magic is part of her**: foxfire, petals, sparks, a halo, few and attached to her. She shows her power without
  any scenery.
- **Calm presence**: slow tail sway, flickering foxfire, an occasional blink. Each phase's motion has its own feeling:
  playful, fierce, divine.
- **Beautiful AND dangerous**: menace through expression and power, never by uglifying her.

The ophanim (photo version) is the standard for QUALITY and PRESENCE: one centered subject (the eye in its rings and
wings), a soft light of its own and a cloud bed instead of a scene. Its glow and photo realism are its own approved
exception; the kitsune is the model for phase design. A background is not banned (rule 2): the Rat King's simple vault
and casino backdrops are approved.

### Rejected (2026-10-10): what the opposite looks like
The 2026-10-09 Showman, Rat King, Cerberus, Seraph, Kaleido, Chronos and Banshee redesigns and the new Headless
Horseman passed every check of the old rules (scene backdrops, a new camera and setting per phase, "detail is the
point", phase 3 "the most happening on screen") and were all rejected. Those rules are gone. They had 2,000 to 4,000
paths and 200 to 720 animations each.
- Chronos: "a ton of details crammed for the sake of details not an intentional art design. too much going on and its
  hard to say what is actually on screen. the background is overwhelming. Each phase is also not as impactful as
  kitsune."
- Banshee: "if the character is defined by her keyboard or organ pips or whatever keep it but... its hard to tell what
  is going on and too much background and phase 3 is just broken in general."
- Seraph: "i love the design of this seraph more but same thing with background and hard to understand what is going
  on and phase 3 just sucks and they aren't any significant changes per phase."
- Showman: "he jus looks like a regular guy. where are his powers?? his magic powers??? All phases look boring."
- Rat King phase 3: "looks like a different character" (twice: a new head, then the same head on a different body).

### The rules
1. **The character is the picture.** One figure, big, centered, the brightest and highest-contrast thing in frame.
   Its core (face, eye or heads) dominates; never a small full figure.
2. **A background only if it makes sense for the boss, and then simple and easy to look at.** The owner
   (2026-10-10): "it is not required for a character to have a fully clear background. If it makes sense for the raid
   boss to have a background then have a background." Approved example: the Rat King's vault ring and coin hoard (P1)
   and casino table (P2): simple, clearly his world, never disrupting him; "its clear what is going on". What failed
   was CLUTTER, not backgrounds: Chronos's, the Banshee's and the Seraph's were "overwhelming", "too much", "hard to tell
   what is going on". So: no background is a fine default (the kitsune), the boss's own aura always counts as the
   character, and a background, when the boss has one, is simple, muted, readable in one second, subordinate to the
   boss, and present in EVERY phase in the same spirit (a P3 without one beside a P1 and P2 with one breaks the set: the
   Rat King's P3 must get one too).
3. **Readable in one second.** One sentence per phase says what the boss is doing; one clear gesture per phase.
4. **Intentional detail, on the character.** Detail serves identity, expression or the phase's action; anything added
   "for detail" is cut. Simple is not plain: the character itself is finely made (her hairpins, chains, crests,
   markings). The boss's own magic counts as the character (foxfire, petals, sparks, sound), few and attached to it,
   never filling the frame. Defining props stay (the Banshee's organ, the Seraph's veil and single eye), kept simple.
   Path count is a warning light, not the goal: the kitsune is 787 paths and 138 animations for all three phases, the
   rejected redesigns 2,000 to 4,000; far past hers must be justified (`grep -o '<path' file | wc -l`).
5. **One anchor, everything else evolves.** Identical in all three phases: face construction, head shape, proportions,
   build, the face VIEW it is known by, signature features. Shared markup alone is not identity. What changes:
   expression, eyes, hair, costume, the signature prop transforming, the aura, light, palette.
6. **A significant change every phase, ON the character.** P1 composed, power held but visible; P2 the true nature
   breaks out; P3 the ascended or true form. New scenery, swapped hand props or only a new halo behind an unchanged
   body do not count (a Chronos whose ring became blades then a sun, over the same cape, armour and colours, failed).
   The BODY itself changes: face, colours, costume, silhouette. Keep one framing like the
   kitsune; a camera change is optional and never costs size or clarity. The SILHOUETTE differs per phase (costume, cape, hair, pose), not only colour: see test item 6.
7. **Each phase's silhouette changes through the boss's own aura or body** (tails, wings, flames, hair, horns), so the
   three tell apart at 120 px.
8. **Phase 3 is the most impactful AND the clearest.** The spectacle is the transformation (light, color, silhouette),
   never piling on things. Never crowded, twisted or broken; the face and the phase's key gesture are never cropped
   (aura may bleed off the sides).
9. **One small palette per phase** with one accent.
10. **A raid boss, not a person in a costume.** Its power shows ON it in every phase (glowing eyes, its fire, horns,
    wings, possession), escalating by phase.
11. **Elegant and strong.** A clean silhouette, graceful shapes, a confident villain face (never soft or pretty-boy).
    Threatening from phase 1 (menace can be a sly smile, like hers). Personality constant: escalate power, never
    temper. A beautiful boss stays beautiful.
12. **Anatomy connects.** Shoulder, upper arm, elbow, forearm, hand; necks grow from shoulders; hands grip what they
    hold. Never floating gloves, tube arms, pasted heads or necks.
13. **Bold concept, simple execution.** Nameable at a glance, unique in the set (silhouette, palette, face, entrance),
    its ability visible in the art.

### Animation
- **Idle = calm presence** (the boss feels alive and watching): a blink every few seconds, breathing, a slow sway of
  hair, tails, cloth and aura on layered rhythms; small fast motion (flame flicker, sparks) is fine, big motion is for
  the entrance and the fight. Not everything moving at once. Time-based SMIL only.
- **Every animation is unique and has a feeling that fits the character**: its own entrance, the nine impact moments,
  the attack on the player, a themed knockout, and each ability effect "crazy distinct", moving the boss's own parts.
  Effects never bury the figure or cover its face; nothing detaches, slides or pops.

### The Kitsune test (written out pass/fail before anything else; one fail = not done)
On the real asset view "Phase drawings" panel (all three phases), by the artist, the reviewer and the coordinator:
0. **Nothing broken (LOOK at the screenshot, every phase, then each face AND each hand zoomed in 3 to 4x).** Every feature where it
   belongs and only once: two eyes, glasses ON the eyes (a Rat King phase 3 shipped yellow eyes plus a tiny pair of
   shades on its snout and gold lines across its face), ears and limbs attached, hands that read as hands (not a
   box), no stray lines, holes, doubled or floating parts. It must look good and NORMAL at a glance. A render the
   artist never looked at counts as broken. Also make a HOLES map (pixels exactly the page background painted
   magenta): page showing inside the outline is a break (a Cerberus phase 3 had a hole between its necks and floating
   heads that every self-check passed). And an ARM check: every arm cropped at 4x, its parts named in order (shoulder,
   upper arm, elbow, tapering forearm, a hand gripping what it holds); a part you cannot point to does not exist (tube
   arms, sticks on balls and fists with no forearm failed six bosses in one pass).
1. Background: none, or one that makes sense for the boss, is simple and never disrupts it, in every phase alike?
2. One sentence per phase of what is happening.
3. Blur the screenshot 6 to 8 px: does the figure still stand out in every phase?
4. Every element not on the character listed with its reason; paths and animations against the kitsune's.
5. Same character? (faces covered: proportions and build; heads only: the face; personality the same)
6. A significant change per phase, on the character? Labels covered, can a stranger order the three phases and say what
   changed in each? **SILHOUETTE check** (owner 2026-10-10 on a Showman whose phases kept the same bust, hat, coat and pose: "they are too similar in each phase", "it needs to be more different each phase"): render each phase as a solid black silhouette at 60 px beside the kitsune's three; the shapes must be clearly different, and the pairwise silhouette overlap (IoU of the alpha masks) must be no higher than the kitsune's same pair. Colour, horns or a new halo over the same outline fail. Measure it ONLY with `node .scratch/raid-kitsune/silhouettes.mjs <motif>` (frame 0, committed kitsune, EACH pair no more alike than her same pair, entrances stripped; run it again with `--hide=<background selector>` when the boss has a background); hand-made scripts gave every artist a different kitsune number, and a highest-pair rule let the owner-rejected Showman pass.
7. Phase 3 the most impactful and the clearest?
8. Power visible in every phase?
9. Anatomy connects at 2 to 4x zoom; a confident villain face?
10. Exciting? Would the owner say "go all out" was met, or "boring"?
11. Would it hang beside the kitsune as her equal? Answered as the owner, never as the maker.

### Process (every change, even a one-line fix)
1. Read this section, `src/features/legends/impact/bosses/README.md` and CLAUDE.md's raid notes; back up the file.
2. Plan in writing before drawing: what the owner liked in the current version (it stays); the concept in one line;
   the anchor; per phase the one-sentence action, the palette and how the silhouette changes; the background
   (ideally none).
3. Draw, then at least three rounds of: the Kitsune test on the panel, every join zoomed 2 to 4x, fix.
4. Animation check: frames across the idle, entrance, moments, attack and every ability.
5. `check-art.mjs` 0 failures, tests green. It includes the JOINT check (`check-joints.mjs`): in every fight animation
   the head must stay on its neck (a kitsune head shifted off her neck in 40 animations); add the boss to its
   `STRICT` list once it passes, and look at its `--sheet` contact sheets.
6. Independent review by a fresh agent given the owner's words and this section; anything below "equal to the kitsune"
   fails; repeat with a fresh reviewer until nothing must be fixed.
7. The coordinator runs the Kitsune test on its OWN panel screenshot before the owner sees anything, and reports
   honestly what is still weaker.
8. **Interrupted work gets an extra check** (the owner: if an artist is ever interrupted, check it is not broken and
   that the vision is still there). Before resuming AND before reporting: (a) NOT BROKEN: the file is well-formed XML
   and complete (ends with `</svg>`, every phase layer and hook class present), a half-written generator run or partial
   edit is redone from the backup or the last good version, tests and `check-art.mjs` pass, a fresh panel screenshot of
   every phase (faces zoomed) is looked at; (b) THE VISION IS STILL THERE: re-read the plan and this section, then run
   the whole Kitsune test again on that screenshot (a resumed artist drifts toward finishing, not toward the vision).

**Phase layers** (switched by the arena's `data-phase`): `lg-p1` phase 1 only, `lg-p2` / `lg-p3` shown from that phase
on (start `style="display:none"`), `lg-p12` gone in phase 3. A shared layer hidden in some phases is copied into
`lg-p1` and `lg-p3` groups, never painted over. The fight half (impact moments, knockout, powers, fair health):
"The owner's vision for the FIGHT" in `docs/raid-bosses-plan.md`.

## Rules for every boss and banner (Legends and raid)

Raid bosses: the RAID BOSSES section above wins where they differ.

1. **Quality bar: `raids/kitsune.svg`.** Clear, elegant, intentional detail; layered cel shading (3 to 4 values per
   material), rim light, materials that read (gold, steel, fur, feathers, cloth). Never flat shapes, cute blobs or
   crammed detail. Legends bosses meet the same bar.
2. **Concept first.** The owner can NAME it at a glance ("i don't understand what the boss is trying to be" was a
   rejection); one silhouette idea; reads at 120 px (64 on the map).
3. **BIG in frame.** Head and torso fill most of it; variety never comes from zooming out (rat king, sugar queen and
   showman full-body shots were all rejected).
4. **Personality constant across phases**: escalate status and power, never turn a smug character into a screaming
   maw. Approved exceptions: the rat king and showman phase 3 moods. Ask before another.
5. **Repeated parts** (heads, minions, wings) share the creature's features, each with its own character. Clones read
   lazy.
6. **The background is subordinate**: muted, dark, simple; the boss is the brightest, most saturated thing. No rainbow
   bursts, flat colored blobs (they read as stains) or fake glows.
7. **Faces**: no mouth where eyes go, no ring maws, unibrows or eyelash brows; teeth only where they fit (a smirk with a
   gold tooth beats a wall of teeth). Raid bosses imposing from phase 1; Legends bosses vary in mood.
8. **Raid variants of loved Legends bosses** keep the DNA (theme, signature props, palette, personality) and are clearly
   their own design.
9. **Fire only where it belongs** (the arena knight has none). All-ages, except the Sugarplum Heiress's phase 3 V
   neckline the owner asked for (2026-10-03; never explicit). Don't raise it.
10. **Photo layers and gradients are opt-in**: only the ophanim.
11. **Anatomy survives a glance**: a limb bends at one clear joint and ends on something (a planted foot with a contact
    shadow); no stick arms, peg shins, double knees, blob legs, box fists or legless bodies. Held objects read at once
    and are GRIPPED (fingers wrap in front), or are removed.
12. **Shapes sleek**: heads and necks taper and curve; parallel sides read blocky, round and puffy read rubbery.
13. **Necklines read in every phase**; nothing hides them.
14. **Abilities animate the boss itself** (the ophanim's lids, the hydra's heads), richly, never covering it; the parts
    an ability is about get hook classes in the SVG.
15. **Light files**: economical shapes, fewer points; a reshape that bloats a file is redone.
16. **Voices are part of the design**: a redesign updates its lore and voice ("Raid boss voices").
17. **"Badass"** = a meaner face, a bigger silhouette, sharper materials. Through the design, never through clutter.
18. **Every change gets a backup, a before/after render and an honest critique.**

> **Retired raid boss: the Glutton (the Bottomless Maw).** Removed by the owner in 2026-10 ("i dont even like the
> concept of glutton"). Never draw, recreate or propose it again. It stays in `RAID_ROSTER` only as a `RAID_RETIRED`
> index; it has no art file.

## What the owner wants from Legends bosses and banners

- **Real bosses, finely made** (intentional detail on the creature, never crammed): glowing eyes, a maw, claws, spikes, scars, armor, cracks of light; never a smiley
  blob with teeth. Reads at 64 px on the map and rewards a close look at 190 px on its intro card.
- **Mood: RAID bosses are all threatening (power and a villain's confidence; a sly smile counts); Legends bosses VARY.** "Raid bosses should look super threatening but normal
  Legends bosses don't all need to be mean looking. Some mean looking ones, but also variety." Pick the mood from the
  area (mean, smug, playful, proud, eerie, sleepy, regal, sad, comic-menacing), then check the set for a spread. Mean
  stays where the design calls for it ("if it makes sense for the boss design then yea keep it mean": dread knight,
  lava wyrm, three-headed hound). Not every one gets the angry V brow.
- **Every boss and banner truly unique**, not a recolor: silhouette and pose (bust, full body, winged, profile, rising
  out of something), what is behind a Legends boss (spotlight cone, storm cloud, turning sun, smoke, crystal halo, never the same
  round glow), number and kind of eyes, mouth type (maw, beak, mandibles, carved grin, jaw of rock), the entrance.
- **Detail stays readable when small**: layered shading, highlights, texture strokes (bark, scales, fur, rivets,
  stitches), strong ink outline, clear shapes first.
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

The first raid bosses were "boring, uninspired and weak" (small figures lost in their frame: the fix was a BIG figure, not a fuller backdrop; one neck, a boxy robot, a
skeleton in a robe, a lion like a house cat); the redesign got "YESS, much better". Every boss, Legends and raid, is
held to this. Worked example: `docs/raid-bosses-plan.md`.

**Plan before drawing**: per boss, the idea in one line, the backdrop, the face, what each phase (or the intro) breaks,
grows or opens, the idle motion, the SVG entrance beats and the card entrance. Every boss's answers differ.

**Size and presence**
- **Fill the frame and bleed past it** (horns, fins, wings, fists run off the edge into the 20% headroom). A figure
  floating small in its box reads weak whatever its detail.
- **Shoulders wider than the frame, seen from below** (Legends bosses; raid bosses: rule 6):
  low horizon, big upper body.
- **At most one simple shape behind the boss that is part of it** (a halo, a ring, its own tails or wings as an aura),
  quiet and clearly behind it. Never a scene.
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

**Every phase is a transformation with a story** (a Legends boss's rage; raid bosses follow the RAID BOSSES section)
- Phase 1 controlled (sealed armor, one power). Phase 2 hurt and WORSE (armor cracks on molten veins, a cut neck grows
  two heads, more eyes open, the face rages). Phase 3 the true form (a skull under the split helm, a jaw unhinged).
- Damage and menace only ESCALATE for Legends bosses; raid bosses escalate POWER (an ascended, serene P3 like the
  kitsune's is right) (a phase 3 with fewer teeth than phase 2 was caught; a phase 2 hourglass needed more
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
headroom, or they show as a rectangle when the boss scales in. Nothing cut off: measure every animated part's outline over the idle
loop (widest moment) and keep it inside x and y -22 to 142.

**Parts join organically**: no seam where a tentacle beard meets the face, no loose decorations on a forehead (blue
circles on the ocean boss were "weird"); accessories read as what they are (the banshee's bells read as "weird green
hair that floats").

## The owner's vision: approved and rejected

**Approved (do more of this)**
- Phases that change the creature: a head cut off and two growing back, armor bursting open on a molten core, a helm
  splitting on a skull, a crown shattering into orbiting shards, bony legs where the robe burned away, (Legends only:) waterspouts
  rising from a whirlpool, a bolt striking the crowned head.
- **The face changes every phase** (the owner's idea). Lich: calm eyes, then a V brow ridge narrowing them, then
  blazing wide eyes over a dropped jaw. Titan: sealed visor, then the grille torn off a snarling molten mouth with
  flames from the eyes, then a split helm on a molten skull.
- Bold, readable shapes with a strong outline, a darker depth edge and a highlight; graceful, never chunky.
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

## Lessons from rejected drawings (each applies to every boss)

- **Rat King**: smug and cool throughout. A rat is a wedge (long snout, nose at the tip, high round ears); a round head
  and short muzzle read as a cat. Phase 3 failed twice as "a different character" (a new head, then phase 2's head on a
  bodybuilder): keep proportions, build and face view. A true form never replaces the character (a gold statue rat read
  as "a gold cat statue"). Minions stand on something, few and posed, never a mass.
- **Showman**: a costume is not a power. Power floating AROUND a man still reads "a guy with masks": it must be ON him
  (his face, horns from his head, fire from his palms). Never a soft pretty-boy face (narrow chin, thin neck, doll eyes,
  timid smile). Never a second copy of the character as a "trick". Arms are one limb (shoulder to glove); masks are
  thick carved artifacts HELD in the hand, never pasted on.
- **Sugar queen**: "too far away" and "background too colorful". Hair keeps one identity (may whip, never grow); a
  pendant must not hide the neckline.
- **Hive empress**: phase 1 "not different enough" was fixed by changing her POSE (sprawled, then rearing).
- **Banshee**: a scream reads from lips, teeth and a stretched face, not a big hole (a long oval maw was too close to a
  ring maw). A pale figure needs value separation from what is behind her. Ghost minions with round eyes turn cute.
  Thin upward hair locks read as horns. Her bells read as "weird green hair that floats".
- **Hydra**: heads share features (one eye color), each its own character (snout, horns, scars, expression); tapered
  skulls on waisted necks. Built from the heads out: fixed neck roots, the same head on the same root in every phase,
  a stump where a head was cut.
- **Chronos**: an arm is upper arm, elbow, vambrace, gauntlet, the bell ON the shoulder turning with the arm. A hand
  always does something. A signature prop (the winding key) runs through all phases. Clock-hand brows sit ABOVE the
  eyes or read as glasses. The head-to-body ratio never changes.
- **Zeus (tempest)**: muscular and handsome (V-taper, real irises, a confident half smile, a short beard); glowing visor
  eyes read as a mask. A rider sits BEHIND the mount's head in profile, thigh along the neck, one hand gripping.
- **Seraph**: keep the loved silhouette and the single eye (the owner wanted it back when a maw replaced it). A pointed
  white hood over red robes reads as a hate group's hood: never. Nothing symmetric under the single eye (reads as teeth);
  a rounded dome read as "a tombstone": a face needs a face's structure. White hands vanish on white wings. A closed lid
  drawn with lash ticks read as a grin.
- **Cerberus**: every neck roots into the shared shoulders, or it reads as several animals; a neck is longer than it is
  wide; the heads change ARRANGEMENT per phase, not only what they wear.
- **Headless Horseman**: fire is several tongues, never one teardrop (reads as a tulip). A horse reads in profile or
  three-quarter, never head-on. A lantern hangs BELOW the forearm that holds it.
- **Ophanim**: a divine boss is serene and flawless; scarier than a snarl. An effect never puts a stand-in eye over the
  real one.
- **Lunar Strix (moonmaw)**: a loved theme on a weak creature becomes a creature whose signature part IS the theme (the
  moon as an owl's facial disc). An owl reads from a two-lobed disc, two big forward eyes, a short hooked beak, ear tufts.
- **Mirror Knight (kaleido)**: a helmed knight still needs a readable face. A reflection is mirrored, recolored as glass
  and lags his motion, never a pasted copy. Arms are plate, never a tube with a ball joint. An ability overlay aims at
  the part it is about (his chest prism), never the face.
- **Kitsune (first version)**: "very ugly... compare it to sakura being so beautiful". A beautiful boss gets grander
  through scale, light and stillness, never an uglier face.
- **General**: liked concept, disliked character = redesign the character, keep the concept. "Redesign completely" = a
  new silhouette, pose and face. "Mutant" is not "creepy" (no horror shorthand on a noble boss). A hand doing something
  specific beats a hand flung out. Mouths are few, big and unmistakable.

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

Raid bosses: the RAID BOSSES process replaces this section.

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
bosses: 27 active in `RAID_ORDER` (`src/features/legends/raid.js`), one file each in `raids/`.

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
