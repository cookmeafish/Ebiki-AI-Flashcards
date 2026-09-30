# Legends art: how the assets are made

Read this BEFORE drawing any Legends art (a new motif, a redraw, "make more bosses"). It is the owner's art direction
plus the technical rules the app enforces. The files live in `public/assets/legends/` (`areas/<motif>.svg`,
`bosses/<motif>.svg`); `public/assets/legends/README.md` is the short version for anyone editing a file by hand.

## What the owner wants

- **Bosses look like real bosses.** Super detailed, ferocious, menacing: glowing eyes, fangs or a maw, claws, spikes,
  scars, armor, cracks of light. Never cute, never a smiley blob with teeth. A boss should read as a threat at 64 px
  on the map and still reward a close look at 190 px on its intro card.
- **Every boss and every banner is truly unique**, not "the same thing but slightly different". Vary the whole idea,
  not the colors:
  - silhouette and pose (a head bust, a full body, winged, a profile view, a creature rising out of something);
  - what is behind it (a spotlight cone, a storm cloud, a turning sun, smoke, a crystal halo), not the same round
    glow every time;
  - number and kind of eyes (two slits, a visor, six eyes, one burning eye in profile), mouth type (maw, beak,
    mandibles, carved grin, jaw of rock);
  - the entrance (see below).
- **Creative and super detailed**: layered shading (a dark side, a lit side), highlights, texture strokes (bark
  grooves, scales, fur tufts, window grids, rivets, stitches), small story props (toadstools, a hazard tag, an ankh,
  a tear on a mask, fireflies, sparks). Detail must stay readable when small: strong ink outline, clear shapes first.
- **Each banner (area map) is themed to match its boss**: it is the boss's lair, and the boss is present in it (eyes in
  the dark, a silhouette, the face carved into the cliff, a tentacle holding a wreck). A banner tells a small story:
  a path, a bridge, ruins, weather, something alive.
- **Each boss has its own animated entrance** (see Motion), and everything has some idle life.

## The boss recipe (what made the 2026-09 raid redesign land)

The first raid bosses were called "boring, uninspired and weak" (small figures in empty space, one neck, a boxy robot,
a skeleton in a robe, a lion like a house cat). The redesign got "YESS, much better". Every boss from now on is held
to this list, Legends bosses and raid bosses alike. `docs/raid-bosses-plan.md` is the worked example.

**Plan before drawing.** Write a short plan per boss first: the idea in one line, the backdrop, what each phase (or
the intro) shows, the idle motion, the SVG entrance beats and the card entrance. Make every boss's answers different.

**Size and presence**
- **Fill the frame and bleed past it.** Horns, fins, wings, fists, tentacles run off the edge (the 20% headroom
  shows them). A figure floating small in the middle of its box reads weak, whatever its detail.
- **Shoulders wider than the frame, seen from below**: the viewer looks UP at a boss. Low horizon, big upper body.
- **A backdrop that is part of the boss**, never a plain glow: a maelstrom it rises from, a gear halo, a rune circle,
  a burning spiky shockwave, a black hole's disk. It animates on its own rhythm.

**Faces sell menace** (check the face at 420 px first; a soft face ruins the whole boss)
- **Angry brows over the eyes**: a heavy brow ridge angled DOWN to the middle, or a V-shaped visor slit. Round eyes,
  or eyes with no brow, read friendly.
- **Slit or burning eyes with a glow halo** (the same shape bigger and bright behind it, 0.4 to 0.5), a slit pupil,
  and a tiny white hot spot.
- **Angular skulls, not round heads**: faceted planes, cel shaded (a `#000` shadow plane at 0.2 to 0.3 on one side, a
  lit plane at 0.3 on the other), cheek spikes, swept-back ridged horns, scale or plate texture on the crown.
- **Too many teeth**: long upper fangs past the lip, a row of small teeth, a dark maw with a tongue. The jaw moves.

**Materials read as materials**
- Metal gets rims, rivets, bolts and a lit edge line. Fists are gauntlets with knuckle plates, curled fingers and
  glowing seams, not boxes. A chain is interlocking LINKS (alternate a ring and an edge-on bar, ink under a light
  stroke), never stacked ellipses (they read as springs).
- Scales, fur, bone and robes get texture strokes, kept inside their shape (the overdraw rule).
- Wings are membranes with lit panels between bone struts and an ember or light edge; on a dark backdrop a dark
  wing disappears.

**Contrast against the backdrop.** Check every big shape against what is behind it in BOTH palettes. A dark
membrane on a dark sky, a translucent wraith over a busy rune circle, a storm cloud as dark as the night: all
vanished. Fix with a lit rim, a brighter mid-tone, or a glow copy behind.

