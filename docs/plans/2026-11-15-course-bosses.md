# Course bosses: regions, domain raids, a final raid (career mode)

The owner (2026-11-15): one boss per domain is far too slow. A domain takes a month or two of study. Legends paces
at 8 to 14 lessons and then a boss. Asked for: several bosses per domain, a raid boss at the end of each of the 5
domains, and a super raid boss over all domains. It must be easy to understand, easy to reach and logical.

## Design
- **Regions**: each island (domain) is split into regions of 8 to 14 lessons, following the objectives in order. A
  small objective joins the next one; a big one is split by its lessons. A region is named after its objectives
  (`1.1 · 1.2`).
- **Region boss** ends every region: a normal Legends boss fight over the region's items, named "Guardian of
  <region>", drawn with the island's own boss art. It replaces the per-objective checkpoints, so the user sees one
  test per region instead of one per objective.
- **Domain raid boss** opens when every region boss of the island is beaten (Weak spots stays optional before it).
  It is a fight over the whole domain, drawn with raid boss art and its 3 phases (BossArena `kind="raids"`), and
  beating it clears the island. Suggested art: d1 titan, d2 hydra, d3 chronos, d4 leviathan, d5 ophanim.
- **Final raid**: a 6th card at the bottom of the islands, "👑 Final raid", locked until all 5 domain raids are
  beaten. It is a fight over every domain (kitsune art).
- **Easy to reach**: the Continue card names the next step, including "⚔️ Region boss: Guardian of 1.1 · 1.2". The
  island page shows regions as a path (lessons, then that region's boss card). Island cards show
  "Region 2 of 5 · 1 of 5 bosses beaten".

## Build notes
- Keep `kind: 'boss'` for all three, with `stage: 'region' | 'raid' | 'final'` and an optional `motif`, so every
  existing fight path (fresh questions, lives, rewards, nemesis) keeps working. Only `stage: 'raid'|'final'` clears
  an island (`applyNodeResult` `areaDone`). `normalizeCareerNodes` opens a region boss when its region's lessons are
  done, and the raid when every region boss is done.
- Stamp `career.layout: 2`. An older course map with no finished step is rebuilt from the package. One with progress
  keeps its done steps mapped by item ids.
- Tests: region sizes (8 to 14), the unlock order, the raid clears the island, the final raid locks and unlocks,
  `nextCareerStep` walks region by region.
- QA: walk it in the real app from the owner's saved course (desktop and phone), look at every screenshot, run an
  independent review, bump the version.

## Status
Built (1.64.0). Change from the first draft, per the owner: regions are balanced by NEW THINGS taught (about 30
items, 22 to 37 in the Security+ course, 27 regions), not by lesson count. Checked: unit tests (career.test.js), the
real app on the owner's saved course (rebuilt on open, desktop dark and phone light), and a real domain raid intro
with the owner's provider. Not played through: a full region boss or raid fight to the end.
