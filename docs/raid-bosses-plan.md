# Raid bosses: reference

What each raid boss IS. The bosses exist: art in `public/assets/legends/raids/<motif>.svg` (each file's leading
comment describes it), abilities in `src/features/legends/abilities/<motif>.js` (the module is the truth for numbers),
lore `lg_raidLore_<motif>`, voices in `raidVoices.js`. Progression order is `RAID_ORDER` in `raid.js`; the stored
index is into the append-only `RAID_ROSTER`. Numbers below are roster positions. Art direction: read
`docs/legends-art-guide.md` first.

Background: the owner called the first set "super boring, uninspired and weak" (small figures lost in their frame; the fix was a BIG figure, not a fuller backdrop). A raid
boss is the day's whole due stack in one fight, so it must look like a game's final boss.

## Rules for all raid bosses

**The art rules are the RAID BOSSES section of `docs/legends-art-guide.md`** (the kitsune is the gold standard; it wins
over anything in this file). The per-boss sections below describe the drawings as they are, NOT a model to copy: the
2026-10-09 redesigns and the Headless Horseman were rejected (busy backgrounds, crammed detail, phases that changed the
scenery but not the character, broken phase 3s).

- **Depth without gradients** (only `REALISTIC_ART`, the ophanim, uses local gradients): base shape, a dark shadow
  side, a lit edge; strong ink outline.
