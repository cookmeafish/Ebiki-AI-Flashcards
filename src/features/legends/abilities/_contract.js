// THE RAID ABILITY CONTRACT (documentation; nothing imports this file).
//
// Every raid boss has ONE pure module, abilities/<motif>.js (motif = raid.js RAID_MOTIFS entry), picked up by
// abilities/index.js. Its default export is a descriptor. EVERY field is optional except `id` and `icon`:
//
//   id        'regrowth'   unique ability id. The texts: lg_ability_<id> (name), lg_abilityDesc_<id> (rule),
//                          and whatever keys hint/banner/hud/actions return. Never shared by two modules.
//   icon      '🐍'         the ability's icon (intro card, arena chip, asset view).
//   K         { ... }      tuning constants (named, never literals inside the hooks).
//   fxKeys    ['cut']      every `res.fx` the module can fire. fx/<motif>.jsx draws each one (effects[key]) and
//                          names its floater text (floaters[key]); abilityfx.test.js checks both.
//   noCrit    true         the base "every 3rd clean strike in a row is a critical (+1)" never applies.
//   sampleHint { key, vars } the hint the asset view shows on the ability card (key defaults to lg_hint_<id>).
//   knownUnfair { <check>: 'Boss (ability): why' }  fairness.test.js skips those checks (allRight, allWrong, lives,
//                          heals, choices, choicesThenTyped, hintDiet, tagDiet). Only for a v1 module waiting to be
//                          replaced (each says "TODO(<motif>)"): a new ability passes them all and declares none.
//   decision  true         this module offers the player a CHOICE: only a decision module may return actions() (the
//                          attention budget: at most DECISION_MAX modules declare it; RaidRun and the simulator ignore
//                          actions() of any other module). Its buttons never show on attacks or inserted questions, and
//                          the boss must still fall to an all-right run with no button ever pressed (F1, press 'never').
//
// STATE. `fight.ab` is the module's own state: `init(ctx)` returns it (lazily, on the first strike or read, so a
// raid that starts already in phase 2 gets ctx.phase = 2). strike() hands every hook a COPY `s` of the fight with
// `s.ab` already shallow-copied: assign fields freely (s.ab.heads = 3), but REPLACE arrays/objects inside s.ab, never
// push into them (s.ab.raised = [...s.ab.raised, key]). Base fight fields (damage, livesLost, combo, chain, rights,
// answers, clean, glancing, safe, misses, attacks, blocked, unredeemed, n, last) are shared: read them, do not
// repurpose them. Older top-level counters (cuts, triples, coins, sugar...) belong to the ported v1 abilities.
//
// HOOKS (all pure, all deterministic: any pick comes from the fight state or hashOf(...) in _rules.js):
//   init(ctx) -> {}                  the starting state (ctx.phase: the phase the attempt starts in; ctx.dayAb: what
//                                    dayState saved from today's earlier attempt, or null).
//   onPhase(s, phase, ctx)           a higher phase began (the bar crossed a phase line). State only: no damage here.
//   onStrike(s, res, hit, ctx)       THE main hook, once per answer, after the base rules filled `res`:
//        res  = { dmg, lives, heal, gorge, crit, fx, fxVars }   dmg = damage this answer deals; lives = lives it
//               costs; heal = lives it gives BACK; gorge = health the BOSS heals (strike floors it at the damage
//               this attempt dealt, F4); fx = the effect key to play (one of fxKeys); fxVars = vars for its floater.
//        hit  = { verdict: 'clean'|'glancing'|'miss', mode: 'typed'|'choice', attack, inserted, lastStand, key,
//                 weak, armed: { <toggleId>: true } }   (armed: the toggle actions the player armed for this answer)
//        ctx  = { kind: 'normal'|'attack'|'inserted', inserted, right, clean, phase, need, lives, livesLost,
//                 lastLife, shieldReady, bar, K, before }   (bar: { total, before, phases } on raids, else null;
//                 before = the fight state before this answer)
//   onLifeLoss(s, res, ctx)          after the Legends shield, when res.lives > 0 is about to be taken (wards, a
//                                    lucky tail): lower res.lives, set res.fx.
//   attackGap(s, ctx) -> n           questions between a miss and its returning attack (default ATTACK_GAP).
//   attackLives(s, ctx) -> n         lives a missed ATTACK costs (default ATTACK_LIVES); also shown on its banner.
//   afterStrike(next, info) -> plan  RaidRun asks after every answer what to put into the run:
//        info = { q, hit, over, attack (an attack will be inserted), normal, pos, room }
//                 room = how many inserts still fit in this ATTEMPT (MAX_INSERTED = 4, shared by every ability insert:
//                 minions, loops, last stands; attacks are separate, MAX_ATTACKS). raidStep keeps only the first
//                 `room` inserts, and with room 0 drops the WHOLE plan (its ab and attack: false too, so a loop that
//                 never comes back does not cancel the attack). Read `room` and record only what really goes in.
//        plan = { insert: [{ key, kind }], at: 1|2|... (questions after this one), attack: false (cancel the
//                 attack), ab: { ...fields merged into fight.ab } (what it decided: never mutate `next`) } | null. Each key is a card id (q._cardId); RaidRun turns it into that card's question,
//                 typed (no choices), marked `_inserted: kind` (+ `_lastStand` for kind 'lastStand'). Inserted
//                 questions are NEVER recorded in Anki. strike() gets them as hit.inserted = kind.
//   actions(s, ctx) -> [{ id, icon, labelKey, vars, enabled, toggle, on, tone }]   buttons beside Skip while a
//        question waits for its answer (ctx.mode = 'typed'|'choice', ctx.q = the question, ctx.armed). A `toggle`
//        arms itself for the coming answer (hit.armed[id]); any other button calls act().
//   act(s, res, action, ctx)         a non-toggle button was pressed (action = { type: id }): fill res.dmg / res.fx /
//                                    res.heal / res.gorge (an action never costs lives).
//   settle(s, res, ctx)              the questions ran out (or the raid was left): flush held damage into res.dmg.
//   hint(s, q, mode, ctx) -> { icon, key, vars } | null    one line under the strike label for THIS question.
//        HINT DIET: read on every question, so return one ONLY when it changes what the learner might do or expect on
//        THIS question (a ready trigger, a tagged question, an armed axe); else null. The HUD carries the steady
//        state. At most HINT_MAX_WORDS (8) words in English (fairness.test.js renders them and counts).
//   tag(s, q, ctx) -> { icon, key, vars, tone } | null     a COMPACT chip in the question header's corner that marks the
//        CURRENT question (a Seraph verdict, a Kaleido facet color, a Gorgon gaze): icon + at most TAG_MAX_WORDS (3)
//        English words. Use it instead of a banner for a mark on a normal question.
//   banner(s, q, ctx) -> { icon, key, vars, tone } | null  a full-width banner above the question. ONLY for a different
//        KIND of question that must be told apart (a Lich minion, a Chronos loop, a last stand).
//   hud(s, ctx) -> [item]            the visible state in the arena (BossArena's AbilityHud draws it). Any item may set
//        `ready: true` when it is ONE step from its trigger (the last head, the jar one cube short): it pulses (a
//        static ring under reduced motion). An item whose values change BUMPS by itself (keyed by index + type, so
//        keep each item at a stable index). Items:
//        { type: 'pips',  n, max, icon, emptyIcon, labelKey, vars, tone }      filled / empty icons
//        { type: 'gauge', value, max, labelKey, vars, tone }                   a small meter
//        { type: 'track', pos, max, icon, labelKey, vars, tone }               a marker on a row of stops
//        { type: 'board', cells: [0|1|2], shape: 'hex7'|'row', labelKey, vars, tone }   a board of cells
//        { type: 'queue', items: [{ icon, labelKey, vars, tone }], labelKey }  what comes next (first = now)
//        { type: 'bars',  bars: [{ icon, labelKey, value, max, tone, active }] }   several mini health bars
//        { type: 'coins', n, icon, labelKey, vars, tone }                      a counter
//        { type: 'chip',  icon, key, vars, tone }                              a labelled chip
//        tone: 'purple'|'danger'|'warning'|'success'|'info'|'brand'|'ink' (theme tokens; never a hex color)
//   barMarks(s, ctx) -> [{ type: 'line'|'ghost', at, to, tone }]   marks on the health bar, in health LEFT on the
//        bar BossArena draws (ctx.need = that bar's max; ctx.damage = what it shows dealt): a line at `at`, a ghost
//        segment from `at` down to `to` (banked damage).
//   chipNote(s, ctx) -> i18n key     appended to the ability chip (" · Risen").
//   artState(s, ctx) -> { 'data-ab-<name>': value }   persistent state attributes on the arena: the boss SVG shows
//        `.lg-ab-<name>-<value>` layers through generated CSS (also under Still bosses: a static change).
//   artStyle(s, ctx) -> style        a persistent STATIC style on the innermost boss art box (e.g. a
//                                    swelling scale): it composes with the hit/lunge wrapper and the reaction class.
//   idle(s, ctx) -> key | ''         a PERSISTENT idle reaction: BossArena keeps `.lgr-<motif>-idle-<key>` on the art
//                                    box while it returns a key (the Dreamer's sleep drift).
//                                    Only IDLE_MOTIFS may declare it; slow and small; off in focus mode, with Still
//                                    bosses and under reduced motion like every reaction. Every other reaction plays
//                                    ONCE per trigger (fx keys).
//   dayState(s) -> object            what to keep for today's NEXT attempt (raid day.ab, saved with the day's wounds;
//                                    a new day starts without it). init(ctx) reads it back as ctx.dayAb.
//   cancelHeal(s)                    RaidRun undid this answer's gorge (it would have crossed a phase line back):
//                                    roll back the module's own heal counter.
//
// Ctx for hint/tag/banner/hud/actions/barMarks/artState/artStyle/idle: { phase, need, lives, livesLeft, damage, bar, mode, q, armed, K }.
//
// LOOKS: fx/<motif>.jsx draws each fx key (effects, floaters) and says how hard it hits (its `juice` map: size
// tick/medium/big, shake 0..3, flash 0..2, hitstop 0|1, sfx name; fx/_juice.js). BossArena plays it all once, inside the
// arena box, starting 100 ms after the answer and fading out the moment the next question appears.
//
// AFTER THE FIGHT: RaidRun's Aftermath asks the picked cards the fight never reached, with NO fight math (no hooks run),
// so an ability that shortens the fight never costs a due card its review.
//
// FAIRNESS (abilities/fairness.test.js runs every module): an all-right run always wins (with any buttons used or
// never), an all-wrong run never wins, a right answer never costs a life, a boss heal never goes below what this
// attempt started with.
export {}
