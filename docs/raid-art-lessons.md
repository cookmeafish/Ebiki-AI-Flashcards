# Raid and Legends art: past mistakes and what they taught

The vision and the rules are in `docs/legends-art-guide.md` (raid bosses) and CLAUDE.md "RAID BOSS CHECKMARKS". This
file keeps the concrete cases behind them, one line each, so a rule can be traced to what went wrong. Read the guide
first; come here when a rule needs an example.

## Anatomy and broken parts
- Rat King P3 shipped with yellow eyes plus a tiny pair of shades on its snout, gold lines across its face, box hands
  and floating parts: every feature where it belongs, once.
- Cerberus P3 had a hole between its necks and floating heads that every self-check passed: hence the HOLES map.
- One pass of six bosses had tube arms, sticks on balls and fists with no forearm: hence the ARM check (name every part).
- Kitsune P3 shipped two floating flames over her ears and unexplained dangling zigzags: every element nameable.
- Hydra P2 showed a bare red triangle for a mouth.
- Kitsune P2 foxfire floated above her hands: "doesn't look like its coming out of the hands".
- A kitsune head shifted off her neck in 40 fight animations: hence the JOINT check at the chin seam.
- A Horseman's lantern and horse muzzle were sliced flat in fight frames: hence `check-moment-clip.mjs`.
- The Showman's arms, head and masks snapped back to idle when the knockout ended; the Horseman sank off the compact
  card: hence `check-ko-hold.mjs`.
- Banshee pipe caps and the Titan's top were sliced flat by the frame: hence the raid `clip` check.
- Chronos: an arm is upper arm, elbow, vambrace, gauntlet, the bell ON the shoulder turning with the arm; a hand always
  does something.
- Showman: arms are one limb (shoulder to glove); masks are thick carved artifacts HELD in the hand, never pasted on.
- Mirror Knight (kaleido): arms are plate, never a tube with a ball joint.
- Cerberus: every neck roots into the shared shoulders or it reads as several animals; a neck is longer than it is wide.
- Zeus (tempest): a rider sits BEHIND the mount's head in profile, thigh along the neck, one hand gripping.
- Headless Horseman: a horse reads in profile or three-quarter, never head-on; a lantern hangs BELOW the forearm.
- Hydra: tapered skulls on waisted necks; built from the heads out (fixed neck roots, same head on the same root each
  phase, a stump where a head was cut).
- Seraph: white hands vanished on white wings.

## Same character
- Rat King P3 failed twice as "a different character": first a new head, then the same head on a bodybuilder's body.
  It had passed close-up renders, a review and the coordinator, and failed the moment the owner opened the asset view:
  hence "judge it on the owner-view panel".
- A gold statue Rat King true form read as "a gold cat statue": a true form never replaces the character.
- Chronos: the head-to-body ratio never changes; a signature prop (the winding key) runs through all phases.
- Sugar queen: hair keeps one identity (may whip, never grow).
- Rat King: a rat is a wedge (long snout, nose at the tip, high round ears); a round head and short muzzle read as a cat.

## Phase feel and significant change
- Cerberus: the same three heads in a row and the same stance each phase, only the fire colour and a crown changing:
  "YOUR BIGGEST FLAW RIGHT NOW IS MAKING EVERY PHASE BORING AND THE SAME ... THE SAME THING BUT DIFFERENT FIRE COLOR
  BASICALLY AND MAYBE A BIGGER CROWN". The heads must change ARRANGEMENT, not only what they wear.
- Rat King P3 kept P1's smirk and raised coin hand: P1 and P3 must differ as much as any pair.
- Showman with the same bust, hat, coat and pose each phase: "they are too similar in each phase", "it needs to be more
  different each phase".
- Showman body-only silhouette P1-P3 at 0.709 against the kitsune's 0.700 passed with a 0.05 margin and was rejected
  again ("too similar", "a weakling"): hence 0 tolerance on that pair.
- Kaleido and Showman had the same body under a new aura: hence the body-only silhouette run.
- Hand-made scripts gave every artist a different kitsune number, and a highest-pair rule let the rejected Showman
  pass: hence ONE silhouette script, each pair against her same pair, kitsune pinned at a commit.
- Chronos whose ring became blades then a sun, over the same cape, armour and colours: a new halo is not a change.
- Seraph: "they aren't any significant changes per phase" and "phase 3 just sucks".
- Hive empress P1 "not different enough" was fixed by changing her POSE (sprawled, then rearing).

