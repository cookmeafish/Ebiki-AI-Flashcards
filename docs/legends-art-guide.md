# Legends art: how the assets are made

Read this BEFORE drawing any Legends art (a new motif, a redraw, "make more bosses"): the owner's art direction plus
the technical rules the app enforces. Files: `public/assets/legends/` (`areas/<motif>.svg`, `bosses/<motif>.svg`);
`public/assets/legends/README.md` is the short version for hand edits.

## The owner's top rules, in short (2026-10; the details are further down)

Every boss and raid boss brief starts from these (what the owner rejected or loved across many rounds).

1. **Quality bar: `raids/kitsune.svg`.** Super detailed, layered cel shading (3 to 4 values per material), rim light,
   materials that read (gold, steel, fur, feathers, cloth folds). Never flat shapes, never cute blobs.
2. **Silhouette first.** Reads at 120 px (and 64 on the map), fills its frame, seen from below, bleeding past the
   edges. Limbs have real mass and anatomy: thick arms, bent joints, gripping hands (no stick arms, no "boxes with
   buttons" fists, no floating legless bodies; small figures stand on something with a shadow).
3. **BIG in frame, always. Variety never comes from zooming out.** A full-body shot shrinking the face to a few pixels
   was rejected every time (rat king, sugar queen, showman). Head and torso fill most of the frame.
4. **Each raid phase is a new picture: new CAMERA, HEAD ANGLE, POSE, FACE, LIGHT and COLOR.** Props swapped in the
   same crop, or the same pose recolored, is "lackluster". Test: the three phases tell apart by silhouette alone at
   120 px.
5. **Personality is constant across phases.** A smug king stays smug and cool; a sly showman keeps his sly smirk.
   Escalate with status, scale, power and spectacle, never by turning the character into a screaming, snarling maw.
6. **Distinct parts of one creature.** Repeated heads, minions or wings each get their own character (size, shape,
   scars, expression, angle) while clearly one creature. Identical clones read as lazy.
7. **The backdrop is subordinate.** Muted, darker, lower saturation, with depth; the boss is the brightest, most
   saturated thing. No rainbow bursts, no flat colored blobs, no fake-looking glows or hard light sticks.
8. **Faces:** mouths never where eyes go, no ring-shaped maws, no unibrows; teeth only where they fit the character
   (a smirk with a gold tooth beats a wall of teeth). Raid bosses terrifying or imposing; Legends bosses vary in mood
   (smug, proud, playful, eerie, mean).
9. **Raid variants of loved Legends bosses go all out but stay recognizable**, and look clearly different from the
   Legends boss even in phase 1 (own costume, prop, setting, pose).
10. **Fire only where it belongs** (the arena knight has none). All-ages content (tasteful figures, no revealing
    designs).
11. **Photo-real layers are opt-in per boss** (only the ophanim so far, via the PHOTO LAYERS block in `art.jsx`). No
    photos on other bosses unless the owner asks.
12. **Every change gets a backup and a before/after render**, and the owner sees an honest critique, not just praise.
13. **Phase 3 is the climax, never a letdown.** It must feel bigger, more alive and more spectacular than phase 2, and
    be as different from phase 1 as phase 2 is (ratking and showman phase 3 were sent back for this). One dominant,
    readable figure, never a pile of equal-weight parts (the old showman phase 3).
14. **The true form moves the most.** Idle life grows with the phases: phase 3 needs the most motion (a pet, a jaw,
    a sway, spilling props, smoke), big enough to read at 120 to 340 px, on different rhythms ("not enough movement
    on phase 3", ratking).
15. **Anatomy must survive a glance.** A limb bends at one clear joint and ends on something (a foot planted with a
    contact shadow); a cloth must not read as a leg, and no peg shins, stumps, double knees or blob legs (tempest
    phase 3 took three rounds). Held objects read instantly and are GRIPPED (fingers wrap in front), or are removed
    (a yellow blob in a fist and a gold disc in a mouth read as nothing).
16. **Shapes stay sleek, not blocky.** Heads and necks taper and curve (arrowhead skulls, waisted necks); straight
    parallel sides and flat coffin outlines read as "blocky" (hydra heads). But never round, puffy or rubbery.
17. **Necklines match across phases.** A character's neckline (the sugar queen's sweetheart neckline with its short
    cleavage line) is visible in every phase and no lower than the most covered phase; props must not hide it.
18. **Abilities animate the boss itself.** Every ability effect moves the boss's REAL parts (the ophanim's lids open
    and blink, the seraph's wings spread and eyes turn gold, the hydra's heads rise), and is rich, not bare bones
    (seraph Grace was sent back). An effect never covers the boss: no stand-in drawn eye over the real one, and the
    boss never disappears for a frame. Parts an ability is about get hook classes in the SVG.
19. **Light files.** Keep shapes economical (the asset view and fights must stay smooth on a high refresh monitor);
    a reshape that bloats a file is redone with fewer points.