- **Phase layers** `lg-p1`, `lg-p2`, `lg-p3`, `lg-p12`. A phase change in the arena flashes and shakes the boss
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
all nine moments unique, including a themed knockout; `ENTRANCES` entry; lore and a voice; then 10 QA passes (the art itself: the guide's RAID BOSSES process) over its
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

- **Concept** (redrawn 2026-10-10 to the kitsune model, generator `.scratch/raid-kitsune/seraph/gen.mjs`): a bust,
  face on, NO background (only her wings and halo). A porcelain MASK-HELM (wide brow, brow ridges over ONE great red eye
  with a white star pupil, a fine gold inlay inside its edge, a single keel to a pointed chin, no mouth) under an iron
  crown with a red eye-gem; a grey-ivory veil hanging behind the shoulders like long hair, crimson-lined; a high
  crimson collar with a gold eye brooch, a porcelain neck under the chin (no hole), porcelain pauldrons over each
  upper arm, the crimson robe with gold trim, steel gauntlets with gold nails, eyed wings, a halo, the SCALES OF
  JUDGMENT (her ability is read on them).
- **Arms** (every phase, redrawn in round 9 after three reviews failed the tube arms): ONE outline per arm from under
  its pauldron: full at the shoulder, slimming along the upper arm, turning at the elbow (a soft bone outside the bend,
  a crease inside, no disc and no corner), swelling below the elbow and tapering into a slim wrist with a gold cuff
  that follows the taper, then the hand. The scales stand on an upright fist: a visible gold post from the fist to the
  beam.
- **Phases** (her BODY and POSE change every phase): 1 In Session: composed, she weighs you; crimson robe and gold-rimmed
  crimson sleeves; both elbows rest low at her sides and both forearms rise ACROSS her robe: the left hand open at her
  waist, palm out (closed eye stirring red), the right fist holding the scales up level before her heart; the arms
  stay inside her outline (round 10, for the silhouette rule: P2 flings them out, P3 raises them); soft elbows, short
  broken lights (no glossy stripe); eye heavy-lidded; ONE pair of lavender eyed wings stands folded tall and rises into
  a pointed ARCH over her head (a judge's throne vault; the lower pair was cut); thin gold halo. Knocked out, P1's
  wings sag OUTWARD (the shared inward turn folded the arch into a hood). P2 leans hard (rotate 7) and its wings are
  larger and fanned. 2 The Verdict: the veil crimson-black with ember edges, whipping; the mask
  charred grey, cracked red, an ember inlay; heavy brows and ONE bold V lid line biting into the glowing eye; both arms
  flung out to the sides at shoulder height: the left nearly straight, palm thrust out (eye wide, red), the right
  thrusting the scales out, tipped hard to wrath; blood-black robe and ember-rimmed crimson sleeves, an ember-orange
  stole, every hem torn and burning; ash-and-ember wings flung wide, every eye open and blinking; a red ring halo.
  3 Final Judgment: both arms raised from the TOPS of her shoulders in an open V, elbows marked above shoulder
  height (OCHRE sleeves, separate from the white robe by value; pale gold vambraces pointed toward the elbow); large
  hands (round 10: about 1.4x) in clear dark space: the scales aloft on the right fist with Mercy's white and Wrath's
  red flames in the pans, the left palm raised (eye blazing gold); the robe white and gold (a crimson stole only),
  gold pauldrons, an ivory neck, the veil turned to GOLD cloth so the ivory mask stands out, a plain gold circlet, the
  cracks healed in gold, the eye gold and calmly lidded; one great pair of pale-gold wings MANTLED: each wing's soft
  pale top rises from behind the shoulder to elbow height and long feathers hang down and out to the lower corners
  (no dark leading-edge line: it read as a staff; coverts are long narrow feathers), so no feather touches a hand or
  a pan; a halo (radius 34) with one golden eye and two fine rings of light (never a filled disc: it read as a grey
  plate); she floats, motes of light rising. Knocked out: the eye a closed lid in the mask's own colour, its line
  drooping at the corners (a sagging curve read as a smile); phase 3's wings sink a little (12deg; the shared -16deg
  stood them up like ears) and its halo swells only 1.05x; in phases 2 and 3 the raised arms give way to arms hanging
  at her sides with limp hands, the scales fallen and toppled beside her right hand.
- **Ability (verdicts)**: questions cycle Wrath, Mercy, none (tag chip): Wrath right +2; Mercy miss costs no heart (still
  returns as an attack), Mercy right +1; a phase line shifts the cycle. Art: `lg-ab-verdict-wrath|mercy` (a red
  flame lit in the right pan or a white flame in the left; phase 3: that pan's flame roars tall); every verdict moves the REAL scales
  (`lgs-beam`, `lgs-panL`, `lgs-panR`: wrath slams them onto the flame, grace onto the feather, mercy swings them level),
  the wings, the eye (wrath: wide white-gold weeping light; mercy: shut; grace: gold) and the halo.
- **Tint**: the halo, every phase. **Card**: `lgHolyUnfold`.
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

## 9. Chronos: the Hourglass Colossus

- **Concept** (redrawn 2026-10-10 to the kitsune model, same concept; the 2026-10-09 scene version was rejected: "a ton
  of details crammed... the background is overwhelming. Each phase is also not as impactful as kitsune"): a tight bust,
  the same framing in every phase, NO background, the face dominant. A big pocket-watch head (engraved bezel numerals,
  dial ticks, stem, knurled crown and bow ring) whose brows are its own hour hand (spade, viewer left) and minute hand
  (arrow, viewer right), set as brows just over each eye; the jaw is the lower dial (it opens in phase 2). A small calm hourglass in the
  chest (the Time Loop sand), steel gorget with the time gem, bell pauldrons ON the shoulders that turn with the arms
  (steel upper arm, cog elbow, brass vambrace, gauntlet), THE GREAT WINDING KEY in his left fist in every phase.
  Generator: `.scratch/raid-kitsune/chronos/gen.mjs` (about 910 paths, 95 animations).
- **Phases** (HE transforms, not only the halo): 1 Time flows: midnight mantle, warm brass, a thin gold clock ring with
  two great hands at ten past ten; key upright, the other hand raised under a small floating hourglass; a curved,
  lopsided sly smirk. 2 Time breaks loose: a new STANCE, hunched with the head dropped and tilted, the key gripped
  in BOTH fists across his body; verdigris brass and a torn teal mantle blown up past his shoulders in two wings, teal
  light cracking from the cuirass seams, flank plates open on turning clockwork, a cracked pauldron; five great blades
  and three broken arcs; dial cracked, eyes blazing in dark sockets, brows a steep V, the jaw dropped onto fangs and a
  glowing throat. 3 The end of time: HIS BODY and POSE change: the key thrust high
  across the ring, the other arm swept out palm UP, white-gold brass, a cuirass flaring into a sun's pointed
  breastplate, the chest hourglass a glass of light, the mantle turned to sand pouring down in drips; one aura, a
  corona of ticking clock hands of light around his ring, longest at the sides; the key dark bronze, winding in his
  fist; sand falls off the upturned palm in a broken stream of grains; a DARK bronze dial with white-gold eyes, gold brows,
  a star of light on the hub (his power mark) and a glowing smirk. Its knockout: he crumbles into a heap of sand under his fading halo. The whole boss is drawn 15% larger than its units (the fight's pivots stay in drawing units).
- **Ability (loop)**: sand 0 to 3 (starts 1; +1 every 3rd right answer and each phase line); a miss with sand costs no
  heart and no attack, and the card loops back 2 questions later (right = Paradox +1, missed = one heart); sand past full
  = Time Stop, the next right answer doubles. Max 4 loops. Art: `data-ab-sand` (the sand level in the chest glass, every
  phase), `lg-ab-stop-1` (frost locks the glass and the stream), face layers `lg-fx-rewind` (swirl eyes, hands and
  seconds spinning back), `lg-fx-timestop` (frost eyes, hands stopped on 12), `lg-fx-paradox` (glitched eyes, the hands
  at two times at once), `lg-fx-overflow` (sand brims and pours down the cuirass).
- **The drawing acts every moment** (`fx/chronos.jsx`, shared shoulder/neck pivots, the key's fist per phase): head, brow hands, crown, jaw, torso, both arms
  and the key. Its blow drives the right arm at the camera while the key swings; the heavy blow hammers both arms down
  like a bell clapper; the knockout races the hands, stutters the head, topples the crown, drops the key and crumbles the
  hourglass body, held via `data-down`. Impact parts of its own: `chronosGlassBurst` and `chronosSandfall` (it
  shatters into sand).
- **Tint**: the time-energy glow (core, cracks, gems, sigils). **Card**: `lgTimeReverse` (sand flows back up).
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

## 12. Kaleido: the Mirror Knight (the Thousand Reflections)

- **Concept** (kitsune-model redo, 2026-10-10; the hall-of-mirrors version with 3,702 paths was rejected with the other
  scenery redesigns): a silver-faced knight whose power is light. NO background: only his own aura. One bust, the same
  framing in every phase: a horned obsidian ogive helm with gold rims and filigree, a living SILVER MIRROR face (square
  jaw, burning amber eyes) framed by cheek guards under a heavy V brow plate, layered pauldrons with a diamond mirror
  medallion, a cuirass with a gold V trim leading to the triangular PRISM in his chest. His reflections are two fans of
  mirror blades rising behind his shoulders, each blade holding his reflected amber eye (they sway a beat late).
- **Arms and gesture**: his right arm (viewer's left) acts, drawn as ONE armoured sleeve: the upper arm comes down out
  of the pauldron (a gold lame band across it), bends at a pointed elbow under a couter shaped to the bend, and the vambrace
  rises across his chest narrowing to a cuff no wider than the wrist (a rim of his light on top, its shadow on the cuirass);
  hand sizes follow the forearm (P3 palm about 0.75 of it); his left hangs, tapering to its elbow plate; the head tilts per phase. The cuirass has
  three lames with gold edges and rivets, engraved scrolls and a fleur, lit by his own crystal glow. His mirror fans hold
  ghosted reflections of his helm and face.
- **Phases** (he changes, nothing else): 1 the Vigil: head bowed into the gorget, one eye narrowed, his fist grips a long mirror shard upright
  beside his face (its light on his cheek), the fans FOLDED shut behind his shoulders (two small panes holding his
  reflection: a compact, closed outline), the prism glinting cyan. 2 Shattered: the
  plate turns plum-crimson and splits, crimson crystal growing out through the cuirass and crest and bursting sideways out of both pauldrons (a spiky new shoulder line), the head thrown into a tilt and the whole bust lurching into the punch, a denser, taller burst; the helm's
  cheek guard breaks away showing more mirror face, which shatters and bares its teeth; he raises his clenched FIST (the thumb
  folded across it) spraying splinters; the fans fling wide and break, red and cyan; the prism red hot. 3 Thousand Reflections: white
  crystal plate with gold rims, a tall crystal crown, a cut-crystal brow, gold eyes blazing in dark sockets, a cold
  smile; an open palm raised (jointed fingers, a two-segment thumb), his white-gold light glowing in
  it and a star of that light rising from it (no rainbow); a mantle of long white-gold crystal blades sweeps from under his pauldrons to the bottom corners (his body's new
  outline); a dark edge keeps the white helm and horns clear of the corona; the fans have become a white-gold corona on a gold ring that opens where his horns pass (no backdrop light).
  Every part stays inside the box's headroom. Generator: `.scratch/raid-kitsune/kaleido/gen.mjs` (edit it, not the SVG).
  1192 paths, 75 animations. Silhouette IoU (silhouettes.mjs, 60 px, still pose): P1-P2 0.654, P2-P3 0.759,
  P1-P3 0.677 (kitsune 0.671 / 0.863 / 0.699).
- **Ability (prism)**: each question shows a color chip (red, green, blue in shuffled blocks of three); collecting all
  three = Prism +2; a right answer on a color already held = Overcharge +1. Art: `lg-ab-prism-1/2` light the chest
  prism's facets; `lg-fx-shard` (a glint), `lg-fx-overcharge` (the prism red hot and cracking), `lg-fx-prism` (the prism
  blazes with colored rays). The overlays land on the chest prism (about 80% down the box), never on the face.
- **Hook classes**: `lg-kaleido-head`, `-chest`, `-pauldl`/`-pauldr` (viewer's left / right), `-armr` (the raised arm,
  viewer's left, pivot at the shoulder measured per phase), `-arml` (the hanging arm, viewer's right), `-refl`/`-refr` (the mirror fans,
  in phase 3 the corona halves), `lgfa-kaleido-eye` (the pupils).
- **Tint**: the mirror blades (fans and orbiting shards). **Card**: `lgShardFocus`.

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
- **Tint**: the wings. **Card**: `lgHiveRumble`. **Owner** (superseded 2026-10-10): the change is ON the character, never a new scene.

## 17. Gorgon: the Stone Gorgon

- **Concept**: a jade gorgon with a crown of striking serpents and petrifying gaze rays in a ruined temple of statues.
- **Phases**: 1 regal and monstrous. 2 her stone face splits on a second face made of snakes. 3 one colossal serpent
  bristling with heads round a single petrifying eye, the temple collapsing.
- **Ability (mirror)**: every 4th raid question (3rd in phase 3) is her gaze (tag chip): right typed +3, by choice +2.
  Art: `data-ab-gaze`.
- **Card**: `lgSerpentRear`.

## 18. Banshee: the Drowned Organist

- **Concept** (redone 2026-10-10 on the kitsune model; the 2026-10-09 scene version was rejected: "hard to tell what is
  going on and too much background and phase 3 is just broken"): no background, one bust, face centered, the SAME
  framing in every phase; her own organ is her aura. ONE gaunt ghost woman seen face on: a long angular face (high
  cheekbones, hollow cheeks, sunken sockets with glowing eyes, two heavy V brows, blue-violet lips), long silver hair, a
  black lace mourning veil with a widow's peak, a silver tiara with a teardrop gem, a deep violet mourning gown with a
  lace V neckline, silver funeral lilies and a gem brooch, two cracked bronze bells hanging on chains from the veil pins
  beside her face. Generator: `.scratch/raid-kitsune/banshee/gen.mjs`.
- **Her mouth is a real, expressive human mouth, never a ring**: phase 1 a keening moan (lips parted, corners
  dragged down, a sliver of teeth), phase 2 a raging shriek (upper lip curled up, fangs top and bottom, nose folds),
  phase 3 the killing note (a wide open scream, both rows of teeth, the throat lit with her light). The jaw drops 2 to
  2.6 units; the skull never changes.
- **Phases** (the ONE silhouette tool, `node .scratch/raid-kitsune/silhouettes.mjs banshee`, frame 0, tolerance 0: banshee
  P1-P2 0.495, P2-P3 0.816, P1-P3 0.519 against the committed kitsune's 0.671 / 0.863 / 0.699; a slim hooded bust at
  her keys, a wide V of tall banks with the veil whipped out to the lower corners, a fan of pipes with arms flung wide
  and down over long ghost tails): 1 THE DIRGE, teal and cyan: she plays a short spectral keyboard of light, both bony
  hands arched on the keys, eyes half lidded and glowing; no pipes yet (the organ grows with each phase), ghost notes
  drifting up beside her; the veil, gown and keyboard narrow and straight. 2 THE WAIL, violet and acid green: she rips
  her right claw off the keys and flings it up beside her face on a long forearm that tapers from the elbow to a slim
  wrist and is longer than the hand (short vase-stub forearms were rejected), the wide sleeve fallen to the elbow, green
  sparks round the claw, shrieking; the pipe banks rise tall, swing open and shudder, the same organ pipe as phase 1
  with its flue mouth cut into the pipe face (it tilts with its pipe), staggered, no crack lines (no rings or wisps over
  the tops: straws in test tubes); the veil's sides whip out to the lower corners in one smooth curve each with a torn
  lace hem (stacked wedges read as bat wings); the gown darkens to violet-black with acid-green lace, rips at the
  shoulders and frays below the hem into short torn shreds, uneven and tapering (scallops read as a lampshade or a
  frill), the bells swing hard. 3 REQUIEM, ice cyan on night blue, gold bells: ascended into ghost light: skin and hair
  turned to light, eyes of light in a GLARE (dark blue brows driven down to the nose, upper lids pressed onto the
  eyes), her ultimate WAIL, bigger than the phase 2 shriek: a wide commanding open mouth, both rows of teeth clearly
  drawn (no fangs), cold light filling her mouth from deep inside in its own shape (a throat-glow oval read as a
  tongue; a ring round her lips read as a ring gag); ONE commanding move: both arms flung wide and DOWN, claws spread
  low at her sides, the wide bell sleeves hanging from the forearms with lit lace hems ("hands up beside the face"
  read as "don't shoot"); the gown a night-blue robe with thin threads of light rising up it (curved pale streaks read
  as fangs), slim, trailing off below the bust into long torn ghost tails, each its own tapering curl; her organ is her
  AURA, three ice-metal organ pipes a side fanned from ONE root behind each shoulder: long conical feet, a flue mouth
  cut into each pipe face (two lit from inside), OPEN cut tops (a dark bore inside a pale rim, no caps: capped pale
  tubes read as glass tubes or glow sticks), spread so every mouth clears the veil and the arms; her sound is the
  ghost notes rising out of the lit flue mouths; inside the frame with strokes and idle sway (measured -21.9..141.9,
  top -22.0, bottom 142.7); her head tilts into the note (glassy pipes with rim rings read as test tubes; a rank on a
  plinth read as scenery; a radial fan of thin white pipes read as syringes; no glow outline round her, no upward
  tongues: horns; no veil wings: they hid the pipes). In phases 1 and 2 the sleeve stops at the elbow and a bony
  forearm runs to the lace cuff (hands growing out of cuffs read as armless). The hair locks fall behind her shoulders
  in every phase (in front they read as tusks). No scenery in any phase (no loft, nave, window, water or lightning).
- **Fight motion keeps her together** (`fx/banshee.jsx`, check-joints 0): head and hair pivot on the same neck joint
  (view-box units per phase) and the hair plays the head's animation in every moment; head moves are tilts and small
  scales about that joint, never translations; in phase 3 the jaw only flexes (`lgrBansheeP3Jaw*`) so the wide mouth
  never passes her chin. The shared white hit flash is moved down onto her chest for this boss (it hid her face for
  ~150 ms on a critical). The Wail and Shatter screen layers are round and fade to nothing before the box edge (a
  hard rectangle showed past the card); Wail has no juice flash and Shatter flash 1 (a hit-stop held white silhouette
  hid her). Knockout ring solid, not dashed (a dashed ring read as a loading spinner).
- **Ability (scream)**: she screams at every phase line and after each miss (one pending); the next right answer
  shatters it for +2. Art: `lg-ab-scream-1` (the scream held: the mouth opens in phase 1, frost on her cheeks, streaks
  of cold sound hang from her mouth), `lg-fx-wail` (blazing eyes, bolts of sound), `lg-fx-shatter` (eyes squeezed shut,
  lips clamped, an ice crack across her face). Effects (`fx/banshee.jsx`): Wail = a VIOLET and GREEN sound shock
  (jagged pressure fronts sweeping from her mouth corners to the edges, green/violet waveforms, the choir flung at you,
  glowing green); Shatter = WHITE and ICE BLUE glass (a white flash, frost needles from every corner, two bars of ice
  beside her mouth, a crack web in the outer ring of the arena, shards falling beside her, a flatline). Knockout: the
  song ends: her sound rings collapse back into her, her LAST NOTE slips from her lips and thins away past her veil
  (`bansheeLastNote`), her ghost light comes apart in rising motes (`bansheeMotes`) and her pipes shudder and sink
  silent (`lg-banshee-pipes`, held by `data-down`). No water (the owner dropped the flood theme). Entrance (the drawing): her pipes grow up behind her, her head
  lifts from a bow, her hands come down on the keys, her eyes snap open.
- **Tint**: the two bells (every phase). **Card**: `lgWailPulse`. **Owner**: no ring maws (phases as
  whole new scenes: superseded 2026-10-10, the change is ON the character).

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

- **Concept**: a smug, swaggering, gold-dripping sewer rat king (a BIG round faceted head, face on, a short muzzle with a pink nose, big round ears, the torn one with gold hoops,
  scar, gold grill, buck teeth, round rat pupils, crown, shades). Smug in EVERY phase.
- **Phases**: 1 holding court on his coin throne before an emerald vault, cigar, scepter, henchmen on the hoard.
  2 High Roller: neon casino, three-quarter lean over the felt, royal flush, roulette halo (the felt and its chip stacks
  sit OUTSIDE his breathing group: "the green table should not move"). 3 The Hoard God (redrawn 2026-10-10 to the
  kitsune model; the 2026-10-09 version was rejected for yellow eyes plus tiny shades on the snout, gold lines across
  the face, a box fist, coin-wave and throne scenery and a square tile, earlier ones as "a different character"). Phase
  1's own grey head and face at phase 1's size (narrow eyes now lit gold, phase 1's purple-black shades in a ring of
  gold light with light leaking past them, the grill grin and cigar, gold flecks in his fur, a clean gold rim light on
  his lit side); the gold is LIGHT, never his fur colour; a bigger crown; a bust ending on its own curved
  gold-embroidered hem; the near arm resting phase 1's paw on the vest, the other raised with phase 1's paw holding a
  gold coin (thumb across it) while coins erupt out of it in a stream of glowing coins (no beam); behind him a sun
  king's halo ring with broad gold rays bursting to the edges (round 12: his own outline, not a background frame;
  silhouette check passes with and without the corner heaps), small coin heaps in both lower corners, and four rimmed
  coins on the rays that are the hoard states
  (`lg-abh-hoard-*`, `lg-ab-hoard-0..2`: fewer coins as you rob him). No henchmen. Fight: the
  conjuring arm (`lg-ratking-armr`, pivot at the shoulder) strikes with a shorter hurl of the coin, `lgrRkPawStrikeP3`/`HeavyP3`, so the raised paw stays in the box, the vest-resting arm
  (`lg-ratking-arml`) only sways and slumps in the knockout; in phase 3 the head never moves on its own (every reaction moves `lg-ratking-figure`, so the head stays on the neck) and the crown lands on top of the left coin heap; afterwards every part holds its fallen pose (`data-down`,
  all phases). Source: `.scratch/raid-kitsune/ratking/build10.mjs` (keeps phases 1 and 2 byte-identical).
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

- **Concept** (redrawn 2026-10-10 on the kitsune model, after "he jus looks like a regular guy. where are his powers??
  his magic powers??? All phases look boring."; generator `.scratch/raid-kitsune/showman/gen.mjs`): a demon ringmaster
  whose act is real magic. The liked character is the anchor in every phase: one frontal bust, face centered and the
  same size, a strong angular face (heavy V brows, deep-set glowing eyes, long straight nose, strong jaw), a waxed
  handlebar moustache, a chin tuft, slick black hair silvered at the temples, a tall top hat, a navy tailcoat with gold
  epaulettes, frogging and gold-piped satin lapels, white gloves; Comedy and Tragedy are thick carved masks with living
  eyes. NO background: only his own aura, HIS RING (the ringmaster's ring behind his head, like the kitsune's gold
  ring), and his magic. Smug in every phase; the power escalates, the man never screams.
- **Phases (one sentence each; the power is ON him; a different SHAPE each phase, checked with
  `.scratch/raid-kitsune/silhouettes.mjs` against the kitsune; he grows in stature every phase)**: 1 the Overture (green
  ghost fire, navy coat, compact and upright): the charming ringmaster tips his top hat at a rakish angle, Comedy floats
  on a green flame over his raised glove, Tragedy by his shoulder, his fist on his hip holding a gold-knobbed cane over
  his shoulder. 2 the Possession (violet, WIDE, leaning in): the demon half of his face shows, horns burst out, the hat is
  knocked askew and smokes, his arms fling a torn violet-black cape open like wings, claw hands ablaze, and the masks are
  whipped round him on a storm of violet fire. 3 the Grand Finale (crimson and gold, TALL): his true demon form, the hat
  gone (slick hair, a crown of fire, great horns rising beside his head), the epaulettes burned away into fire and
  flame wings, both arms raised conducting, each clawed glove holding a huge burning mask aloft. Arms are whole limbs
  (one sleeve: upper arm, a bent elbow, a tapering forearm, cuff, glove). The head moves only by rotating on the neck in
  every fight animation (check-joints clean).
- **Ability (encore)**: right answers win applause, the 4th = Encore +3; misses shed tears, the 2nd tear is a Plot Twist
  leaving the applause one short of an Encore. Art: `lg-ab-comedy`, `lg-ab-tragedy`, `lgfa-showman-comedy`, the tear and twist effects INSIDE the masks
  (`lg-fx-tear` + `lgfa-showman-tear` in Tragedy, `lg-fx-twist` glow round both; nothing over his face); the fight
  moves `lg-showman-arml/-armr/-head/-comedy/-tragedy/-fan` (his ring) `/-shadow` (his horns) `/-fire/-sigil` (his brow
  brand) (pivots per phase in `fx/showman.jsx`): the horns lunge and recoil, the fire roars, gutters and dies, the brand flares.
- **Tint**: the ember silk cravat. **Card**: `lgCurtainPart`. **Owner**: masks are the core of his act; "make him a
  villain who owns the stage, not a pretty boy".

## 27. Cerberus: the Hound of the Last Gate

- **Concept**: a colossal hellhound guarding the underworld's last gate, ONE body seen close as a bust, the heads
  filling the upper two thirds (one shoulder mass ending on a rounded arc like her kimono, fur clumps lit by each
  head's power, one mane across both shoulders that three long arched, muscled necks grow out of, a pale chest ruff,
  forelegs on big clawed paws), three long angular wolf heads on one skull (deep-set eyes in a dark eye-mask under a
  heavy V brow, a lip line from nose to long fangs, swept ears) with their own characters (Brand the fiery hothead:
  broad muzzle, burn scar, warm rust fur, ember markings, notched ear, curled lip, flame mane; the stern iron-browed
  Warden: biggest, riveted V brow plate, claw scars, bite scar, torn ear, the gate's key on his collar; sly Shade:
  narrow long snout, violet-grey fur, swept ears, watchful slit eyes, smoke tears, smoke mane). Never goofy.
- **Phases** (redrawn 2026-10-10 on the kitsune model: no gate, portal, stairs, floor or rays; NO background, only
  his own aura; the same framing and neck roots in every phase, the change is ON the hound; generator
  `.scratch/raid-kitsune/cerberus/gen.mjs`, outside the build). ONE deep-chested hound seen from the front: broad
  shoulders behind the necks, a barrel chest tapering to a keel between two real forelegs (round elbow with a tuft, a
  tapering forearm, a narrow wrist with a dewclaw, the pastern, a paw in perspective with uneven toes, pads and claws,
  a contact pool), the page showing under the keel; a fur ruff in uneven locks under the Warden's collar. Faces: cheek
  pads and a raised snout with its own planes, each head its own form (Brand broad snout and jowls, the Warden square
  snout and chin, Shade narrow snout and pointed chin). The body OUTLINE changes per phase (silhouette check passes,
  with and without the aura): 1 narrow and upright, 2 a wide asymmetric lunge, 3 risen tall. 1 the Warden on duty
  (slate and cold teal): heads close together, mouths shut over long fangs in a snarl, the chains taut down to iron
  rings in the floor, power held (Brand's flame mane and nostril smoke, burning eyes, Shade's smoke tears, cold soul
  fire burning round his paws). 2 the Chains Snap (charcoal-red and hellfire): Brand thrown low left, Shade high right,
  every jaw open, Brand breathes a jet of fire from between his jaws, the
  Warden roars under a crest of iron spikes, Shade howls; hackles break the shoulder line, elbows out, legs splayed,
  the chest dropped, embers in the shoulder and leg fur, red-hot collars, a singed ruff with ember-lit edges, a
  snapped link swinging from the outer end of each side collar, hellfire roaring up beside him. 3 the Three Kings
  (obsidian, white gold, blue soul light): heads raised in a crown, crowned (white fire, an iron crown with a soul gem,
  black horns), big eyes of cyan light, the plate and brows lifted, every jaw open on a throat of soul light, a third eye on the Warden's plate,
  gold-trimmed collars with broken cuffs, a glowing ruff, the chest risen tall on straight legs, ONE great blaze of
  blue soul fire around him. Knocked out, every power goes out (`lg-cerberus-power`), every head's eyes shut, the aura
  gutters (`lg-cerberus-portal`). Each head group pivots where its neck leaves the body (per-phase origins,
  `ROOTS` in `fx/cerberus.jsx`; the Warden's group carries the ruff, the side heads' groups their chains). About 940
  paths and 128 animations for all three phases.
- **Ability (shackles)**: Fire head chained by any right answer, Iron by a clean typed answer, Shadow by the first right
  answer after a miss or a blocked attack; one answer chains one head; all three = Bound +4, then they tear free; a miss
  frees the Fire head. Art: `data-ab-fire|iron|shadow` (`lg-ab-<head>-1`: a chain muzzle of red-hot, padlocked or
  smoke links, an open jaw shut; `lg-fx-bound` squeezed eyes, `lg-fx-snap` Brand's eyes blaze); the fight moves
  `lgfa-cerberus-<head>` (each a whole neck and head), the key, `lg-cerberus-pawl/-pawr/-chainl/-chainr`.
- **Tint**: the soul fire. **Card**: `lgHoundPace`. **Owner**: "GOES ALL THE WAY OUT", clearly not the Legends Cerberus.

## 28. Horseman: the Headless Horseman

- **Concept**: the rider of Sleepy Hollow on a black horse, ONE character, no scenery: green soulfire (the tinted part)
  burning out of the empty neck inside a ruffled cape collar, a tailored frock coat under tattered tiered capes, a lace
  jabot with a ruby pin, a crimson waistcoat, black gauntlets, and his own head carved into a grinning jack-o'-lantern
  hanging below his fist. The lantern and the soulfire are his face. Silent, patient, theatrical: the lantern does the
  grinning. A hushed campfire storyteller's voice ("Listen close, rider").
- **Phases** (redrawn 2026-10-10, v3, after the owner rejected a rider bust: "there is no full horse ... all 3 phases
  are basically the exact same"; round 4 after review 3). NO background. Horse and rider are ONE figure: the WHOLE horse
  in profile facing left (real leg segments: forearm, knee, cannon, fetlock, pastern and a hoof wider than the cannon in
  front; gaskin and a sharp hock behind; two-value cel shading), the headless rider in the saddle turned toward us (a
  mid violet frock coat with a waist and belt, hips in the saddle, thigh and tall boot down the flank, one tier of capes,
  a high collar round the soulfire, a lace jabot, steel gauntlets): one fist holds the reins, the other the lantern by
  its bail. A different POSE and body every phase (silhouettes.mjs: P1-P2 0.47, P2-P3 0.44, P1-P3 0.54 against the
  kitsune's 0.67 / 0.86 / 0.70; generator `.scratch/raid-kitsune/horseman/gen-v4.mjs`): 1 The Rider Waits (slate blue
  and violet): the horse stands head up, the near foreleg raised pawing, a tail of loose strands; he sits upright, the
  lantern hanging at his side (a sly wink, a one-fanged smirk); a small soulfire. 2 The Horse Rears (black, crimson
  lining, green fire): the horse rears on bent hind legs, forelegs folded, jaws open with the bit in the corner of the
  mouth, mane, tail and hooves burning; he leans back and raises the lantern high on a bent arm (carved brows, a
  saw-toothed grin), coat and capes torn, the cloak whipping back on its crimson lining, the soulfire twice as tall. 3
  The Nightmare (spectral green, bone): the horse dives into a leap, a horse SKULL for a head (deep jaw, hollow socket
  with a green eye, nasal notch, teeth), bone ribs, mane, tail and hooves of fire; he leans into the charge, swaps hands
  and thrusts the blazing lantern out AHEAD over the skull, his capes burnt to stubs with soulfire roaring off the
  shoulders, his cloak one sheet of soulfire. Pivots are per phase (`PIV` in `fx/horseman.jsx`).
- **Ability (ride, the Midnight Ride)**: every right answer gallops one stretch of the road; the 5th crosses the bridge
  for +3 and the road starts over (`cross`). He starts 2 lengths behind (`lead`); a miss lets him gain one (`close` at
  one length), a clean typed answer wins one back (2 at most); caught = thrown back to the start of the road (`caught`),
  never a heart or damage. Choices and slips hold the lead. Unique: TWO tracks, progress (the road) and a chase (the
  lead); a single miss never costs progress, only two misses with no clean typed answer between them, and recall is the escape. Art:
  `data-ab-ride` (`lg-ab-ride-close`: fire bursts from the lantern's shoulders and trails from the horse's eye); the
  fight moves `-horse` (holds EVERYTHING: horse, saddle and rider, so the rider stays seated and the reins on the bit),
  inside it `-legn/-legf` (near and far foreleg), `-mane` and `lg-horseman-body` (the whole rider, nesting -cloak (P1,
  P2) or -wingl/-wingr (P3), -leg (thigh and boot), -rider, -armr with -reins, -arml with -lantern, -shoulders, -flame);
  pivots per phase (fx/horseman.jsx `PIV`; rider parts in the rider's own units). Knockout: the forelegs buckle, the
  front drops, he lets go of the reins and is thrown out of the saddle (data-down holds it). Drawn by
  `.scratch/raid-kitsune/horseman/gen-v4.mjs`.
- **Tint**: the soulfire. **Card**: `lgFogCharge`. **Family**: Sleepy Hollow (Garden, Forest).