## Threat and power
- Showman: "he jus looks like a regular guy. where are his powers?? his magic powers??? All phases look boring." A
  costume is not a power; power floating AROUND a man still reads "a guy with masks": it goes ON him (his face, horns
  from his head, fire from his palms).
- Showman: "the showman looks like a weakling ... make this guy look like a bigger threat": never a slim smiling bust,
  never a soft pretty-boy face (narrow chin, thin neck, doll eyes, timid smile), never a second copy of him as a trick.
- Gorgon and Chimera redesigns passed review as clear but were "too plain and looks a LOT LOT LOT LOT LESS THREATENING
  than before": cute and tame.
- Chronos scaled up from its base: "now he looks fat instead of muscular". Bulk is muscle.
- Kitsune first version: "very ugly... compare it to sakura being so beautiful": a beautiful boss gets grander through
  scale, light and stillness, never an uglier face.
- Ophanim: a divine boss is serene and flawless, scarier than a snarl.

## Clarity, background and detail
- The 2026-10-09 Showman, Rat King, Cerberus, Seraph, Kaleido, Chronos and Banshee redesigns and the first Headless
  Horseman were all rejected: scene backdrops, a new camera and setting per phase, "detail is the point", P3 "the most
  happening on screen"; 2,000 to 4,000 paths and 200 to 720 animations each (the kitsune: 787 and 138).
- Chronos: "a ton of details crammed for the sake of details not an intentional art design. too much going on and its
  hard to say what is actually on screen. the background is overwhelming."