**Every phase is a transformation with a story** (raids: phase 1, 2, 3; a Legends boss's rage too):
- Phase 1 controlled (sealed armor, one power shown). Phase 2 hurt and WORSE (armor cracks on molten veins, a cut
  neck grows two heads, the dead rise, many eyes open). Phase 3 the final form (a skull under the split helm, a
  plasma orb in the maw, a wraith hood framing the scene, a maw of spiral teeth), the colors run hot.
- A new element must READ at 120 px: big, bright, framed. A giant ghost face behind the figure only showed pale
  blobs at the edges; redrawn as a hood around the frame with eyes in the corners and claws reaching in, it worked.
- Nothing only "added": something breaks, grows, opens or turns on.

**Motion with character.** Every head, limb, flame and particle on its own rhythm. Each boss gets its own SVG
entrance beats (eyes igniting, jaws opening, fists slamming) AND its own card entrance in `ENTRANCES` whose
MOVEMENT no other boss uses (crushed flat then whipping up tall, three hydraulic jerks, a slow drift then a snap
up, three roars, a slit in reality tearing open).

**No hard edges from the frame.** Bands that span the width (a cloud layer, a floor) end in organic shapes inside
the headroom; a straight cut at the box edge shows as a rectangle when the boss scales in.

**Check at every size, both themes, every moment.** Render at 420 px (does the face scare?), 190 px (intro), 120 and
68 px (fight), per phase, in the entrance at a few moments and at rest. Then run `check-art.mjs`. Look, fix, repeat:
the second pass (sharper heads, real chains, a readable wraith, lit wings) is where "good" became "great".

## The current set (40 motifs)

The full list, one line per motif (boss, idea, entrance, lair), is `dev/legends-gallery/catalog.js`: the ONE place
that describes the set. Read it before adding a motif, and add the new motif's entry there. The first ten:

| Motif | Boss | Entrance (card motion, `ENTRANCES`) | Banner |
|---|---|---|---|
| forest | Elder Thornmaw: treant, thorn crown, ember eyes, splintered maw | bursts up out of the ground | Thornmaw Woods: path to the elder tree, fog, fireflies |
| city | Neon Tyrant: skyscraper war machine, scanning visor, furnace maw | glitches in like a broken screen | Neon Ruins: skyline, searchlights, rain, the Tyrant behind the towers |
| ocean | Abyssal Kraken: hooked tentacles, glowing lures, beak | surges up out of the water | Kraken Deep: storm, lighthouse, wreck in a tentacle, waves, whirlpool |
| mountains | Stone Colossus: crystal spines, magma veins, boulder fists | drops from the sky and slams | Colossus Pass: rope bridge over a burning chasm, the cliff is its face |
| lab | Specimen X: brain dome, too many eyes, bolts, slime | teleports in on a beam | Containment Breach: tanks, one shattered, alarm, eyes in the doorway |
| stage | Phantom Maestro: horned puppeteer, cracked mask, torn-curtain cape | spins in under the spotlight | Phantom Opera: curtains, chandelier, spotlights, audience, floating mask |
| sky | Storm Wyvern: lightning crest, wings like thunderheads | swoops down from the clouds | Stormspire Isles: floating islands, sky temple, the wyvern circling |
| desert | Sand Emperor: pharaoh scorpion, six eyes, venom sun on the tail | tunnels up out of the sand | The Sand Emperor's Tomb: pyramid, bones, a stinger in the dunes |
| volcano | Pyrewyrm: obsidian dragon in profile, fire torrent, lava pool | erupts out of the lava | Pyrewyrm Caldera: eruption, lava rivers, the dragon on the rim |
| ice | Glacier Warlord: yeti in ice armor, crystal ram horns, frost breath | freezes into being in a flash | The Glacier Throne: aurora, frozen lake, eyes in the ice cave |

The other thirty: swamp, castle, graveyard, jungle, space, clockwork, carnival, underworld, moonlit, fungal, pirate,
dojo, crystal, arcade, library, sewer, arena, hive, garden, sweets, savanna, mirror, manor, junkyard, dream, sakura,
mine, frontier, primeval, celestial (see the catalog).

**Every entrance is completely different.** The owner's rule: no two bosses may share a movement, not just a
keyframe name. A new entrance tells the boss's own story (a kitsune blinks left, right, then appears; a poltergeist
billows up like a sheet; a rex leans in head first and roars). Pick a pivot with `origin` when it matters.
When adding a motif, pick an idea none of the forty uses.

## Technical rules (enforced by `src/features/legends/art.test.js`)

- **Sizes**: boss `viewBox="0 0 120 120"` (square; shown 64 to 190 px). Banner `viewBox="0 0 400 140"`, shown on
  the map at 620 x 132 and cropped top and bottom (`slice`): only about **y 28 to y 112** is visible there, so the
  boss's presence, the focal point and the story props go in that band; the top and bottom 28 units are sky and
  ground that may be cut. (The gallery shows both the map crop and the whole drawing.)
- **Plain drawing only**: shapes, paths, groups. No `<script>`, `<style>`, `<image>`, `<use>`, `<a>`, `href`, event
  attributes, and **no `url(...)` at all**: so no gradients, patterns, filters, masks or clip paths. Depth comes from
  LAYERS: a shape, then a `#000` shape at `opacity` 0.15 to 0.3 for the shadow side, then a `#fff` or light shape at
  0.15 to 0.4 for the lit side, then a glow halo (the same shape bigger, bright color, `opacity` 0.3 to 0.45).
