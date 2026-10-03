# Raid bosses: redesign plan

The owner's verdict on the first set: "super boring, uninspired and weak" (small figures in empty space, one neck, a
boxy robot, a skeleton in a robe, a lion like a house cat). A raid boss is the day's WHOLE due stack in one fight,
harder than any Legends boss, so it must look like a game's final boss.

## Rules for all raid bosses

- **Fill the frame.** The figure owns the 120 x 120 canvas and bleeds past its edges (heads, wings, fists, tentacles
  cut by the frame read as "too big to fit"); boss figures may draw 20% past it (art.jsx `BOSS_HEADROOM`).
- **A backdrop that is part of the boss**, different for each (a maelstrom, a forge halo, a rune circle, a burning
  ring, a black hole), animated.
- **Menace first**: angry brows, slit or burning eyes with a glow halo, too many fangs, claws, spikes, scars.
- **Depth without gradients**: base shape, a `#000` shadow side at 0.2 to 0.3, a lit edge at 0.15 to 0.3, a glow halo
  (same shape bigger, bright, 0.3 to 0.45). Strong ink outline (2 to 2.4 on big shapes).
- **Idle life everywhere**: every head, limb or flame moves on its own rhythm; particles rise or orbit; eyes flicker.
- **Every phase is a TRANSFORMATION with a story**, not a sticker added:
  - Phase 1 (full health): most controlled: armored, sealed, one power shown.
  - Phase 2 (a third down): hurt and WORSE: armor breaks, a new power awakens, the silhouette grows.
  - Phase 3 (last third): the final form: unleashed, desperate, maximum spectacle, colors run hot.
  The arena marks each change: the boss flashes, shakes and swells (`lgPhaseShift`) and "PHASE N" stamps over it.
- **Lore and a voice**: lore `lg_raidLore_<motif>` in all four locales (who it is, its legend, why it blocks the way,
  a hint of its phases and ability) and a `RAID_VOICES` entry in `src/features/legends/raidVoices.js` (English persona
  prompt + sample line; it drives the boss's taunts on a miss), both shown in the asset view. A new raid boss needs
  both (`raidLore.test.js`). The voice follows the owner's rules in the art guide's "Raid boss voices" section: its
  own unique register, sentence shape, nickname and word for a mistake (nothing shared with any other boss), not
  cheesy, short plain sentences, never technical, works for any subject. A redesign updates lore and voice to match.
- **Phase 3 is the climax** (art guide top rules 13 to 18): as different from phase 1 as phase 2 is, bigger and
  more alive than phase 2, the most idle motion, one readable dominant figure, anatomy and held objects that read
  at a glance, and every ability effect moving the boss's real parts.
- **Its own entrance**: SVG `lg-in` beats (eyes igniting, jaws opening, heads rising) plus an `ENTRANCES` card motion
  no Legends boss uses.

## Abilities: each boss fights differently, never against learning

The owner's rule: an ability changes how the FIGHT plays, never how a question is asked: no timers, nothing hidden,
no trick questions, a right answer never marked wrong, and every twist rewards what builds memory (retrieving a card
again after missing it, typing instead of recognizing, steady streaks). Each ability shows on the entrance card
(name + one line) and as a chip in the fight; rules live in `fight.js` (pure, tested), keyed by raid motif.

| Boss | Ability | Rule | Why it helps learning |
|---|---|---|---|
| Hydra | **Regrowth** | A missed card grows a head: it comes back sooner (2 questions later, not 3). Cutting a head (answering it right) deals 3 instead of 1. | Missed cards are retrieved again quickly; fixing a mistake is the big hit. |
| Titan | **Iron plating** | In phase 1 the armor holds: a right choice answer bounces off (no damage; a wrong one is a miss as always). Typed answers smash through. | Rewards recall over recognition while the armor is on. |
| Lich | **Phylactery** | At 0 health the Lich rises once if any missed card is still unredeemed: those come back one last time; it falls when all are answered right (a miss there costs a life). | Every mistake of the fight gets fixed before it ends. |
| Chimera | **Three heads** | Every third right answer in a row cuts all three heads: triple damage (replaces the critical). | Rewards steady, consistent recall. |
| Void | **Singularity** | In phase 3 right answers deal double; a miss costs two lives. | A high-stakes finale that still only asks cards you have to know. |
| Seraph | **Judgment** | Every 5 answers are weighed together: all 5 right = the Judge is smitten for +5 damage. Nothing is taken away. | Rewards steady recall over a run of cards. |
| Leviathan | **Maelstrom** | After a miss, the next right answer breaks the surface: +3 damage. | Recovering right after a mistake is the big hit. |
| Inferno | **Kindling** | From the 4th right answer in a row, every right answer burns for +1. A miss puts the fire out. | Rewards long runs of steady recall. |
| Chronos | **Rewind** | The first miss in each phase is rewound: no life lost (still counts as a miss). | Room to try a hard card without the fight ending on it. |
| Vampire | **Blood pact** | Every 5th right answer in a row wins back a lost life. | A streak of recall can undo earlier mistakes. |
| Tempest | **Storm Measure** | Answers march in measures of four on Zeus's four storm orbs (the 4th ringed in gold): a right answer on beats 1 to 3 charges an orb, a wrong one leaves it dark; the 4th beat brings the thunder, 1 damage per charged orb, right or wrong (none charged: it fizzles). Attacks and inserted questions do not move the beat. Then a new measure starts. | A rhythm to play toward; the cards stay the same. |
| Kaleido | **Reflection** | A glancing typed answer (the tested thing right, a small slip elsewhere) deals full clean damage. | Credit for knowing the core of the card. |
| ~~Glutton~~ | ~~Devour~~ | RETIRED by the owner (2026-10): removed from the app. Do not recreate. | |
| Puppeteer | **Marionette** | A blocked attack snaps a string for 3 damage; a missed attack costs only 1 life. | Fixing a missed card is worth a lot; failing it again is forgiven a little. |
| Berserker | **Last breath** | On your last life every right answer deals triple. | A comeback is always possible. |
| Hive Empress | **Swarm** | Every 5th right answer, in a row or not, stings the queen for +3. | Every right answer counts toward the next hit, even after a slip. |
| Gorgon | **Petrify** | Every 3rd clean typed answer cracks her stone for +3. | Rewards full recall typed out. |
| Banshee | **Crescendo** | Right answers deal +1 in phase 2 and +2 in phase 3. | The fight builds toward a big finish. |
| Reaper | **Harvest** | Each life already lost makes it careless: right answers deal +1 per lost life, at most +2. | A rough start is easier to turn around. |
| Dreamer | **Slumber** | While no life is lost, every right answer deals +1. | Rewards a careful, clean run. |
| Moon Devourer | **Supernova** | The first right answer in each phase goes supernova: +3 damage. | Every time the fight turns, a calm first recall is the big hit. |
| Nine-Tailed Empress | **Star ball** | Blocking an attack (a missed card answered right when it returns) steals a star ball: every later right answer deals +1 per ball held, at most +2. | Fixing a mistake is the biggest hit because its power lasts. |
| Wheel of Eyes | **All-seeing** | Every right answer opens one eye on its wheel, a miss closes one; the answer opening the 6th eye turns the whole gaze: +6 damage, and the eyes close again. | Accuracy over the whole fight pays; one slip costs one eye, never the run. |
| Sewer Kingpin | **Hoard** | Every right choice, or typed answer with a slip, drops a gold coin in his hoard (max 3); the next clean typed answer loots it: +1 damage per coin, and the hoard empties. | Recognition builds the pile, full recall cashes it in. |
| Sugarplum Tyrant | **Sugar rush** | Every right answer drops a sugar cube in her jar (a miss takes none out); the 4th sets off a sugar rush: the next 3 right answers each deal +2. A miss during the rush crashes it and the jar starts again. | Every right answer counts toward the rush, which rewards staying careful. |
| Infernal Impresario | **Comedy and Tragedy** | Every right answer wins a round of applause (comedy mask); the 4th brings an Encore: +3 damage, applause starts over. Every miss sheds a tear on the tragedy mask; the 2nd tear is a Plot Twist putting the applause one right answer short of an Encore. Attacks and inserted questions move neither mask. | Steady recall brings the big hit; two misses set up the next Encore. |
| Hound of the Last Gate | **Shackles** | Each head is chained by its own deed: the Fire head by any right answer, the Iron head by a clean typed answer, the Shadow head by the first right answer after a miss (or a blocked attack). One answer chains one head. All three chained = Bound: +4 damage, and every head tears free again. Any miss lets the Fire head slip its chain. | Three different good habits (recall, typing it out, bouncing back from a miss) each count; the big hit needs all three. |

## 1. Hydra: the Tide Hydra (redrawn 2026-10, second pass)

- **Idea**: a many-headed sea serpent wrecking a harbor in a night storm. ONE creature (pewter scales, blood-red crest
  spikes, gold slit eyes under solid dark brow ridges, bone teeth, belly plates down every neck), SIX characters. The
  owner on the first pass: "all the snakes are too similar to each other in every phase", so heads differ in skull,
  size, angle, horns, scars and expression while sharing those features (never a different eye color). Every head is a
  SLEEK, ANGULAR dragon skull: arrowhead skull, long tapered snout, hard brow plates, faceted cheek/jaw planes in 3 to 4
  values with a lit top plane and rim light, dark underside, narrow glowing slit eyes under a hard lid line, a tight
  closed mouth along the snout edge or a fanged sneer. Never round, puffy or rubbery (owner on a soft cartoon pass:
  "snakes look ugly now"). Skins a darker steel blue so gold eyes and red crests pop. Necks thick, tapering, overlapping
  scales, a belly band of curved plates bowing with the neck (never a flat ladder), dark dorsal spines.
  - **King** (center, biggest, front view): gold crown, two big swept horns, heavy-lidded and smug, one brow cocked,
    closed smirk with a fang over the lip.
  - **Elder** (three-quarter): one eye scarred shut by three claw marks, one horn snapped to a stub, the other a curled
    ram horn, ragged crest, long drooping barbels, barnacles, a chipped tooth, a tired knowing squint.
  - **Brute** (wide, blunt, low skull): bolted iron jaw plate, two tusks, thick bull horns, stitched snout scar, small
    eyes under a heavy V brow, underbite grin.
  - **Sly** (long snout, three-quarter): long backswept horns wrapped in gold bands (bands, never piercings), a
    Cheshire grin of many teeth, side-eye, one brow cocked high.
  - **Young** (profile): lighter skin, fanned red frill, jaw wide open, forked tongue out, lunging.
  - **Sleepy** (profile): lids nearly shut, chin on the body, a curl of smoke from the nostril, bored.
  - **Newborns** (ability sprouts and phase 2 regrowth): small pale wet heads in profile: a screamer, a hisser, one
    still peeking with an egg tooth.
- **Phase 1, composed**: the old harbor scene (lighthouse, fortress, burning ships, tail coils), the six heads in a wide
  low row over the body hump, harpoons in the necks. Navy night sky.
- **Phase 2, regrowth (new camera)**: the hydra REARS out of the sea on a leaning torso, the mass on a diagonal: King
  high on the LEFT baring his teeth in a grin, Young striking down at the viewer on the right, Brute with a bolt
  striking its horn, Sly and Elder coiled out to the sides. Two cut necks in the middle are burnt shut (charred crust,
  glowing cracks, smoke) with three newborn heads bursting out, ichor dripping. The fortress topples, waves crash, the
  clouds glow with the harbor fire (red-orange sky): a new color story.
- **Phase 3, true form (seen from far below)**: a colossal chest rising from the sea, necks fanning like a crown of
  serpents to the frame edges, the King enormous in the middle under a tall jagged storm crown with lightning off its
  points, every head battle-scarred and furious, two grown newborns at the top, waterspouts, purple torn sky. No
  body-face, no blob maw.
- **Ability (heads)**: `data-ab-heads` 3 is the default drawing. 2 and 1 replace one and two heads (per phase: Sly then
  Young, Elder then Sly, the two top newborns) with burnt stumps (`lg-abh-heads-*` hide the head, `lg-ab-heads-*` show
  the stump). 4, 5, 6 add one, two, three newborn heads (each different), every phase. Every head has an `lg-fx-grow`
  face (smug sideways glances, wider grins) and an `lg-fx-cauterize` face (lids fly up, jaws drop).
- **Tinted part**: the lightning (sky bolts, the bolt on the Brute, the crackle off the storm crown).
- **Entrance (SVG)**: necks shoot up out of the body one at a time (King first), then idle sway and nods per head.
  **Card**: `lgHydraRise`.

## 2. Titan: the Forge Titan (redrawn 2026-10)

- **Idea**: a hunched forge machine-god seen from below, inside its own foundry. Eyes sit at the same spot on helm and
  skull, so the eye flames carry from phase 2 into phase 3.
- **Backdrop**: soot-brick foundry under an iron truss arch, two furnace mouths, a brass flywheel halo, a conveyor of
  white-hot ingots, a colossal tipped crucible pouring a molten stream into a funnel on the helm.
- **Phase 1, sealed**: one V brow plate over burning slit eyes, a furnace-grille mouth breathing steam, four smoking
  stacks, a power-hammer forearm with pistons, an anvil fist, chained arms, the firebox shut and glowing.
- **Phase 2, the plating cracks**: plates tear open on white-hot metal and gears, the firebox door blows off, the grille
  tears off on a molten snarl (static fangs), flames pour from the eye slits, the chains snap, the halo cracks red.
- **Phase 3, true form**: the armor blows apart into two counter-turning orbits around a skeletal machine (girder ribs,
  gear spine, white-hot reactor core with lightning), a molten iron skull with the same eye flames, fed by a torrent
  from the crucible, the halo a ring of fire.
- **Entrance (SVG)**: the crucible pours, the flywheel spins up, the hammer arm swings up in jerks, the anvil fist slams,
  the eyes ignite. **Card**: `lgPowerUp`.

## 3. Lich: the Lich of the Sunless Crypt (redrawn 2026-10)

- **Idea**: the sorcerer-king bound to his phylactery, which sits at the center of every phase.
- **Backdrop**: a crypt throne: pointed arch rimmed with vertebrae, an ossuary wall of skulls with blinking eyes,
  standing coffins with candle skulls, bone piles, green embers.
- **Phase 1, calm and cruel**: angular skull, steady green pupils, chattering grin, cracked iron crown, rune circle,
  trophy-skull pauldrons, royal robes, soulfire in one hand and an open grimoire in the other, lower arms dragging
  chained souls, the phylactery cage with a screaming soul inside.
- **Phase 2, furious**: the robe burns away to a ribcage full of soulfire, two more burning arms rise, one V brow over
  blazing slit eyes, snarling jaw, souls tear out of the grimoire, coffins burst open on reaching corpses.
- **Phase 3, true form**: a colossal hooded wraith of soulfire with a huge screaming maw; in front floats the lich's
  true body, the SAME skull as phases 1 and 2 (V brow, slit eyes, cackling jaw, crown snapped to stubs) on a gaunt
  skeletal sorcerer: spiked bone pauldrons, torn mantle and collar, a broad ribcage torn open on the blazing
  phylactery, clawed hands raised with soulfire crackling between them, robe tatters and chains trailing into mist.
  The crown floats in pieces.
- **Entrance (SVG)**: the throne swells in, coffins slide in, the lich rises, runes spin up, the grimoire snaps open,
  the eyes ignite last. **Card**: `lgLevitate`.

## 4. Chimera: the Chimera Tyrant (redrawn 2026-10)

- **Idea**: three beasts in one body, in a ruined colosseum: a lion with a mane of fire, a goat on a neck from the
  shoulder with lightning between its horns, a serpent-dragon tail curling over the top.
- **Backdrop**: a broken bone-sandstone colosseum, skull spectators, braziers, chains, volcanic sky, cracked lava floor.
- **Phase 1**: torn burning wings, spiked iron pauldrons, skull breastplate; the lion roaring, the goat chanting with
  its third eye sealed, the serpent spitting venom.
- **Phase 2, feral**: the lion's jaw splits to the ears, the goat's horns crack with fire and its eyes multiply, the
  serpent sheds to a skeletal neck, a fourth head tears out of the chest.
- **Phase 3, true form**: the belly bursts open on a molten core (2026-10, replacing a spinning tooth-ring maw the
  owner called generic): a torn ragged wound over a furnace, a cracked lion-bone ribcage splayed outward, the three
  beasts' fused heart beating inside (gold, black and green vessel stumps, the lion's crowned-mane sigil on it), the
  goat's ram-horn and the serpent's coil sigils burning on the ribs, magma veins and flames spreading over the body.
  All three heads are burning skulls, six more heads sprout on writhing necks, the arena burns.