- Banshee: "its hard to tell what is going on and too much background and phase 3 is just broken in general".
- Seraph: "same thing with background and hard to understand what is going on".
- The opposite then failed: a day of redesigns stripped detail ("ur making them shitty", "kitsune was detailed yet
  beautiful. you are going too far on less detail and making them look ... uninteresting"). Hence "organise detail,
  never delete it" and "better than the chosen version".
- The Rat King's vault and casino backdrops were approved: clutter failed, not backgrounds. A P3 without one beside
  a P1 and P2 with one breaks the set.
- Sugar queen: "too far away" and "background too colorful"; a pendant must not hide the neckline.
- Rat King, sugar queen and showman full-body shots were rejected: variety never comes from zooming out.
- The first raid bosses were "boring, uninspired and weak": small figures lost in their frame (one neck, a boxy robot,
  a skeleton in a robe, a lion like a house cat). The fix was a BIG figure, not a fuller backdrop; the redesign got
  "YESS, much better".
- A ghost face behind a figure showed only pale blobs; redrawn as a hood around the frame, it worked.
- The lich's stacked ghost robe, fishbone ribs, rectangle mouth and scythe read "mega weird": pick two or three changes.
- Blue circles on the ocean boss's forehead were "weird"; the banshee's bells read as "weird green hair that floats".
- "void has too many eyes".
- A dark membrane on a dark sky and a translucent wraith over a busy rune circle vanished.
- "i don't understand what the boss is trying to be": the concept must be nameable.

## Faces and features
- Banshee: a long oval scream maw was too close to a ring maw; a scream reads from lips, teeth and a stretched face. A
  pale figure needs value separation; ghost minions with round eyes turn cute; thin upward hair locks read as horns.
- Seraph: when a maw replaced the single eye the owner wanted it back; a pointed white hood over red robes reads as a
  hate group's hood; anything symmetric under the single eye reads as teeth; a rounded dome read as "a tombstone"; a
  closed lid drawn with lash ticks read as a grin.
- Chronos: clock-hand brows sit ABOVE the eyes or read as glasses.
- Zeus: glowing visor eyes read as a mask; he is muscular and handsome (V-taper, real irises, a half smile, short beard).
- Mirror Knight: a helmed knight still needs a readable face; a reflection is mirrored, recolored as glass and lags his
  motion, never a pasted copy; an ability overlay aims at the part it is about (his chest prism), never the face.
- Ophanim: an effect never puts a stand-in eye over the real one; a porcelain bezel plate around the photo eye was
  rejected.
- Hydra: heads share features (one eye color), each its own character (snout, horns, scars, expression).
- Headless Horseman: fire is several tongues, never one teardrop (reads as a tulip).
- Lunar Strix (moonmaw): a loved theme on a weak creature became a creature whose signature part IS the theme (the
  moon as an owl's facial disc). An owl reads from a two-lobed disc, two big forward eyes, a short hooked beak, tufts.
- Rounded teeth were reverted; a design made only of spikes reads "too pointy" (the spiky lion head).
- Thin brow wedges with a line through them read as eyelashes; small round mouths read as EYES at game size.
- A phase 3 with fewer teeth than phase 2 was caught; a phase 2 hourglass needed more cracks.
- Rat King minions: stand on something, few and posed, never a mass.

## Motion
- Chronos: "this guy is a hunk of metal and the breathing movement is so slow and subtle that it looks like he's
  glitching up and down": objects never breathe; a living breath needs real range (hence `check-idle-breath.mjs`).
- Seraph P3 breath and Rat King P2 chips: "choppy and low frame rate ... looks buggy" (linear playback reversed bobs in
  one frame; hence the app's easing).
- A Banshee float and Kaleido crystals measured "smooth" in one drawing in software raster still stuttered on the
  owner's 480 Hz screen ("every animation even subtle isn't low framerate"): measure the real asset view, GPU raster,
  CPU throttled, presented frames (hence compositing and `check-smooth.mjs`).
- "THE SLOW STUTTERING BOBBING/WEIRD BREATHING IS STILL THERE. ITS LOW FRAMERATE AND CHOPPY. I ASKED YOU TO FIX THIS
  MULTIPLE TIMES" (2026-10-13, Banshee and 16 more): every earlier fix (compositing, easing, the clock off, a 2 px
  minimum) treated the PLAYBACK; the presented frames were already smooth. The fault was the motion: a whole figure
  drifting a few px over seconds steps one pixel about every half second and reads as a low frame rate on any screen.
  The 2 px minimum had blessed exactly that range. Whole-figure idle motion is now banned and big parts must move 3+
  px (`check-idle-breath.mjs` drift/creep). Lesson: when a pipeline fix does not change what the owner sees, question
  the content, and measure what reaches the screen, not the animation's maths.
- A keyTimes list ending at `.46` left a boss's eyes shut forever.
- The rex's twitchy idle arm was rejected: idle is slow and small.

## Process
- Regenerating bosses from simple primitives by script drifted into flat, rounded cartoon shapes: edit the chosen
  version instead.
- Parallel art waves produced a day of rejected redesigns: one boss at a time, shown to the owner before commit.
- Self-checks passed what the owner rejected at a glance: the coordinator takes its own owner-view screenshot and checks
  EVERY rule, never just the latest complaint (a Showman then passed "same character" and failed on powers).
- A resumed artist drifts toward finishing, not toward the vision: hence the interrupted-work check.
- Retired: the Glutton ("i dont even like the concept of glutton"). Never draw, recreate or propose it again.

## Legends bosses and banners (rejected designs)
- mountains: a rock-golem face block with a crystal crown ("cartoon rock mask", no body); a serene old man with a moss
  beard (too close to forest).
- forest: "evil", "goofy", "hippie" faces on a tree, a trunk "tiki mask", a stag skull in a hollow with root-claw hands,
  a creepy winged stag (skull face, fangs, tear streaks, glowing ribs, bone spikes, green bat wings: "make him less
  creepy"); bat wings recolored instead of bird wings ("make this more like bird wings").
- garden: the round flytrap with eye stalks "looks like a big ball".
- arena: a holy paladin "too skinny" with armor "like a flag", a noble one "ugly af", a muscular one without nobility;
  sword flames, eye fire and "shadow fire" removed ("no fire").
- arcade: a cute star-eyed version.
- sweets: the goofy gingerbread man was hated.
- junkyard: "make this guy more badass", twice; a traffic cone.
- mine: drill-maw mole-worm, dwarf king, blind leviathan.
- savanna: the spiky lion head was "too pointy".
- swamp: the crocodile with a lantern lure.
- stage: a unibrow ("get rid of the unibrow").
- Fire out of the eyes was removed from the frontier rider and the inferno (it worked rooted IN the titan's and castle
  knight's visor slit).
- A tree spirit went "goofy", then "hippie": a fierce boss must not read soft or flowery.
- Ebi drafts "way too different" or "a shitty low quality version": variations are polished and only a little different.
