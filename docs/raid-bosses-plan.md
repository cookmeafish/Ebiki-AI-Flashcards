# Raid bosses: reference

What each raid boss IS. The bosses exist: art in `public/assets/legends/raids/<motif>.svg` (each file's leading
comment describes it), abilities in `src/features/legends/abilities/<motif>.js` (the module is the truth for numbers),
lore `lg_raidLore_<motif>`, voices in `raidVoices.js`. Progression order is `RAID_ORDER` in `raid.js`; the stored
index is into the append-only `RAID_ROSTER`. Numbers below are roster positions. Art direction: read
`docs/legends-art-guide.md` first.

Background: the owner called the first set "super boring, uninspired and weak" (small figures in empty space). A raid
boss is the day's whole due stack in one fight, so it must look like a game's final boss.

## Rules for all raid bosses

- **Fill the frame.** The figure owns the 120 x 120 canvas and bleeds past it (art.jsx `BOSS_HEADROOM`: 20% past).
- **A backdrop that is part of the boss**, different for each, animated.
- **Menace first**: angry brows, slit or burning eyes, too many fangs, claws, spikes, scars. Raid bosses are terrifying;
  a smug or beautiful boss keeps its personality in every phase and escalates by status, never into a different temper
  (exception: the Showman snaps in phase 3).
- **Depth without gradients** (only `REALISTIC_ART`, the Ophanim, uses local gradients): base shape, a dark shadow side,
  a lit edge, a glow halo; strong ink outline.
- **Idle life everywhere**: every head, limb or flame on its own rhythm; particles; eyes flicker.
- **Every phase is a TRANSFORMATION**, with a new camera, pose, silhouette and face, never a sticker added or a zoom out:
  phase 1 controlled, phase 2 hurt and worse, phase 3 the true form and climax (most motion, readable at 120 px). Phase
  layers are `lg-p1`, `lg-p2`, `lg-p3`, `lg-p12`. A phase change in the arena flashes and shakes the boss
  (`lgPhaseShift`) and fades a "PHASE N" tag in UNDER it (`lgPhaseTag`).
- **No ring or spiral maws** except the Leviathan's phase 3 (the one deliberate one); the Void keeps its spiral teeth.
- **One tinted part** per boss (`--lg-tint`/`-hi`/`-lo` with fallbacks); everything else in its own fixed colors.
- **Lore and a voice** for every boss (`raidLore.test.js`): unique register, nickname and word for a mistake, short
  plain sentences, never technical, any subject (art guide "Raid boss voices"). A redesign updates both.
