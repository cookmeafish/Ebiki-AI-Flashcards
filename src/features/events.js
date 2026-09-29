// FACTS announced with `emit(EVENTS.X, payload)`, by the app (App.jsx) or by a feature (ctx.emit). They
// describe what happened, not what anyone should do about it: the game turns them into XP, the Mistake Gym
// collects misses, and with nobody listening they cost nothing. Add a fact here before emitting it.
export const EVENTS = {
  // A studied card got its FIRST final rating (any subject). `misses` = the questions answered wrong:
  // [{ question, answer, expected, feedback }]. { correct, mode, front, back, noteId, cardId, misses }
  CARD_GRADED: 'study.cardGraded',
  LEARN_DONE: 'study.learnDone',          // { mode } a Learn-it moment was completed
  CARDS_ADDED: 'cards.added',             // { n, source, mode } new cards went into a deck
  CHAT_SENT: 'chat.sent',                 // { mode } the user sent a Chat message
  PRACTICE_ANSWERED: 'practice.answered', // { source, correct, mode } one practice question (never touches Anki)
  PRACTICE_DONE: 'practice.done',         // { source, mode, total, correct } a practice session finished
  CALL_DONE: 'call.done',                 // { mode, cards } an Ebi Call ended; `cards` = reviews it recorded
  LEGENDS_STEP: 'legends.stepCleared',    // { mode, kind, area, effort, replays } a Legends step was cleared (area = 0-based index
                                          // on the map; effort 0.5..1.3 = how hard the answers were; replays = earlier clears)
  BOSS_BEATEN: 'legends.bossBeaten',      // { mode, area, raid? } a Legends boss was beaten (the area is finished), or
                                          // a daily raid boss for the first time (raid: true)
  LEVEL_UP: 'learner.levelUp',            // { mode, from, to } the learner level passed a whole number upward
}