- **Entrance (SVG)**: braziers ignite, then three roars: serpent, goat, lion. **Card**: `lgTripleRoar`.

## 5. Void: the Eye of the Void (the owner's favorite: keep the idea, push it much further; upgraded 2026-10 with veined eyes, sealed eyes that tear open in phase 2, crack-mouths, a torn flesh rim and an eye in the throat in phase 3, and debris pulled into the disk)

- **Idea**: a cosmic horror: one great eye in a mass of night, a black hole's burning ring behind it, starry
  tentacles.
- **Backdrop**: an accretion disk (a tilted ring of orange and violet) turning behind the body.
- **Phase 1**: the great eye (tracking), thick tapering tentacles with toothed tips, the ring turning.
- **Phase 2, "it sees you"**: the body cracks and many eyes open across it, tentacles multiply, gravity rings pulse
  outward.
- **Phase 3, "singularity"**: the body splits into a colossal vertical maw of spiraling teeth with a star-core inside,
  a crown of eyes above, shattered planets orbiting, the ring blazes.
- **Idle**: tentacles writhe, eyes blink out of step, the ring turns, stars twinkle.
- **Entrance (SVG)**: unfolds from a point of light, the eye snaps open. **Card**: `lgRealityTear`: reality splits as a
  horizontal slit, tears open vertically, jitters, holds.

## 6. Seraph: the Thousand-Eyed Judge (owner request: inspired by the Legends celestial, NOT a copy; "a masterpiece, terrifying but crazy")

- **Lesson from the first draft**: a calm GOLD knight with a sword and no eyes in phase 1 was rejected outright ("where
  is the scary eyes and dangerous white celestial figure???"). "Inspired by" keeps what the owner loved (a WHITE
  celestial, scary eyes everywhere) and changes the rest. Terrifying from phase 1, not only at the end.