- **Its own entrance**: SVG `lg-in` beats plus a distinct `ENTRANCES` card motion (BossArena.jsx). Hidden entrance
  parts rest at `scale(0.01)` or far off canvas, never `scale(0)` (crashes check-art's overdraw pass).

## Abilities: each boss fights differently, never against learning

An ability changes how the FIGHT plays, never how a question is asked: no timers, nothing hidden, no trick questions, a
right answer never marked wrong; twists reward what builds memory (retrieval after a miss, typing over recognizing,
steady streaks). Contract: `abilities/_contract.js`; shared limits: `abilities/_rules.js`.

- **Deterministic and pure**: picks come from fight state or `hashOf`, never `Math.random`.
- **Attention budget**: ability-inserted questions (minions, loops, last stands) share `MAX_INSERTED` = 4 per attempt;
  at most `DECISION_MAX` = 5 modules may show buttons (now: chimera, inferno, berserker, ratking), never on attacks or
  inserted questions; a hint line is at most 8 English words, a tag chip at most 3; only the Dreamer has a persistent
  idle reaction (`IDLE_MOTIFS`).
- **Inserted questions are never recorded in Anki**; Anki gets only each card's first answer.
- **Fairness** (`fairness.test.js`): an all-right run wins with buttons used or never, an all-wrong run never wins, a
  right answer never costs a life, a boss heal never goes below what the attempt started with.
- **Shown** on the intro card (name + one line), an arena chip, HUD items, tag chips, floaters; state drives SVG layers
  through `data-ab-<name>` (`lg-ab-<name>-<value>` show, `lg-abh-*` hide) and `lg-fx-<key>` face layers. Every fx key
  has an effect and juice in `fx/<motif>.jsx` (`abilityfx.test.js`).

## The owner's vision for the FIGHT (2026-10): every boss must feel like its own game

Art is half of a raid boss. The other half is how fighting it feels. These are the owner's own rulings from the
2026-10 sessions; a new or redesigned boss meets every one before the owner sees it.

**Fair, crafted numbers, never by feel**
- Each boss has its own fixed health and gives the player its own number of hearts (`raidProfiles.js`); a bigger boss
  comes with more hearts or an ability that protects the player. Tune with `PROFILES=1 npx vitest run
  src/features/legends/profiles.test.js`: a 65% learner beats it in a handful of runs (12 when unlucky), a 60% learner
  always can, later bosses take longer. No boss needs near-perfect play.
- The fight has stakes but never locks the player out: losing every heart makes the boss RALLY (heals back half that
  run's damage), the hearts refill at once and the player may fight again ("why stop them?"). Wounds stay until it is
  beaten; a small heal each night.
- Bosses are balanced WITHOUT powers. Each new boss beaten (a DIFFERENT one) can unlock a power
  (`docs/raid-powers-guide.md`); the 26th unlock needs the whole roster, so adding a boss is part of that ladder.

**Every hit feels like THIS boss** (`impact/styles.js`, `impact/parts.jsx`, `impact/body.js`, `StrikeFxLayer.jsx`)
- Nine impact moments per boss (hit, critical, sharpened, the boss strikes, heavy blow, blocked, saved, heart back,
  defeated), each a different animation and body move. The owner's complaint that started this: "a lot of the impact
  moments have the same exact animations but with different words". Within a boss no two moments share parts or a
  body move; across bosses no two play the same moment the same way (`impact.test.js` enforces both).
- They "hit hard": weight (hitstop, shake, flash within the juice limits), the boss's own two colors and glyph.
- **The knockout is the payoff** ("very dramatic to make the feeling of killing one feel good", "very creative,
  dramatic, and unique"): a short cinematic in the boss's own theme, its story ending (Chronos shatters into sand and
  gears, the Lich crumbles to bones, the Void implodes), a shockwave, debris, a weighty DEFEATED! stamp. Never a
  recolored template. The boss stays visible afterwards (never below 0.2 opacity, in frame for the result screen).

**The boss stays in view**
- Power casts, power hits and anything else layered on the fight play in the LOWER HALF of the boss box (the power
  stage), never over the face; armed powers are badges in the hearts row. Strike labels own the top.
- Labels never clip ("COND WIN" was a cast label cut by a too-narrow stage).

**Numbers come from the game, never typed into text**
- Every number a player reads (damage floaters, "+N heart", "for N questions", "deals N", bonus hearts) is filled
  from the game's own values (`powerVars`, `DAMAGE`, the strike itself). Adding a power or a damage bonus later must
  update every label by itself.

**The asset view is the test bench**
- Every boss's phases, ability effects (Try it), nine impact moments, power casts, armed looks and power hits can be
  played from the Raid bosses tab, with the arena PINNED at the top by default (like a frozen spreadsheet row, flush under the app header, only the
  card, no dark band) so the boss stays on screen while scrolling the growing button rows; a Pin / Unpin button at the
  card's top right lets it scroll away, remembered per device (`ebiki-assets-arena-pinned`).

**Checklist for a new raid boss** (on top of the art rules above): profile in `raidProfiles.js` and a balance run;
ability module + `_triggers.js` rows + bestiary text; `fx/<motif>.jsx` for every fx key; a `RAID_IMPACT` entry with
all nine moments unique, including a themed knockout; `ENTRANCES` entry; lore and a voice; then 10 QA passes over its
moments and knockout in the asset view (light and dark) before the owner looks.

## 1. Hydra: the Tide Hydra

- **Concept**: a many-headed sea serpent wrecking a harbor in a night storm, redesigned 2026-10-09 FROM THE HEADS OUT.
  One serpent body with SIX fixed neck roots, filled in order so any count 1 to 6 is a balanced fan: 1 the crowned King
  (centre, never cut), 2 the one-eyed Elder (left inner: scar, snapped horn, barbels), 3 the long-snouted Sly one (right
  inner: gold-banded horns), 4 the Sleepy one rising low out of the surf in front (lidded eyes, ram horns), 5 the Brute
  (left outer: iron jaw plate, tusks), 6 the hotheaded Young one (right outer: fanned frill, forked tongue). Shared: slate
  scales, red crest spikes, gold slit eyes under solid V brow ridges, faceted arrowhead skulls (small 3D meshes cel shaded
  by each phase's light, so a camera change turns every head with it). Slot k is the same head on the same root in every
  phase; a phase change never changes which heads are up.
- **Phases**: 1 the harbor at night, eye level, cold moonlight: a composed fan, jaws shut, smug (lighthouse, fortress,
  a wreck, rain). 2 the harbor burns: a dutch angle, fire light from below, the King lunges down at you with jaws open
  while the others rear high and wide, a torn red sail of fins opens behind the necks, old scars on the chest. 3 the storm
  crown, from far below: the King towers in a crown crackling with lightning (a bolt strikes it), every head turned on you
  with jaws open, a violet sail of fins spread like a crown with lightning in its veins, charged belly seams, waterspouts,
  a turning storm eye, the most idle motion (heads snap forward, sway wider).
- **Ability (heads)**: a right answer or blocked attack cuts a head; cutting the last one cauterizes for +2 and three
  heads stand again; a missed raid answer grows 2 (max 6). Art: `data-ab-heads` 1 to 6 shows slots 2..N, and every slot
  cut since the last burn shows its seared stump (`data-ab-top`: the most heads since the last burn; stumps are slots
  N+1..top). Grow bursts heads out of their stumps (`data-ab-regrew`), Cauterize burns every stump (`data-ab-burnt`).
- **Tint**: the lightning. **Card**: `lgHydraRise`.
- **Owner**: heads must differ in skull, size and face; sleek and angular, never round or rubbery; "built with the heads in
  mind" (2026-10-09).

## 2. Titan: the Forge Titan

- **Concept**: a hunched forge machine-god seen from below in its foundry (flywheel halo, crucible pouring onto its helm).
- **Phases**: 1 sealed: V brow plate, furnace-grille mouth, power-hammer arm, anvil fist, chains. 2 the plating cracks on
  white-hot metal, molten snarl, chains snap. 3 armor orbits a skeletal machine with a reactor core and a molten skull.
- **Ability (plates)**: 2 plates; a clean typed answer cracks one; the last crack shatters them for +2 and leaves him
  exposed for the next 3 right answers (+1 each), then he forges new plates; a phase line re-forges cracked plates (never
  during an opening).
- **Card**: `lgPowerUp`. **Owner**: not a boxy robot.

## 3. Lich: the Lich of the Sunless Crypt

- **Concept**: a sorcerer-king bound to his phylactery, which sits at the center of every phase, before a crypt throne.
- **Phases**: 1 calm and cruel: cracked crown, grimoire, soulfire, chained souls. 2 the robe burns to a soulfire ribcage,
  two more arms, furious V brow. 3 a colossal soulfire wraith behind his true body, the same skull, ribcage open on the
  blazing phylactery, crown in floating pieces.
- **Ability (minions)**: every 3 raid answers he raises the earliest card answered right as a typed skeleton (inserted):
  destroyed = Bone Burst +3, escaped = he heals 2, no heart lost. Max 3 per attempt.
- **Card**: `lgLevitate`. **Owner**: not a skeleton in a robe.

## 4. Chimera: the Chimera Tyrant

- **Concept**: lion, goat and serpent-dragon in one body in a ruined bone colosseum under a volcanic sky.
- **Phases**: 1 roaring lion, chanting goat, venom-spitting serpent. 2 feral: split jaws, multiplying eyes, a fourth head
  from the chest. 3 the chest bursts on a furnace heart in a ribcage, heads become burning skulls, more heads sprout.
- **Ability (threeheads, decision)**: three head bars, Goat, Lion, Serpent in line (auto-aimed, tap to aim); overkill
  spills; a fallen head deals +1 and gives its boon (Lion +1 on clean typed, Goat's horn blocks the next lost heart and
  regrows at each phase line, Serpent +1 on every right answer). Art: `lg-ab-<head>-down`.
- **Card**: `lgTripleRoar`. **Owner**: no generic tooth-ring maw (replaced by the furnace heart).

## 5. Void: the Void Leviathan

- **Concept**: a mass of living night with ONE great eye, a black hole's burning disk behind, starry tentacles, a moon
  and a starship pulled into the disk.
- **Phases**: 1 the eye watches. 2 it sees you: body cracks on pink light, bloodshot eye, split pupil, the grin rips to
  the cheeks. 3 singularity: the pupil a black hole, the body splits into a maw of spiraling teeth, planets falling in.
- **Ability (horizon)**: right answers bank damage in the disk; the third banked strike collapses it for 1.5x; a miss
  spills it at 1x; it never holds a winning blow; left over at the end it collapses.
- **Card**: `lgRealityTear`. **Owner**: favorite concept; "void has too many eyes", so one eye in every phase.

## 6. Seraph: the Thousand-Eyed Judge

- **Concept**: a white celestial horror: faceted porcelain hood, crown of iron thorns, one great red eye over a gold mask
  plate, three pairs of eyed blade-feather wings, bony arms with eye-palms, chains to caged eyes, a rose window.
- **Phases**: 1 frontal, calm, heavy-lidded. 2 tilted, every wing eye open, robe torn on stylized holy body horror (bone
  ribs round a crimson cavity of eyes), blood tears. 3 a burning wheel of eight eyed wings round a ring of fire, arms
  like sun rays, an enormous gold eye.
- **Ability (verdicts)**: questions cycle Wrath, Mercy, none (tag chip): Wrath right +2; Mercy miss costs no heart (still
  returns as an attack), Mercy right +1; a phase line shifts the cycle. Art: `lg-ab-verdict-wrath|mercy`.
- **Tint**: the halo (1, 2), the ring of fire (3). **Card**: `lgHolyUnfold`.
- **Owner**: terrifying from phase 1; keep the spiky eyed-wing mass; no sword, no bulky robe.

## 7. Leviathan: the Drowned God

- **Concept**: a sea god so vast a harbor town grew on its back, in the maelstrom it churns.
- **Phases**: 1 the island wakes: an armored head breaches, the town and lighthouse on its crown. 2 the jaws gape on
  fangs, throat rings show, the town falls, tentacles rise. 3 jaws open into the spiral maw of fanged rings round a
  drowned eye (the one allowed ring maw), the maelstrom red.
- **Ability (current)**: current 0 to 3, starts at 1: right +1, miss -2; on the crest every right answer deals +1. Art:
  `data-ab-current`.
- **Tint**: the lighthouse beam. **Card**: `lgAbyssBreach`. **Owner**: phase 3 loved; earlier phases must read as a creature.

## 8. Inferno: the Cinder Sovereign

- **Concept**: an obsidian dragon-king coiled on a throne of swords before a molten river, wings like fire windows.
- **Phases**: 1 black scales with lava seams, jaws clenched. 2 scales flake to embers, furnace throat, the throne melts.
  3 a black bone skeleton in a firestorm with a ribcage furnace.
- **Ability (vent, decision)**: heat +1 per right answer, a miss cools 2; the Vent button (from 2 heat) deals heat - 1;
  at 4 it erupts for 3 by itself; left over at the end it vents. Art: `data-ab-heat`.
- **Card**: `lgFlareBurst`.

## 9. Chronos: the Hourglass Titan

- **Concept**: a brass-and-glass titan rising from dunes under a clock rose window; its torso an hourglass with a
  pendulum heart, tower-bell shoulders, clockwork arms, a crowned dial-helm whose brows are its clock hands (signature).
- **Phases**: 1 time flows: calm, a minute-hand sword. 2 time fractures: the dial cracks, seconds hand spins wild,
  afterimages, sand sprays. 3 the dial splits into a cog-toothed jaw round a time core, giant crescent scythes, a sand
  robe, frozen moments orbiting.
- **Ability (loop)**: sand 0 to 3 (starts 1; +1 every 3rd right answer and each phase line); a miss with sand costs no
  heart and no attack, and the card loops back 2 questions later (right = Paradox +1, missed = one heart); sand past full
  = Time Stop, the next right answer doubles. Max 4 loops. Art: `data-ab-sand`, `lg-ab-stop`.
- **Tint**: the time-energy glow. **Card**: `lgTimeReverse` (sand flows back up).
- **Owner**: keep the concept, no clock-face grin, no ring maw, readable hands.

## 10. Vampire: the Crimson Matriarch

- **Concept**: a corpse-pale queen with a third eye, crown of thorns, bat-wing collar, a blood moon in stained glass.
- **Phases**: 1 regal, chalice raised. 2 the jaw unhinges into a long vertical feeding snarl (never a round ring), bat
  wings tear out of her shoulders, nails in her own chest, it rains blood. 3 a giant blood bat-demon, the moon an eye.
- **Ability (wards)**: 3 right in a row raise a ward (max 1); a ward takes one lost heart and bursts for +2; a full
  streak while holding a ward = Feast +3. Art: `data-ab-wards`.
- **Card**: `lgBatAssemble`.

## 11. Tempest: Zeus, the Storm King

- **Concept**: a heroic, handsome, muscular Zeus (laurel crown, short silver beard, himation, smug half smile, same face
  every phase) and his storm dragon.
- **Phases**: 1 on Olympus from below, thunderbolt raised. 2 he summons the colossal storm dragon from a rift. 3 he rides
  the dragon straight at the viewer, both facing us, a giant lightning sword raised.
- **Ability (drums, Storm Measure)**: measures of four on four storm orbs: a right answer on beats 1 to 3 lights an orb;
  beat 4 brings the thunder, 1 damage per lit orb. Attacks and inserted questions do not move the beat. Art:
  `lg-ab-drums-1..3`, `lg-fx-thunder`.
- **Tint**: the lightning. **Card**: `lgBoltDrop`.
- **Owner**: "Zeus with lightning, summons a giant dragon, then rides it with a giant lightning sword".

## 12. Kaleido: the Abyssal Fire Knight

- **Concept**: an obsidian knight cracked with molten seams, horned great helm pouring fire, in front of a gilded
  triptych in a hall of mirrors that reflect him as burning silhouettes.
- **Phases**: 1 sealed and upright. 2 lunges, faceplate breaks on a molten skull, reflections climb out of the panes.
  3 the Abyssal Inferno: armor plates hang in an arc, a lava fire demon erupts with fire wings and a molten greatsword.
- **Ability (prism)**: each question shows a color chip (red, green, blue in shuffled blocks of three); collecting all
  three = Prism +2; a right answer on a color already held = Overcharge +1. Art: `data-ab-prism`.
- **Tint**: the fire. **Card**: `lgShardFocus`. **Owner**: keep the triptych, make him "a flaming abyssal fire knight".

## 13. Glutton: RETIRED

Removed by the owner (2026-10). Its slot stays in `RAID_ROSTER` and `RAID_RETIRED` only so stored states and old
trophies work. Do not recreate it.

## 14. Puppeteer: the Grand Marionettist

- **Concept**: a cracked porcelain mask with needle fingers working a knight-jester marionette on a ruined stage.
- **Phases**: 1 the doll dances. 2 the doll's head snaps off, strings run into the real face, the hanging puppets wake.
  3 a spider of strings, masks and doll parts round an eye of strings, the stage burning.
- **Ability (puppets)**: every 4th right answer steals a puppet (max 2); each kicks him for 1 on every raid answer (even
  a miss); a miss yanks one back. Art: `data-ab-puppets`.
- **Card**: `lgStringDrop`.

## 15. Berserker: the Last Warlord

- **Concept**: a ram-horned warlord in black plate at a burning war camp under a blood sun. Constant: horns, crested
  helm, scar over the left eye, a snapped tusk, skull pauldrons, a broken manacle chain, one notched axe.
- **Phases**: 1 coiled, axe on his shoulder, glaring up through the visor. 2 berserk rage: hulks out past the frame,
  helm split on a raging bull skull, axe mid-swing. 3 a flaming four-armed demon-god over a sea of fallen helms, one
  heart blazing in the open ribcage.
- **Ability (allin, decision)**: arm the axe before a typed answer: right = Cleave +3; a miss costs one extra heart,
  never the last; the axe then rests 3 answers.
- **Tint**: the fire. **Card**: `lgWarCharge`. **Owner**: "go crazy", a different pose every phase.

## 16. Swarmqueen: the Hive Empress

- **Concept**: an insect queen on her egg sac in a honeycomb cathedral, compound eyes, scythe forelimbs.
- **Phases**: 1 enthroned. 2 the hive awakens: she rears off the burst sac, glass wings blurring, stinger at the viewer.
  3 the hive is her face: comb cells become eyes and mouths round giant mandibles, her old body hung inside.
- **Ability (wildfire)**: a right answer lights 2 of 6 comb cells, a miss douses one; all six = Hive Ablaze +2. Art:
  `lg-ab-comb-1..6`.
- **Tint**: the wings. **Card**: `lgHiveRumble`. **Owner**: phase 2 must be its own scene.

## 17. Gorgon: the Stone Gorgon

- **Concept**: a jade gorgon with a crown of striking serpents and petrifying gaze rays in a ruined temple of statues.
- **Phases**: 1 regal and monstrous. 2 her stone face splits on a second face made of snakes. 3 one colossal serpent
  bristling with heads round a single petrifying eye, the temple collapsing.
- **Ability (mirror)**: every 4th raid question (3rd in phase 3) is her gaze (tag chip): right typed +3, by choice +2.
  Art: `data-ab-gaze`.
- **Card**: `lgSerpentRear`.

## 18. Banshee: the Drowned Organist

- **Concept**: a ghost in a drowned organ loft with an enormous screaming mouth (dropped jaw, never a ring), veils for
  hair, bells on chains from an iron yoke above her, a choir of faces in her robe.
- **Phases**: 1 hunched at the organ. 2 the wail rises: she tears free on a diagonal, bare cracked skull, jaw off its
  hinge, the choir torn out. 3 Requiem: her face stretched into a vast wail at the eye of a spiral storm of veils.
- **Ability (scream)**: she screams at every phase line and after each miss (one pending); the next right answer
  shatters it for +2. Art: `lg-ab-scream`, `lg-fx-wail`, `lg-fx-shatter`.
- **Tint**: the bells. **Card**: `lgWailPulse`. **Owner**: phases 2 and 3 must be whole new scenes.

## 19. Reaper: the Soul Harvester

- **Concept**: a towering hood, bone pauldrons, a cape of screaming faces, a vertebra scythe, a soul lantern, over dead
  wheat and graves. One angular skull with a soul gem in every phase.
- **Phases**: 1 the skull burns in the hood's shadow. 2 hood ripped back, armored ribcage full of souls, a soul whip.
  3 the same skull enormous and horned, jaw unhinged on a soul, four huge claws, souls dragged from bursting graves.
- **Ability (execute)**: a scythe line starts at the phase floor; right answers raise it 1, misses lower it 1; a right
  answer leaving his health at or under the line reaps him to the floor (in phase 3, death). Art: `data-ab-line`.
- **Card**: `lgScytheSwoop`. **Owner**: "more badass in every way".

## 20. Dreamer: the Sleeping Horror

- **Concept**: an eldritch god asleep in a drowned impossible city, tentacle beard, dream bubbles holding nightmares.
- **Phases**: 1 asleep, slit eyes peeking. 2 wakes: dozens of eyes, the beard parts on a beak. 3 the skull splits on a
  cosmic brain ringed by eyes, the sky tears.
- **Ability (sleep)**: asleep, right answers sink it deeper (1 to 3); the next right at full depth = Nightmare +3; a miss
  wakes it; awake, 2 right in a row = Lullaby +2 and it sleeps again. Its idle sleep drift is the one persistent idle
  reaction. Art: `data-ab-asleep`.
- **Card**: `lgEldritchUnfold`.

## 21. Moonmaw: the Lunar Strix

- **Concept**: the night sky is a colossal horned owl and the MOON is its face (craters, a V brow of night). A silent,
  patient, cold predator in every phase.
- **Phases**: 1 Full Moon: perched, wings folded, heavy-lidded, a moon halo. 2 Blood Moon: threat display, wings flung up,
  fanged beak hissing, the halo shattered. 3 Total Eclipse: diving at you, a black moon in a corona, talons thrust out.
- **Ability (moons)**: every 3rd clean typed answer flings a moon that crashes 2 raid answers later for 2, even on a miss;
  moons still orbiting at the end crash at once. Art: `lg-ab-orbit-1|2`.
- **Tint**: the halo / corona. **Card**: `lgMoonrise`.
- **Owner**: "love the idea of a MOON boss" but not a pale Void copy; an owl, which nothing else is.

## 22. Kitsune: the Nine-Tailed Empress

- **Concept**: the Legends Sakura ascended, built from `bosses/sakura.svg`'s face: a fine white fox face, red markings,
  a bell on a red cord, a layered kimono collar. The gold standard of quality.
- **Phases** (each a different woman, silhouette and palette): 1 Courtly: wink, closed fan at her lips, neat fan of pink
  tails. 2 Unveiled: the mask cracks off, amber slits, fanged grin, hair and tails flung wide in violet foxfire.
  3 Celestial Kyubi: a corona of nine white-gold tails, a shimenawa halo, eyes of light, a third eye.
- **Ability (rally)**: every right answer returns her star ball; the 4th in a row = Starfall +3; a miss resets. Art:
  `data-ab-rally`.
- **Card**: `lgPetalFall`. **Owner**: "go all out" while staying beautiful.

## 23. Ophanim: the Wheel of Eyes

- **Concept**: a biblically accurate angel, a second take beside the Seraph: one porcelain eyeball inside wheel after
  wheel of rose-gold and copper packed with eyes, parchment-feather wings, a tiny pilgrim for scale. Serene, never angry.
  Painted (`REALISTIC_ART`), with an experimental photo layer (`lg-photo-*` groups filled by art.jsx sprites).
- **Phases**: 1 folded: a cocoon of wings, feather lids, nearly every eye shut. 2 unfolding: wings open, more wheels,
  eyes everywhere, gaze eyes beam. 3 heaven blinding gold, colossal burning wheels, every eye open.
- **Ability (grace)**: open eyes needed = 2, 4, 6 by phase; a right answer lights one, a miss darkens one; all lit = Grace
  (a lost heart back, once per phase) or else a Holy Beam for phase + 1. Art: `lg-ab-lit-1..6`.
- **Tint**: the small eyes' irises. **Card**: `lgGyroAlign`. **Owner**: "the craziest raid boss ever", no scroll.
- **The great eye panics as health drops** (owner): phase 1 still (folded shut), phase 2 a SLOW look-around (16s loop,
  4 long holds), phase 3 RAPID darting (13s loop, 10 darts). Keep that escalation if the eye is ever redone.

## 24. Ratking: the Sewer Kingpin

- **Concept**: a smug, swaggering, gold-dripping sewer rat king (long-snouted wedge skull, torn ear with gold hoops,
  scar, gold grill, buck teeth, round rat pupils, crown, shades). Smug in EVERY phase.
- **Phases**: 1 holding court on his coin throne before an emerald vault, cigar, scepter, henchmen on the hoard.
  2 High Roller: neon casino, three-quarter lean over the felt, royal flush, roulette halo. 3 The Gold Emperor (2026-10-08
  redraw, "phase 3 is bad"): the peak of his rise, still smug: from below, chin up, head turned right, crowned in full
  regalia on a gold throne in his vault, rat-skull scepter, a goblet of coins raised in a toast, gold raining down.
- **Ability (hoard, decision)**: a right answer takes a coin, a miss loses one; Cheese Bomb (3 coins) deals 3; Lucky Tail
  (2 coins) saves the next heart; at 5 coins the rats throw a bomb for you. Art: `lg-ab-hoard-0..2`.
- **Tint**: the red velvet. **Card**: `lgCoinToss`.
- **Owner**: keep the Sewer vibe, "just as epic and cool and smug"; big face in every phase, never zoomed out.

## 25. Sugarqueen: the Sugarplum Tyrant

- **Concept**: a glamorous, beautiful candy empress (porcelain face, short pink bob with a soft-serve knot, chocolate
  corset, lace gloves) in front of a muted dusk palace that never outshines her.
- **Phases**: 1 the Empress on her heart throne, scepter raised. 2 Sugar Rush: close three-quarter lean, scepter arc, a
  kiss bursting into crystals, a wink. 3 the Sugar Empress: close from below, sugar-glass crown, lollipop halo, rock-candy
  wings, the jar as a heart jewel.
- **Ability (sugarrush)**: every right answer adds a cube; the 3rd starts a rush for the next 2 answers (+2 each right);
  a miss crashes it. Art: `data-ab-rush`.
- **Card**: `lgSugarDrop`. **Owner**: "make her beautiful", short hair, close shots, all-ages coverage.

## 26. Showman: the Infernal Impresario

- **Concept**: a smug ash-grey demon showman (ember slit eyes, gold star under the eye, swept silver pompadour, ringed
  black horns, emerald sequin tailcoat, white gloves with claws through the tips), clearly not the Legends Grand
  Illusionist. ONE character per phase, big in frame; Comedy and Tragedy are his act. Smug in every phase.
- **Phases**: 1 the Overture: between crimson drapes, Comedy raised on a gold baton beside his face, Tragedy floating
  over his glove. 2 the Swap (the owner asked for it back): backstage at a bulb-rimmed mirror, dutch angle, head three
  quarters, cold violet eyes; the masks float mid switch and the idle swaps them across his face. 3 the Grand Finale:
  center stage from below, crossing spotlights, a fan of giant cards, cape and chain of office, both masks raised like
  trophies, a broad smug grin, roses and cards raining. Never a doubled head or a sawn box again ("two of the same
  character", "looks broken").
- **Ability (encore)**: right answers win applause, the 4th = Encore +3; misses shed tears, the 2nd tear is a Plot Twist
  leaving the applause one short of an Encore. Art: `lg-ab-comedy`, `lg-ab-tragedy`, `lgfa-showman-comedy`.
- **Tint**: the ember ascot. **Card**: `lgCurtainPart`. **Owner**: masks are the core of his act.

## 27. Cerberus: the Hound of the Last Gate

- **Concept**: a colossal hellhound guarding the underworld's last gate, three heads with their own characters (Brand
  the fiery hothead, the stern iron-browed Warden, sly smoky Shade), the gate's key on his collar. An unmoved doorman,
  never goofy.
- **Phases**: 1 the Warden at the Gate, seated, chained, doors shut. 2 the gate torn open: dutch angle, hellfire, a paw
  slams at the viewer. 3 the Three Kings: crowned necks fan up from below, the gate's keyhole burning in his chest.
- **Ability (shackles)**: Fire head chained by any right answer, Iron by a clean typed answer, Shadow by the first right
  answer after a miss or a blocked attack; one answer chains one head; all three = Bound +4, then they tear free; a miss
  frees the Fire head. Art: `data-ab-fire|iron|shadow`.
- **Tint**: the soul fire. **Card**: `lgHoundPace`. **Owner**: "GOES ALL THE WAY OUT", clearly not the Legends Cerberus.
