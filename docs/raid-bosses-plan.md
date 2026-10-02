# Raid bosses: redesign plan

The owner's verdict on the first set: "super boring, uninspired and weak" (small figures standing in empty space, one
neck, a boxy robot, a skeleton in a robe, a lion like a house cat). A raid boss is the day's WHOLE due stack in one
fight, harder than any Legends boss, so it must look like the final boss of a game.

## Rules for all raid bosses

- **Fill the frame.** The figure owns the 120 x 120 canvas and bleeds past its edges (heads, wings, fists, tentacles
  cut by the frame read as "too big to fit"). Boss figures may draw 20% past the frame (art.jsx `BOSS_HEADROOM`).
- **A backdrop that is part of the boss**, different for each: a maelstrom, a forge halo, a rune circle, a burning
  ring, a black hole. It animates.
- **Menace first**: angry brows, slit or burning eyes with a glow halo, too many fangs, claws, spikes, scars.
- **Depth without gradients**: base shape, a `#000` shadow side at 0.2 to 0.3, a lit edge at 0.15 to 0.3, a glow halo
  (the same shape bigger, bright, 0.3 to 0.45). Strong ink outline (2 to 2.4 on big shapes).
- **Idle life everywhere**: every head, limb or flame moves on its own rhythm; particles rise or orbit; eyes flicker.
- **Every phase is a TRANSFORMATION with a story**, not a sticker added:
  - Phase 1 (full health): the boss at its most controlled: armored, sealed, one power shown.
  - Phase 2 (a third down): it gets hurt and it gets WORSE: armor breaks, a new power awakens, the silhouette grows.
  - Phase 3 (the last third): the final form: unleashed, desperate, maximum spectacle, the colors run hot.
  The arena marks each change: the boss flashes, shakes and swells (`lgPhaseShift`) and "PHASE N" stamps over it.
- **Its own entrance**: SVG `lg-in` beats (eyes igniting, jaws opening, heads rising) plus a card motion in
  `ENTRANCES` that no Legends boss uses.

## Abilities: each boss fights differently, never against learning

The owner's rule: an ability changes how the FIGHT plays, never how a question is asked. So: no timers, nothing
hidden, no trick questions, a right answer is never marked wrong, and every twist rewards what builds memory
(retrieving a card again after missing it, typing the answer instead of recognizing it, steady streaks). Each ability
is shown on the entrance card (name + one line) and as a chip in the fight; the rules live in `fight.js` (pure,
tested), keyed by the raid motif.