- **Second lesson**: v2 (white, eyes, a sword) was "still not that scary"; the sword "restricts the design" and was
  removed. Terror in EVERY phase: bloodshot eyes, blood tears, teeth from phase 1, reaching clawed hands.
- **Third lesson (2026-10)**: a v4 redrawing him as a calm cowled judge in a heavy robe (scales, censer, sword) was
  "lame" and "too bulky": it threw away what made the seraph (the overwhelming spiky mass of eyed wings, skeletal arms,
  chains and cages). Raising an older boss to the new bar means KEEPING its design and silhouette and upgrading the
  RENDERING, not its mass. No sword.
- **v5 (current)**: the original composition re-rendered: an angular faceted porcelain hood under a crown of iron
  thorns with red-hot tips, ONE great red eye with a detailed iris, a gold mask plate where the toothy mouth was
  (nothing mouth-like under the eye); three pairs of long blade-feathered, steel-tipped wings with red eyes in the
  coverts; two pairs of sturdier bony arms with shaded bones and eye-palms (four clawed fingers, not spider sticks);
  real iron link chains to birdcages each holding an eye; a thin tattered robe with a crimson panel of eyes; a dark
  rose window ringed by the gold halo (the tinted part).
- **Phase 1, watching**: frontal, symmetric; covert eyes mostly shut, the great eye calm and heavy-lidded, upper arms
  hold the eye-palms out wide, lower ones reach down, cages hang still.
- **Phase 2, the verdict**: tilted camera; wings flare up and out with every covert eye open; upper arms raise the
  eye-palms beside the head; lower arms thrust the cages toward us, doors open; the robe is torn wide open on the
  seraph's insides (owner: "more gruesome, maybe guts"), kept as stylized holy body horror: a cage of angular
  cel-shaded bone ribs breaking out of the torn edges round a pulsing crimson cavity of muscle bands, veins of red light
  and gold, sinew strung between the ribs and a column of staring eyes, dark drips sliding down the torn robe; blood
  tears from the great eye and the wing eyes, mask cracks weep red light, torn feathers drift down. No realistic organs
  or spurting blood; V brow and a narrowed bloodshot eye, four more eyes open on the hood, the mask plate cracks with
  red light; red cracks run through the window.
- **Phase 3, true form**: the figure is gone into a colossal turning wheel of six burning eyed gold wings round a ring
  of fire (tinted), six bony arms ringing it like a sun's rays with gold eye-palms, burning cages orbiting on a chain
  loop the other way, an enormous blazing gold eye at the heart, the tribunal shattered into orbiting shards.
- **Faces**: lg-fx-wrath throws the eyes wide (pin pupils) weeping light (`lgfa-seraph-tear`); lg-fx-mercy closes them;
  the verdict ahead rings the halo with flame blades or white feathers, every phase.
- **Entrance (SVG)**: window and halo spin up, wings unfold pair by pair, chains and arms swing in, the great eye opens
  last. **Card**: `lgHolyUnfold`.

## 7 to 15. The second wave (owner request: "super crazy bonkers", Seraph and Void as the bar, "like WTF IS THAT")

Same rules for each: terrifying from phase 1, a face that changes every phase, a backdrop that is part of the boss, a
phase 3 true form that is a different creature. The file's leading comment describes each in full.

