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

## 1. Hydra: the Maelstrom Hydra

- **Idea**: a many-headed sea serpent rising out of a whirlpool in a storm. Not one neck: a knot of necks.
- **Backdrop**: a spinning maelstrom (spiral bands of black water) under a storm arc; lightning forks flicker.
- **Phase 1**: three heads on thick scaled necks (the center one crowned with a fin frill, the side two lower,
  snapping), teal eyes, rows of fangs, belly plates, the whirlpool around the coils.
- **Phase 2, "cut one off, two grow back"**: the left head is a severed stump spurting glowing ichor, and two new
  heads burst from it (five heads). Eyes turn toxic green, gill frills flare.
- **Phase 3, "the storm answers"**: the center head's maw charges a crackling ball of storm plasma, every neck's
  spines glow, lightning runs down the coils, the maelstrom speeds up.
- **Idle**: every head sways on its own pivot and rhythm, jaws snap, spray droplets, lightning flicker.
- **Entrance (SVG)**: the heads rise one by one out of the water and open their jaws. **Card**: `lgHydraRise`,
  crushed flat at the waterline, then the necks whip up tall with side-to-side lashes.

## 2. Titan: the Forge Titan

- **Idea**: a colossal war machine of iron and bronze seen from below, shoulders too wide for the frame, a furnace for
  a heart. Not a box robot: a hunched giant with huge fists and a crested helm.
- **Backdrop**: a slowly turning gear halo with heat and embers rising.
- **Phase 1**: sealed armor, a helm with one burning visor slit, a chest grille glowing orange, chained fists.
- **Phase 2, "the armor cracks"**: plates split and show molten veins, the chest grille bursts open on a spinning
  furnace core, the chains snap, steam blasts from the shoulder vents.
- **Phase 3, "meltdown"**: the helm splits open on a molten skull with a fanged maw, the core goes white-hot with
  energy rings, fists burn, cracks everywhere, the halo turns into a ring of fire.
- **Idle**: a heavy breath heave, the core pulsing, the visor scanning, embers rising, a smoking vent.
- **Entrance (SVG)**: the visor ignites left to right, the fists slam down. **Card**: `lgPowerUp`, crouched and dark,
  rising in three hydraulic jerks with power surges, then a shudder.

## 3. Lich: the Lich of the Sunless Crypt

- **Idea**: a floating sorcerer-king with a crown of black iron, a skull of green fire, a robe dissolving into wisps,
  one hand on a chained phylactery, the other on a ram-skull staff.
- **Backdrop**: a rune circle turning behind him, soul flames.
- **Phase 1**: in command: runes turning, eyes burning green, the phylactery glowing.
- **Phase 2, "the dead rise"**: skeletal arms claw up from the ground, spectral skulls orbit him, the crown catches
  green fire, the robe tears.
- **Phase 3, "soul storm"**: the phylactery cracks, the skull splits and pours light, a giant screaming wraith face
  looms behind him, a second rune ring turns the other way.
- **Idle**: a floating bob, wisps swaying, skulls orbiting, runes turning, eyes flickering.
- **Entrance (SVG)**: the eyes ignite, the rune circle spins up. **Card**: `lgLevitate`, drifts up from below with a
  slow sway, then snaps upward as the power takes hold.

## 4. Chimera: the Chimera Tyrant

- **Idea**: a rearing monster: a lion in front with a mane of fire, and more heads that wake as it is hurt. It
  stands up tall, claws out, roaring at you.
- **Backdrop**: a burning ring of embers.
- **Phase 1**: the lion alone: a huge roaring maw, a burning mane, scarred shoulders, raised claws.
- **Phase 2, "the goat wakes"**: a goat head bursts out of its back with curled horns that crackle with lightning.
- **Phase 3, "all three heads"**: dragon wings unfold across the frame and the serpent tail strikes over its
  shoulder, dripping venom: fire, lightning and poison at once.
- **Idle**: the mane flickers, the jaw roars, claws flex, embers rise, and each head moves on its own.
- **Entrance (SVG)**: the mane ignites, the jaw opens. **Card**: `lgTripleRoar`, three roars, each a bigger punch
  forward with a head shake.

## 5. Void: the Void Leviathan (the owner's favorite: keep the idea, push it much further)

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
  reaching out of the sleeves, an eye staring from each palm; before a dark crimson cathedral rose window. No weapon.
- **Phase 1, watching**: every eye open, the hands reaching, the grin.
- **Phase 2, cracking**: red light in cracks across the mask, four more eyes tear open on it and four down the robe,
  the jaw drops open on two rows of teeth and heaves, a second pair of clawed arms rises from behind the shoulders,
  the window cracks.
- **Phase 3, true form**: the mask shatters into halves drifting apart on a void with a spiral of eyes around a huge
  screaming vertical maw, a beam of light pours up, the wings and rings burn, shards orbit, the window shatters over
  a red void full of opening eyes.
- **Face per phase**: one great staring eye, then a cracked mask of eyes, then a screaming maw.
- **Entrance (SVG)**: the window and halo spin up, the wings snap open pair by pair, the arms swing out, the great eye
  opens last. **Card**: `lgHolyUnfold`, a point of light high above that spins open and descends into place.
