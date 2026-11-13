# Raid bosses: reference

What each raid boss IS. The bosses exist: art in `public/assets/legends/raids/<motif>.svg` (each file's leading
comment describes it), abilities in `src/features/legends/abilities/<motif>.js` (the module is the truth for numbers),
lore `lg_raidLore_<motif>`, voices in `raidVoices.js`. Progression order is `RAID_ORDER` in `raid.js`; the stored
index is into the append-only `RAID_ROSTER`. Numbers below are roster positions. Art direction: read
`docs/legends-art-guide.md` first.

A raid boss is the day's whole due stack in one fight, so it must look like a game's final boss (the first set was
"super boring, uninspired and weak": small figures lost in their frame; the fix was a BIG figure, not a fuller backdrop).

## Rules for all raid bosses

**The art rules are the RAID BOSSES section of `docs/legends-art-guide.md`** (the kitsune is the gold standard; it wins
over anything in this file). The per-boss sections below describe the drawings as they are, NOT a model to copy: the
2026-10-09 redesigns and the Headless Horseman were rejected (busy backgrounds, crammed detail, phases that changed the
scenery but not the character, broken phase 3s), and on 2026-10-11 the raid bosses went back to earlier art; some have
been redrawn since. Every past drawing is in the asset view's version picker.

- Depth without gradients, phase layers (`lg-p1`/`lg-p2`/`lg-p3`/`lg-p12`), one tinted part: the art guide's technical
  rules and RAID BOSSES section.
- **No ring or spiral maws** except the Leviathan's phase 3 (the one deliberate one); the Void keeps its spiral teeth.
- **Lore and a voice** for every boss (`raidLore.test.js`; rules: art guide "Raid boss voices"). A redesign updates
  both.
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
  (`docs/raid-powers-guide.md`); the last unlock needs the whole roster (`RAID_ORDER.length`, now 27), so adding a boss
  moves that ladder (and `PAST_UNLOCKS`).

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
  played from the Raid bosses tab, with the arena PINNED at the top by default (like a frozen spreadsheet row, flush
  under the app header, only the card, no dark band) so the boss stays on screen while scrolling the button rows; a Pin
  / Unpin button at the card's top right lets it scroll away, remembered per device (`ebiki-assets-arena-pinned`).