20. **Voices are part of the design.** Every raid boss has its own personality and way of talking (see "Raid boss
    voices" below); a redesign updates the boss's lore and voice so they match the art.

> **Retired raid boss: the Glutton (the Bottomless Maw).** Removed by the owner in 2026-10 ("i dont even like the
> concept of glutton"). Never draw, recreate or propose it again.

## What the owner wants

- **Bosses look like real bosses.** Super detailed: glowing eyes, a maw, claws, spikes, scars, armor, cracks of light.
  Never cute, never a smiley blob with teeth. Reads as a boss at 64 px on the map and rewards a close look at 190 px
  on its intro card.
- **Mood: RAID bosses are all terrifying; Legends bosses VARY (owner, 2026-10).** "Raid bosses should look super
  threatening but normal Legends bosses don't all need to be mean looking. Some mean looking ones, but also variety."
  A Legends boss can be mean, smug, playful, proud, eerie, sleepy, mischievous, regal, sad or comic-menacing: pick the
  mood fitting its area and give the set a spread. Not every one gets the angry V brow (the "Faces sell menace" recipe
  below is for the mean ones and raids).
  **Mean is still welcome where the design calls for it** (owner: "this doesn't mean there should never be any mean
  bosses ... if it makes sense for the boss design then yea keep it mean"). The rule is VARIETY, not "no mean
  bosses": a dread knight, a lava wyrm, a three-headed hound stay menacing; a mountain spirit, a kitsune, a candy
  giant may be serene, sly or goofy. Decide per boss from its concept, then check the set for a spread. Changed from
  mean in 2026-10:
  mountains (stern, ancient, immovable, and a MOUNTAIN, not a man: remade from scratch in 2026-10 after the owner hated
  the rock-golem face block with its crystal crown ("cartoon rock mask", no body); now the Wandering Peak, a colossal
  tortoise whose shell IS the snowy summit, horned head pushed out from under the scute rim, heavy-lidded glacial slit
  eyes on you, a hooked stone beak with its corners pulled down, bowed scaly forelegs planted wide. Earlier rejected: a
  serene old man with a moss beard ("different face", too close to forest) and the cliff-face golem), sakura
  (enigmatic), sky (playful), ice (haughty), jungle (smug), graveyard (melancholy),
  garden (gleefully, greedily hungry; redesigned in 2026-10 after the round flytrap with eyes on stalks "looks like a
  big ball": now a towering plant with a BODY, a wide hinged trap head tilted on a thick thorny stem out of a cracked
  planter, pointed thorny chin, gleeful amber slit eyes under heavy leaf brows, crimson bract crown and sepal horns, a
  crescent grin of cilia teeth and two fangs, the glowing nectar pool in the throat as the tinted part; never a round
  head again),
  arena (cold, silent, menacing, after the holy paladin read "too skinny" with armor "like a flag": a massive SHADOW
  knight seen from below, black plate with cold lit edges, a T-visor great helm with soul fire IN the slit, an iron
  crown of thorns biting in, a greatsword planted point-down, never held across the body; NO FIRE on him or in his
  lair: sword flames read weird, eye fire was removed, then "shadow fire", then the owner said "no fire" (2026-10), so
  no flames, smoke flames, embers or braziers; runes glow cold blue like the visor),
  crystal (insufferably smug: three conceited heads, a cocked brow, an eye roll, a self-admiring sparkle),
  fungal (drowsy, dreamy spore-sage: heavy half-shut lids, moss moustache and beard, a content smile, a slow yawn
  puffing sleepy spores),
  arcade (evil but OVERLY happy, giddy because he is about to destroy you: steep devil brows raised with glee, crazed
  glowing red crescent eyes, cheeks pushed up, a manic ear-to-ear grin of far too many sharp fangs, a drool drip,
  cackling HA-HA-HA in hard steps; an earlier cute star-eyed version was rejected),
  sewer (smug show-off flashing his gold grillz: chin up, half-lidded eyes, one brow cocked, two huge sparkling gold
  buck teeth as the focal point, bling, two rat courtiers, one polishing a coin, one holding up his mirror),
  sweets (sickly sweet and scheming, remade from scratch after the owner hated the goofy gingerbread man: the
  Sugarplum Queen, half-lidded eyes looking down, one brow arched, a too-sweet smile curling at one corner over one
  sugar fang, offering you a skull-marked bonbon),
  junkyard (happy-creepy at first; then "make this guy more badass", then a robot-tyrant brief: a cold, arrogant robot
  WARLORD of junkyard vehicles, the vibe of a tyrant transforming robot without copying any real character: crested
  helmet with swept fins, narrow red eyes, grim mouth guard, car-hood pauldrons, windshield and grille chest, an
  exhaust-pipe fusion cannon and a clawed gauntlet; no traffic cone. Then "make him more badass" again: now HUGE, seen
  from far below and bleeding past the frame, backlit by a roaring blast furnace with a rim of fire, the cannon leveled
  face-on at the viewer and crackling, claw arm cocked wide, layered jagged pauldrons, heavy legs on pistons planted on
  a crushed car, slit eyes with light trails under a heavy V brow, a fanged steel mouth guard, heat glowing in the
  seams),
  mine (CUTE IN A DANGEROUS WAY, the owner 2026-10: "make this guy cuter" then "but cute in a dangerous way". A chubby
  crystal-crowned cave axolotl: big shiny eyes with slit pupils, one sly lid and one cocked brow, a smug grin with
  little sharp fangs, blush, stubby paws with small dark claws, one paw holding a single lit stick of dynamite, pink
  feathery gills; no scars, no rows of jagged teeth. Earlier rejected: the drill-maw mole-worm, a dwarf king, a blind
  leviathan; no dwarf, miner-person, mole or drill),
  ocean (eerily polite: a walking octopus gentleman in a tattered greatcoat, one gold eye heavy-lidded, the other
  magnified behind a brass monocle under the lifted side of one brow ridge, flat octopus pupils, a tentacle beard
  hiding the mouth, a lantern held high as a lure; the owner asked for "a walking human like octopus thing"),
  forest (PROUD and NOBLE, a little stern, never horror. Remade from scratch twice in 2026-10: the owner hated the
  trunk-face "tiki mask", then found the stag skull in a tree hollow with root-claw hands "like its coming out of the
  ground" and asked for "a mutant deer where you can see its body and it looks at you and it has wings coming out of
  it". That winged stag had a heartwood skull face, bared fangs, cyan tear streaks, an exposed glowing ribcage and bone
  spikes on its back; the owner then asked to "make the wings brown and make him less creepy". Now the Elder Hart, an
  ancient forest guardian: a whole stag in three-quarter view looking straight at you, a FURRED stag head with a
  muzzle, dark nose and calm closed mouth, warm amber eyes under one solid ridge of dark fur, grand mossy antlers,
  BROWN feathered bird wings (after "make this more like bird wings": bat-wing bone frame and membrane gone; coverts,
  broad secondaries, six separated primary "fingers", cream barring, dark umber against a warmer red-brown hide) rising
  out of fur collars at the shoulders, a dappled hide, a moss saddle with ferns and a sapling where the spikes were, a
  glowing spirit leaf on the brow and flank where the ribs were. Earlier rejected: "evil", "goofy", "hippie" human
  faces on a tree, a face on a trunk, arms out of a hole, a skull face with fangs and tears. The two spirit leaves
  (and the leaf carved on the banner's rune stones) are the part a palette tints),
  savanna (proud, regal, a little smug, remade from scratch after the owner found the spiky lion head "too pointy" and
  then wanted to "see its body while it looks at us": the WHOLE lion lying at ease along Pride Rock, crossed soft paws
  over the ledge, head turned square to the viewer, half-lidded gold eyes, one cocked brow, a closed smirk with two
  round-tipped fang tips, a big curly mane, royal beads and a sun medallion; everything soft and round),
  swamp (royally BORED, redesigned from scratch after the crocodile head with a lantern lure: the Bog Sovereign, a
  colossal toad king slumped on a sunken throne, heavy FLAT lids half over gold eyes with horizontal toad pupils, chin
  propped on a webbed hand squishing one cheek so that corner of the long closed mouth curls up while the other sags, a
  cattail sceptre, a crown too small for him with a lily pad and a lotus, a throat sac that swells as he croaks, a fly
  he will not swat; no teeth at all. The will-o'-wisps around him are the part a palette tints),
  stage (smug, theatrical, sinister but charming, after the owner asked to "make this guy more interesting and get rid
  of the unibrow": the Grand Illusionist, a demon showman mid-act inside a gilded proscenium arch, one arm flung out
  with cards spiralling up from his glove, a jewelled cane, top hat between swept horns, a velvet collar and cape
  swirled open on its lining (the tinted part). TWO separate brows: a painted one cocked high on the porcelain mask
  over an amused eye, and, where the mask cracked away, the demon's own bony brow lowered over a burning slit; a curled
  moustache over a sly crooked grin. Kept apart from the puppeteer raid boss: no marionettes, no square curtain box,
  no row of footlights across the frame).
- **Every boss and every banner is truly unique**, not "the same thing but slightly different". Vary the whole idea,
  not the colors:
  - silhouette and pose (head bust, full body, winged, profile, a creature rising out of something);
  - what is behind it (spotlight cone, storm cloud, turning sun, smoke, crystal halo), not the same round glow;
  - number and kind of eyes (two slits, a visor, six eyes, one burning eye in profile), mouth type (maw, beak,
    mandibles, carved grin, jaw of rock);
  - the entrance (see below).
- **Creative and super detailed**: layered shading (dark side, lit side), highlights, texture strokes (bark grooves,
  scales, fur tufts, window grids, rivets, stitches), small story props (toadstools, a hazard tag, an ankh, a tear on a
  mask, fireflies, sparks). Detail stays readable when small: strong ink outline, clear shapes first.
- **Each banner (area map) is themed to match its boss**: the boss's lair, with the boss present (eyes in the dark, a
  silhouette, the face carved into the cliff, a tentacle holding a wreck). It tells a small story: a path, a bridge,
  ruins, weather, something alive.
- **Each boss has its own animated entrance** (see Motion), and everything has some idle life.

## The owner's vision in one place (read this before ANY new boss or raid boss)

**The gold standard of quality is `raids/kitsune.svg`** (owner, 2026-10: "kitsune is basically the gold standard of
quality"): detailed, beautiful, every phase a different pose and silhouette of the same creature, the signature (face,
tails, palette) kept through all three. Compare every new or redrawn boss with it side by side. `raids/void.svg` ("the
best one by far" in the earlier round) shows the other half: fills its frame, its backdrop IS the boss (a black hole's
disk), a face you remember, every phase changes it so much no phase is mistaken for another. `raids/titan.svg` and
`raids/hydra.svg` are the next references. The 40 Legends bosses are held to the same bar (they just have no phases).

**Bosses vs raid bosses**
- A **Legends boss** guards one map area: one drawing, no phases, an entrance on its intro card, idle life in the
  fight. Concept comes from the area (`dev/legends-gallery/catalog.js`). Must look as detailed and fierce as a raid
  boss: raids must not make it look lackluster.
- A **raid boss** fights across THREE phases (`lg-p1`, `lg-p2`, `lg-p3`, `lg-p12`, see the README) and has an ability
  (`RAID_ABILITY`). Each phase is a TRANSFORMATION of the boss itself, not layers added around it.

**What the owner approved (do more of this)**
- Phases that change the creature: a head cut off and two growing back, armor bursting open on a molten core, a helm
  splitting on a skull, a crown shattering into orbiting shards, bony legs showing where the robe burned away,
  waterspouts rising from the whirlpool, a bolt striking the crowned head.
- **The face changes every phase** (the owner's idea): calm and in control, then furious, then screaming or melting.
  Lich: calm eyes, then one solid V brow ridge narrowing them, then blazing wide eyes over a dropped jaw. Titan: sealed
  visor, then the jaw grille torn off on a snarling molten mouth with flames pouring from the eyes, then a split helm
  on a molten skull with the same flames.
- Effects ATTACHED to their source and moving with it: flames rooted in the eyes they pour from, drips falling from
  the gash that bleeds them, sparks from the core.
- Chunky, colorful, readable shapes with a strong outline, a darker depth edge and a highlight.

**What the owner rejected (never again)**
- **Flat semi-transparent color blobs or auras** behind or around a boss (a red tint filling the clouds, green fans
  behind heads): they read as stains. A glow is only the bright copy of one specific shape (an eye, a flame core).
- Effects floating loose: flames hovering above the eyes instead of coming out of them.
- Motion without a reason: teeth bobbing while the jaw stays still. Teeth hold still unless the whole jaw moves.
- Thin separate brow wedges with a line through them read as **eyelashes**. A brow is ONE solid bone or armor ridge
  in a V, angled down to the middle.
- Too much stacked in a final phase (ghost robe + fishbone ribcage + bright rectangle mouth + scythe on one lich)
  reads "mega weird". Pick the two or three changes that tell the story and make them big.
- A phase that only adds small things: if phase 2 looks like phase 1 at a glance, it is not done.
- Labels or tags over the boss (the PHASE tag now sits under it) and anything hiding the transformation.
- **Nose rings** ("I hate nose rings"). No piercings on bosses.
- **Handsome means HANDSOME** (owner on the first noble arena: "ugly af"): a chiseled heroic face with cel shading and
  good head-to-body proportions, shining layered armor, not a small flat head on a flat torso.
- **No circular spinning ring maws** (owner, 2026-10: "the circular spinny mouth that a lot of other bosses have"). The
  round lamprey or spiral disc of tooth rings was reused into a cliche. Give each boss its own mouth (an unhinged jaw,
  splitting jaw flaps, a fanged snarl).
- **The phases are ONE creature** (owner on the berserker: "they look like brothers", "separate enemies"): phase 2 is
  what phase 1 becomes when it breaks, phase 3 what phase 2 becomes. Keep head shape, eyes, a signature mark and the
  helm or crown, and wreck them step by step.
- **"Inspired by X, don't copy it" does NOT mean drop what made X loved.** The first Thousand-Eyed Judge kept only "an
  angel" and became a calm gold knight with no eyes; the owner: "where is the scary eyes and dangerous white celestial
  figure??? HOW IS THIS YOUR BEST WORK???". Keep the loved signature (a white celestial, eyes everywhere), change the
  rest (pose, backdrop, structure, phases). A raid boss is terrifying from PHASE 1; the phases make it worse, not
  scary for the first time.
- **A raid variation of a BEAUTIFUL boss stays beautiful** (owner, 2026-10, on the first kitsune: "very ugly ...
  compare it to sakura being so beautiful"): keep the loved face construction and elegance, make it grander and more
  dangerous through scale, light and stillness, never by crowding the frame or uglifying the face.
- **Fire out of the eyes as a default.** It worked on the titan and the castle knight (rooted IN the visor slit,
  leaning outward); on others (the frontier rider) the owner asked to remove it. Use rarely, only rooted in the eye.
- Mouths that do not read as mouths: a thin slot with tiny teeth, pink squiggles around it, a ring line across it.
  A maw is one bold jagged opening, a dark inside, a glowing throat and a few BIG fangs.
- Twitchy idle motion: small limbs flapping fast and far (the rex's arm). Idle life is slow and small; big motion
  belongs to the entrance.

**What the 2026-10 review rounds taught (every boss, Legends and raid)**
- **"Badass" is the word the owner keeps using.** When in doubt, push harder: meaner face, bigger silhouette, sharper
  materials, more threat. "Make him even more badass" got a crown of thorns biting into the brow with blood running
  (arena); "more badass in every way" is a valid whole brief. Never cute where it should be fierce.
- **Fierce bosses must not read soft or flowery.** A tree spirit went "goofy", then "hippie" (flower crowns, a gentle
  bearded smile, peace vibes); what works is a monster first (a face grown INTO the trunk, bark plates, a threat).
- **The concept must read at a glance.** "I love phase 3 but i don't understand what the boss is trying to be": if the
  owner cannot name the creature, it is not drawn clearly enough. One clear silhouette idea per boss.
- **Pointy beats rounded** for teeth, claws and spikes (the library's rounded teeth were reverted to pointy). But a
  design made only of spikes reads "too pointy" (the savanna head); show a BODY, not a floating spiky head, when the
  creature has one.
- **Mouths go where mouths go, eyes where eyes go.** Small round or oval mouths read as EYES at game size (a raid boss
  "of mouths", since retired, read as "a monster of eyes"). Mouths are few, big, unmistakable slashes with teeth;
  nothing mouth-like in the eye position. Eyes everywhere has a limit ("void has too many eyes"): a few big ones over
  a sea of dots.
- **One creature, one set of features.** Heads of one body share eye color, skin, crest, brow style and teeth ("they
  all look too different, the eyes are different color", hydra). Same across phases (lich phase 3 skeleton got the
  lich's own skull, not a generic one).
- **...but not clones** (the hydra's next round: "all the snakes are too similar to each other in every phase"). Keep
  the shared features, then give every head its own CHARACTER through the skull and what it carries: size, snout
  length (blunt, long, broad-jawed), view (front, three-quarter, profile), horns (crowned and swept, one snapped, bull
  horns, gold-banded), scars, a frill, barbels, a jaw plate and tusks, its own expression and pose (smug, sly
  side-eye, bored and resting, lunging). At 120 px each head must be nameable by silhouette.
- **Parts join organically.** No seam line where a tentacle beard meets the face; no loose decorations floating on the
  forehead (blue circles on the ocean boss were "weird"). Accessories read as what they are: the banshee's green bells
  were mistaken for "weird green hair that floats".
- **Anatomy reads.** Arms bend at an elbow from a shoulder ("arms are weird", ice); a hand doing something specific
  (clawed into its own chest, vampire) beats a hand flung out generically. Eyes on stalks like a snail beat little eyes
  dotted around a face (lab).
- **Nothing cut off by the frame.** Wings and feathers hitting the clip edge "get cut off": scale them inside the
  headroom or spread them where the box allows (seraph). Measure: sample every animated part's outline over the idle
  loop and keep it inside x and y -22 to 142 (seraph v4 wings sized this way; a flapping wing or turning wheel needs
  the room at its widest moment, not at rest).
- **Raising an older boss to the new bar means re-RENDERING it, not redesigning it** (seraph, 2026-10). A redraw into
  a calm cowled judge in a heavy robe was "lame" and "too bulky": keep the loved silhouette (tall, spiky, airy,
  many-limbed, lots of negative space), upgrade shading, materials and structure, fix only what was wrong (a mouth
  under the eye became a gold mask plate; thin spider sticks became fewer, sturdier, shaded bones). Check effect faces
  too: a closed lid drawn as a curve with lash ticks read as a grinning MOUTH; keep the whole almond, lid lowered.
- **Divine bosses are perfect and omnipotent**, not angry: an immaculate central eye, interlocking rings studded with
  many eyes, many layered wings of parchment feathers, a white void, overwhelming scale (the Wheel of Eyes, from the
  owner's reference images). Serene and flawless is scarier for them than a snarl.
- **Liked concept, disliked character = redesign the character, keep the concept** (kaleido, chronos, tempest: ability
  and theme stay, the creature is drawn fresh). "Redesign completely" means a new silhouette, pose and face, not a
  tweak. A color note is part of the brief ("more yellow because of lightning").
- **An animal must read as THAT animal, front on too** (the sewer kingpin, 2026-10: a wide round head with big slit
  eyes and a short muzzle read as a cat). A rat is a wedge: a long snout bridge ending in whisker pads and a nose at the
  TIP, big thin round ears set high, small round pupils, buck teeth under the nose. Check the species at 120 px first.
- **A god or hero must look heroic: muscle and good looks are part of the character** (Zeus, 2026-10: "make zeus more
  muscular and handsome"). Thin stick arms, a narrow chest and a small body under a huge hair and beard mass read frail
  and old; glowing visor eyes with a scowl read as a mask, not a face. Draw the V-taper (broad deltoids and traps, big
  pec slabs with a hard shadow under them, a six-pack, obliques, serratus notches), thick upper arms with a biceps
  bulge, forearms swelling near the elbow, a strong neck, and a handsome face: real irises, a straight nose, a jaw, a
  confident half smile. Beard short enough that face and chest show. Shoulders melt into the arm (outline only the
  outer arc of the deltoid) or the body reads as an action figure with ball joints.
- **"Riding" needs a side or three-quarter view and the straddle** (Zeus phase 3, 2026-10: a small figure on top of a
  head-on dragon "doesn't look like he is riding it"; the owner then suggested the side view). Mount in profile
  charging across the frame, rider seated on the neck BEHIND the head, near thigh along the neck, shin and foot hanging
  below its lower edge, one hand gripping (a horn, a mane spine, reins), hair and cloak streaming back with speed
  lines. That reads as riding at 120 px; a rider stacked above a frontal head never does.
- **Bosses look AT the player, always** (Zeus phase 3, next round: "make the enemies focus on the user, because right
  now they look like they are looking outwards"). A pure profile sends every face off the side. Keep bodies in side or
  three-quarter view for action (riding, charging) but turn the HEADS to the camera: the mount's head swung round
  roaring at us with both eyes visible, the rider square to the viewer with eyes on us, the weapon raised toward us,
  speed lines rushing at the viewer. Keep the camera close (rule 3).
- **Personality is constant across phases; escalate with STATUS, not by turning a smug character into a screaming
  monster** (the sewer kingpin, 2026-10: a snarling phase 2 with flailing arms and a roaring phase 3 made of a muddy
  mass of rats were "terrible"; the owner: "MAKE THIS RAT KING SMUG AND COOL THROUGHOUT THE WHOLE THING"). A mob boss
  never loses composure: keep the loved face every phase (same eyes, brow, smirk); phases add power, wealth and swagger
  (standing up and making it rain with his crew, then lounging on a throne of gold built from his own rats). Effect
  faces may wink or dip a grin but stay in character. "Terrifying from phase 1" fits the monsters; a character boss
  threatens through status and scale. New poses and silhouettes per phase still apply; a crowd becomes a few distinct
  posed figures or one ordered structure (a ring of golden rats), never a muddy mass.
- **Each phase needs a new CAMERA, POSE and FACE, not just new props** (the sewer kingpin's next round: "phase 2 and 3
  aren't different enough ... different face too, they are the same face. still smug tho"). Same head size, place,
  angle and expression with new things around it reads as one picture three times. Change the framing (a
  head-and-shoulders bust, then full length in three-quarter view, then a small figure high on a throne seen from far
  below), the head's angle (front, three-quarter, tilted down), the expression within the character (smug over the
  shades, a wink and a side-eye, a bored half-lidded closed smirk), and the color story. Test: the three phases tell
  apart at 120 px by silhouette alone. Small figures stand on something (the hoard, an armrest) with a contact shadow:
  "why are the mice floating".
- **Variety never comes from zooming out** (the same rat, next round: "phase 2 and 3 look absolutely terrible"). A
  full-length figure or a small figure on a throne shrank the face to a few pixels, left stick legs and a blob claw,
  and lost everything loved in phase 1. Keep the boss BIG every phase (head and torso filling most of the frame,
  bleeding past the edges, seen from below) and vary the CAMERA ANGLE (frontal, a close three-quarter lean, a low shot
  from below), the HEAD ANGLE, the HANDS (a huge foreshortened claw thrust at the viewer, a goblet by the face), the
  LIGHT (vault light behind, gold uplight from beneath) and the COLOR story.
- **Distinctive phases: a new SETTING, COLOR story, POSE and TRANSFORMATION each** (the sewer kingpin, 2026-10: "make
  it distinctive enough"; a plan only escalating the props around phase 1's head was rejected as "phase 1 plus
  stuff"). Keep him big and keep the personality, then move him elsewhere (a vault, a neon casino, a treasure temple),
  give each phase its own palette (emerald and gold; magenta, cyan and black; all gold on purple) and let the true form
  transform the material itself (living gold). Sketch three 120 px silhouette concepts per phase before drawing; keep
  the strongest.
  A "true form" must not REPLACE the loved character: recoloring the rat into a gold statue read as "a gold cat statue"
  and was rejected; what landed kept him himself and brought his world to life around him (his hoard rising as a gold
  dragon coiling round him).
- **Rejected concepts stay rejected**: a dwarf miner, a blind cave leviathan (mine; the current cute-but-dangerous
  crystal-crowned axolotl is the one being refined), a muscular-only arena without nobility, a white-and-gold paladin
  that "looks like a flag" (arena is now a shadow knight). When the owner rejects a design twice, offer a sheet of
  distinct concepts to pick from.
- **Reference images from the owner are the brief.** Match their signature qualities (palette, materials, structure,
  mood) in the app's flat cel-shaded style.
- **"Mutant" is not "creepy"** (owner on the forest hart, 2026-10: "make him less creepy"). A proud or noble Legends
  boss must not pick up horror shorthand: a bare skull for a face, bared fangs in a snarl, tear streaks, exposed
  glowing ribs, bone spikes down the spine. Keep the strangeness in its SHAPE (wings grown from a stag) and give it a
  living face (fur, muzzle and nose, closed mouth, warm eyes under a stern brow) and living details (moss, ferns, a
  glowing leaf). Colors carry mood too: the hart's green bat wings read alien, brown feathered bird wings read like the
  forest. A wing the owner calls a wing of something real is built like it (coverts, secondaries, primaries), not a
  membrane recolored.
- **A NEW CAMERA per phase when props were all that changed** (owner on the banshee, 2026-10: "more variation for
  phase 2 and 3"; phase 2 was phase 1 plus frost stars, phase 3 the same front-on crop with the face split). The fix
  redrew phases 2 and 3 as WHOLE scenes (phase 1 wrapped in `lg-p1`, a `lg-p12 > lg-p2` scene, a `lg-p3` scene):
  phase 1 front-on and hunched at the organ, phase 2 pulled back on a dutch angle with the full figure rising on a
  diagonal, phase 3 from below with a colossal head over a vortex body. Each scene has its own backdrop, face and
  fx/ability layers; the personality (a mourning wraith that screams), V brow, cyan eyes, glowing throat slit,
  torn-veil hair and tinted bells carry through. Check the three silhouettes at 120 px first: triangle mass, diagonal
  X, crowned funnel.
- **A phase that swaps props on the same crop is not a new pose** (owner on the sugar empress: "phase 2 and 3 are
  boring"). Her three phases were one front-facing half figure with a scepter, then a sword, then a halo. A raid phase
  changes the BODY: phase 2 a diagonal leap with legs, a swing arc, the lair breaking apart behind her; phase 3 a
  floating giant with uneven wings, one arm raised, the other offering the ability's object, the lair tiny below.
  Check at 120 px that the three silhouettes differ before any detail.
- **A new pose inside the same crop is still the same picture** (owner on the sugar empress, after a leap and a
  floating pose both kept her head the same size in the same place: "phase 2 and 3 need to be more interesting").
  Change the CAMERA too: phase 2 pulled back to a small full figure surfing a giant caramel wave, phase 3 a colossus
  seen from far below whose gown becomes the kingdom. Each phase needs a new camera, scale, pose and face, tellable
  apart by silhouette alone at 120 px; the personality stays, the spectacle escalates.
- **Eyes and fire on the same pose is still phase 1** (owner on the hive empress, 2026-10: "phase 2 isn't different
  enough"; it was phase 1 with cracked eyes and two fire bursts). The redraw changed the BODY PLAN shown: phase 1 a
  wide, symmetric queen sprawled over her egg sac; phase 2 rears up tall on a tilt, a striped wasp gaster curled
  forward with the stinger at the viewer, scythes raised, wings fanned. The same red eyes, V brow and spiked crown keep
  her the same queen. When a phase must hide a SHARED layer (a floor drawn over every phase), copy that layer into an
  `lg-p1` and an `lg-p3` group instead of painting over it.
- **...and never by zooming out** (owner on the sugar empress's sixth pass: "she's too far away in phase 2 and 3"). The
  fix for "same crop" is a new camera ANGLE and pose at the SAME closeness (a three-quarter lean, a regal shot from
  below), not a wide shot. A beautiful villainess sells through the face (liner, lashes, cheekbones, a smirk), styling
  and attitude; keep figures tasteful for all ages.
- **The backdrop is subordinate to the boss** (owner on the sugar empress: "the castles and background are too
  colorful"). Pastel towers, a rainbow sunburst and saturated clouds made her disappear. Behind a colorful boss use a
  restrained, darker, low-saturation palette (dusk plum, mauve, chocolate), small warm accents only (windows), and
  atmospheric depth (farther = lower contrast), so the boss is the brightest, most saturated thing in the frame.
- **Long hair is not glamour** (owner on the same boss: "her hair is too long"). Waist-long locks filled the frame and
  buried the figure; a short styled cut (a bob with a fringe, a small swirl knot, short ringlets) frames the face and
  keeps it beautiful. The hair keeps one identity across phases: it may whip or float, never grow.
- **A loved THEME on a weak creature is redrawn as a new creature** (owner on Moonmaw: "i love the idea of a MOON boss
  but this design ain't it. redesign from scratch"). A cratered ball with one eye, a grin and tentacles read as a pale
  Void and copied the Legends space boss. The moon now belongs to something bigger: the Lunar Strix, a colossal horned
  owl whose FACE is the moon (`raids/moonmaw.svg`). Lessons: make the theme the creature's signature part (moon disc as
  the facial disc, its phases as the phases), check the whole set for the same silhouette before drawing (a ball with
  an eye is taken; owls, moths and spiders were weighed against the set), let one theme carry the color story (full
  moon silver, blood moon red, eclipse black and gold). Keep the moon readable: show it ABOVE the brows (one solid V
  ridge and a narrow forehead wedge, never a dark cap over the whole top), craters soft and unoutlined so they never
  read as extra eyes.
- **Ebi drafts stay close to the current Ebi.** A redraw in a very different style was "way too different"; a
  low-detail copy was "a shitty low quality version". Variations are polished and only a little different.

**Backgrounds (area banners, `areas/<motif>.svg`) are held to the same bar.** A banner is the boss's LAIR, as detailed
and alive as the boss: layered depth (far silhouettes, mid scenery, a near foreground framing the view), moving
weather and light (drifting fog, rain, sweeping searchlights, embers, fireflies, waves), a small story (a path leading
in, a bridge, ruins, a wreck, a warning sign) and the BOSS PRESENT and recognisable as the same creature as its boss
file (glowing eyes in the dark, its silhouette on the ridge, a tentacle holding the wreck, its face in the cliff). Same
rules as bosses: no flat color blobs as "atmosphere" (depth from layered shapes and lit edges), effects attached to
their source, contrast checked in both themes and every palette, nothing important outside the visible band (about y
28 to y 112 on the map). A banner and its boss are designed TOGETHER: when a boss is redrawn, its banner's boss
presence is updated to match.

**Process the owner expects**
1. Plan per boss (idea, backdrop, face, what each phase breaks/grows/opens, idle motion, entrance).
2. Draw, render ALL phases side by side at 300 px and 120 px on dark AND light, and look before showing.
3. Ask: does each phase read as a different moment at a glance? Does the face change? Anything floating, flat or
   weird? Fix, render again.
4. `npx vitest run src/features/legends` and `check-art.mjs` (0 failures, no new warnings).
5. **Triple check before showing the owner** (asked for on every boss, raid boss and banner):
   - **Check 1, the drawing:** each asset alone at 420, 190, 120 and 64 px, dark and light, at rest and at a few
     entrance moments. Face fierce? Anything floating, flat, cut off, invisible on one theme, or moving for no reason?
   - **Check 2, the set:** a contact sheet of the WHOLE set side by side (all bosses, or all raid bosses with their
     phases). Does any boss look like another (silhouette, backdrop, face)? Any weaker than the raid bosses? Do several
     now share a habit (every boss in a rectangular frame, the same glow, the same pose)?
   - **Check 3, in the app:** the real screens (intro card with its entrance, the fight arena, the map icon, the asset
     viewer), plus the tests and `check-art.mjs` once more after the last fix. Fix what any check finds, then run all
     three again.

## How the owner wants RAID bosses made (2026-10: "i love the new raid bosses")

The owner loved the third and fourth waves (leviathan to dreamer) and the 2026-10 redraws of lich, chimera, hydra,
titan, void and seraph. Every new or redrawn raid boss follows this, on top of everything above:
- **"Super crazy bonkers", "like WTF is that".** Seraph and Void are the bar. A raid boss is the most extreme drawing
  in the app: a creature nobody has seen before, not a big version of a Legends boss.
- **Detail is the point**: about 200 to 300 KB of hand-placed shapes (a 30 KB raid boss reads as lackluster beside
  them), but every addition must still read at 120 px; cut what muddies the small read.
- **The backdrop is part of the boss** (a crypt throne of skulls, a foundry with a pouring crucible, a black hole's
  disk, a colosseum): it fills the frame, bleeds past it and changes with the phases.
- **Terrifying from phase 1.** Phase 2 furious (wounds open, more eyes, the face rages); phase 3 a TRUE FORM, nearly a
  different creature that is still the SAME one (a colossal wraith, armor blown into an orbit around a skeletal core,
  a molten heart in a torn-open ribcage). Each phase must read as a different moment at 120 px.
- **Each phase is a different POSE** (owner, 2026-10: "different poses. Kitsune raid boss is a good example of phase
  variation"). Not the same front-facing figure with parts swapped: phase 1 enthroned or composed, phase 2 lunging,
  rearing or arms flung wide, phase 3 a new silhouette. Reference: `raids/kitsune.svg`.
- **Raid variations of loved Legends bosses** (owner on sweets and sewer: "I LOVE THE DESIGN AND CONCEPT ... make a raid
  version that goes ALL OUT"): HEAVILY INSPIRED, NOT A COPY. The first rat raid kept the Legends face, crown and teeth
  and was "too similar to the normal boss. make it heavily inspired but different and crazier and more badass". Keep
  the DNA (theme, loved signature props, palette, lair), then redesign the creature: new body, face construction and
  silhouette, bigger, seen from below, crazier, a new pose per phase. A beautiful boss stays beautiful (kitsune); a
  playful one turns deranged, not generic. And it keeps its PERSONALITY: the second rat raid became a gritty plague
  warlord and lost what was loved ("does not look pimpin like the regular boss"). New design, SAME VIBE taken over the
  top (the rat stays a gold-dripping smug kingpin).
- **Stage became the Infernal Impresario** (`raids/showman.svg`, owner: "I LOVE THE DESIGN OF STAGE ... GOES ALL
  OUT"). The first pass (the Legends bust in the same arch three times, a wall of teeth growing into an unhinged
  scream) was "a little" too close to the regular boss with "lackluster" phases. What fixed it: a raid COSTUME and
  STAGE of its own even in phase 1 (ringmaster coat with gold braid and tails, star-lined cape, crystal-ball cane, a
  vast opera house with boxes and a chandelier, a full-figure stance); the loved signature kept (hat with the ace,
  horns, half mask with the cocked painted brow, burning eye, moustache, cards) with the SAME sly smirk every phase;
  three different silhouettes and color stories (standing with a card halo in warm gold; floating with card wings in
  violet light; colossal under an enormous hat in an emerald ruin with giant masks circling).
  - A full-figure phase needs a WHOLE body (owner on v2: "it's almost as if his lower body doesn't exist"): a big head
    on a narrow coat ending in a triangle of cape reads as a head on a stick. Draw about 3.5 to 4 heads of heroic
    proportion: chest, cinched waist, hips, two legs with real shoes, coat tails BEHIND the legs, a cape that frames
    and never replaces them, a contact shadow (or a glow when floating); check at 120 px that it reads as a figure.
  - Props carrying the concept are ARTIFACTS, not emoji faces (masks: filigree, gems, painted lips, carved brows,
    ribbons, age); the concept can become the face (phase 2: three masks taking turns on his face from a carousel).
    Props sharing a role are still unique DESIGNS, not recolors (the harlequin, the weeping saint, the porcelain).
  - A final phase is an EVENT, not a pose (owner: "PHASE 3 IS REALLY UNEVENTFUL" on a frontal bust holding props): a
    diagonal action pose, something breaking open, things flying with motion trails, foreground debris, idle motion
    that keeps it happening (here: he rips the curtain open on a void, cards burst, the hat flies off).
- **The face changes every phase**, and the signature stays readable through all three (the Seraph's one head eye
  stays in phase 3: the owner asked for it back when a maw replaced it). Transform what makes it loved, never remove it.
- **The ability shows in the art** (the hydra's regrowing heads, the titan's plating, the lich's phylactery at the
  center of every phase) and has its own effect in the fight (`AbilityFx.jsx`).
- **Unique against the whole set**: silhouette, palette, backdrop, face and entrance (`ENTRANCES`, its own MOVEMENT).
- **Owner dislikes, again**: flat aura blobs, eyelash brows, fire not rooted in what burns (eye fire was removed from
  the inferno), bobbing teeth, a sword in the hands (it boxes the pose in), nose rings, twitchy fast idle motion.
- **Process**: one agent per boss with a written plan (the brief lists these rules and the checks), a generator script
  kept OUTSIDE the repo, renders of every phase (420, 300, 120 px, dark and light, entrance frames), vitest and
  `check-art.mjs`, then the owner looks in the asset viewer (Raid bosses tab: phases and every ability effect).
- **2026-10-03 round, sent back**: blocky coffin-shaped hydra heads (now tapered skulls, waisted neck); tempest's
  broken leg and unreadable held objects (fixed in three rounds: a short kilt, two bent bare legs on a serpent coil, a
  big gripped thunderbolt, a ball of lightning in the other hand); ratking and showman phase 3 too close to phase 1 or
  weaker than phase 2 (ratking: low angle, chin up, a gold wyrm pet, violet night treasury, then much more idle
  motion; showman: a close "curtain call" from the pit with both masks presented); the sugar queen's phase 3
  neckline hidden by the pendant; a stand-in eye covering the ophanim's real eye; seraph Grace "bare bones".

## Raid boss voices (what the owner wants when a boss talks)

Voices live in `src/features/legends/raidVoices.js` (persona per boss + `RAID_VOICE_RULES`), lore in
`lg_raidLore_<motif>`. They drive the taunts a boss says when the learner misses.
- **Every boss is its own character.** Its own register (deadpan, comic, petty, quiet, formal, loud...), sentence
  shape, nickname for the learner (or none), word for a mistake, and signature habit. All must be unique: no shared
  templates, openers, nicknames or distinctive words or phrases across bosses ("all must be unique"). If two
  personas could swap names unnoticed, rewrite one.
- **Not cheesy.** No stock cartoon villain talk ("delicious", "how sweet", "foolish mortal", gloating about eating or
  owning the learner, a pet name in every line).
- **Easy to understand.** Short (1 to 2 sentences), complete plain sentences a learner gets on first read: no
  fragments ("Eighty. The open door. Wrong." made no sense), riddles or archaic wording.
- **Never technical.** The joke is about the mistake, told with one everyday image, never a lecture on the subject;
  the neutral feedback note does the correcting.
- **Any subject.** A line must work for a CompTIA, pilot license or language miss alike.
- **Mock the mistake, never the person.** PG; the missed question may be mentioned, an upcoming one never.
- **Matches the art.** A redesign updates the persona and lore (the hydra has six named heads, the seraph wears a
  porcelain hood, not a mask). Live taunts never repeat a boss's recent lines.

## The boss recipe (what made the 2026-09 raid redesign land)

The first raid bosses were "boring, uninspired and weak" (small figures in empty space, one neck, a boxy robot, a
skeleton in a robe, a lion like a house cat); the redesign got "YESS, much better". Every boss from now on, Legends
and raid alike, is held to this list. Worked example: `docs/raid-bosses-plan.md`.

**Plan before drawing.** A short plan per boss first: the idea in one line, the backdrop, what each phase (or the
intro) shows, the idle motion, the SVG entrance beats and the card entrance. Every boss's answers differ.

**Size and presence**
- **Fill the frame and bleed past it.** Horns, fins, wings, fists, tentacles run off the edge (the 20% headroom shows
  them). A figure floating small in the middle of its box reads weak, whatever its detail.
- **Shoulders wider than the frame, seen from below**: the viewer looks UP at a boss. Low horizon, big upper body.
- **A backdrop that is part of the boss**, never a plain glow: a maelstrom it rises from, a gear halo, a rune circle,
  a burning spiky shockwave, a black hole's disk. It animates on its own rhythm.

**Faces sell menace** (raid bosses, and Legends bosses meant to be mean; check the face at 420 px first)
- **Angry brows over the eyes**: a heavy brow ridge angled DOWN to the middle, or a V-shaped visor slit. Round eyes,
  or eyes with no brow, read friendly.
- **Slit or burning eyes with a glow halo** (the same shape bigger and bright behind, 0.4 to 0.5), a slit pupil, a tiny
  white hot spot.
- **Angular skulls, not round heads**: faceted planes, cel shaded (a `#000` shadow plane at 0.2 to 0.3 on one side, a
  lit plane at 0.3 on the other), cheek spikes, swept-back ridged horns, scale or plate texture on the crown.
- **Too many teeth**: long upper fangs past the lip, a row of small teeth, a dark maw with a tongue. The jaw moves.

**Materials read as materials**
- Metal gets rims, rivets, bolts and a lit edge line. Fists are gauntlets with knuckle plates, curled fingers and
  glowing seams, not boxes. A chain is interlocking LINKS (alternate a ring and an edge-on bar, ink under a light
  stroke), never stacked ellipses (they read as springs).
- Scales, fur, bone and robes get texture strokes, kept inside their shape (the overdraw rule).
- Wings are membranes with lit panels between bone struts and an ember or light edge; on a dark backdrop a dark wing
  disappears.

**Contrast against the backdrop.** Check every big shape against what is behind it in BOTH palettes. A dark membrane on
a dark sky, a translucent wraith over a busy rune circle, a storm cloud as dark as the night: all vanished. Fix with a
lit rim, a brighter mid-tone, or a glow copy behind.

**Every phase is a transformation with a story** (raids: phase 1, 2, 3; a Legends boss's rage too):
- Phase 1 controlled (sealed armor, one power shown). Phase 2 hurt and WORSE (armor cracks on molten veins, a cut neck
  grows two heads, the dead rise, many eyes open). Phase 3 the final form (a skull under the split helm, a plasma orb
  in the maw, a wraith hood framing the scene, a jaw unhinged down to the chest), colors run hot.
- Damage and menace only ESCALATE: phase 2 has more cracks than phase 1, phase 3 more teeth than phase 2 (the owner
  caught a phase 3 with fewer teeth than phase 2, and asked for more cracks on a phase 2 hourglass).
- A new element must READ at 120 px: big, bright, framed. A giant ghost face behind the figure showed only pale blobs
  at the edges; redrawn as a hood around the frame with eyes in the corners and claws reaching in, it worked.
- Nothing only "added": something breaks, grows, opens or turns on.

**Motion with character.** Every head, limb, flame and particle on its own rhythm. Each boss gets its own SVG entrance
beats (eyes igniting, jaws opening, fists slamming) AND its own card entrance in `ENTRANCES` whose MOVEMENT no other
boss uses (crushed flat then whipping up tall, three hydraulic jerks, a slow drift then a snap up, three roars, a slit
in reality tearing open).

**No hard edges from the frame.** Bands spanning the width (a cloud layer, a floor) end in organic shapes inside the
headroom; a straight cut at the box edge shows as a rectangle when the boss scales in.

**Check at every size, both themes, every moment.** Render at 420 px (does the face scare?), 190 px (intro), 120 and
68 px (fight), per phase, in the entrance at a few moments and at rest. Then run `check-art.mjs`. Look, fix, repeat:
the second pass (sharper heads, real chains, a readable wraith, lit wings) is where "good" became "great".

## The current set (40 motifs)

The full list, one line per motif (boss, idea, entrance, lair), is `dev/legends-gallery/catalog.js`: the ONE place
describing the set. Read it before adding a motif, and add the new motif's entry there. The first ten:

| Motif | Boss | Entrance (card motion, `ENTRANCES`) | Banner |
|---|---|---|---|
| forest | The Elder Hart: proud winged stag, furred face, stern amber eyes, brown feathered eagle wings, glowing spirit leaves | bursts up out of the ground | The Elder Hollow: path past leaf-rune stones to the World Tree, the hart at its roots |
| city | Neon Tyrant: skyscraper war machine, scanning visor, furnace maw | glitches in like a broken screen | Neon Ruins: skyline, searchlights, rain, the Tyrant behind the towers |
| ocean | Abyssal Kraken: hooked tentacles, glowing lures, beak | surges up out of the water | Kraken Deep: storm, lighthouse, wreck in a tentacle, waves, whirlpool |
| mountains | The Wandering Peak: tortoise whose shell is the mountain, horned head under the scute rim, glacial eyes, hooked beak | drops like an avalanche and slams | The Wandering Peak: snowy valley, the tortoise is its mountain, torii, prayer flags, lantern path |
| lab | Specimen X: brain dome, too many eyes, bolts, slime | teleports in on a beam | Containment Breach: tanks, one shattered, alarm, eyes in the doorway |
| stage | The Grand Illusionist: smug demon showman, cards spiralling from his palm, cracked mask with one cocked brow | spins in under the spotlight | Phantom Opera: curtains, chandelier, spotlights, ghostly audience, the Illusionist mid-act |
| sky | Storm Wyvern: lightning crest, wings like thunderheads | swoops down from the clouds | Stormspire Isles: floating islands, sky temple, the wyvern circling |
| desert | Sand Emperor: pharaoh scorpion, six eyes, venom sun on the tail | tunnels up out of the sand | The Sand Emperor's Tomb: pyramid, bones, a stinger in the dunes |
| volcano | Pyrewyrm: obsidian dragon in profile, fire torrent, lava pool | erupts out of the lava | Pyrewyrm Caldera: eruption, lava rivers, the dragon on the rim |
| ice | The Yeti King: yeti in ice armor, crystal ram horns, frost breath | freezes into being in a flash | The Glacier Throne: aurora, frozen lake, eyes in the ice cave |

The other thirty: swamp, castle, graveyard, jungle, space, clockwork, carnival, underworld, moonlit, fungal, pirate,
dojo, crystal, arcade, library, sewer, arena, hive, garden, sweets, savanna, mirror, manor, junkyard, dream, sakura,
mine, frontier, primeval, celestial (see the catalog).

**Every entrance is completely different.** The owner's rule: no two bosses may share a movement, not just a keyframe
name. A new entrance tells the boss's own story (a kitsune blinks left, right, then appears; a poltergeist billows up
like a sheet; a rex leans in head first and roars). Pick a pivot with `origin` when it matters. A new motif gets an
idea none of the forty uses.

## Technical rules (enforced by `src/features/legends/art.test.js`)

- **Sizes**: boss `viewBox="0 0 120 120"` (square; shown 64 to 190 px). Banner `viewBox="0 0 400 140"`, shown on the
  map at 620 x 132 and cropped top and bottom (`slice`): only about **y 28 to y 112** is visible there, so the boss's
  presence, focal point and story props go in that band; the top and bottom 28 units are sky and ground that may be
  cut. (The gallery shows both the map crop and the whole drawing.)
- **Plain drawing only**: shapes, paths, groups. No `<script>`, `<style>`, `<image>`, `<use>`, `<a>`, `href`, event
  attributes, and **no `url(...)` at all**: no gradients, patterns, filters, masks or clip paths. Depth comes from
  LAYERS: a shape, then a `#000` shape at `opacity` 0.15 to 0.3 for the shadow side, then a `#fff` or light shape at
  0.15 to 0.4 for the lit side, then a glow halo (the same shape bigger, bright color, `opacity` 0.3 to 0.45).
- **No `id` attributes**: a file is inlined many times on one page, and ids would collide.
- **Realistic opt-in** (only the ophanim, on the owner's request "make this guy hyperrealistic"): files in
  `REALISTIC_ART` (art.jsx) may paint with local gradients (`<defs>`, `id`s, `url(#id)`; no filters, the sanitizer
  strips them); art.jsx renames the ids per mounted copy and art.test.js checks every reference stays local. The
  default stays flat cel shading: never add a file to the list unless the owner asks.
- **Photo ophanim (an experiment)**: the eye, wings, wheels, cloud bed and holy light are real photographs. The SVG only
  marks the places (empty `<g class="lg-photo-...">` groups, wing/wheel/cloud/light markers carrying their own
  transform; painted parts they replace tagged `lg-photo-hide`); `withPhotoEye` in art.jsx injects the fixed sprites
  `raids/ophanim-{eye,wings,rings,cloud,light}.webp` after sanitizing. Each photo sits inside the painted part's motion
  group, so flaps, unfolding, wheel spins, cloud drift and the eye's gaze still play; each wheel is split into a back
  and a front half so it still passes behind and in front of the eye. Phase and ability layers (gaze eyes, lit eyes,
  holy fire) stay painted on top. The eye is never a floating ball: masked to an almond with thin lid rims, framed by
  the wings behind it (the owner's reference; a porcelain bezel plate was rejected). The sky and light are HTML layers
  in art.jsx (PHOTO LIGHT: screen blending and blur, which SVG cannot have); the painted backdrop is hidden. Revert:
  delete both blocks and their uses, delete the five webps, restore the painted `ophanim.svg` backup. Never put
  `<image>` or a URL in a file.
- **Colors** (the owner, 2026-10: palettes repainting the whole boss made some unrecognizable and barely touched
  others): paint every boss, banner and raid boss in its OWN ideal FIXED colors (what palette "original" shows). A
  palette recolors exactly ONE part per boss: the least intrusive part still clearly noticed (its fire, ice growing
  out of it, a gem or orb, an aura or halo, runes, a cape or banner cloth, crystals; never skin, face or body). That
  part uses `var(--lg-tint, #orig)` (mid tone), `var(--lg-tint-hi, #orig)` (lit) and `var(--lg-tint-lo, #orig)`
  (shade), ideal colors as fallbacks, in the boss AND the same part in its banner (raid bosses: every phase layer).
  Check it in every palette, including dull sand and steel. Outlines use `var(--lg-ink, #1d2230)`. The old
  `--lg-sky/far/near/deep/accent/light` are retired (`art.test.js` fails on them).
- **Outline style**: ink strokes 1.5 to 2.2 on big shapes, 0.6 to 1.2 on details, `stroke-linejoin="round"`.

## Motion

Motion is SVG animation inside the file. The sanitizer keeps only `<animateTransform>` and `<animateMotion>`
(`<animate>` and `<set>` are dropped) and drops `calcMode` (timing is linear; pace with `keyTimes`). So animate
`translate`, `scale` and `rotate` only. No fade: hide by scaling to 0.02, or move far off the canvas
(`translate 0 -200`).

- **`keyTimes` must have exactly as many entries as `values`, start at 0 and END AT 1.** Otherwise the browser silently
  ignores the whole animation (a list ending at `.46` left a boss's eyes shut forever). Tested.
- `class="lg-in"`: the ENTRANCE, played once when the boss appears on its intro card. `fill="freeze"`, start at `0s`
  so the hidden first frame shows at once, finish on the resting pose. Typical beats: eyes open (scale Y 0.05 to 1.3
  to 1), jaw or maw opens (scale Y 0.2 to 1.25 to 1), limbs, wings, claws or tail swing into place (rotate from far
  out, overshoot, settle), horns or crystals grow, fire or breath bursts. Start the main beats around 55 to 70% of a
  1.4 to 1.6 s run, so they land after the card's own motion.
- `class="lg-loop"`: IDLE life, `repeatCount="indefinite"`: breathing, blinking, swaying, flames, drips, bubbles,
  sparks, falling snow or pebbles, drifting fog, sweeping lights. Bosses AND banners have it. Banners have no `lg-in`.
- **The file's own attributes are the resting pose.** The app strips animation where motion is not wanted (small map
  icons, locked areas, reduced motion); what remains must be the finished, fierce boss. Never rely on an animation to
  put a part in its place.
- **Scaling around a point**: animateTransform `scale` scales around (0,0). Wrap:
  `<g transform="translate(cx cy)"><g><animateTransform .../><g transform="translate(-cx -cy)">...</g></g></g>`,
  or draw the part around (0,0) inside `translate(cx cy)`. `rotate` takes its center in the values: `"20 60 64"`.
- **One animation per target.** An entrance and a loop on the same element fight; nest a `<g>` for the loop.
- **The card motion** (the whole boss moving in) is CSS in `BossArena.jsx`: `ENTRANCES[motif]` names a keyframe in its
  `CSS` block. It starts at `ENTRANCE.slam` and lands at `ENTRANCE.impact`, where the quake and shockwave hit. Every
  motif gets its own keyframe (tested: entrances are all different).

Where each mode plays (`art.jsx`, `animated` prop): boss intro card = `'intro'` (entrance + loops); fight arena =
`'idle'` (loops); the map's boss icons and the result screen = still; area banners on the map = `'idle'`. Reduced
motion or a locked area = still.

## How to make and check a new asset

1. Pick the idea (table above: make it different), sketch the layers back to front: backdrop, back limbs, body, front
   armor and details, face, mouth, front limbs, particles.
2. Write the SVG by hand (the Write tool; never a shell heredoc, which mangles backslashes).
3. Add the motif name to `MOTIFS` in `src/features/legends/map.js`, and its entrance to `ENTRANCES` in `BossArena.jsx`
   (with a new `@keyframes` in the `CSS` block).
4. Look at it: render in headless Chrome at a few moments (e.g. 300 ms, 1100 ms, 3000 ms), on a light and a dark
   palette. Look for: parts hidden behind others, anything invisible in dark mode, empty areas in a banner, anything
   that reads cute instead of fierce. Fix, look again.
5. `npx vitest run src/features/legends` (the art test checks every rule above), then check the intro card in the app.
   Bump the version.

## Review gallery (where the owner looks at the set)

All Legends art is reviewed in ONE place: `npm run dev`, then `http://localhost:3000/dev/legends-gallery/`
(`dev/legends-gallery/`, not part of the build). Every motif shows its real intro entrance (Replay), the idle boss, the
map icon, the locked icon, the banner at its true map size and the whole drawing, in light or dark and any palette.
Each card has Good / Change / Bad plus a note (kept in that browser); "Copy my feedback" copies the notes to paste
back. When the owner pastes feedback, fix exactly what it names, then re-check in the gallery.
