// FIGHT EXTRAS: the decisions behind every answer's second look (pure, tested by fightCheck.test.js). The hooks and
// rows that draw them live in FightExtras.jsx; Legends fights (NodeRun.jsx), raids (RaidRun.jsx) and the Legends
// result's all-answers list (LegendsScreen.jsx) share them.
//
// THE SWITCHES, one place for every piece (all on; set one to false to switch that piece off everywhere):
//   recheck  every AI miss/glancing verdict gets a careful background re-check (kit/judge.js recheckStrike)
//   refund   an overturned answer gives the hearts and damage back while the fight runs (fight.js refundRunningFight);
//            off = an overturn still fixes the grade and the tally, never the fight
//   appeal   the learner's ⚖ Appeal on a miss (during the fight, in the raid debrief and the Legends result)
//   learnIt  📖 Learn it on a miss (kit/LearnItPanel.jsx), mid fight and after it
//   debrief  "What tripped you up" after a raid (Debrief) and the Legends result list opening itself on misses
//   taunts   boss taunts on a miss (kit/taunt.js); also the per-user setting features.legends.taunts, off in focus mode
export const FIGHT_EXTRAS = Object.freeze({ recheck: true, refund: true, appeal: true, learnIt: true, debrief: true, taunts: true })

// The switches for one fight: the constants above, and the user's taunt setting (cfg = features.legends) with focus.
export function fightExtrasFor(cfg = {}, { focus = false } = {}, extras = FIGHT_EXTRAS) {
  return { ...extras, taunts: !!extras.taunts && cfg?.taunts !== false && !focus }
}

export const isWrongish = (v) => v === 'miss' || v === 'glancing'

// The question's right answer as the screen shows it.
export const expectedOf = (q) => (q?.kind === 'choice' ? q.choices?.[q.answerIdx] : (q?.accepted || [])[0]) || ''

// A new answer is re-checked in the background: an AI verdict that judged it wrong (or glancing), with an answer to
// look at and a key to ask with.
export const needsRecheck = ({ viaAi = false, verdict, answer, hasKey = false } = {}, extras = FIGHT_EXTRAS) =>
  !!extras.recheck && !!viaAi && isWrongish(verdict) && !!String(answer || '').trim() && !!hasKey

// An appeal may START on this answer: not already right, none running, none decided (a failed one may retry).
export const appealOpen = (e, extras = FIGHT_EXTRAS) =>
  !!extras.appeal && !!e && !e.overturned && e.appeal !== 'pending' && e.appeal !== 'won' && e.appeal !== 'lost'

// The ⚖ Appeal button shows: an appeal can start, the automatic re-check is not still running, there is an answer.
export const appealOffered = (e, { hasKey = false } = {}, extras = FIGHT_EXTRAS) =>
  !!hasKey && appealOpen(e, extras) && e.status !== 'checking' && !!String(e.answer || '').trim()

// The raid debrief's rows: every miss or glancing answer the fight applied (attached).
export const debriefEntries = (entries = [], extras = FIGHT_EXTRAS) =>
  (extras.debrief ? (entries || []).filter((e) => e && isWrongish(e.first) && e.attached) : [])

// A question of the run, as it should be asked now: an attack whose answer was overturned is cancelled (null), a
// glancing slip's follow-up replaces its placeholder once written (still unwritten = skipped, null).
// cancelled: Set of answer ids; fixes: Map answer id -> { prompt, accepted }.
export function resolveFightQuestion(q, cancelled = new Set(), fixes = new Map()) {
  if (!q) return q
  if (q._attackOf && cancelled.has(q._attackOf)) return null
  if (q._pending) {
    if (cancelled.has(q._pending)) return null
    const fix = fixes.get(q._pending)
    if (!fix) return null
    const { _pending, ...rest } = q
    return { ...rest, prompt: fix.prompt, accepted: fix.accepted }
  }
  return q
}

// What the Learn-it panel shows for a missed question: the card or item it was about, else the question itself.
// found: a raid card ({ front, back, noteId }) or a map item ({ front, back, cardNoteId }: noteKey 'cardNoteId'), or
// null. fallback: { front, back } when the screen knows them better than the question (the Legends result list).
export function learnItemFor(found, q, { noteKey = 'noteId', fallback = null } = {}) {
  if (found) return { front: found.front, back: found.back, noteId: found[noteKey] || null }
  if (fallback) return { front: fallback.front, back: fallback.back }
  return { front: q?.prompt || '', back: expectedOf(q) }
}