**Checklist for a new raid boss** (on top of the art rules above): profile in `raidProfiles.js` and a balance run;
ability module + `_triggers.js` rows + bestiary text; `fx/<motif>.jsx` for every fx key; `impact/bosses/<motif>.js` +
`.parts.jsx` (its impact style, assault and body moves) with all nine moments unique, including a themed knockout;
`ENTRANCES` entry; lore and a voice; then 10 QA passes (the art itself: the guide's RAID BOSSES process) over its
moments and knockout in the asset view (light and dark) before the owner looks.

## 1. Hydra: the Tide Hydra

- **Concept**: a many-headed sea serpent wrecking a harbor in a night storm, redesigned 2026-10-09 FROM THE HEADS OUT.
  One serpent body with SIX fixed neck roots, filled in order so any count 1 to 6 is a balanced fan: 1 the crowned King
  (centre, never cut), 2 the one-eyed Elder (left inner: scar, snapped horn, barbels), 3 the long-snouted Sly one (right
  inner: gold-banded horns), 4 the Sleepy one rising low out of the surf in front (lidded eyes, ram horns), 5 the Brute
  (left outer: iron jaw plate, tusks), 6 the hotheaded Young one (right outer: fanned frill, forked tongue). Shared:
  slate scales, red crest spikes, gold slit eyes under solid V brow ridges, faceted arrowhead skulls (small 3D meshes
  cel shaded by each phase's light, so a camera change turns every head with it). Slot k is the same head on the same
  root in every phase; a phase change never changes which heads are up.
- **Phases** (the live file is the 2026-10-09 drawing; the 2026-10-11 redo, dozing / striking / roaring, was rolled back
  with the other 10-11 redraws and is in the version picker): 1 the harbor at night, eye level, cold moonlight: a
  composed fan of heads, jaws shut, smug. 2 the harbor burns: a dutch angle, fire light from below, the King lunges down
  at you with jaws open while the others rear high and wide; a torn red sail of fins opens behind the necks. 3 the storm
  crown, from far below: the King towers in a crown crackling with the storm, every head turned on you with jaws open, a
  violet sail of fins spread like a crown with lightning in its veins, waterspouts, the belly seams charged. Every neck
  and stump grows out of a shoulder on the chest (`lg-hydra-root<k>`). Fight wrappers: `lg-hydra-king`,
  `lg-hydra-neck lg-hydra-n<k>`, `lg-hydra-coils`, `lg-hydra-root`. Generated by a script outside the repo; edit the SVG
  by hand.
- **Ability (heads)**: a right answer or blocked attack cuts a head; cutting the last one cauterizes for +2 and three
  heads stand again; a missed raid answer grows 2 (max 6). Art: `data-ab-heads` 1 to 6 shows slots 2..N, and every slot
  cut since the last burn shows its seared stump (`data-ab-top`: the most heads since the last burn; stumps are slots
  N+1..top). Grow bursts heads out of their stumps (`data-ab-regrew`), Cauterize burns every stump (`data-ab-burnt`).
- **Tint**: the lightning. **Card**: `lgHydraRise`.
- **Owner**: heads must differ in skull, size and face; sleek and angular, never round or rubbery; "built with the heads
  in mind" (2026-10-09).

## 2. Titan: the Forge Titan

- **Concept** (the owner's pick, version 584f9a5, refined; the 2026-10-11 kitsune-model redraw was rolled back): a
  hunched colossus of iron and bronze seen from below, a furnace for a heart, a gear halo turning behind it.
- **Phases** (each a moment): 1 chained to the forge floor, it hauls against its chains behind raised fists, the visor
  slit smouldering (one chain link already splitting). 2 the chains torn free, it rears up with both fists raised high
  to smash; its chest plate has burst open from inside, and in the furnace an EYE rolls to find you and blinks. 3 the
  smash lands: both fists driven into the forge floor, cracking it and spitting molten metal, and the impact splits its
  helm in two: no head inside, only a molten skull screaming fire.
- **Fight**: wrappers `lg-titan-head` (neck and helm), `-torso`, `-shoulders` (both pauldrons), `-armL`, `-armR`; pivots
  per phase in `fx/titan.jsx` (the fists are raised in phase 2 and planted in phase 3, so those phases have their own
  arm moves). Knockout: the head shudders, then lolls and sinks, the pauldrons drop, the fists fall slack, the boiler
  buckles.
- **Ability (plates)**: 2 plates; a clean typed answer cracks one; the last crack shatters them for +2 and leaves him
  exposed for the next 3 right answers (+1 each), then he forges new plates; a phase line re-forges cracked plates
  (never during an opening). Art: two riveted plates over the belly (`lg-ab-plates-*`), the molten core when exposed
  (`lg-ab-exposed-1`), `lg-fx-shatter` flares the visor.
- **Card**: `lgPowerUp`. **Owner**: not a boxy robot; not buried in a forge of machinery (2026-10-11).

## 3. Lich: the Lich of the Sunless Crypt

- **Concept**: a sorcerer-king bound to his phylactery, which sits at the center of every phase, before a crypt throne.
- **Phases**: 1 calm and cruel: cracked crown, grimoire, soulfire, chained souls. 2 the robe burns to a soulfire
  ribcage, two more arms, furious V brow. 3 a colossal soulfire wraith behind his true body, the same skull, ribcage
  open on the blazing phylactery, crown in floating pieces.
- **Ability (minions)**: every 3 raid answers he raises the earliest card answered right as a typed skeleton (inserted):
  destroyed = Bone Burst +3, escaped = he heals 2, no heart lost. Max 3 per attempt.
- **Card**: `lgLevitate`. **Owner**: not a skeleton in a robe.

## 4. Chimera: the Chimera Tyrant

- **Concept** (the live file is the colosseum drawing; the 2026-10-11 kitsune-model redraw, one beast with no
  background, was rolled back): a monstrous three-headed beast in a ruined colosseum of bones: a lion in the middle, a
  black goat on the right, a serpent-dragon tail on the left, bat wings, iron plates riveted into its flesh, a collar of
  chains, claws gripping skulls. The heads are the focal points (bright, sharp); colosseum, wings, spikes and collar sit
  darker; fire comes in a few masses out of what casts it (mouths, mane, the open chest).
- **Phases**: 1 the spell: crouched low and wide, head down between its pauldrons, paws forward on their skulls, wings
  folded tall at its sides like a cloak; the goat chants with its jaw dropped, lightning running from its mouth up to
  its horns and arcing between them; the serpent coiled at the lion's ear. 2 the fourth head: it rears up, one forepaw
  torn off its skull and raised, wings flung open, the goat's spell broken (cracked horns dripping fire, extra eyes
  open), the lion's jaw split to the ears; its chest tears open, the collar's chains snap and a FOURTH head forces its
  way out, bone fingers hooked over the torn rim, fire in its throat. 3 the true form: the flesh burns away to a
  ribcage and bone forelegs, the three heads bare skulls cracked and glowing from inside, the lion skull crowned in
  flame and breathing fire, the wings burnt to bone fingers with shreds of membrane, a coal heart glowing through the
  ribs.
- **Fight**: wrappers `lg-chimera-body` / `-lion` (the head: tilts and swells on its chin seam, pivot per phase in
  `fx/chimera.jsx`) > `-jaw` / `-goat` / `-serpent` / `-pawL` / `-pawR` / `-wingL` / `-wingR`. Knockout: three last
  roars (Lion, Goat, Serpent), then at 1400 ms all three drop and the body sinks.
- **Fallen heads (the REAL fight, not only the panel)**: with no aiming the Goat falls at the first phase line and the
  Lion at the second, so a normal P2 has the goat down and a normal P3 goat AND lion down. A falling head is struck down
  in the drawing (snaps back, slumps and hangs) while the other two rear in rage; a fallen head shows its
  `lg-ab-<head>-down-1` layer and loses its `lg-abh-<head>-down-1` parts. Judge every phase on those states too.
- **Ability (threeheads, decision)**: three head bars, Goat, Lion, Serpent in line (auto-aimed, tap to aim); overkill
  spills; a fallen head deals +1 and gives its boon (Lion +1 on clean typed, Goat's horn blocks the next lost heart and
  regrows at each phase line, Serpent +1 on every right answer).
- **Card**: `lgTripleRoar`. **Owner**: no generic tooth-ring maw; "too much going on" (2026-10-11: one clear beast).

## 5. Void: the Void Leviathan

- **Concept**: a mass of living night with ONE great eye, a black hole's burning disk behind, starry tentacles, a moon
  and a starship pulled into the disk.
- **Phases**: 1 the eye watches. 2 it sees you: body cracks on pink light, bloodshot eye, split pupil, the grin rips to
  the cheeks. 3 singularity: the pupil a black hole, the body splits into a maw of spiraling teeth, planets falling in.
- **Ability (horizon)**: right answers bank damage in the disk; the third banked strike collapses it for 1.5x; a miss
  spills it at 1x; it never holds a winning blow; left over at the end it collapses.
- **Card**: `lgRealityTear`. **Owner**: favorite concept; "void has too many eyes", so one eye in every phase.

## 6. Seraph: the Thousand-Eyed Judge

- **Concept** (redrawn 2026-10-10 to the kitsune model, P2/P3 horror pass and the sacred pass 2026-10-13; generator
  `.scratch/raid-kitsune/seraph/gen.mjs`, or edit the SVG): a bust, face on, NO background (only her wings and halo). A
  porcelain MASK-HELM (wide brow, brow ridges over ONE great red eye with a white star pupil, a fine gold inlay inside
  its edge, a single keel to a pointed chin, no mouth) inside a round ivory veil with a crimson lining, an iron crown
  with a red eye-gem, a high collar with a gold eye brooch, porcelain pauldrons, the crimson robe with gold trim, steel
  gauntlets with gold nails, eyed wings, a halo, the SCALES OF JUDGMENT (her ability is read on them).
- **Arms** (every phase; three reviews failed tube arms): ONE outline per arm from under its pauldron: full at the
  shoulder, slimming along the upper arm, turning at the elbow (a soft bone outside the bend, a crease inside, no disc
  and no corner), swelling below the elbow and tapering into a slim wrist with a gold cuff that follows the taper, then
  the hand. The scales stand on an upright fist: a visible gold post from the fist to the beam.
- **Phases**: 1 In Session: composed, held menace; she weighs you. Both elbows rest low at her sides (rose-crimson
  sleeves, a value step above the crimson robe) and both forearms rise across her robe, inside her outline: the left
  palm turned sideways below the pauldron, its eye a closed porcelain lid; the right fist holds the scales up level
  before her heart. The great eye heavy-lidded; ONE pair of lavender eyed wings stands folded tall and rises into a
  pointed ARCH over her head (a judge's throne vault); a thin gold halo turns slowly. 2 The Mask Breaks: the mask tears
  open down its keel like a jaw, its two halves swinging apart from the brow and working slowly open and shut; behind
  them no face, a crimson-black maw (`lg-seraph-maw`) with a column of eyes, the great eye glaring and one eye in the
  throat, three long ivory fangs on each lower half crossing the gap. Two too-long skeletal arms (`lg-seraph-bonearm`)
  rise from behind her shoulders and pry at the halo's rim (inside a second `lgs-halo` wrapper, so every halo move
  carries the hands). Her own arms are flung out at shoulder height: the left palm thrust out, its eye wide and red; the
  right thrusts the scales out, tipped hard to wrath. Blood-black robe, an ember-orange stole, every hem torn and
  burning; ash-dark wings flung wide, covered in eyes that open now and then; a red halo of four arcs. 3 The True Form:
  the mask halves, smaller, hang open from gold hinge rods at her circlet like shrine doors; where her face was is a
  mask-shaped void and in it one huge burning gold eye (iris torn, a second pupil budding) ringed by eight eyes of
  different sizes. SIX WINGS (the old pair raised, a second pair level behind her arms, a third sweeping down past her
  hips). The scales arm is an L (crimson upper arm out near level, a clear elbow, a gold vambrace rising), the scales
  (Mercy's white flame, Wrath's red) standing in clear dark space past the halo; the palm arm crosses low in front of
  her, the open hand at her belt, its eye blazing gold. A slim white gown with a gold eye-buckle belt, the crimson
  stole, gold pauldrons, the veil GOLD cloth, a plain gold circlet; lifted 9 units, she floats, motes rising.
- **Sacred, every phase**: an engraved halo band (glyphs between two fine rings, four gems, inside `lgs-halo`), a
  mandorla of light wedges behind her head (`lg-seraph-mandorla`), filigree inside the veil edge (`lg-seraph-filigree`),
  sigils on the stole (`lg-seraph-sigils`), a reliquary on the scales (`lg-seraph-reliquary`). P1 an icon in ivory and
  pale gold; P2 the same relic desecrated (band torn, glyphs red, the mandorla red and broken); P3 the brightest.
- **Fight**: the head (`lg-seraph-head`: veil, mask, crown) pivots at the NECK (60,100; phase 2 62.5,92; phase 3 60,90)
  and never translates on its own in any fight animation (check-joints). Her wings fill the frame from phase 2 on, so
  the fight swings them less (`--sp-wa` .35 in phase 2, .32 in phase 3; phase 3 halo swell `--sp-hs` .35). The scales
  group holds the FIST too and turns about the wrist, so block/sharpen never part them. Knocked out, the END pose of the
  knockout is held (check-ko-hold): the eye a closed lid drooping at its corners (a sagging curve read as a smile), the
  arms dropped, phase 3's scales arm sagging in; in phase 3 the wings sink a little (the shared turn stood them up like
  ears) and the halo swells less.
- **Ability (verdicts)**: questions cycle Wrath, Mercy, none (tag chip): Wrath right +2; Mercy miss costs no heart
  (still returns as an attack), Mercy right +1; a phase line shifts the cycle. Art: `lg-ab-verdict-wrath|mercy` (a red
  flame lit in the right pan or a white flame in the left; phase 3: that pan's flame roars tall); every verdict moves
  the REAL scales (`lgs-beam`, `lgs-panL`, `lgs-panR`: wrath slams them onto the flame, grace onto the feather, mercy
  swings them level), the wings, the eye (wrath: wide white-gold weeping light; mercy: shut; grace: gold) and the halo.
- **Tint**: the halo, every phase. **Card**: `lgHolyUnfold`.
- **Owner**: terrifying from phase 1; keep the spiky eyed-wing mass; no sword, no bulky robe.

## 7. Leviathan: the Drowned God

- **Concept**: a sea god so vast a harbor town grew on its back, in the maelstrom it churns.
- **Phases**: 1 the island wakes: an armored head breaches, the town and lighthouse on its crown. 2 the jaws gape on
  fangs, throat rings show, the town falls, tentacles rise. 3 jaws open into the spiral maw of fanged rings round a
  drowned eye (the one allowed ring maw), the maelstrom red.
- **Ability (current)**: current 0 to 3, starts at 1: right +1, miss -2; on the crest every right answer deals +1. Art:
  `data-ab-current`.
- **Tint**: the lighthouse beam. **Card**: `lgAbyssBreach`. **Owner**: phase 3 loved; earlier phases must read as a
  creature.

## 8. Inferno: the Cinder Sovereign

- **Concept** (the live file is the 2026-10-08 drawing; a 2026-10-11 redraw, a chained dragon-king rising off a slab,
  was not kept. The owner's verdict on this drawing still stands: "P1 and P2 the same chained crouch, a wall of orange
  where the character doesn't dominate"): a dragon-king of obsidian and magma coiled round a throne of swords stabbed
  into slag, a crown of molten spikes fused into its skull, wings like cathedral windows of fire, chains of glowing
  slag, before a molten river pouring from under a broken obsidian lip.
- **Phases** (the fire builds): 1 black scales with lava seams, jaws clenched on too many teeth, smoke from the
  nostrils, a few sword points burning. 2 the scales flake into embers on a molten body, the jaw drops on a furnace
  throat, fire pours from the eyes, the throne melts, the crown drips, every point burns. 3 true form: a skeleton of
  black bone in a firestorm, a ribcage furnace round a beating heart full of eyes, a skull of pure flame screaming above
  the bone skull (`lg-inferno-flameskull`), the wings burned to bone frames with fire for membranes.
- **Fight**: parts `lg-inferno-head`, `-jaw`, `-body`, `-arml`, `-armr`, `-wingl`, `-wingr`, `-throne`, `-river` (pivots
  in `impact/bosses/inferno.parts.jsx`). Its attack is fire breath: it rears back, lunges with the jaw gaping and roars
  while the breath crosses the card; the fallen pose is held after the knockout.
- **Ability (vent, decision)**: heat +1 per right answer, a miss cools 2; the Vent button (from 2 heat) deals heat - 1;
  at 4 it erupts for 3 by itself; left over at the end it vents. Art: `data-ab-heat`.
- **Card**: `lgFlareBurst`.

## 9. Chronos: the Hourglass Colossus

- **Concept** (redrawn 2026-10-10 to the kitsune model, same concept; the 2026-10-09 scene version was rejected: "a ton
  of details crammed... the background is overwhelming. Each phase is also not as impactful as kitsune"): a tight bust,
  the same framing in every phase, NO background, the face dominant. A big pocket-watch head (engraved bezel numerals,
  dial ticks, stem, knurled crown and bow ring) whose brows are its own hour hand (spade, viewer left) and minute hand
  (arrow, viewer right), set as brows just over each eye; the jaw is the lower dial (it opens in phase 2). A small calm
  hourglass in the chest (the Time Loop sand), steel gorget with the time gem, bell pauldrons ON the shoulders that turn
  with the arms (steel upper arm, cog elbow, brass vambrace, gauntlet), THE GREAT WINDING KEY in his left fist in every
  phase. Generator: `.scratch/raid-kitsune/chronos/gen.mjs`.
- **Phases** (HE transforms, not only the halo): 1 Time flows: midnight mantle, warm brass, a thin gold clock ring with
  two great hands at ten past ten; key upright, the other hand raised under a small floating hourglass; a curved,
  lopsided sly smirk. 2 Time breaks loose: a new STANCE, hunched with the head dropped and tilted, the key gripped in
  BOTH fists across his body; verdigris brass and a torn teal mantle blown up past his shoulders in two wings, teal
  light cracking from the cuirass seams, flank plates open on turning clockwork, a cracked pauldron; five great blades
  and three broken arcs; dial cracked, eyes blazing in dark sockets, brows a steep V, the jaw dropped onto fangs and a
  glowing throat. 3 The end of time: HIS BODY and POSE change: the key thrust high across the ring, the other arm swept
  out palm UP, white-gold brass, a cuirass flaring into a sun's pointed breastplate, the chest hourglass a glass of
  light, the mantle turned to sand pouring down in drips; one aura, a corona of ticking clock hands of light around his
  ring, longest at the sides; the key dark bronze, winding in his fist; sand falls off the upturned palm in a broken
  stream of grains; a DARK bronze dial with white-gold eyes, gold brows, a star of light on the hub (his power mark) and
  a glowing smirk. Its knockout: he crumbles into a heap of sand under his fading halo. The whole boss is drawn 15%
  larger than its units (the fight's pivots stay in drawing units).
- **Ability (loop)**: sand 0 to 3 (starts 1; +1 every 3rd right answer and each phase line); a miss with sand costs no
  heart and no attack, and the card loops back 2 questions later (right = Paradox +1, missed = one heart); sand past
  full = Time Stop, the next right answer doubles. Max 4 loops. Art: `data-ab-sand` (the sand level in the chest glass,
  every phase), `lg-ab-stop-1` (frost locks the glass and the stream), face layers `lg-fx-rewind` (swirl eyes, hands and
  seconds spinning back), `lg-fx-timestop` (frost eyes, hands stopped on 12), `lg-fx-paradox` (glitched eyes, the hands
  at two times at once), `lg-fx-overflow` (sand brims and pours down the cuirass).
- **The drawing acts every moment** (`fx/chronos.jsx`, shared shoulder/neck pivots, the key's fist per phase): head,
  brow hands, crown, jaw, torso, both arms and the key. Its blow drives the right arm at the camera while the key
  swings; the heavy blow hammers both arms down like a bell clapper; the knockout races the hands, stutters the head,
  topples the crown, drops the key and crumbles the hourglass body, held via `data-down`. Impact parts of its own:
  `chronosGlassBurst` and `chronosSandfall` (it shatters into sand).
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
- **Phases**: 1 on Olympus from below, thunderbolt raised. 2 he summons the colossal storm dragon from a rift. 3 he
  rides the dragon straight at the viewer, both facing us, a giant lightning sword raised.
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
  of the pauldron (a gold lame band across it), bends at a pointed elbow under a couter shaped to the bend, and the
  vambrace rises across his chest narrowing to a cuff no wider than the wrist (a rim of his light on top, its shadow on
  the cuirass); hand sizes follow the forearm (P3 palm about 0.75 of it); his left hangs, tapering to its elbow plate;
  the head tilts per phase. The cuirass has three lames with gold edges and rivets, engraved scrolls and a fleur, lit by
  his own crystal glow. His mirror fans hold ghosted reflections of his helm and face.
- **Phases** (the BODY changes, not only the aura): 1 the Vigil: head bowed into the gorget, one eye narrowed, his fist
  grips a mirror shard upright beside his face, the fans folded into two small panes, cyan glints. 2 Shattered:
  plum-crimson plate splitting; the right horn SNAPPED off with a burning break, the dome split with crystal forcing
  out, the left pauldron BURST into a crystal shoulder; he lunges (nearer, leaning); face shattered, teeth bared; fist
  raised, thumb across it; the fans flung wide red and cyan. 3 Thousand Reflections: risen into his corona (bust
  smaller, lifted), the horns become a swept crystal crown, the pauldrons grow crystal wings, white plate over a dark
  gorget, the white face in a dark visor frame against a dark field inside the gold ring; open palm with a big star of
  light; the white-gold corona. Generator: `.scratch/raid-kitsune/kaleido/gen.mjs` (edit it, not the SVG). Silhouettes
  (silhouettes.mjs): full 0.662 / 0.734 / 0.662, body-only (`--hide=.lg-kaleido-refl,.lg-kaleido-refr,.lg-kaleido-aura`)
  0.665 / 0.611 / 0.669, both PASS. Fight moments stay inside the arena clip (check-moment-clip 0): the helm punches by
  TILTING on its neck (it sits about 3 units under the top clip in P2/P3, so it never grows past 1.04), the mirror fans
  lean with a matching drop, and the P2 helm turns the other way (its intact horn rose on a clockwise turn). He ACTS in
  his strike and heavy blow (THROW in impact/bosses/kaleido.parts.jsx, shared with his ray attack so nothing restarts):
  rears back, the raised arm swings across him, the shoulders twist, the chest shears, the fans focus, and his own body
  moves (kaleidoThrow / kaleidoCleave) lunge the whole knight at the player; the heavy blow throws twice. His knockout
  lands ON him and holds: face dark and shattered (lg-kaleido-crack, the prism too), left horn broken off, crown knocked
  askew, fans folded away, P3 wings drooped, head bowed, arms fallen, his light dimmed. A shield save's ring starts at
  the chest prism, not his mouth. The P3 star of light is held in front of the open palm.
- **Ability (prism)**: each question shows a color chip (red, green, blue in shuffled blocks of three); collecting all
  three = Prism +2; a right answer on a color already held = Overcharge +1. Art: `lg-ab-prism-1/2` light the chest
  prism's facets; `lg-fx-shard` (a glint), `lg-fx-overcharge` (the prism red hot and cracking), `lg-fx-prism` (the prism
  blazes with colored rays). The overlays land on the chest prism (about 80% down the box), never on the face.
- **Hook classes**: `lg-kaleido-head`, `-chest`, `-pauldl`/`-pauldr` (viewer's left / right), `-armr` (the raised arm,
  viewer's left, pivot at the shoulder measured per phase), `-arml` (the hanging arm, viewer's right), `-refl`/`-refr`
  (the mirror fans, in phase 3 the corona halves), `lgfa-kaleido-eye` (the pupils).
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
- **Tint**: the wings. **Card**: `lgHiveRumble`. **Owner** (superseded 2026-10-10): the change is ON the character,
  never a new scene.

## 17. Gorgon: the Stone Gorgon

- **Concept**: a gorgon queen with a crown of serpents, a stone V brow, gold armor, cobra-head pauldrons and
  stone-feather wings, her lower body a scaled coil among the statues of her victims, in a ruined marble temple kept
  dark so she is the bright focal figure.
- **Phases**: 1 smug: she lifts the stone head of her last hero in her fist like a trophy, the other claw on her hip,
  while her gaze turns the hall to stone. 2 the reveal: she rears up, wings flaring, and wrenches her own cracked stone
  face open with both claws: inside there is no face, only a nest of snakes glaring out. 3 true form: her hair fused
  into one colossal coiled serpent behind her, her eyes rolled back blank, arms thrown wide, her jaw unhinged to her
  chest: the great slit-pupil eye stares out of her mouth.
- **Ability (mirror)**: every 4th raid question (3rd in phase 3) is her gaze (tag chip): right typed +3, by choice +2.
  Art: `data-ab-gaze`.
- **Card**: `lgSerpentRear`.

## 18. Banshee: the Drowned Organist

- **Concept** (redone 2026-10-10 on the kitsune model; the 2026-10-09 scene version was rejected: "hard to tell what is
  going on and too much background and phase 3 is just broken"): no background, one bust, face centered, the SAME
  framing in every phase; her own organ is her aura. ONE gaunt ghost woman seen face on: a long angular face (high
  cheekbones, hollow cheeks, sunken sockets with glowing eyes, two heavy V brows, blue-violet lips), long silver hair, a
  black lace mourning veil with a widow's peak, a silver tiara with a teardrop gem, a deep violet mourning gown with a
  lace V neckline, silver funeral lilies and a gem brooch, two cracked bronze bells hanging on chains from the tiara
  beside her face. Generator: `.scratch/raid-kitsune/banshee/gen.mjs` (or edit the SVG directly; the SVG is the source
  of truth).
- **Her mouth is a real, expressive human mouth, never a ring**: phase 1 a keening moan (lips parted, corners
  dragged down, a sliver of teeth), phase 2 a raging shriek (upper lip curled up, fangs top and bottom, nose folds),
  phase 3 the killing note (a wide open scream, both rows of teeth, the throat lit with her light). The jaw drops 2 to
  2.6 units; the skull never changes.
- **Phases** (the ONE silhouette tool, frame 0: full view P1-P2 0.637, P2-P3 0.716, P1-P3 0.584
  against the kitsune's 0.671 / 0.863 / 0.699; BODY ONLY with `--hide=.lg-banshee-pipes` 0.633 / 0.574 / 0.698 against
  her body pairs 0.626 / 0.591 / 0.700, tolerance 0.05): a hooded bust at her keys between two low pipe banks, a wide V
  of tall banks with the veil whipped out, a diagonal conductor's gesture in front of a tall facade. 1 THE DIRGE, teal
  and cyan: both bony hands arched on a full-width spectral keyboard, eyes half lidded and glowing; a low bank of three
  unlit pewter pipes behind each shoulder, tallest nearest her (flat tops, dark flue mouths), ghost notes drifting up
  from them. 2 THE WAIL, violet and acid green: she rips her right claw off the keys and flings it up beside her face on
  a long tapering forearm, shrieking (curled lip, fangs); the banks rise tall, swing open and shudder; the veil whips
  out to the lower corners; the gown rips at the shoulders and frays into short shreds; the bells swing hard. 3 REQUIEM,
  night blue and ice cyan, gold bells: she CONDUCTS the killing note in one diagonal gesture: her left arm thrown FULLY
  up, high above the hood, the hooked claw round a small sound orb, her right claw flung down at you; both arms are her
  BONES in the lavender of phases 1 and 2 (a short cap sleeve, a bony upper arm, a real elbow knob, a tapering ridged
  forearm, long hooked claws; white mannequin arms read as a robot, a half-raised arm read as waving), their value below
  the face; the face is the strongest of the three: pupilless blazing eyes in dark sockets under heavy brows, a wide
  shriek with long fangs and a faint cold light deep in the throat; a SLIM gown (sloped shoulders, narrow waist) that
  ends in a soft torn edge and pours into one long pale TAIL of ghost light curling to a point below her (the body
  carries the change; a row of dark points read as teeth, a wide robe as a poncho); the veil narrow behind her
  shoulders; her organ is a dim slate FACADE: four upright pipes a side, tallest at the outside, a short foot, a flue
  mouth CUT into each (dark slot, pale lip, a thin cold line of light), flat tops with a pale rim, low value and
  saturation so they sit behind her in the blur (flame tops, needle feet and capsule lights read as pencils). No scenery
  in any phase.
- **Fight motion keeps her together** (`fx/banshee.jsx`, check-joints 0, check-moment-clip 0): head and hair pivot on
  the same neck joint and the hair plays the head's animation in every moment; in phase 3 the jaw only flexes
  (`lgrBansheeP3Jaw*`) and each moment moves her arms its OWN way inside the clip (`lgrBansheeP3*`: the raised forearm
  `lg-banshee-foreR` bends at the elbow, the low arm swings at the shoulder); the knockout folds the raised forearm down
  across her chest, sinks both arms and shuts her mouth (`lg-banshee-shut`), held by `data-down`; in phase 2 the raised
  claw flinches, rears and sinks inside the clip (`lgrBansheeP2*`: the keyboard-pose swings threw it past the edge). The
  shared white hit flash lands on her chest, small, through the supported `style.flash` option (`impact/bosses/banshee.js`,
  read by the shared flash part; tested in impact.test.js). No colour bloom or white disc is laid over her
  in Wail or Shatter; her scream rings stop inside the arena. Knockout ring solid, not dashed.
- **Ability (scream)**: she screams at every phase line and after each miss (one pending); the next right answer
  shatters it for +2. Art: `lg-ab-scream-1` (the scream held: the mouth opens in phase 1, frost on her cheeks, streaks
  of cold sound hang from her mouth), `lg-fx-wail` (blazing eyes, bolts of sound), `lg-fx-shatter` (eyes squeezed shut,
  lips clamped, an ice crack across her face). Effects (`fx/banshee.jsx`): Wail = a VIOLET and GREEN sound shock (jagged
  pressure fronts sweeping from her mouth corners to the edges, green/violet waveforms, the choir flung at you, glowing
  green); Shatter = WHITE and ICE BLUE glass (frost needles from every corner, two bars of ice beside her mouth, a crack
  web in the outer ring of the arena, shards falling beside her, a flatline). Knockout: the song ends: her sound rings
  collapse back into her, her LAST NOTE slips from her lips and thins away past her veil (`bansheeLastNote`), her ghost
  light comes apart in rising motes (`bansheeMotes`) and her pipes shudder and sink silent (`lg-banshee-pipes`, held by
  `data-down`). No water (the owner dropped the flood theme). Entrance (the drawing): her pipes grow up behind her, her
  head lifts from a bow, her hands come down on the keys, her eyes snap open.
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
- **Ability (sleep)**: asleep, right answers sink it deeper (1 to 3); the next right at full depth = Nightmare +3; a
  miss wakes it; awake, 2 right in a row = Lullaby +2 and it sleeps again. Its idle sleep drift is the one persistent
  idle reaction. Art: `data-ab-asleep`.
- **Card**: `lgEldritchUnfold`.

## 21. Moonmaw: the Lunar Strix

- **Concept**: the night sky is a colossal horned owl and the MOON is its face (craters, a V brow of night). A silent,
  patient, cold predator in every phase.
- **Phases**: 1 Full Moon: perched, wings folded, heavy-lidded, a moon halo. 2 Blood Moon: threat display, wings flung
  up, fanged beak hissing, the halo shattered. 3 Total Eclipse: wings raised in a tall V, a black moon in a blazing
  corona, talons reaching at you.
- **Ability (moons)**: every 3rd clean typed answer flings a moon that crashes 2 raid answers later for 2, even on a
  miss; moons still orbiting at the end crash at once. Art: `lg-ab-orbit-1|2`.
- **Tint**: the halo / corona. **Card**: `lgMoonrise`.
- **Owner**: "love the idea of a MOON boss" but not a pale Void copy; an owl, which nothing else is.

## 22. Kitsune: the Nine-Tailed Empress

- **Concept**: the Legends Sakura ascended, built from `bosses/sakura.svg`'s face: a fine white fox face, red markings,
  a bell on a red cord, a layered kimono collar. The gold standard of quality.
- **Phases** (each a different woman, silhouette and palette): 1 Courtly: wink, closed fan at her lips, neat fan of pink
  tails. 2 Unveiled: the mask cracks off, amber slits, fanged grin, hair and tails flung wide in a radial fan of
  crimson tails tipped in violet foxfire, and her arms come up in a summoning pose, in phase 1's fitted purple sleeve
  (same shade, blossoms and pink cuff with gold trim; the owner: phase 1's sleeve is "hugged to her arm", so no
  hanging drapes): elbows out at shoulder height, forearms angled in and up, each clawed hand (thumb included) beside
  her jaw raising a tall crimson foxfire that leans away from her face, the two arms not mirrors; the lower tails
  show at the sides (2026-10-11: the old sleeves were flat-topped tubes with no arm in them, then straight upright
  forearms read as two candles; the owner asked for them fixed, not removed).
  3 Celestial Kyubi: a corona of nine white-gold tails, a shimenawa halo, eyes of light, a third eye. Every tail of
  phases 2 and 3 ends inside the headroom (2026-10-11: they were sliced flat at the frame's edge; the corona was
  re-angled to fit).
- **Head and knockout** (2026-10-11): her head and hair pivot on the chin seam (60 81), so every fight move tilts the
  head on the neck (`check-joints.mjs` STRICT). The knockout has no spin: frozen on the blow, lifted and trembling in a
  ring of foxfire, her spirit tears out above her ears as she drops, her face falls (eyes shut, a tear, a frown).
- **Ability (rally)**: every right answer returns her star ball; the 4th in a row = Starfall +3; a miss resets. Art:
  `data-ab-rally`.
- **Card**: `lgPetalFall`. **Owner**: "go all out" while staying beautiful.

## 23. Ophanim: the Wheel of Eyes

- **Concept**: a biblically accurate angel, a second take beside the Seraph: one porcelain eyeball inside wheel after
  wheel of rose-gold and copper packed with eyes, parchment-feather wings, a tiny pilgrim for scale. Serene, never
  angry. Painted (`REALISTIC_ART`), with an experimental photo layer (`lg-photo-*` groups filled by art.jsx sprites).
- **Phases**: 1 folded: a cocoon of wings, feather lids, nearly every eye shut. 2 unfolding: wings open, more wheels,
  eyes everywhere, gaze eyes beam. 3 heaven blinding gold, colossal burning wheels, every eye open.
- **Ability (grace)**: open eyes needed = 2, 4, 6 by phase; a right answer lights one, a miss darkens one; all lit =
  Grace (a lost heart back, once per phase) or else a Holy Beam for phase + 1. Art: `lg-ab-lit-1..6`.
- **Tint**: the small eyes' irises. **Card**: `lgGyroAlign`. **Owner**: "the craziest raid boss ever", no scroll.
- **The great eye panics as health drops** (owner): phase 1 still (folded shut), phase 2 a SLOW look-around (16s loop,
  4 long holds), phase 3 RAPID darting (13s loop, 10 darts). Keep that escalation if the eye is ever redone.

## 24. Ratking: the Sewer Kingpin

- **Concept**: the raid form of the sewer's smug Rat King (`bosses/sewer.svg`). One head in all three phases: a
  long-snouted wedge rat skull (round thin ears, the right one torn with gold hoops, a pink nose at the snout's tip), a
  dark blaze down the brow, a stitched scar over the right eye, a gold grill with two great buck teeth (a diamond in
  one, the other chipped), the crown. Smug in EVERY phase.
- **Phases**: 1 holding court, hunched on his coin throne before the emerald vault, gold shades pushed down the snout,
  one brow cocked, cigar in the grin, a claw on the rat-skull scepter; two henchmen on the hoard fan him. 2 High Roller:
  neon casino, three-quarter lean over the felt, a royal flush, shoving chips, a roulette wheel turning behind his head
  like a halo (the felt and its chip stacks sit OUTSIDE his breathing group: "the green table should not move"). Phases
  1 and 2 predate the kitsune rules and keep their scenery. 3 The Hoard God (2026-10-11, round 15; earlier versions were
  rejected for yellow eyes, tiny shades on the snout, gold lines across the face, a box fist, coin-wave and throne
  scenery, and "a different character"): phase 1's own grey rat and face at phase 1's size (purple-black shades with a
  white glint, eyes burning white hot with no glow ring, the grill grin and cigar, gold flecks in his fur); the change
  is ON him: a red coronation mantle edged in ermine spreads to the lower corners (his new outline), coat and sleeves
  turn antique gold, a red sash across his chest carries his four biggest coins (the hoard states), a grander crown. The
  near paw rests on the vest; the other is raised holding the crown coin (thumb across it) as a white-hot burst breaks
  from it (`lg-ratking-burst`, the brightest thing) and coins fly out (`lg-ratking-spray`). His world: dim gold coin
  stacks behind his shoulders in a rounded hump at each side (loose coin towers read as brown boxes). No henchmen.
- **Fight** (`fx/ratking.jsx`): in phase 3 his power attacks (the burst flares, the paw thrusts the coin,
  `lgrRkThrustP3`/`lgrRkThrustHeavyP3`, the spray fires at the hearts and refills, the crown jolts); a crit snuffs the
  burst. The head never moves on its own in phase 3: every reaction moves `lg-ratking-figure` (pivot at his hem), the
  vest-resting arm (`lg-ratking-arml`) only sways; at the knockout the hoard stays put, he slumps, burst and spray go
  dark and the crown tumbles off to his left onto his chest. Every part holds its fallen pose (`data-down`, all phases);
  every fight move stays inside the box (check-moment-clip 0). Source: `.scratch/raid-kitsune/ratking/build12.mjs`
  (keeps phases 1 and 2 byte-identical).
- **Ability (hoard, decision)**: a right answer takes a coin, a miss loses one; Cheese Bomb (3 coins) deals 3; Lucky
  Tail (2 coins) saves the next heart; at 5 coins the rats throw a bomb for you. Art: `lg-ab-hoard-0..2`.
- **Tint**: the red velvet. **Card**: `lgCoinToss`.
- **Owner**: keep the Sewer vibe, "just as epic and cool and smug"; big face in every phase, never zoomed out.

## 25. Sugarqueen: the Sugarplum Tyrant

- **Concept**: a glamorous, beautiful candy empress (porcelain face, short pink bob with a soft-serve knot, chocolate
  corset, lace gloves) in front of a muted dusk palace that never outshines her.
- **Phases**: 1 the Empress on her heart throne, scepter raised. 2 Spoiled Tantrum: losing, she throws a fit on a round
  cake tier seen from below, one arm cocked overhead with the scepter as if to throw it, the other hurling candies that
  grow as they fly at you; crown askew, furious red eyes, a cartoon yell (no fangs), sugar-drop tears. 3 the Sugar
  Empress: close from below, sugar-glass crown, lollipop halo, rock-candy wings, the jar grown into a heart jewel; she
  casts a love spell (heart irises, slow loving blinks, heart motes drifting at you).
- **Ability (sugarrush)**: every right answer adds a cube; the 3rd starts a rush for the next 2 answers (+2 each right);
  a miss crashes it. Art: `data-ab-rush`.
- **Card**: `lgSugarDrop`. **Owner**: "make her beautiful", short hair, close shots, all-ages coverage.

## 26. Showman: the Infernal Impresario

- **Concept** (REDESIGNED 2026-10-11 after "the showman looks like a weakling and every phase is too similar. make this
  guy look like a bigger threat and also what if the masks were scary and rotated on and off his face the both of them
  on phase 2"; generator .scratch/raid-kitsune/showman/v2/gen.mjs): a demon ringmaster whose act is real magic, now a
  BIG man: the face drawn 1.45 to 1.5 times the old size with a heavy scowl and narrow glowing slit eyes, the torso
  1.15 to 1.3 times broader (shoulders past the frame). The anchor stays: handlebar moustache, chin tuft, slick hair,
  navy tailcoat, gold epaulettes and frogging, ember cravat, white gloves (now taloned). Comedy and Tragedy are SCARY:
  hollow black eyes with a pinprick of light; Comedy a cracked gilt maniac grin of jagged teeth, Tragedy cracked
  porcelain weeping black, a gaping maw of broken teeth. No background: only his aura (ring, violet mantle, fire wings).
- **Phases** (one sentence each, a different MOMENT, pose and silhouette): 1 the Ringmaster (green ghost fire): upright
  under an extra-tall top hat, a fitted coat tapering from broad shoulders, a cold closed sneer over one fang; he
  PRESENTS Comedy floating over his raised palm and plants his skull-knob cane wide, Tragedy hovering above the knob; no
  horns yet; a slow proud breath. 2 the Possession (violet): the whole figure pitched forward in a lunge, shoulders
  hauled up into a hunch, head sunk low, hat askew, the face split (his half smirking, the demon half torn open on a
  fang), no horns yet, clawed gloves raised low and wide at the viewer, a violet mantle of fire behind; the masks TAKE
  TURNS OVER HIS FACE (10 s loop: Comedy swings up rolling a quarter turn and edge-on, covers his face full size
  UPRIGHT, holds, swings back, then Tragedy from the other side; his true face only between them); quick heaving
  breaths. 3 the Unmasking (crimson and gold, the biggest; edited 2026-10-14): HE PEELS HIS OWN SKIN OFF, caught
  mid-way: his clawed right glove, talons sunk in at the temple, drags his human face (phase 1's) off, torn and
  stretched toward the glove, still anchored to his jaw by a raw band, the demon's eye glowing through its empty eye
  hole; under it the red devil (horns, crown of fire, gold brow gem, fangs, blazing eyes) grins. The left hand raises a
  hellfire orb over Comedy on his shoulder; two fire wings behind. The skin is phase 3's Tragedy slot
  (`lg-showman-tragedy`, inside the right arm, pivot at the grip); in fights the head and the right arm play the same
  move about his neck, so the glove never lets go, and on his own attack he YANKS, tearing the skin further.
- **Fight**: phase 3's raised arms only jolt a few degrees; phase 2's parry and shield arcs and phase 1/2 knockout falls
  are their own (`fx/showman.jsx`). Knockout (phase 3): the raised arms and the skin fade, the drawn fallen pose
  (`lg-showman-armsfallen`: limp arms, open gloves, Comedy upside down and cracked, Tragedy tipped over) fades in,
  lifted a little (`lg-showman-stage`) to clear the DEFEATED tag, held by `data-down` (check-ko-hold).
- **Ability (encore)**: right answers win applause, the 4th = Encore +3; misses shed tears, the 2nd tear is a Plot Twist
  leaving the applause one short of an Encore. Art: `lg-ab-comedy`, `lg-ab-tragedy`, `lgfa-showman-comedy`, the tear and
  twist effects INSIDE the masks (`lg-fx-tear` + `lgfa-showman-tear` in Tragedy, `lg-fx-twist` glow round both; nothing
  over his face); the fight moves `lg-showman-arml/-armr/-head/-comedy/-tragedy/-fan` (his ring) `/-shadow` (his horns)
  `/-fire/-sigil` (his brow brand) (pivots per phase in `fx/showman.jsx`): the horns lunge and recoil, the fire roars,
  gutters and dies, the brand flares.
- **Tint**: the ember silk cravat. **Card**: `lgCurtainPart`. **Owner**: masks are the core of his act; "make him a
  villain who owns the stage, not a pretty boy".

## 27. Cerberus: the Hound of the Last Gate

- **Concept** (FULL REDESIGN 2026-10-13; generator `.scratch/cerberus-redesign/tools/gen2.mjs`, outside the build): a
  hellish three-headed war-mastiff, ONE charred body, hellfire behind him as his aura (`lg-cerberus-portal`, the tinted
  part). Three hound heads of one construction (a heavy muzzle, black nose, hanging flews, a hinged lower jaw, ears
  swept back): the WARDEN in the middle (iron plates riveted on his brows, a spiked strap across his muzzle), BRAND on
  the left (a burning mane, molten cracks, torn ear, broken fang), SHADE on the right (smoke-black, one milky blind eye
  under claw scars). ONE ANCHOR: the same body and the same three heads at the same size in every phase. Never goofy.
- **Phases**: 1 chained at the gate: a low wide crouch, forelegs braced, chains taut to the anchors; the Warden stares,
  Brand snarls, blind Shade sniffs the ground. 2 he breaks loose: reared up on his hind legs, forepaws raised claws out,
  the chains snapping off the collars, the three heads howling in a fan. 3 he is the gate: lunging low, his chest split
  open like iron gate doors onto the burning underworld, skull souls clawing at the bars, the heads flanking it jaws
  wide, the serpent tail rearing over his back. No whole-figure idle motion: life is in the parts.
- **Fight**: his own body moves (`impact/bosses/cerberus.js` `body`, from the bottom centre): a crit knocks him back, a
  strike or heavy blow is a lunge or pounce with the heads snapping in sequence (`fx/cerberus.jsx`), a block a braced
  crouch. Each head group turns about its neck ROOT and each head about its collar join (`ROOTS` / `NECKS` per phase in
  `fx/cerberus.jsx`), so a head never leaves its neck. Knocked out: the side heads flop inward onto the Warden, the
  Warden's head drops sideways, the body squashes onto its keel (`KO_FALL` / `KO_SLUMP` / `KO_SINK`), every power goes
  out (`lg-cerberus-power`), every head's lids shut, the aura gutters (`lg-cerberus-portal`); `data-down` holds it.
- **Ability (shackles)**: Fire head chained by any right answer, Iron by a clean typed answer, Shadow by the first right
  answer after a miss or a blocked attack; one answer chains one head; all three = Bound +4, then they tear free; a miss
  frees the Fire head. Art: `data-ab-fire|iron|shadow` (`lg-ab-<head>-1`: a chain muzzle of red-hot, padlocked or
  smoke links, an open jaw shut; `lg-fx-bound` squeezed eyes, `lg-fx-snap` Brand's eyes blaze); the fight moves
  `lgfa-cerberus-<head>` (each a whole neck and head), the key, `lg-cerberus-pawl/-pawr/-chainl/-chainr`.
- **Tint**: the hellfire aura. **Card**: `lgHoundPace`. **Owner**: "GOES ALL THE WAY OUT", clearly not the Legends
  Cerberus.

## 28. Horseman: the Headless Horseman

- **Concept**: the rider of Sleepy Hollow on a black horse, ONE character, no scenery: green soulfire (the tinted part)
  burning out of the empty neck inside a low wide collar, a frock coat under a short tier of coachman's capes, a
  knotted cravat, a crimson waistcoat, black gauntlets, and his own head carved into a grinning jack-o'-lantern
  hanging below his fist. The lantern and the soulfire are his face. Silent, patient, theatrical: the lantern does the
  grinning. A hushed campfire storyteller's voice ("Listen close, rider").
- **Phases** (the owner rejected a rider bust: "there is no full horse ... all 3 phases are basically the exact same";
  the live file is round 9, generator `.scratch/raid-kitsune/horseman/gen-v4.mjs`). NO background. Horse and rider are
  ONE figure: the WHOLE horse in profile facing left (real leg segments: forearm, knee, cannon, fetlock, pastern and a
  hoof wider than the cannon in front; gaskin and a sharp hock behind; two-value cel shading), the headless rider in the
  saddle turned toward us (a frock coat in four values, broad sloped shoulders tapering straight into a belted waist, a
  rim light and wide lapels a value lighter than the coat with a dark notch and gold piping, flapped pockets, a
  gold-piped hem, hips in the saddle, thigh and tall boot down the flank, one short tier of capes, a LOW wide collar
  round the empty neck with flared points on a crimson lining and a dark opening, a waistcoat and knotted cravat, riding
  boots with a narrow ankle, a curved instep, a toe cap (P3 heel down, spur pointing back), a curved heel and a spur on
  its neck, set in an arched stirrup iron; a large built horse head with a darker muzzle, cheek plane, lips and a
  scowling brow, three values on the body; arms leaving from under the capes with a tapered upper arm, a bent elbow, a
  forearm tapering to the cuff and a gripping gauntleted hand): one hand holds the reins, the other the lantern by the
  top of its bail. A different POSE and body every phase (silhouettes.mjs: 0.47 / 0.45 / 0.56 against the kitsune's 0.67
  / 0.86 / 0.70; body-only with `--hide=.lg-horseman-fire, .lg-horseman-flame, .lg-horseman-wingl, .lg-horseman-wingr`
  0.45 / 0.40 / 0.49 against her 0.63 / 0.59 / 0.70): 1 The Rider Waits (slate blue and violet): the horse stands head
  up, the near foreleg raised pawing, a tail of loose strands; he sits upright, the lantern hanging at his side (a sly
  wink, a one-fanged smirk); a small soulfire. 2 The Horse Rears (black, crimson lining, green fire): the horse rears on
  bent hind legs, forelegs folded, jaws open with the bit in the corner of the mouth, mane, tail and hooves burning; he
  hauls the reins up and holds the lantern out and up at his side (carved brows, a saw-toothed grin), coat and capes
  torn, the cloak fastened at both shoulders and streaming back on its crimson lining, the soulfire twice as tall. 3 The
  Nightmare (spectral green, bone): the horse dives into a leap, a horse SKULL for a head (deep jaw, hollow socket with
  a green eye, nasal notch, teeth), bone ribs, mane, tail and hooves of fire; he leans into the charge, swaps hands and
  raises the blazing lantern high AHEAD of him, clear above the skull, his capes burnt to stubs with soulfire roaring
  off the shoulders, his other hand on his hip (no reins), his cloak one sheet of soulfire, hooves of fire. Pivots are
  per phase (`PIV` in `fx/horseman.jsx`).
- **Ability (ride, the Midnight Ride)**: every right answer gallops one stretch of the road; the 5th crosses the bridge
  for +3 and the road starts over (`cross`). He starts 2 lengths behind (`lead`); a miss lets him gain one (`close` at
  one length), a clean typed answer wins one back (2 at most); caught = thrown back to the start of the road (`caught`),
  never a heart or damage. Choices and slips hold the lead. Unique: TWO tracks, progress (the road) and a chase (the
  lead); a single miss never costs progress, only two misses with no clean typed answer between them, and recall is the
  escape. Art: `data-ab-ride` (`lg-ab-ride-close`: fire bursts from the lantern and the horse's eye); the fight moves
  `-horse` (holds EVERYTHING: horse, saddle and rider, so the rider stays seated and the reins on the bit), inside it
  `-legn/-legf` (near and far foreleg), `-legh/-leghf` (hind legs), `-mane` and `lg-horseman-body` (the whole rider,
  nesting -cloak (P1, P2) or -wingl/-wingr (P3), -leg (thigh and boot), -rider, -armr with -reins, -arml with -lantern
  (a second -arml group draws the lantern, the forearm running into the fist and the hand in front of the capes),
  -shoulders with -collar, -flame); pivots per phase (fx/horseman.jsx `PIV`; rider parts in the rider's own units).
  Knockout: a visible fall BEFORE the DEFEATED plate (the horse rears and tips from about 8% of the cinematic, the rider
  slides off from 18%, down by about 48%): the forelegs fold under and the horse kneels (P3's nightmare folds its
  forelegs flat under its chest, hind legs under the rump), he lets go of the reins, is thrown BACK out of the saddle
  and lands SITTING on the ground at the right, a clear gap from the horse, while the horse lies down smaller at the
  left (scale 0.64) with its head (P1 head, P3 skull) at the far left, never behind him or on his empty collar, so the
  greyed end card reads "a headless rider and his horse"; legs out, arms limp, the soulfire a wisp, his torso and empty
  collar above the DEFEATED tag (the `unhorsed` body move in impact/body.js only settles a few px). His lantern head
  slips from his fist, falls ahead of him and lands at the knockout part's spot (6%, 84% of the box) at 46.2% of the
  knockout, where `horsemanShatter` breaks it open; the drawn lantern is last seen one frame before the halves appear
  (per phase `lgrHorseKoBody1..3` / `lgrHorseKoHorse1..3` / `lgrHorseKoLegs1..3` / `lgrHorseKoHind1..3` /
  `lgrHorseKoLantern1..3`, `lgrHorseKoSit`; `KO_END`/`KO_HORSE`/`KO_LEGS` hold the pose under data-down). Every move
  stays inside the arena's inset(-20%) clip (check-moment-clip 0): the drawing stays big and the MOVES are sized instead
  (the `...7` keyframes: rears and tosses of a few degrees, no scaling of the horse, the soulfire flaring without
  towering). His strike is one throw per phase (`lgrHorseThrow1..3` + `lgrHorseFly1..3`; the lantern stays below or
  beside the fist, so the fist never covers the carved face): P1 swings it out to the side and hurls it DOWN and forward
  over the horse's flank toward your hearts, P2 thrusts it out and down from the raised fist into the space in front of
  the cloak, P3 flings it up and out over his head, clear of the skull; each throw grows a little and fades before the
  clip edge, then the lantern reappears in the hand. The heavy blow flails low (P1), hoists it high over the shoulder
  (P2) or raises and smashes it (P3), the lantern counter-swinging on its bail (`lgrHorseHang1..3`).
- **Ability moments and idle**: `gallop` the horse tosses its head and paws (`lgrHorseNod`, `lgrHorsePaw`) while burning
  hoofprints stamp toward the bridge; `cross` a covered bridge thunders up out of the bottom of the card
  (`lgrHorsemanBridge` in `fx/horseman.jsx`) and his fire blows back off it. Idle lives in the parts: the horse blinks,
  mane and tail sway, the lantern sways on its bail and its carved eyes gutter, each fire flickers. (The 2026-10-11
  walking and galloping idles, the walking phase 2 and the bridge drawn into the SVG were rolled back with that
  version.)
- **Tint**: the soulfire. **Card**: `lgFogCharge`. **Family**: Sleepy Hollow (Garden, Forest).
