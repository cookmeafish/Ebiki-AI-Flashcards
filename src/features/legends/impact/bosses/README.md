# Raid boss fight effects, one boss per file

Every raid boss's plain fight moments live in `impact/bosses/<motif>.js` (pure data) and `<motif>.parts.jsx` (its own
drawn parts and CSS). Its ABILITY effects live in `fx/<motif>.jsx` (see that folder). Editing one boss never touches
another boss's files.

- `<motif>.js` `style`: the impact style (shape documented at the top of `impact/styles.js`): colors, glyph, and the
  parts list for each of the 9 moments (hit, crit, sharpen, strike, heavy, block, shield, wind, ko) plus `body` (one body
  move per moment). `assault`: its attack on the player (`impact/assault.js`: travel + impact, a unique pair).
  `body`: body moves of its OWN, `{ <moment>: { <motif><Move>: '<keyframes>' } }` (strings like impact/body.js; for `ko`
  a full keyframe string too), which `style.body` may then name.
- `<motif>.parts.jsx` default export: drawers `{ <motif><Name>: (params, ctx) => node }` merged into `PARTS` (ctx: color,
  accent, glyph, scale, speed; container units of the boss box; deterministic; transforms and opacity). `css`: global
  CSS for them (keyframes prefixed `lg<motif>`), injected while a strike moment plays.
- THE BOSS DRAWING ITSELF can react to a moment: the arena root carries `data-motif="<motif>"` and, while a moment plays,
  `data-moment="hit|crit|sharpen|hurt|hurtBig|block|shield|wind|ko"` (hurt = its strike, hurtBig = its heavy blow), and
  `data-assault-on` while its attack on the player plays. Put CSS in `css` like
  `.lg-boss[data-motif="titan"][data-moment="hurt"] .lg-titan-fist { animation: lgtitanPunch 560ms ease-out }` and give the
  SVG part a class starting `lg-` (the bake keeps `lg-*` elements live vector, so CSS can move them). Pivots need
  `transform-box: fill-box` and a sensible `transform-origin`.
- WHERE that drawing CSS goes: `css` here is on the page ONLY while a strike moment plays. CSS that must also run when
  an ability takes a heart (`data-assault-on` with no `data-moment`), react to an ability (`data-fx`), or hold the
  fallen pose after the knockout (`data-down` on the arena root) goes in `fx/<motif>.jsx` `css`, which is on the page
  for the whole raid. Wrap existing SVG parts in `<g class="lg-<motif>-<part>">` (never on an element with its own
  `transform` attribute or SMIL motion: CSS would override it); never redraw for it.
- `data-fx-pending` is set between an ability being judged and its effect starting: a part whose state changes (the
  Hydra's heads) holds its BEFORE look through that gap.
- `impact.test.js` checks each boss's `css` against its OWN `koMs` (nothing may still play after its knockout).
