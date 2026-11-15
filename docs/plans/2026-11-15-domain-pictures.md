# Course domain pictures (2026-11-15)

The owner: "instead of these pictures, please put in pictures that pertain to the topic of the domain. generate them.
and tuck the raid boss in the left side of the panel". Today every course domain card shows a generic adventure
banner (castle, swamp, workshop...) that says nothing about the domain.

## Angles (three separate agents, none saw the others)
- **X** = an adult exam learner (12 items)
- **P** = phone and accessibility (12 items)
- **W** = what can go wrong (12 items)

## Design (the angles that raised each item)
1. **One topic picture per domain, recognisable without reading** (X1, X2, W3, X11). Generic security symbols, each
   domain its own main object and hue, no two sharing a main object:
   - General security concepts: a padlock and key standing on a triangle of three nodes (the three core goals).
   - Threats, vulnerabilities and mitigations: a bug crawling at a cracked wall, a shield blocking it.
   - Security architecture: a blueprint grid with a cloud, a server rack and a firewall wall between two zones.
   - Security operations: a monitoring screen with an alert spike, a magnifier over log lines, an alert light.
   - Program management and oversight: a clipboard checklist and a balance scale.
2. **Reads at the card's small size** (X3, P6, W4): one big subject, at most 3 or 4 large forms, thick outlines, no
   text, letters, acronyms or hairlines.
3. **Same style for all five** (X10): same outline weight, flat shapes with a shadow side and a lit edge (layered
   opacity, no gradients), a dark blueprint-blue panel behind each.
4. **The domain's raid boss sits in its own zone on the LEFT** (X5, X6, P3, P5, W2, W11): a square box as tall as
   the banner, the boss still and whole (face never cut), the topic picture in the rest; they never overlap and never
   sit under text. The topic picture keeps its subject centred in its own zone at any width (P4, X7).
5. **Still, cheap** (X11, P9, P10, W6): the topic pictures have no motion; the boss is a still snapshot on the
   domain picker (the existing small-still path, exact device pixels, cached) and on the domain page.
6. **Decorative** (P1, P2, W12): both images are `aria-hidden`; the domain number, title, share and progress stay
   real text on the card. No meaning in the picture or its colour alone.
7. **Both themes** (X8, P7, W5): the panel is a fixed dark blue in both themes with a 1 px border, so the picture never
   melts into the card; fixed bright colours on it.
8. **Safe files** (W1, W7): hand-drawn SVG, generic symbols only (no vendor or exam logos, no seals, no names), no
   scripts, links, images, `url()`, ids or animation; checked by `art.test.js`.
9. **Older saved maps and other courses** (W8, W9, W10): the picture is chosen at RENDER time from a per-course
   table (`CAREER_TOPIC_ART`, course id → one topic per domain), never written into the map; a course or domain with
   no entry keeps the old adventure banner; a map with no raid node (layout 1) shows the topic picture across the full
   width with no empty boss gap.
10. **Never changes once set** (X12): the table is fixed per course.

## Declined, with why
- P11 3x screenshots: covered by the snapshot path drawing at device pixels; checked at 1x and 2x.
- W10 a 7-domain course never repeating a raid boss: the five raid bosses are per course in `CAREER_RAID_MOTIFS`; a
  longer course will need its own list (noted in career.js), out of scope here.

## Judge (three independent rounds, the owner's real Security+ map, 1280 and 390 px, both themes, 100% and 150%)
| Item | Round 1 | Round 2 | Round 3 |
|---|---|---|---|
| Topic at a glance, also blurred and greyscale | PASS (weak: two brick walls) | PASS | PASS |
| Boss left, whole, secondary | FAIL (picture a speck at 390 px / 150%) | PASS | PASS |
| No clipping or sideways scroll | FAIL (same) | FAIL (region rows, 3 px) | PASS (after the step-chip fix below) |
| SVGs at 4x | FAIL (stray dash, cut light) | FAIL (doubled disc, missing outlines) | PASS (minor notes) |
| Bosses still, aria-hidden | PASS | PASS | PASS |
| Narrow page banner | n/a | WEAK | WEAK, then height follows the picture's shape |

After round 3: step chips no longer break words mid-word (`overflowWrap: 'break-word'`), the briefing header wraps,
the narrow page banner takes the picture's 2:1 height. Still weak: the Hydra's still snapshot carries its own night
backdrop, so it reads as a tile.