| Boss | Ability | Rule | Why it helps learning |
|---|---|---|---|
| Hydra | **Regrowth** | A missed card grows a head: it comes back sooner (2 questions later, not 3). Cutting a head (answering it right) deals 3 instead of 1. | Missed cards are retrieved again quickly, and fixing a mistake is the big hit. |
| Titan | **Iron plating** | In phase 1 the armor holds: a right choice answer bounces off (no damage; a wrong one is a miss as always). Typed answers smash through. | Rewards recall over recognition while the armor is on. |
| Lich | **Phylactery** | At 0 health the Lich rises once if any card you missed is still unredeemed: those cards come back one last time, and it falls when all are answered right (a miss there costs a life). | Every mistake of the fight gets fixed before it ends. |
| Chimera | **Three heads** | Every third right answer in a row cuts all three heads at once: triple damage (it replaces the critical). | Rewards steady, consistent recall. |
| Void | **Singularity** | In phase 3 right answers deal double, and a miss costs two lives. | A high-stakes finale that still only asks cards you have to know. |
| Seraph | **Judgment** | Every 5 answers are weighed together: if all 5 were right, the Judge is smitten for +5 damage. Nothing is taken away. | Rewards steady, consistent recall over a run of cards. |
| Leviathan | **Maelstrom** | After a miss, the next right answer breaks the surface: +3 damage. | Recovering right after a mistake is the big hit. |
| Inferno | **Kindling** | From the 4th right answer in a row, every right answer burns for +1. A miss puts the fire out. | Rewards long runs of steady recall. |
| Chronos | **Rewind** | The first miss in each phase is rewound: it costs no life (it still counts as a miss). | Room to try a hard card without the fight ending on it. |
| Vampire | **Blood pact** | Every 5th right answer in a row wins back a lost life. | A streak of recall can undo earlier mistakes. |
| Tempest | **Tempest** | Every 4th answer is a lightning strike: answered right, it deals double. | A rhythm to play toward; the cards stay the same. |
| Kaleido | **Reflection** | A glancing typed answer (the tested thing right, a small slip elsewhere) deals full clean damage. | Credit for knowing the core of the card. |
| Glutton | **Devour** | A miss lets it gorge and heal 1 (never below the attempt's start); a clean typed answer chokes it for +1. | The one boss that punishes misses; full recall wins it back. |
| Puppeteer | **Marionette** | A blocked attack snaps a string for 3 damage; a missed attack costs only 1 life. | Fixing a missed card is worth a lot, and failing it again is forgiven a little. |
| Berserker | **Last breath** | On your last life every right answer deals triple. | A comeback is always possible. |
| Hive Empress | **Swarm** | Every 5th right answer, in a row or not, stings the queen for +3. | Every right answer counts toward the next hit, even after a slip. |
| Gorgon | **Petrify** | Every 3rd clean typed answer cracks her stone for +3. | Rewards full recall typed out. |
| Banshee | **Crescendo** | Right answers deal +1 in phase 2 and +2 in phase 3. | The fight builds toward a big finish. |
| Reaper | **Harvest** | Every life already lost makes it careless: right answers deal +1 per lost life, at most +2. | A rough start is easier to turn around. |
| Dreamer | **Slumber** | While no life is lost, every right answer deals +1. | Rewards a careful, clean run. |
| Moon Devourer | **Supernova** | The first right answer in each phase goes supernova: +3 damage. | Every time the fight turns, a calm, careful first recall is the big hit. |
| Nine-Tailed Empress | **Star ball** | Blocking an attack (a missed card answered right when it comes back) steals a star ball: every later right answer deals +1 per star ball held, at most +2. | Fixing a mistake is the biggest hit of the fight because its power lasts. |

## 1. Hydra: the Tide Hydra (redrawn 2026-10)

- **Idea**: a five-headed sea serpent wrecking a harbor in a night storm; every head has its own face (a crowned
  king, a one-eyed brute, a broken jaw, a young hungry one, an old barnacled one).
- **Backdrop**: storm clouds with lit undersides, rain and lightning; a smashed burning lighthouse on a cliff, a harbor
  fortress on fire, burning galleons, tail coils breaking the surface through snapped ships.
- **Five faces (2026-10, the owner: "make each head have a different face and personality")**, each with its own eye
  color, brow, mouth and idle rhythm so they read apart at 120 px: the **King** (center: gold crown, cold gold slits
  looking down, mouth shut in a thin line with long fangs over the lip, slow imperious sway), the **Brute** (outer left:
  one eye scarred shut, one huge bloodshot eye, crushed brow, roaring maw with tusks, heavy head shake, never blinks),
  the **Broken Jaw** (inner left: cracked jaw hanging crooked, lopsided grin of teeth, one big wild green eye and one
  green squint under a lopsided ridge, tongue lolling, cackling jaw), the **Young** one (inner right, smaller: wide
  cyan eyes with pinpoint pupils, needle teeth, drool, snaps and lunges in time) and the **Old** one (outer right:
  barnacles, heavy lids over milky eyes, a chipped fang and a stump, jaw ajar breathing mist, slowest sway).
- **Phase 1**: pewter scales, blood-red crests, the five faces, harpoons and chains in the necks, a snapped harbor
  chain across the body.
- **Phase 2, regrowth**: the two outer necks are cut to dripping stumps, each bursting into two pale new heads, a
  SCREAMING newborn (eyes squeezed shut, huge wet maw) and a HISSER (yellow slit eyes, mouth shut on two long fangs,
  forked tongue flicking); the rest rage in character with ichor vein cracks (the King's crown cracks and he snarls, the
  Broken Jaw drops further and drips ichor, the Young one snaps faster with slit pupils); the severed Brute and Old
  heads float dead in an ichor slick.
- **Phase 3, true form**: the body rises as one colossal three-eyed head with lightning seams and a gaping mandible V
  around a storm orb, two heads lunging from its throat, a crown of eleven necks, waterspouts, the lighthouse falling.
  The crown keeps the five in their true forms (the King's crown crackles with lightning, the Brute's scar splits on a
  second burning eye, the Broken Jaw nearly drops off, the Young one's pupils burn red, the Old one's lids lift on
  blank glowing eyes) beside screamers and hissers.
- **Entrance (SVG)**: the body heaves up, the necks shoot up one at a time, the eyes ignite and the jaws snap open.
  **Card**: `lgHydraRise`.

## 2. Titan: the Forge Titan (redrawn 2026-10)

- **Idea**: a hunched forge machine-god seen from below, inside its own foundry. Its eyes sit at the same spot on the
  helm and the skull, so the eye flames carry from phase 2 into phase 3.
- **Backdrop**: a soot-brick foundry under an iron truss arch, two furnace mouths, a brass flywheel halo, a conveyor of
  white-hot ingots, and a colossal tipped crucible pouring a molten stream into a funnel on the helm.
- **Phase 1, sealed**: one V brow plate over burning slit eyes, a furnace-grille mouth breathing steam, four smoking
  stacks, a power-hammer forearm with pistons, an anvil fist, chained arms, the firebox shut and glowing.
- **Phase 2, the plating cracks**: plates tear open on white-hot metal and gears, the firebox door blows off, the grille
  tears off on a molten snarl (static fangs), flames pour out of the eye slits, the chains snap, the halo cracks red.
- **Phase 3, true form**: the armor blows apart into two counter-turning orbits around a skeletal machine (girder ribs,
  gear spine, a white-hot reactor core with lightning), a molten iron skull with the same eye flames, fed by a torrent
  from the crucible, the halo a ring of fire.
- **Entrance (SVG)**: the crucible pours, the flywheel spins up, the hammer arm swings up in jerks, the anvil fist slams,
  the eyes ignite. **Card**: `lgPowerUp`.

## 3. Lich: the Lich of the Sunless Crypt (redrawn 2026-10)

- **Idea**: the sorcerer-king bound to his phylactery, which sits at the center of every phase.
- **Backdrop**: a crypt throne: a pointed arch rimmed with vertebrae, an ossuary wall of skulls with blinking eyes,
  standing coffins with candle skulls, bone piles, green embers.
- **Phase 1, calm and cruel**: an angular skull with steady green pupils and a chattering grin, a cracked iron crown, a
  rune circle, trophy-skull pauldrons, royal robes, soulfire in one hand and an open grimoire in the other, lower arms
  dragging chained souls, the phylactery cage with a screaming soul inside.
- **Phase 2, furious**: the robe burns away to a ribcage full of soulfire, two more burning arms rise, one V brow over
  blazing slit eyes, a snarling jaw, souls tear out of the grimoire, the coffins burst open on reaching corpses.
- **Phase 3, true form**: a colossal hooded wraith of soulfire with a huge screaming maw; the skeleton hangs in its
  torn-open chest on threads of soulfire, the phylactery blazes at the center, the crown floats in pieces.
- **Entrance (SVG)**: the throne swells in, the coffins slide in, the lich rises, the runes spin up, the grimoire snaps
  open, the eyes ignite last. **Card**: `lgLevitate`.

## 4. Chimera: the Chimera Tyrant (redrawn 2026-10)

- **Idea**: three beasts in one body, in a ruined colosseum: a lion with a mane of fire, a goat on a neck from the
  shoulder with lightning between its horns, and a serpent-dragon tail curling over the top.
- **Backdrop**: a broken bone-sandstone colosseum with skull spectators, braziers, chains, a volcanic sky, a cracked
  lava floor.
- **Phase 1**: torn burning wings, spiked iron pauldrons and a skull breastplate, the lion roaring, the goat chanting
  with its third eye sealed, the serpent spitting venom.
- **Phase 2, feral**: the lion's jaw splits to the ears, the goat's horns crack with fire and its eyes multiply, the
  serpent sheds to a skeletal neck, and a fourth head tears out of the chest.
- **Phase 3, true form**: the chest becomes a maw of three counter-turning tooth rings with an eye in its throat, all
  three heads are burning skulls, six more heads sprout on writhing necks, the arena burns.
- **Entrance (SVG)**: the braziers ignite, then three roars: serpent, goat, lion. **Card**: `lgTripleRoar`.

## 5. Void: the Void Leviathan (the owner's favorite: keep the idea, push it much further; upgraded 2026-10 with veined eyes, sealed eyes that tear open in phase 2, crack-mouths, a torn flesh rim and an eye in the throat in phase 3, and debris pulled into the disk)

- **Idea**: a cosmic horror: one great eye in a mass of night, a black hole's burning ring behind it, starry
  tentacles.
- **Backdrop**: an accretion disk (a tilted ring of orange and violet) turning behind the body.
- **Phase 1**: the great eye (tracking), thick tapering tentacles with toothed tips, the ring turning.
- **Phase 2, "it sees you"**: the body cracks and many eyes open across it, the tentacles multiply, gravity rings
  pulse outward.
- **Phase 3, "singularity"**: the body splits into a colossal vertical maw of spiraling teeth with a star-core inside,
  a crown of eyes above it, shattered planets orbiting, and the ring blazes.
- **Idle**: tentacles writhe, eyes blink out of step, the ring turns, stars twinkle.
- **Entrance (SVG)**: unfolds from a point of light, the eye snaps open. **Card**: `lgRealityTear`, reality splits
  as a horizontal slit, tears open vertically, jitters, and holds.

## 6. Seraph: the Thousand-Eyed Judge (owner request: inspired by the Legends celestial, NOT a copy; "a masterpiece, terrifying but crazy")

- **Lesson from the first draft**: a calm GOLD knight with a sword and no eyes in phase 1 was rejected outright ("where
  is the scary eyes and dangerous white celestial figure???"). "Inspired by" keeps what the owner loved (a WHITE
  celestial, scary eyes everywhere) and changes the rest. Terrifying from phase 1, not only at the end.
- **Second lesson**: v2 (white, eyes, a sword) was "still not that scary"; the sword "restricts the design" and was
  removed. Terror in EVERY phase: bloodshot eyes, blood tears, teeth from phase 1, reaching clawed hands.
- **Idea**: a towering white celestial: a faceless angular porcelain mask split by ONE huge bloodshot vertical red eye
  under a porcelain V brow, weeping blood over a needle-toothed slit grin; six white wings (three pairs: up, out, down,
  past the frame) of steel-tipped feathers with rows of red eyes; gyroscope rings full of eyes and a halo of
  light-blades around the head; a tattered white robe on a dark red lining; long skeletal arms with black-clawed hands
  reaching out of the sleeves, an eye staring from each palm; a crown of iron thorns; chains hanging beside it, an eye
  locked in an iron cage on each; eyes stitched shut down the robe's lining; bone hands clawing up from below; before a
  dark crimson cathedral rose window. No weapon.
- **Phase 1, watching**: every eye open, the hands reaching (and clawing up from below), the grin, the stitched eyes
  straining against their thread.
- **Phase 2, cracking**: red light in cracks across the mask, four more eyes tear open on it and four down the robe,
  the jaw drops open on two rows of teeth and heaves, a second pair of clawed arms rises from behind the shoulders,
  the stitches burst and those eyes open too, the halo blades go red-hot, it rains blood, the window cracks.
- **Phase 3, true form**: the mask shatters into halves drifting apart on a void with a spiral of eyes around a huge
  screaming vertical maw, a beam of light pours up, the robe splits into a second maw with ribs for teeth and an eye
  down its throat, the wings and rings burn, shards orbit, the window shatters over a red void full of opening eyes.
- **Face per phase**: one great staring eye, then a cracked mask of eyes, then a screaming maw.
- **Entrance (SVG)**: the window and halo spin up, the wings snap open pair by pair, the arms swing out, the great eye
  opens last. **Card**: `lgHolyUnfold`, a point of light high above that spins open and descends into place.

## 7 to 15. The second wave (owner request: "super crazy bonkers", Seraph and Void as the bar, "like WTF IS THAT")

Each was drawn to the same rules: terrifying from phase 1, a face that changes every phase, a backdrop that is part of the
boss, a phase 3 true form that is a different creature. The file's leading comment describes each one in full.

- **7. Leviathan, the Drowned God** (`lgAbyssBreach`): an eyeless barnacled skull rising from a maelstrom, a sunken
  cathedral and a lighthouse fused on, a jaw of ship-mast fangs. Phase 2: gill slits tear open into red eyes, jaws inside
  jaws, tentacles. Phase 3: the head peels open four ways into a whirlpool throat of tooth rings around a drowned eye.
- **8. Inferno, the Cinder Sovereign** (`lgFlareBurst`): an obsidian dragon on a throne of melted swords, wings like fire
  windows, a lavafall behind. Phase 2: the scales flake into embers, a furnace throat. Phase 3: a black bone skeleton in
  a firestorm with a heart of eyes and a screaming skull of white fire above its own.
- **9. Chronos, the Hour Devourer** (`lgTimeReverse`): a cracked clock face with a grin of numeral fangs, eight arms with
  hourglasses, scythe hands and eyed pendulums, in a vortex of clocks. Phase 2: the dial splits like jaws over gears and
  eyes, the arms trail ghost afterimages. Phase 3: a vortex maw of gear teeth with stuttering copies of the head.
- **10. Vampire, the Crimson Matriarch** (`lgBatAssemble`): a corpse-pale queen with a third eye, a crown of thorns and a
  bat-wing collar, a blood moon in a stained-glass window. Phase 2: the jaw splits into a lamprey maw, the bats leave the
  cloak, it rains blood. Phase 3: a giant blood bat-demon wearing her old face as a mask, the moon an eye.
- **11. Tempest, the Storm Tyrant** (`lgBoltDrop`): a thundercloud titan with a lightning face, rods that light in a
  four-beat rhythm (the ability) and a fourth-beat bolt. Phase 2: the chest tears open on the eye of the storm. Phase 3:
  a tornado with a screaming face of white lightning and debris spinning round it.
- **12. Kaleido, the Thousand Reflections** (`lgShardFocus`): two counter-rotating rings of mirror shards around an
  obsidian grinning mask, each shard reflecting a fragment of a face. Phase 2: the mask splits laughing and screaming,
  glass hands punch out. Phase 3: a fractal ring of eyes and gilded jaws around an endless mirror tunnel with a real
  face screaming at its end.
- **13. Glutton, the Bottomless Maw** (`lgGulpBloat`): a mountain of flesh that is mostly grin, tongues (one with an eye,
  one with a fork), cheek mouths, a crown of skewered things, over a collapsing banquet. Phase 2: the belly splits into a
  spinning maw and it eats its own crown. Phase 3: a spiral tunnel of jaw rings down to one tiny eye, swallowing the feast.
- **14. Puppeteer, the Grand Marionettist** (`lgStringDrop`): a hooded porcelain mask with needle fingers working a
  knight-jester marionette on a ruined stage; the strings stay attached through every motion. Phase 2: the doll's head
  snaps off and the strings run up into the real maw, the hanging puppets wake. Phase 3: a spider made of strings and
  masks under an eye of strings, the stage on fire.
- **15. Berserker, the Last Warlord** (`lgWarCharge`): a ram-skull war god in spiked armor with two axes on a burning
  battlefield. Phase 2: the armor shatters on rage veins, a tusked face, two more arms with a mace and a flail. Phase 3:
  a flayed burning six-armed skeleton with a halo of orbiting weapons.

Hidden entrance parts rest at `scale(0.01)` or far off canvas, never `scale(0)` (a non-invertible matrix crashes
check-art's overdraw pass).

## 16 to 20. The third wave (owner request: "5 more raid bosses", the same bar)

- **16. Swarmqueen, the Hive Empress** (`lgHiveRumble`): an insect queen enthroned on her own giant egg sac in a honeycomb
  cathedral of wax arches and cocooned victims, compound eyes of a hundred facets, four scythe forelimbs. Phase 2: the
  carapace splits on a glowing thorax, an inner jaw thrusts out, the egg sac bursts and drones pour out. Phase 3: the
  hive is her face: comb cells become eyes and chewing mouths around a ring of mandibles, her old body hung inside.
- **17. Gorgon, the Stone Gorgon** (`lgSerpentRear`): a jade gorgon with a crown of thirteen striking serpents and
  sweeping green gaze rays, petrified warriors around her in a ruined temple. Phase 2: her face turns to stone and splits
  open on a second face made of snakes. Phase 3: one colossal coiled serpent bristling with heads around a single huge
  petrifying eye, the temple collapsing.
- **18. Banshee, the Wailing Choir** (`lgWailPulse`): a ghost in a drowned organ loft with an enormous screaming mouth,
  veils for hair, a crown of cracked bells and a choir of faces in her robe. Phase 2: the jaw unhinges to her chest, the
  air cracks like glass, the organ pipes howl. Phase 3: a living organ of bone pipes ending in howling faces around a
  maw-vortex of sound, her head torn in two above it.
- **19. Reaper, the Soul Harvester** (`lgScytheSwoop`): a robe of screaming faces, a spine scythe with a jawbone blade, a
  lantern of trapped souls, over a field of dead wheat and graves. Phase 2: the hood falls on a cracked skull with eight
  eyes, a ribcage full of souls, the lantern cracks. Phase 3: a cloud of souls around a giant skull maw, hundreds of
  skeletal hands, a fan of orbiting blades, the graves bursting open.
- **20. Dreamer, the Sleeping Horror** (`lgEldritchUnfold`): an eldritch god asleep in a drowned impossible city, slit
  eyes peeking, tentacles twitching, dream bubbles holding tiny nightmares. Phase 2: it wakes, dozens of eyes snap open,
  the tentacles part on a beak. Phase 3: the skull splits open on a cosmic brain of galaxies ringed by eyes, the sky tears.

## 21. Moonmaw: the Moon Devourer (owner request: the Legends space boss as a raid boss that "goes all out")

- **Idea**: the living moon of `bosses/space.svg` (one giant purple slit eye under a crater-rim V brow, a jagged maw,
  star-dust tentacles, a gold orbit ring of satellites, the little ringed planet) grown into a planet eater. Kept apart
  from the Void: a PALE moon, not a dark orb; the bottom of the frame is the curve of an Earth-like world it is eating,
  its tentacles reach DOWN onto it; phase 3 splits the moon like a clam, not a round maw.
- **Backdrop**: a dome of deep space framed by a belt of shattered moon rock (the belt also passes in front of the
  world's lower edge), a milky way, a comet, a half-eaten moon still crumbling at the bite; the world below with oceans,
  continents, clouds, an atmosphere rim and city lights on its night side.
- **Phase 1, in control**: the eye narrowed and looking down at its meal, the maw shut in an interlocked jagged grin with
  violet drool and light leaking between the teeth, tentacles crushing the crust, the ring intact, satellites orbiting.
- **Phase 2, furious**: magenta fissures crack the moon open, six craters split into eyes, the brow clamps into a steep V
  over a bloodshot slit, the maw tears wide on two rows of fangs and a ring-toothed glowing gullet (the jaw chomps), the
  ring snaps into broken arcs with sparks and whirling wreckage, the crust cracks with lava, stars streak toward it.
- **Phase 3, true form**: the moon splits like a clam: the upper shell with the brow and the great eye (now wide and
  blazing) lifts, the lower jaw shell with its fangs drops, and between them a galaxy throat turns inside two
  counter-turning tooth rings around a white-hot star; shell plates orbit, the tentacles become galaxy arms reaching
  every corner, the world is torn open on its molten core and its crust rises into the jaw.
- **Face per phase**: narrowed and smug over a grin, a furious bloodshot slit over a screaming maw, a wide blazing eye
  over the galaxy throat.
- **Entrance (SVG)**: the tentacles unfurl one by one, the ring spins up, the eye snaps open, the grin cracks wide.
  **Card**: `lgMoonrise`, it swings round a full orbit in eclipse, small and dark, waxing brighter as it comes round,
  then a gravity pulse toward the viewer.

## 22. Kitsune: the Nine-Tailed Empress (owner request: "I LOVE THE CONCEPT OF SAKURA. PLEASE CREATE A VARIATION AS A RAID BOSS AND GO ALL OUT")

- **Lesson from the first draft**: a crouching cat body with chunky paws, a busy frame (torii, lanterns, steps,
  branches, moon), a scowl and too many face marks was "very ugly ... compare it to sakura being so beautiful". A raid
  variation of a beautiful boss stays beautiful: keep the face construction and the elegance, add majesty through
  scale, light and stillness.
- **Idea**: "the sakura goddess ascended". Built FROM `bosses/sakura.svg`'s face (its paths, at its own scale): the long
  fine white fox face, one eye serenely closed, one sly gold slit, Heian dot brows, delicate red markings, a knowing
  smile with one small fang tip, the little fox mask pushed up on her head, a bell earring. A regal bust: a slender
  neck, a layered kimono collar (white, pink, red, gold) over dark palette-tinted silk with gold sakura crests, a gold
  bell on a red cord, gold kanzashi hairpins with swaying chains, and the star ball (the ability) pinned at the V of the
  collar.
- **Backdrop**: nothing but her: nine pastel pink tails in a symmetrical fan like an open sakura bloom, white tips,
  each edged in cyan fox-fire with sakura's flame at its tip, and a thin gold halo ring behind her head with fox-fire
  rising from it. A few petals.
- **Phase 1, serene**: sakura's face, the stare and the stillness are the threat.
- **Phase 2, awake**: both eyes open, gold on slit pupils, the markings glow, the smile turns thin and cold over two
  elegant fangs, the small mask cracks on cyan light, the tail flames flare tall, the halo burns brighter, petals swirl.
- **Phase 3, true form**: a spirit goddess, never a dark demon: her fur turns luminous white with cyan light, a third
  eye opens as a gold jewel on her brow, the mask breaks into three pieces drifting away, a crown of fox-fire on the
  halo, nine towering spirit tails of pink and cyan fire with a blinking gold eye on each, the star jewel blazes pink.
- **Face per phase**: one eye closed and one sly gold slit, two gold eyes and a cold smile, a third eye and blazing gaze.
- **Entrance (SVG)**: the mask lifts off her face onto her head, the tails open one by one from the center like
  petals, the gold eye slides open. **Card**: `lgPetalFall`, she drifts down like a falling sakura petal, side to side,
  then blooms to full size.