- **No `id` attributes**: a file is inlined many times on one page, and ids would collide.
- **Colors**: the app themes each area with `--lg-sky`, `--lg-far`, `--lg-near`, `--lg-deep`, `--lg-accent`,
  `--lg-light` (from the area's palette and light or dark mode). Use them for the BODY and the scenery, so one file
  fits every palette. EVERY `var()` needs a fallback: `fill="var(--lg-deep, #2e8b57)"`. Use `var(--lg-ink, #1d2230)`
  for outlines (the app does not set it, so it stays dark). Use FIXED colors for the signature details that must not
  change with the palette: glowing eyes, fire and lava, venom, teeth and bone, ice glints, neon. Check both themes:
  `--lg-light` is DARK in dark mode, so anything that must stay white (a lighthouse, a mask) uses a fixed color.
- **Outline style**: ink strokes 1.5 to 2.2 on big shapes, 0.6 to 1.2 on details, `stroke-linejoin="round"`.

## Motion

Motion is SVG animation inside the file. The app's sanitizer keeps only `<animateTransform>` and `<animateMotion>`
(`<animate>` and `<set>` are dropped), and drops `calcMode` (timing is linear; use `keyTimes` for pacing). So:
animate `translate`, `scale` and `rotate` only. There is no fade: hide something by scaling it to 0.02, or move it
far off the canvas (`translate 0 -200`).

- **`keyTimes` must have exactly as many entries as `values`, start at 0 and END AT 1.** Otherwise the browser ignores
  the whole animation silently (a list ending at `.46` left a boss's eyes shut forever). Tested.

- `class="lg-in"`: the ENTRANCE, played once when the boss appears on its intro card. `fill="freeze"`, start at
  `0s` so the hidden first frame shows at once, and finish on the resting pose. Typical beats: eyes open (scale Y
  0.05 to 1.3 to 1), jaw or maw opens (scale Y 0.2 to 1.25 to 1), limbs, wings, claws or tail swing into place (a
  rotate from far out, overshoot, settle), horns or crystals grow, fire or breath bursts. Start the main beats around
  55 to 70% of a 1.4 to 1.6 s run, so they land after the card's own motion.
- `class="lg-loop"`: IDLE life, `repeatCount="indefinite"`: breathing, blinking, swaying, flames, drips, bubbles,
  sparks, falling snow or pebbles, drifting fog, sweeping lights. Bosses AND banners have it. Banners have no `lg-in`.
- **The file's own attributes are the resting pose.** The app strips animation where motion is not wanted (small map
  icons, locked areas, reduced motion), and whatever remains must be the finished, fierce boss. Never rely on an
  animation to put a part in its place.
- **Scaling around a point**: animateTransform `scale` scales around (0,0). Wrap:
  `<g transform="translate(cx cy)"><g><animateTransform .../><g transform="translate(-cx -cy)">...</g></g></g>`,
  or draw the part around (0,0) inside `translate(cx cy)`. `rotate` takes its center in the values: `"20 60 64"`.
- **One animation per target.** An entrance and a loop on the same element fight; nest a `<g>` for the loop.
- **The card motion** (the whole boss moving in) is CSS in `BossArena.jsx`: `ENTRANCES[motif]` names a keyframe in
  its `CSS` block. It starts at `ENTRANCE.slam` and lands at `ENTRANCE.impact`, where the quake and shockwave hit.
  Every motif gets its own keyframe (tested: entrances are all different).

Where each mode plays (`art.jsx`, `animated` prop): the boss intro card = `'intro'` (entrance + loops); the fight
arena = `'idle'` (loops); the map's boss icons and the result screen = still; area banners on the map = `'idle'`.
Reduced motion or a locked area = still.

## How to make and check a new asset

1. Pick the idea (table above: make it different), sketch the layers from back to front: backdrop, back limbs,
   body, front armor and details, face, mouth, front limbs, particles.
2. Write the SVG by hand (the Write tool; never a shell heredoc, which mangles backslashes).
3. Add the motif name to `MOTIFS` in `src/features/legends/map.js`, and its entrance to `ENTRANCES` in
   `BossArena.jsx` (with a new `@keyframes` in the `CSS` block).
4. Look at it: render it in headless Chrome at a few moments (for example 300 ms, 1100 ms, 3000 ms), on a light
   and a dark palette. Look for: parts hidden behind others, anything invisible in dark mode, empty areas in a
   banner, anything that reads cute instead of fierce. Fix, and look again.
5. `npx vitest run src/features/legends` (the art test checks every rule above), then check the intro card in the
   app. Bump the version.

## Review gallery (where the owner looks at the set)

All Legends art is reviewed in ONE place: `npm run dev`, then open `http://localhost:3000/dev/legends-gallery/`
(`dev/legends-gallery/`, not part of the build). Every motif shows its real intro entrance (Replay), the idle boss,
the map icon, the locked icon, the banner at its true map size and the whole drawing, in light or dark and any
palette. Each card has Good / Change / Bad plus a note (kept in that browser); "Copy my feedback" copies the notes
to paste back. When the owner pastes feedback, fix exactly what it names, then re-check in the gallery.
