// ONE grading rule for one answer, shared by Study (one-question cards), Legends (steps, boss, Legendary) and raids.
// Pure and platform-neutral (features import it). Grades are Anki's four buttons.
//   again: wrong, or "I don't know"
//   hard:  right, but not clean: a hint used, an accent slip, a retry after a wrong attempt, a correction or a near
//          miss (a fight's glancing strike)
//   good:  right on the first try, clean
//   easy:  good AND typed (never a choice), no hint, AND the card is already mature (interval >= MATURE_DAYS)
// Choice / multiple-choice answers are recognition: never above Good.

export const MATURE_DAYS = 21
export const GRADES = ['again', 'hard', 'good', 'easy']
export const GRADE_EASE = { again: 1, hard: 2, good: 3, easy: 4 }

export const easeFor = (grade) => GRADE_EASE[grade] || GRADE_EASE.again
// Anki's interval in days (a learning card's is negative seconds or 0: never mature).
export const isMature = (intervalDays) => Number(intervalDays) >= MATURE_DAYS

export function gradeAnswer({ correct, clean = true, hintUsed = false, accentSlip = false, retried = false, corrected = false, choice = false, mature = false } = {}) {
  if (!correct) return 'again'
  if (!clean || hintUsed || accentSlip || retried || corrected) return 'hard'
  if (choice || !mature) return 'good'
  return 'easy'
}

// A fight verdict (kit/judge.js judgeStrike, fight.js): miss = wrong, glancing = right but not clean, clean = clean.
// A choice (the safe strike) is a right answer by recognition.
export function gradeFromStrike(verdict, { choice = false, mature = false, hintUsed = false } = {}) {
  if (verdict === 'clean') return gradeAnswer({ correct: true, choice, mature, hintUsed })
  if (verdict === 'glancing') return gradeAnswer({ correct: true, clean: false, choice })
  return 'again'
}

// Counted as a right answer (tallies, codex): anything but Again. Solid (moves an item toward gold): Good or Easy.
export const gradeIsRight = (grade) => grade === 'hard' || grade === 'good' || grade === 'easy'
export const gradeIsSolid = (grade) => grade === 'good' || grade === 'easy'