- **7. Leviathan, the Drowned God** (`lgAbyssBreach`; phases 1 and 2 redrawn 2026-10 after the owner: "i love phase 3
  but i don't understand what the boss is trying to be"): a sea leviathan so colossal a harbour town grew on its back;
  sailors took it for an island. Backdrop: the maelstrom it churns (red in phase 3).
  - **Phase 1, the island wakes**: an armoured head breaches the waves, filling the frame: barnacled hide plates, gill
    slits, a heavy V brow ridge with bone spikes over two ancient gold eyes with slit pupils under heavy lids, nostrils
    blowing spray, a shut jaw with throat pleats and fangs over the lip, spined cheek frills breaking the water, barbels
    with glowing lures. The town on the crown: the lighthouse (its beam is the palette tint), the chapel, houses,
    dorsal spines between them, the bone horn hung with a chain and lantern, a jetty lifted out of the sea with a boat
    dangling on its taut rope.
  - **Phase 2, the jaws open**: same head; the jaw gapes on rows of fangs (a back row behind the front one), and deep in
    the throat the first two turning tooth rings show with a slit of the drowned red eye. Hide plates crack red, gills
    glow, eyes blaze red under a steeper brow, the town tilts and falls (a roof tumbles off the crown), lures burn red,
    tentacles rise from the sea.
  - **Phase 3, true form** (unchanged, the one deliberate ring maw): the jaws open all the way into the spiral maw of
    fanged rings around the drowned eye from the phase-2 throat, the lighthouse, chapel and horn on its rim.
  - **Idle**: the head heaves, the beam sweeps, eyes blink (phase 1) or flicker (phase 2), spray puffs, frills and
    barbels sway, lures pulse, the boat rocks on its rope, drips and water pour off the jaw, the throat rings turn.
  - **Entrance (SVG)**: breaches with a lurch, the frills swing open, the eyes open, the nostrils blow, the beam lights.
- **8. Inferno, the Cinder Sovereign** (`lgFlareBurst`): an obsidian dragon on a throne of melted swords, wings like fire
  windows, a lavafall behind. Phase 2: scales flake into embers, a furnace throat. Phase 3: a black bone skeleton in a
  firestorm with a heart of eyes and a screaming skull of white fire above its own.
- **9. Chronos, the Hourglass Titan** (`lgTimeReverse`; redrawn 2026-10 after "i like the concept but please completely
  redesign this boss": the old round clock-face grin on a gear pile was cluttered, and its phase 3 was a ring maw). A
  colossal brass-and-glass titan rising out of the dunes of a cathedral of time, under a gothic rose window that is a
  clock. Its TORSO is an hourglass (sand pouring through the pinched glass waist past a swinging pendulum heart),
  shoulders two spiked bronze tower bells, arms plated clockwork (2026-10, after "all the hands look weird": a geared
  ball joint under each bell, cog elbows, clockwork showing in the forearm, a clock on the wrist cuff, five-fingered
  gauntlets with knuckle plates and brass claw tips; phase 1 one hand rests on the hourglass post and one on a
  minute-hand sword planted in the sand, phase 2 one claw grips the cracking lower bulb and the other raises the sword,
  phase 3 both fists hold the scythes up). The face is a crowned dial-helm whose BROWS are its own clock hands (a short
  spade hour hand, a long arrow minute hand) meeting in a V at the hub over slit eyes, with a grin of cog-tooth fangs,
  winding holes for nostrils and the XII broken out of its rim (the signature, kept in every phase).
  Phase 1, time flows: the window hands tick, the sand falls, the face calm and closed. Phase 2, time fractures: the
  dial cracks on glowing fractures, a rim chunk breaks off, the jaw drops on a burning throat, the eyes flare, a red
  seconds hand spins wild across the face, the window's hands spin out of control and its glass cracks, the chest glass
  breaks and sprays sand, the crown loses teeth, two afterimages of the head lag behind, the pendulum stutters.
  Phase 3, true form: the dial splits horizontally into a jaw (eyes and brows rise, the chin drops on hinge rods, both
  edges lined with cog teeth ending in fangs) around a blazing time core, the blades grow into giant crescent scythes
  raised over the head, the glass body shatters and unravels into a robe of pouring sand, the crown hangs in pieces, the
  window blows out into a time vortex, shards of frozen moments (glass holding stopped clocks) orbit it.
  Entrance: time rewinds (the window hands spin backwards, the sand flows back UP into the top bulb, the pendulum swings
  in, the arms swing out, then the eyes ignite and the jaw snaps shut). The time-energy glow (eyes, core, cracks,
  pendulum heart, scythe edges, echoes) is the one tinted part.
- **10. Vampire, the Crimson Matriarch** (`lgBatAssemble`): a corpse-pale queen with a third eye, a crown of thorns and a
  bat-wing collar, a blood moon in a stained-glass window. Phase 2: the same face turns feeding beast: the jaw unhinges
  impossibly far down into a long vertical snarl (lips pulled back off bared gums, two huge upper fangs and two lower
  ones, rows of needle teeth behind, a dark throat glowing red, blood running off the fangs and chin; never a round ring
  of teeth), the phase-3 bat wings tear out of her shoulders half unfurled (same bones, scallops and reds, membrane
  still crumpled, cloak ripped and bleeding at the roots), the flung-out hand sinks its nails into the chest (fingers
  bent hard, tips buried in gashes, blood pooling and running), the bats leave the cloak, it rains blood. Phase 3: a
  giant blood bat-demon wearing her old face as a mask, the moon an eye.
- **11. Tempest, Zeus the Storm King** (`lgBoltDrop`; redesigned from scratch 2026-10 after six Raijin versions: the
  owner asked for "zeus with lightning and then he summons a GIANT dragon in phase 2 and then he rides the giant dragon
  in phase 3 holding a giant lightning sword"; Zeus redrawn the same month: "make zeus more muscular and handsome and
  also phase 3 doesn't look like he is riding it", then "perhaps a side view would be good for phase 3").
  Zeus: a heroic, handsome god in every phase: broad shoulders and traps, big cel-shaded pecs and a six-pack, thick arms
  with biceps, forearms, gold arm bands and wrist cuffs, a strong neck, a chiselled face (straight nose, strong jaw,
  cheekbones), electric-blue eyes with real irises and a confident half smile under a groomed silver moustache, a SHORT
  groomed beard (face and chest stay visible), a swept-back silver mane under a gold laurel crown with a bolt gem, an
  ivory himation over one shoulder with a bolt brooch, a royal storm cloak. Same face and smug confidence in all three
  phases. The storm dragon: steel-blue scales, ivory horns, electric-blue fins and barbels, gold belly plates, slit eyes
  of lightning under heavy brow plates, a fanged maw with lightning in the throat. The lightning (bolts, sword, the
  dragon's eyes and throat) is the tinted part. The ability (drum measure) shows as FOUR STORM ORBS in an arc (the
  fourth gold-ringed: the thunder) lighting one by one (`lg-ab-drums-1..3`).
  Phase 1, Zeus on Olympus, seen from below on the cloud summit between marble columns: one arm raised high gripping a
  crackling thunderbolt, the other fist on his hip, the orbs arcing beside his mane. Phase 2, the command: the colossal
  dragon looms out of a rift behind him, open maw beside his head; he thrusts one arm out to the side, palm open and
  crackling, sending it at the foe, the other fist still on his hip. Phase 3, true form, the charge AT the player (the
  side view read as riding but "they look like they are looking outwards", so both heads now face the viewer): a close
  camera; the dragon's head (phase 2's angular head: brow plates, horns, collar fan) swings round at the lower left and
  roars straight at us, both lightning eyes on the player, its neck curving back from behind the head and running under
  Zeus, body and storm wings sweeping back diagonally to the upper right; Zeus sits astride the neck square to the
  viewer, eyes on us and smirking, near thigh over the neck and gold-greaved shin hanging below it, one fist gripping
  the dragon's horn, the other raising the giant lightning sword over his head; cloak streaming back, speed lines
  rushing out at the viewer.
  Thunder face (`lg-fx-thunder`), every phase: Zeus's eyes blaze and he shouts; phase 2 the dragon's eyes flare too,
  phase 3 they white out. Entrance (SVG): a bolt splits the sky, he rises, the thunderbolt arm swings up and the bolt
  ignites, the eyes open, the orbs pop in.
- **12. Kaleido, the Mirror Knight** (`lgShardFocus`; redrawn 2026-10 three times: the owner kept the triptych concept
  but wanted a cooler character, then "a flaming abyssal fire knight"): an obsidian knight cracked with molten seams, a
  horned great helm with fire pouring out of its narrow visor slit, a crown of flame on a black-iron circlet, flames off
  the pauldrons, a tattered burning cape, a chain of real links and a burning sigil on the breastplate. He stands IN
  FRONT of a towering gilded triptych in an endless hall of mirrors, seen from below; the glass glows with firelight and
  is sooted, the side panes reflect him as burning silhouettes. The fire (every flame) is the one tinted part; the gems
  are fixed rubies.
  Phase 1: sealed and upright, the fire held in the seams. Phase 2: he lunges, head cocked, the faceplate breaks on a
  molten skull with slit eyes and a fanged maw, the burning reflections climb out of their empty panes, gauntlets hooked
  over the frame, the glass cracks and molten glass drips. Phase 3 (redrawn 2026-10: the first was "a flat badge" with a
  surrender pose), the Abyssal Inferno, in the wrecked hall (arches cracked, broken gilded frame pieces burning, the
  floor cracked with lava): the armor bursts, four big plates (faceplate halves, a pauldron, a breastplate half) hang in
  an arc around him glowing at their broken edges, and a fire demon of lava erupts: his horned helm split down the
  middle, the halves lifted and tilted out like a crown around a faceted molten skull (heavy V brow, white-hot slit
  eyes, a jagged fanged maw), fire wings on obsidian spars with ember tips and smoke wisps, one big open clawed gauntlet
  thrust at the viewer, a molten greatsword raised up and back, an abyssal rift torn in the chest, the body pouring away
  as lava; the mirror is a slow vortex of molten glass blades behind him, each reflecting a burning piece of his helm.
  Flames grow only from him and the burning frames. Distinct from the arena shadow knight (fire, horns, molten light)
  and from the titan (a knight-demon, not a machine).
  Entrance: the hall rushes out of the distance, side panels unfold, the knight swells up, the crown of flame shoots up
  and the visor fire ignites (phase 3: the shards spin in, the wings unfold, the demon swells up and the sword swings
  overhead).
- **13. Glutton, the Bottomless Maw: RETIRED** (2026-10). The owner: "i dont even like the concept of glutton, get rid
  of glutton". Its art, ability, texts, voice and entrance were removed; its roster slot stays in `raid.js`
  (`RAID_ROSTER` + `RAID_RETIRED`) only so stored raid states and old trophies keep working. Do not recreate it.
- **14. Puppeteer, the Grand Marionettist** (`lgStringDrop`): a hooded porcelain mask with needle fingers working a
  knight-jester marionette on a ruined stage; the strings stay attached through every motion. Phase 2: the doll's head
  snaps off and the strings run up into the real maw, the hanging puppets wake. Phase 3: a spider of strings and masks
  under an eye of strings, the stage on fire.
- **15. Berserker, the Last Warlord** (`lgWarCharge`): a ram-horned warlord in black plate on a burning war camp under a
  blood-red sun. **A different POSE every phase** (owner, 2026-10: "make this guy more interesting"; the earlier three
  were the same stiff front-facing statue). Kept through all three so the phases stay ONE creature: the same ram horns,
  the same crested bucket helm (V brow with a gold line), the SCAR across his left eye (viewer's right), tusks with the
  right one SNAPPED, the skull pauldrons, war-paint handprints, a belt of fallen enemies' helms, a BROKEN manacle chain
  on his left wrist and one huge notched axe.
  Phase 1, coiled: body turned, head lowered, narrow predator eyes glaring UP through the visor slit; the axe resting on
  his right shoulder (never across the body), the left fist clenched at his side dragging the broken chain in the mud.
  Phases 2 and 3 GO CRAZY (owner, 2026-10: "REDESIGN PHASE 2 AND 3 TO GO CRAZY"; the same-size figure with a swapped
  face was not enough). Phase 2, BERSERK RAGE: he hulks out, a colossal muscled body filling and bleeding past the
  frame, armor plates flying off on chains, the skull pauldron torn away, helms flying off the belt, molten veins, steam
  and blood; the helm SPLIT open round a raging bull skull (the handprint and scar on its brow plate, blazing eyes under
  one V brow, a jagged roaring jaw, never round, drool and blood), the ram horns grown long and spiked; the axe
  mid-swing high with streaks and a blood arc, the ripped-off chain whipping round; the sun turns blood red and cracks,
  the banner tears into strips, the ground splits, the heart already glows through the sternum.
  Phase 3, VALHALLA'S WRATH: a flaming demon-god rising out of a sea of fallen helms and blades, molten bone fused with
  armor, FOUR burning arms (great axe, greatsword, flail, axe), the same bull skull with a crown of fire, horns ablaze,
  white-hot eyes and an unhinged jaw, a halo of broken blades spinning behind, a black sky with an eclipsed sun,
  lightning and fire pillars, outline ghost warriors screaming up into his fire, and ONE heart blazing in the open
  ribcage (the ability in the art). The fire is the palette tint in every phase.
  Entrance: he rises out of a crouch, the lowered head lifts, the axe swings up onto his shoulder and lands (quake),
  then the eyes ignite in the slit.

Hidden entrance parts rest at `scale(0.01)` or far off canvas, never `scale(0)` (a non-invertible matrix crashes
check-art's overdraw pass).
## 16 to 20. The third wave (owner request: "5 more raid bosses", the same bar)

- **16. Swarmqueen, the Hive Empress** (`lgHiveRumble`): an insect queen enthroned on her giant egg sac in a honeycomb
  cathedral of wax arches and cocooned victims, compound eyes of a hundred facets, four scythe forelimbs. Phase 2,
  redrawn 2026-10 as its own scene (the owner: "phase 2 isn't different enough"; it was phase 1 plus cracked eyes and
  two fire bursts): THE HIVE AWAKENS, the camera low and tilted inside her burning royal cell; she rears off her burst
  egg sac, four glass wings (the tinted part) spread in a blur, scythe forelegs raised beside her crowned head, jaws
  flared under the same red eyes and cold V brow, a black and amber gaster curled forward, stinger dripping venom at
  the viewer, soldiers streaming out at us. Its six ability cells climb the right wall as a zigzag column
  (`lg-ab-comb-*`); the comb floor of phases 1 and 3 is copied into an `lg-p1` and an `lg-p3` group so it stays out of
  phase 2. Phase 3: the hive is her face: comb cells become eyes and chewing mouths around a ring of mandibles, her old
  body hung inside.
- **17. Gorgon, the Stone Gorgon** (`lgSerpentRear`): a jade gorgon with a crown of thirteen striking serpents and
  sweeping green gaze rays, petrified warriors around her in a ruined temple. Phase 2: her face turns to stone and
  splits open on a second face made of snakes. Phase 3: one colossal coiled serpent bristling with heads around a
  single huge petrifying eye, the temple collapsing.
- **18. Banshee, the Drowned Organist** (`lgWailPulse`): a ghost in a drowned organ loft with an enormous screaming
  mouth (a long dropped jaw, torn lips, uneven needle teeth; never a ring or spiral maw), veils for hair, brass bells on
  chains swinging from an iron yoke across the arch above her (never on her head), a choir of faces in her robe;
  hunched at the organ in phase 1. Phases 2 and 3 redrawn 2026-10 as whole scenes of their own (the owner: "more
  variation for phase 2 and 3"; phase 2 had been phase 1 plus frost stars). Phase 2, THE WAIL RISES: a new camera
  (pulled back, tilted): she tears free and rises on a diagonal above the organ, arms flung wide, the veil ripped off
  her skull and clutched in one claw, torn-veil hair whipping up, the window blown open behind, bells swinging wild,
  her choir torn out of the robe shrieking around her; a cracked bare skull with blazing white eyes under the same V
  brow, the jaw torn off its hinge, hanging askew. Phase 3, REQUIEM (true form; redone 2026-10 after "phase 3 sucks",
  built from phase 1's own drawing: its face, veils, choir faces and pipes reused and transformed): a towering spectral
  storm, her phase 1 face enlarged and stretched into a vaster wail with an icicle crown and tears of light at the eye
  of a huge spiral of translucent veils and cold light over deep indigo storm bands; the choir caught in the spiral at
  different sizes and depths, big clawed hands thrust out at the viewer, pipe banks bursting outward, bells and
  stained-glass shards flung through the wind, glowing shockwave arcs (never a ring mouth). At 120 px: a round storm
  with a face at its eye (phase 1 a wide triangle, phase 2 a T). Each phase carries her scream hooks (`lg-ab-scream-1`
  sound bolts, a wider `lg-fx-wail` jaw, a clenched cracked `lg-fx-shatter` jaw); the bells are the one tinted part in
  all three.
- **19. Reaper, the Soul Harvester** (`lgScytheSwoop`; redrawn 2026-10, "more badass in every way"): a towering hood
  with a flame-like peak, broad shoulders under bone pauldrons with hooked spikes, a cape of screaming faces whose
  tatters whip like flames, a studded belt with a horned skull buckle and a chain of real links, a huge vertebra
  scythe (serrated jawbone blade, barbs on its back, a cold honed edge with a running glint, a skull at the tang), a
  soul lantern on a chain, over dead wheat and graves under the moon. ONE angular skull in every phase (heavy V brow,
  narrow slit eyes with a white-hot core, long uneven fangs, a cracked jaw, a soul gem in the forehead): phase 1 it
  burns out of the hood's shadow. Phase 2: the hood ripped back, the skull snarls with soul-fire leaking from its
  cracks, the robe tears open on an armored ribcage (iron sternum plate, hooked ribs) full of souls, a whip of soul
  lightning strung with souls lashes out of the blown lantern. Phase 3: the same skull and gem, enormous, crowned with
  broken bone spikes and swept ridged horns, the jaw unhinged on a flaming soul in the throat, four huge bent claws
  with hooked talons (one gripping the colossal scythe), a storm hood of souls behind, souls dragged up from the
  bursting graves into its jaw.
- **20. Dreamer, the Sleeping Horror** (`lgEldritchUnfold`): an eldritch god asleep in a drowned impossible city, slit
  eyes peeking, tentacles twitching, dream bubbles holding tiny nightmares. Phase 2: it wakes, dozens of eyes snap
  open, the tentacles part on a beak. Phase 3: the skull splits open on a cosmic brain of galaxies ringed by eyes, the
  sky tears.

## 21. Moonmaw: the Lunar Strix (redesigned from scratch, 2026-10)

- **Why it was redone**: the first Moonmaw (the Legends space moon grown into a planet eater: a pale cratered ball
  with one slit eye, a grin, tentacles over a little Earth, a clam-split ring maw in phase 3) got "i love the idea of a
  MOON boss but this design ain't it": it read as a pale Void (ball, eye, tentacles), copied `bosses/space.svg`, and
  ended on the banned ring maw. Rejected concepts: a moon-rock huntress (a fifth regal woman; a bow boxes the pose), a
  spider whose abdomen is the moon (a third web spider after `dream` and the puppeteer), a moon wolf (too close to the
  `moonlit` werewolf). Chosen: an owl, which nothing in the set is.
- **Idea**: the night sky is one colossal horned owl and the MOON IS ITS FACE. The facial disc is a cratered moon
  (maria, a rayed crater, a terminator shade); the night cuts into it as ONE solid V brow ridge plus a dark wedge up
  the forehead with a crescent sigil, so the moon shows above the brows like a horned owl's pale V; ear tufts like
  swept horns; a mane of feather blades; a heavy hooked beak; wings of night feathers with constellations sewn in. The
  moon's phases ARE its faces: full moon, blood moon, total eclipse. Personality in every phase: a silent, patient,
  all-seeing predator, cold, never frantic (escalates by display and by swallowing the light, never into a maw).
- **Phase 1, Full Moon** (silver face, amber slit eyes, navy plumage, ice-blue halo): a close bust seen from below,
  perched on a floating spire of moon rock, wings FOLDED into massive pointed shoulders bleeding past the frame (a tall
  horned teardrop), talons hooked over the rock, heavy-lidded eyes, beak shut, the head in a slow owl tilt. Behind: the
  22-degree moon halo with two moon dogs and sparkles turning on it (the TINTED part), stars.
- **Phase 2, Blood Moon** (crimson cracked face with glowing fissures, black plumage, red rim light): the threat
  display. Wings flung UP and wide past both top corners (a V / heart silhouette), feathers bristling, the head
  lowered, tilted and thrust at you, the brow slammed down over narrowed white-hot eyes with lower lids pushing up, the
  beak gaping on fangs and a glowing throat (the hiss), one foot of talons raised at the viewer, the other gripping a
  cracked rock leaking embers. The halo SHATTERED into crystal slivers blown outward (TINTED).
- **Phase 3, Total Eclipse** (black face, white-gold corona, violet-black plumage, gold rim light): the true form,
  diving at you. Wings swept out horizontally past both sides (a wide span with a blazing ring at its centre), the
  ruff turned into a CORONA of flares around a BLACK moon (TINTED), the diamond-ring glint at the rim, eyes burning
  rings with pinprick pupils under heavy lids, the beak parted on fangs with the swallowed moonlight white in the
  throat, two giant foreshortened feet of talons thrust at the viewer, dark feathers drifting down.
- **Silhouettes at 120 px**: tall horned teardrop, raised V of wings, wide span around a ring. **Faces**: cold
  heavy-lidded stare; furious narrowed glare over a hissing fanged beak; eclipse ring eyes, still and cold.
- **Ability art (Moonfall)**: `lg-ab-orbit-1/2` = one or two cratered moonlets with dust trails in orbit (above the
  halo in phase 1, between the tufts in phase 2, beside the corona in phase 3); `lg-fx-charge` a silver glint where the
  next moon gathers; `lg-fx-launch` a moonlet rising, the eyes glancing UP at it; `lg-fx-impact` a fresh crater blown
  into the moon face with glowing cracks and chips, one eye squeezed shut, the other flared.
- **Entrance (SVG, phase 1)**: the wings sweep from spread to folded, the head rights itself from a sideways owl tilt,
  the halo blooms open, the eyes snap open. **Card**: `lgMoonrise`, it swings round a full orbit in eclipse, small and
  dark, waxing brighter as it comes round, then a gravity pulse toward the viewer.

## 22. Kitsune: the Nine-Tailed Empress (owner request: "I LOVE THE CONCEPT OF SAKURA. PLEASE CREATE A VARIATION AS A RAID BOSS AND GO ALL OUT")

- **Lesson from the first draft**: a crouching cat body with chunky paws, a busy frame (torii, lanterns, steps,
  branches, moon), a scowl and too many face marks was "very ugly ... compare it to sakura being so beautiful". A raid
  variation of a beautiful boss stays beautiful: keep the face construction and elegance, add majesty through scale,
  light and stillness.
- **Idea**: "the sakura goddess ascended". Built FROM `bosses/sakura.svg`'s face (its paths, at its own scale): the
  long fine white fox face, one eye serenely closed, one sly gold slit, Heian dot brows, delicate red markings, a
  knowing smile with one small fang tip, the little fox mask pushed up on her head, a bell earring. A regal bust: a
  slender neck, a layered kimono collar (white, pink, red, gold) over dark palette-tinted silk with gold sakura crests,
  a gold bell on a red cord, gold kanzashi hairpins with swaying chains, the star ball (the ability) pinned at the V of
  the collar.
- **Second pass (owner, looking at the phases side by side: "make each phase even more distinctive")**: the first
  three phases read as one picture recoloured (a wink, then both eyes open, then the same face in pale blue). Now each
  phase is a different woman with a different silhouette, palette and face; her signature stays: the red markings
  (brow flame, cheek stripes, dot brows), the bell on its red cord, the kimono collar over palette-tinted silk.
- **Phase 1, Courtly** (soft pink, white, gold): a serene, playful court lady. Long dark hair tied low in gold bands,
  the fox mask pushed up on her head, gold kanzashi with swaying chains, one eye closed and one sly gold slit over a
  knowing smile. A closed red fan (sensu) raised to her lips in a long silk sleeve. Nine pink tails folded in a NEAT,
  tight fan, a thin gold ring with turning blossoms behind her head, pale foxfire wisps drifting, calm petals.
- **Phase 2, Unveiled** (crimson, violet foxfire, amber): the mask cracks in two and slides off the side of her head,
  hanging by its cord; ears pinned back flat; eyes glowing amber slits under a hard V of brows; the brow flame flares
  tall, the cheek stripes glow, a third stripe each side; a fierce, alluring grin open on two long fangs. Hair whips
  loose into a wild mane, the hairpins fly out, the kimono sleeves billow past the frame, the tails FLUNG WIDE,
  crimson, each tip burning in violet foxfire. Petals storm.
- **Phase 3, Celestial Kyubi** (white and gold): the divine form. A corona of nine tails of white-gold foxfire
  radiating all round her, a sacred shimenawa rope halo (twisted straw, slowly turning, white shide streamers), star
  balls orbiting her shoulders, white-gold eyes of light with no pupil, a radiant third eye with rays, the lower face
  thinning to spirit light, upright ears and hair turned to flame, a serene closed smile, gold sparks.
- **Face per phase**: wink and knowing smile behind the fan; amber slits, V brows, a fanged grin; eyes of light, a
  third eye, a calm divine smile. The head tilts left, then right, then faces you straight on.
- **Entrance (SVG, phase 1)**: the tails open one by one from the center like petals, the mask lifts off her face onto
  her head, the sleeve raises the fan, the gold eye slides open.
  **Card**: `lgPetalFall`, she drifts down like a falling sakura petal, side to side, then blooms to full size.

## 23. Ophanim: the Wheel of Eyes (owner request: "an alternative to this raid boss [the Seraph], not replacing it, a second version: a biblically accurate angel")

- **Idea** (third design, 2026-10; the owner: "get rid of the paper scroll", "the craziest raid boss ever"): an
  ophanim as cosmic glory. One immaculate porcelain eye (a kaleidoscope iris of petals, star lines and fibres, a pupil
  that is a window into a starfield, veins of gold light, the wheels' eyes reflected small in its white) inside wheel
  after wheel of rose-gold, copper and gold, every band engraved with an unknown script and packed with eyes of two
  sizes like gems (they look every way, the big ones blink out of step), with wings of parchment feathers behind,
  between and growing out of the wheels. Serene and perfect, never angry: no brows, teeth or mouth. No scroll.
- **Painted, 2026-10** (the owner: "try to make this guy hyperrealistic and crazy"; the only file on art.jsx's
  `REALISTIC_ART` list): no outlines, every surface shaded with local gradients. The great eye is a porcelain eyeball
  (sphere-shaded sclera with a net of veins, an iris of hundreds of fine blue strands with crypts, a collarette and a
  dark limbal ring, a wet cornea with a window highlight, a galaxy turning in the pupil, a soft shadow where it sits);
  the wheels are polished metal cylinders (lit lip, reflected light, a dark groove, fading glints, an engraved script)
  with shaded eyes in recessed settings, the far half of every wheel sunk in shadow; feathers shade from a dark root to
  a translucent tip, with script, rust flecks and a lit edge. Heaven is a white glory fading through lavender into deep
  space (nebulae, faint giant eyes, stars), god rays turning, over a soft sea of lit clouds with a faceted crag and the
  pilgrim's lantern. Phase 3 turns it all gold. It replaced the halo of gold spikes, sacred-geometry burst and flat
  cloud bank below. Generator kept outside the repo (`gen3.mjs`).
- **Backdrop**: a vast halo of glory (a turning burst of gold spikes, rings, a twelve point star, a flower of circles
  of light, runes) ringed by deep starry space whose constellations are eyes; one flat cloud bank with a lit top below,
  a tiny pilgrim with a lantern on a crag for scale. The small eyes' irises are the part a palette tints, in every
  phase.
- **Phase 1, folded**: three pairs of wings close around the wheels like a cocoon, two lids of overlapping feathers fan
  in from the eye's corners leaving only a slit of iris, five wheels (one small gold wheel near the eye), nearly every
  eye shut, two of the six gaze eyes open.
- **Phase 2, unfolding**: the feather lids part, four great pairs of wings and two small pairs open (gold-white tips,
  eyes on the feathers), a colossal gold wheel and a sixth inner wheel appear, eyes open everywhere looking every way,
  four gaze eyes open and shoot beams of light, long beams turn behind it.
- **Phase 3, the true form**: two more colossal wheels burst out (one face-on around the eye), holy fire runs along
  the rims and they shine gold, two more pairs of wings fill the gaps, every eye open and looking straight at you, all
  six gaze eyes beam, the heaven goes blinding gold-white, the iris burns gold with a starburst and a star pupil.
- **The ability in the art**: six large eyes in gold bezels on the main wheel are the gaze counter (2, 4, 6 open).
- **Idle**: every wheel turns on its own axis and rhythm (the main wheel only sways, so the counter stays readable),
  eyes blink, wings breathe at their roots, the halo, its geometry and the beams turn, feathers drift there and back,
  motes twinkle, the cloud bank drifts.
- **Entrance (SVG, phase 1)**: the cloud bank rises, the cocoon of wings unfolds, the wheels swing out of edge-on into
  alignment one by one, the iris opens last in the feather slit.
  **Card**: `lgGyroAlign`, it tumbles in small and blazing on two axes like a gyroscope of wheels (rotateX and rotateY
  together, which no other boss uses), grows through each turn, then locks upright with a flash.

## 24. Ratking: the Sewer Kingpin (owner request: "I ALSO LOVE THE DESIGN AND CONCEPT OF SEWER. MAKE A RAID VERSION THAT GOES ALL OUT TOO")

- **Three drafts, two lessons.** The first kept the sewer boss's face ("too similar to the normal boss. make it
  heavily inspired but different and crazier and more badass"). The second, a gritty armoured plague warlord in
  profile, lost the personality ("does not look pimpin like the regular boss of it. i loved the regular bosses
  design"; "LOOK AT HOW EPIC SEWER LOOKS. MAKE SURE THE RATKING IS JUST AS EPIC AND COOL AND SMUG"). The rule: keep the
  VIBE the owner loves (a smug, swaggering, gold-dripping sewer king, front on, big in the frame, grinning gold), push
  it over the top, build a new face for it.
- **Fourth pass (2026-10, owner: "Phase 1 is in the right direction ... make him even cooler. also phase 2 and 3 look
  awful. redesign completely phase 2 and 3")**: phase 2 had been phase 1 with a mace and a row of sticker henchmen
  (its wide round head with slit eyes read as a CAT); phase 3 a clutter of identical little rats, chains, a padlock
  and a sunburst. Fix: one new rat head for all three phases, three different poses.
- **The head (every phase)**: a long-snouted wedge skull (wide brow and cheekbones, swept-back cheek fur, tapering hard
  to a narrow chin), a lighter snout bridge down to puffy whisker pads with the pink nose at the TIP, long whiskers,
  big round thin ears (the right one torn, two gold hoops), a dark blaze down the brow, a stitched scar over the right
  eye, the gold grill grin under the snout with the two great buck teeth coming out from under the whisker pads (a
  diamond in one, the other chipped), the crown. Round rat pupils, never a cat's slit.
- **The red velvet is the tinted part** in every phase: the cape (1), the smoking jacket (2), the cape again (3).
- **Phase 1, holding court**: hunched forward on his coin throne, head low between high shoulders, looking down at
  you over gold shades pushed down the snout, one brow cocked, cigar in the gold grin; one ringed claw on the shaft of
  the rat-skull scepter planted in the hoard, the other flicking a coin; the emerald vault and its gold wheel behind,
  gold pipes pouring neon sewage either side, two henchmen fanning him (banknotes, plumes).
- **Fifth pass (owner: "LOVE THE PHASE 1 NOW BUT THE PHASE 2 AND 3 LOOK [terrible]. MAKE THIS RAT KING SMUG AND COOL
  THROUGHOUT THE WHOLE THING")**: the fourth pass made him a snarling, screaming monster (flailing arms, a green burst,
  a muddy body of rats with a roaring maw). Phase 1 stays exactly as is; his PERSONALITY is constant: the same smug
  face in every phase; phases escalate his power, wealth and swagger, never his temper.
- **Sixth pass (owner: "why are the mice floating in phase 1 and also phase 2 and 3 aren't different enough. make each
  one drastically different. different face too, they are the same face. still smug tho")**: phase 1 keeps everything
  but its two fan-bearing henchmen, now standing on the hoard with contact shadows. Phases 2 and 3 get their own camera,
  pose, silhouette and face (the fifth pass only changed the props around the same head shot).
- **Seventh pass (owner: "phase 2 and 3 look absolutely terrible. redo them from scratch")**: the sixth pass zoomed out
  (full-length figure, a small figure on a throne) and lost what makes phase 1 great: a BIG expressive face filling
  the frame, chunky gold, swagger (it had tiny faces, stick legs, a blob claw, a static throne with a carpet). Now
  every phase fills the frame like phase 1; variety comes from the camera, head angle, hands, light and color.
- **Eighth pass (an outside written plan, rejected: "chat gpt's plan sucks")**: the same head in phase 1's framing with
  more and more stuff around it (rotary cannons, a coin halo, mechanical arms, orbiting rings). It read as "phase 1
  plus stuff", cluttered in phase 3.
- **Ninth pass (owner: "make phase 2 and 3 from scratch and make it distinctive enough")**: three concepts per phase as
  120 px silhouettes first (`concept-sheet`: phase 2 High Roller / armoured getaway car / docks with a searchlight;
  phase 3 Golden Idol / moon king / sewer colossus); High Roller and Golden Idol won, each a new SETTING, COLOR story,
  POSE and TRANSFORMATION, him still big in frame.
- **Phase 2, High Roller**: neon casino night (magenta, cyan and black against phase 1's emerald and gold). A
  three-quarter head leaning over a green-felt table at you, shades on, one brow up, a wicked gold grin round the
  cigar, its smoke lit pink; neon rim light on his fur; a royal flush fanned in one ringed claw, the other shoving a
  tower of chips; a roulette wheel turning behind his head like a halo; two croupiers in the dark; his gold heaped in
  the pot (the hoard states); a red velvet smoking jacket with satin lapels (the tint).
- **Phase 3, tenth pass (owner: "love phase 1 and 2. change phase 3 because it looks bad")**: the Golden Idol (a gold
  recolor of him as a seated statue) read like a gold cat statue: flat gold, a blobby lap, slipper feet. Three new
  120 px concepts (`concept-sheet-p3`: Gold Wyrm under the moon, an amethyst crystal cavern, a molten-gold forge); the
  Gold Wyrm won. **Phase 3, The Gold Wyrm (true form)**: his hoard come alive as a colossal serpent-dragon of living
  gold coins and jewels (polished tube shading with a dark reflection and a specular band, overlapping coin scales,
  jewels in the spine) coiling up behind him and across his lap, its crowned head looming over his shoulder with a
  ruby eye and a fanged maw spilling coins; he stays the grey smug rat, as big as in phase 1 (shades pushed up,
  glowing eyes, the grin, a goblet in one ringed claw, the other draped on the coil, fur lit gold from below); a deep
  indigo night with a huge full moon behind him as a halo, coins raining; the hoard at the coil's foot; the red velvet
  cape is the tint.
- **Face per phase**: smug over the shades (1); three-quarter, shades on, brow up, wicked grin (2); shades pushed up,
  glowing eyes, the smug grin, lit gold from below (3). Effects stay cool: stolen = a wink and a grin with the diamond
  flashing, loot = the grin dips (the rubies dim), bomb = a flinch (shades knocked crooked), tail = a cold narrow look.
- **120 px**: grey bust in an emerald vault ring (1); a dark neon scene with a green table band and a roulette halo
  (2); an all-gold seated figure on purple (3).
- **The ability in the art**: the coin pile he sits in, stands on and towers over (`lg-ab-hoard-2/1/0` shrink it), the
  coin he flips, the gold he makes rain; face layers per phase for stolen (he gloats, the diamond flashes:
  `lgfa-ratking-sparkle`), loot, bomb and tail.
- **Entrance (SVG, phase 1)**: the vault wheel spins in, the henchmen scurry up, the crown drops on crooked, the shades
  drop onto his snout, the eyes open half lidded, the brow cocks and the grin spreads.
  **Card**: `lgCoinToss`, tossed up from below like a coin, flipping end over end on its horizontal axis (rotateX
  alone, on a vertical arc), then lands with a heavy squash in a flash of gold.

## 25. Sugarqueen: the Sugarplum Tyrant (owner request: "I LOVE THE DESIGN AND CONCEPT OF THIS BOSS. Create a raid boss variation that goes ALL OUT and makes it super crazy... different poses. Kitsune raid boss is a good example of phase variation for bosses")

- **Third pass (owner: "you need to make her a beautiful boss")**: the second pass (a gaunt porcelain mask with a
  slasher grin, blocky armor, a caramel cape) was ugly. Same lesson as the kitsune: a beautiful boss stays beautiful,
  dangerous through scale, glow and her look: a glamorous candy empress, a soft porcelain face, almond eyes with long
  lashes, berry lips and a beauty mark, a chocolate-lattice corset with a heart jewel, puff sleeves, lace gloves.
- **Fifth pass (owner: "her hair is too long. and also phase 2 and 3 are boring")**: the fourth pass gave her
  waist-long pigtails and ONE half-figure front view in every phase (scepter, sword, halo swapped in). Now:
  - **Short hair in every phase**: a chin-length pink bob with a side-swept fringe, a soft-serve swirl knot with a
    cherry behind the crown (the Legends beehive, small), two short ringlets at the jaw. It whips back in phase 2 and
    floats in phase 3, never grows.
  - **Phase 1, the Empress**: enthroned on the heart throne of chocolate and plum velvet between palace towers, the
    heart scepter raised, a gloved hand on the sugar jar, mint eyes, a knowing smile.
  - **Seventh pass (owner: "she's too far away in phase 2 and 3 ... make her hot")**: the sixth pass (a small surfer
    on a caramel wave, a colossus seen from far below) shrank her face to a few pixels; rule 3 of the guide (variety
    never from zooming out). Both phases are CLOSE shots now, head and torso filling most of the frame, a little from
    below, with a glamorous femme-fatale face (winged liner, long lashes, defined cheekbones, glossy lips) and a fuller
    hourglass bodice with the same neckline and coverage as phase 1 (all ages: no cleavage emphasis).
  - **Phase 2, Sugar Rush**: a close three-quarter lean toward the viewer, head tilted; the heart scepter gripped at
    her shoulder and swung back in a candy-striped arc; the other hand blowing a kiss that bursts into sugar crystals
    and hearts; hard-candy pauldrons and a vambrace; a wink, glowing pink slits, a wicked one-fang grin. Behind her,
    muted: the dusk palace cracking, caramel fountains, sparkles.
  - **Phase 3, the Sugar Empress (true form)**: a regal close-up from below: a tall sugar-glass crown, the lollipop
    halo behind her head, huge rock-candy wings framing her shoulders, a high standing collar of sugar crystals, the
    sugar heart pendant (her jar as a jewel, `lgfa-sugarqueen-jewel`) glowing at her neckline and lighting her face
    from below; one hand raised with candies orbiting the fingertips; half-lidded gold eyes, gold crystal marks, a
    serene untouchable smile; a muted deep violet storm.
  - At 120 px: phase 1 a seated frontal bust, phase 2 a diagonal lean with the scepter arc, phase 3 a tall crowned
    bust with wings and halo.
- **A subordinate backdrop (owner: "the castles and background are too colorful")**: pastel mint and lilac towers, a
  rainbow ray burst and a purple-and-mint storm competed with her. Every backdrop is now a dusk palette (`DUSK_FAR` /
  `DUSK_NEAR` in the generator): muted plum and mauve towers with small warm window glows, a plum velvet throne, a
  dark plum ray burst with a few magenta rays (phase 2), a deep violet storm with darker clouds lit from her (phase 3),
  farther = lower contrast. Her pinks, gold and sugar glass are the brightest, most saturated things; the wings are her
  own sugar glass (pinks, white, pale gold). Phase 2's caramel erupts as glossy amber jets arcing out of the cracks.
- **Face per phase**: mint eyes and a knowing smile; hot-pink blazing slits and a fanged grin; gold eyes and a serene
  smile. Each phase has its own kiss (`lg-fx-rush`), pout (`lg-fx-crash`) and flush (`lg-ab-rush-1`).
- **The ability in the art**: the sugar jar in every phase (on the throne, flung up in the leap, the giant heart in
  phase 3, `lgfa-sugarqueen-jewel`, which pulses on `rush`); `rush` bursts a giant striped sweet with rings of rainbow
  sprinkles, `sweet` showers sprinkles on each boosted hit, `crash` drops shattered hard candy.
- **Entrance (SVG, phase 1)**: the scepter swings up into place, the crown's spires grow, her eyes open.
  **Card**: `lgSugarDrop`, dropped onto her cake platter from high above, she splats flat, bounces twice like jelly
  (squash and stretch, each bounce lower) and wobbles still.

## 26. Showman: the Infernal Impresario (owner request: "I LOVE THE DESIGN OF STAGE. PLEASE CREATE A RAID BOSS VERSION OF HIM THAT GOES ALL OUT")

- **History**. v1 was the Legends bust in the same arch three times (owner: "make him look a little more different
  than the regular boss and also phase 2 and 3 look lackluster, not much change or epicness"); v2 to v6 were an opera
  house magician (star cape, crystal-ball cane, a card halo, card wings, a three-mask carousel, a curtain-call phase 3;
  owner on the body: "it's almost as if his lower body doesn't exist", on phase 3: "PHASE 3 IS REALLY UNEVENTFUL").
  **2026-10-03**: a hellfire-circus ringmaster (still too close to the Grand Illusionist, then flat: "a red devil"),
  then the owner: "why not have him do a different magic trick per phase and also redesign the character", and "make
  it a transparent background". v8/v9 is the result below.
- **Who he is now**: a tall, lanky demon CONJURER, his own man next to the Grand Illusionist (bosses/stage.svg: purple
  and black, white half mask, black top hat, violet cape). ASH-GREY skin, a long angular face with carved cheekbones
  and a sharp chin, ember eyes with slit pupils on black sclera under heavy shadow, thin arched brows (the left
  cocked), a sly grin with one gold tooth, a gold star painted under his left eye, long pointed ears with gold hoops,
  silver hair swept into a pompadour with one loose curl, long black horns ringed with gold. An EMERALD SEQUIN
  tailcoat (rows of sequins, a highlight band on the lit side, an ember reflected band on the other), black silk
  peaked lapels edged in gold with a sheen, a black silk waistcoat, an ember silk cravat and tail lining (the TINTED
  part: `--lg-tint`/`-hi`/`-lo`), a gold sash, lace cuffs, slim black trousers with a gold stripe, pointed shoes.
  BARE, LONG-FINGERED hands (real joints, black claws, gold rings): the hands are his instrument. The canvas is
  TRANSPARENT in every phase: only what belongs to the trick is drawn behind him (it reads on both app themes).
- **One trick per phase** (each a new camera, pose, light and color):
  - **Phase 1, the Ember Doves** (warm gold spotlight, close, bleeding past the frame): he tears a burning silk out of
    thin air and a flock of doves with FLAME WINGS bursts from it; the other hand presents them, long fingers fanned
    under Comedy, which hovers over his palm in a ring of embers; Tragedy is pushed up on his head like a festival
    mask. A curved stage lip of bulbs under him.
  - **Phase 2, the Levitation** (cold violet, low camera): he floats over a turning rune circle in a column of violet
    light, arms spread, long hands hovering palm-down; Comedy and Tragedy float beneath them on threads of magic, a
    gold hoop passing over each to prove there are no strings. His face turns cold and MEAN: narrowed violet eyes,
    V brows, a thin lopsided smile with a fang over the lip, a scowl line.
  - **Phase 3, the Infernal Encore** (ember light, the most motion): he SAWS HIMSELF IN HALF. A giant saw with hooked
    teeth and a ring of fire spins through his lacquered emerald box (gold inlay, lozenges, a gloss streak, brass
    hinges); the upper half (Comedy on its door) holds his MANIC face (eyes blown wide with fire trailing off them,
    brows flung up, a huge clenched grin) and his jazz hands; the lower half (Tragedy on its door) slides away with his
    legs, rimmed in ember light, kicking out of it; sparks spray from the white-hot cut, spotlights converge. Not smug
    here: his cool snaps (the owner's exception to "personality is constant").
- **The ability in the art**: the comedy and tragedy masks keep score in every phase: `lg-ab-comedy-1` blazes when an
  Encore is one right answer away, `lg-ab-tragedy-1` weeps after a first miss. Face layers: `lg-fx-encore` (a pressed,
  polite smile; in phase 3 an enormous closed one), `lg-fx-twist` (a startled little o). Effects (fx/showman.jsx):
  `laugh` a rose tossed in, `encore` two spotlights swing in and cross while his own cards and roses rain down and he
  is forced into a deep bow, `tear` one blue tear, `twist` the great mask spins from tragedy to comedy while his cards
  whirl backwards.
- **Entrance (SVG, phase 1)**: he rises into the spotlight, the silk arm whips up and the doves burst out. **Card**:
  `lgCurtainPart`, the frame opens from the middle like parting curtains on a dark silhouette, the spotlight hits him
  in a blaze, he sweeps a deep bow and snaps upright.

## 27. Cerberus: the Hound of the Last Gate (owner request: "make a raid version of this boss that GOES ALL THE WAY OUT")

- **The Legends boss** (`bosses/underworld.svg`, Cerberus of the Ashen Gate): three snarling hound heads in a level row
  before spiked bars and a wall of hellfire, burning manes, spiked collars with a ring, chains staked to the ground,
  molten cracks on the chest. **Kept (the DNA)**: three heads on one hound, gold slit eyes under one solid V brow, spiked
  iron collars, chains, molten chest cracks, a gate. **Changed (clearly not the Legends boss, even in phase 1)**: a
  monumental stone gate of the underworld instead of bars and a fire wall, cold soul fire instead of hellfire, the KEY of
  the underworld hanging from his collar, three heads that are three characters, and a new pose per phase.
- **Idea**: the guardian of the LAST gate, a colossal hellhound who has checked every soul since the world was young. He
  is the gate's warden in phase 1, breaks it in phase 2 and BECOMES it in phase 3 (its keyhole burns in his chest).
  Personality, all phases: an unmoved, menacing doorman (never a goofy dog), escalating by status: chained warden,
  unleashed beast, three crowned kings.
- **Three heads, one creature**: shared charcoal fur, gold slit eyes, the same V brow, the same collar style. Each its
  own character:
  - **Brand, the Fire head** (left): a mane of flames rooted behind the skull, a burnt notch in one ear, always snarling,
    the hothead.
  - **The Warden, the Iron head** (center, the eldest and biggest): a riveted iron brow plate, three claw scars down
    one cheek, one torn ear, a stern closed mouth with two fangs over the lip.
  - **Shade, the Shadow head** (right): narrower skull, the longest snout, a mane of violet smoke, one sly half-lidded
    eye and a one-sided grin.
- **Phase 1, the Warden at the Gate** (cool slate and soul teal): seated on the threshold of a black stone arch with a
  horned skull keystone, the iron-banded doors shut behind him. Chains run from the side collars to rings in the step,
  the great key (a skull bow) hangs from the Warden's collar, soul braziers (the tinted part) burn at both pillars,
  mist drifts along the step. Silhouette at 120 px: an arch with a compact triangle of heads.
- **Phase 2, the Gate Torn Open** (hellfire red and orange): a new camera on a dutch angle. The doors are blasted off
  their hinges at the frame edges, a wall of hellfire pours through the open arch, its stones tumble in the air. The
  hound lunges: Brand big and close in the lower left with his jaws wide, the Warden roaring in the middle with his
  brow plate cracked on molten light, Shade high on the right with a wide sly grin; snapped chains whip loose, links fly,
  the key swings wildly on a broken chain, a huge forepaw slams down at the viewer and cracks the floor, molten cracks
  burst across the chest. Silhouette: a diagonal with a paw in front.
- **Phase 3, the Three Kings** (true form; violet, black and white gold): seen from far below, three long waisted necks
  fan up from a colossal chest into a crown of kings: the Fire King under a crown of white-gold fire with a roaring
  white-gold mane, the Iron King under a tall spiked iron crown, stern and unmoved, chin down on the viewer, the Shadow
  King under a crown of black horns with a mane of violet smoke. His broken chains hang across his chest as gold
  regalia; the gate's own lock plate is fused into his chest, its keyhole burning white gold with gold veins spreading
  from it. Behind him the gate is reborn as a colossal arch ringed with soul fire, and the citadel of the underworld
  rises with glowing windows while souls stream up past him. The most motion of the three (long neck sways, jaws,
  crown fire, the keyhole's pulse, the regalia swinging, rising souls and sparks). Silhouette: a wide crown on top.
- **Face per phase**: P1 gold slit eyes, composed (stern Warden, snarling Brand, sly Shade); P2 eyes blazing orange,
  every jaw open; P3 white-gold eyes of light, each king keeping his character (Brand roars, the Warden stays stern,
  Shade grins).
- **Ability, Shackles** (`abilities/cerberus.js`, id `shackles`, not a decision module): a lock per head, each opened by
  a different deed: the Fire head by any right answer, the Iron head by a clean typed answer, the Shadow head by the
  first right answer after a miss or a blocked attack. One answer chains one head (a recovery goes to the Shadow head
  first, a clean typed answer to the Iron head, anything else to the Fire head). All three chained = **Bound**: +4
  damage and every head tears free again. Any miss lets the hothead Fire head slip its chain. Distinct from the Hydra
  (heads grow and are cut) and the Chimera (three health bars to aim at): here the heads are three different
  CONDITIONS to meet. Nothing changes how a question is asked; no timers; a right answer is never marked wrong.
- **The ability in the art**: `data-ab-fire|iron|shadow = 1` shows that head chained in every phase: two wraps of chain
  round the snout, a padlock under the jaw, a half-lidded glare (an open jaw is swapped for the closed one, `lg-abh-*`).
  Faces: `lg-fx-bound` (every head strains, lids squeezed to a glowing slit), `lg-fx-snap` (Brand's eyes blaze wide).
  Effects (`fx/cerberus.jsx`): `bindFire`/`bindIron`/`bindShadow` (a chain lashes in, a padlock clamps, smoke pulled
  into a chain; that head's real group `lgfa-cerberus-<head>` is yanked down), `bound` (three chains meet over him, the
  gate's bars crash down, a great padlock clamps; he is slammed down and strains; every head and the key or keyhole
  react), `snap` (the chain bursts in flying links, flame tongues, Brand rears up).
- **Entrance (SVG, phase 1)**: the soul braziers ignite, the heads rise one after another (Shade, Brand, then the
  Warden), their eyes ignite, the key swings in on the Warden's collar. **Card**: `lgHoundPace`, he paces left and right
  in the dark behind the gate, stops dead, crouches, then rams through at the viewer and plants.
- **Voice**: a curt, unmoved doorman at the velvet rope of the dead ("Nope."), calling the learner "buddy" and a mistake
  a "fake ticket". **Family**: its own tree, the Last Gate (`underworld` to `cerberus`); the Chimera keeps the savanna
  lion only.
- **Tinted part**: the soul fire (the braziers, the keystone's eyes, the gate's soul fire and windows in phase 3, the
  keyhole's halo).
