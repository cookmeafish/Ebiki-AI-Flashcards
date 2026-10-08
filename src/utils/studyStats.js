// The Stats tab's numbers (and Ebi's Help, which must say the same ones), from two sources: Anki's live review
// counts (`ankiStats`: { today, byDay, accuracy, day }) and this computer's session history
// (localStorage 'screenlens-study-history', newest first). Pure: dates come in as local 'YYYY-MM-DD' strings
// or a `now` Date, so the midnight and rollover cases are testable.

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0 }
export const localDay = (d) => d.toLocaleDateString('en-CA')

// Only real entries (a null row or a non-list value threw and took the app down every time Stats opened); a count
// stored as text ("5") is a number here, never string-joined into "05".
export function shapeHistory(raw, deckText = (x) => String(x ?? '')) {
  if (!Array.isArray(raw)) return []
  return raw.filter((x) => x && typeof x === 'object' && typeof x.date === 'string').map((x) => ({
    ...x,
    deck: deckText(x.deck),
    cardsStudied: num(x.cardsStudied),
    correct: num(x.correct),
    totalQuestions: num(x.totalQuestions),
    accuracy: x.accuracy == null || x.accuracy === '' || !Number.isFinite(Number(x.accuracy)) ? null : Number(x.accuracy),
  }))
}

// Cards for one day: the larger of Anki's count and the local history filed under that ANKI day (an old cached
// copy, or one with no byDay, blanked the chart and streak while the history held the sessions).
export function dayCount(ankiStats, history, ds) {
  const anki = num(ankiStats?.byDay?.[ds])
  const local = history.filter((h) => (h.ankiDay || h.date) === ds).reduce((s, h) => s + num(h.cardsStudied), 0)
  return Math.max(anki, local)
}

// Consecutive days with any cards, ending today or (today not studied yet) yesterday. No upper cap: a 365 cap
// showed a 400-day streak as 365.
export function studyStreak(ankiStats, history, now = new Date()) {
  let streak = 0
  const d = new Date(now)
  for (let i = 0; i < 20000; i++) {
    if (dayCount(ankiStats, history, localDay(d)) > 0) { streak++; d.setDate(d.getDate() - 1) }
    else if (i === 0) d.setDate(d.getDate() - 1)
    else break
  }
  return streak
}

// Today's tiles. Anki's numbers count only when fetched TODAY (a cache from yesterday showed yesterday's "Cards
// today"); cards take the larger of Anki's answers and the local history (practice-only sessions are not in Anki);
// accuracy is Anki's pass rate when known, else the local share right, else null (never a red 0%).
export function todayNumbers(ankiStats, history, now = new Date()) {
  const today = localDay(now)
  const todayHist = history.filter((h) => h.date === today)
  const localCards = todayHist.reduce((s, h) => s + num(h.cardsStudied), 0)
  const tq = todayHist.reduce((s, h) => s + num(h.totalQuestions), 0)
  const tc = todayHist.reduce((s, h) => s + num(h.correct), 0)
  const ankiToday = !!ankiStats && ankiStats.day === today
  const cards = ankiToday ? Math.max(num(ankiStats.today), localCards) : localCards
  const ankiAcc = ankiToday && ankiStats.accuracy != null && Number.isFinite(Number(ankiStats.accuracy)) ? Number(ankiStats.accuracy) : null
  const accuracy = ankiAcc != null ? ankiAcc : tq > 0 ? Math.round(tc / tq * 100) : null
  return { today, cards, accuracy, ankiToday }
}

// The last `n` days, oldest first, each { date, cards }.
export function chartDays(ankiStats, history, now = new Date(), n = 14) {
  const out = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i)
    const ds = localDay(d)
    out.push({ date: ds, d, cards: dayCount(ankiStats, history, ds) })
  }
  return out
}

// Recent Sessions: one row per (date, deck), newest date first whatever order the stored list is in (it is
// newest-first only by convention). Cards sum; accuracy is card-weighted over the sessions that HAVE one (no graded
// answer is unknown, never 0).
export function groupSessions(history, limit = 20) {
  const byKey = new Map()
  const grouped = []
  for (const h of history) {
    const k = `${h.date}|${h.deck}`
    const cards = num(h.cardsStudied)
    const known = h.accuracy != null && Number.isFinite(Number(h.accuracy))
    let g = byKey.get(k)
    if (!g) { g = { date: h.date, deck: h.deck, cardsStudied: 0, accSum: 0, accW: 0, order: grouped.length }; byKey.set(k, g); grouped.push(g) }
    g.cardsStudied += cards
    if (known) { g.accSum += Number(h.accuracy) * cards; g.accW += cards }
  }
  grouped.sort((a, b) => (a.date === b.date ? a.order - b.order : a.date < b.date ? 1 : -1))
  return grouped.slice(0, limit).map((g) => ({ date: g.date, deck: g.deck, cardsStudied: g.cardsStudied, accuracy: g.accW > 0 ? Math.round(g.accSum / g.accW) : null }))
}

// Per deck: sessions, cards, last date studied.
export function deckBreakdown(history) {
  const map = new Map() // deck names are user text ("constructor", "__proto__")
  for (const h of history) {
    const e = map.get(h.deck) || { deck: h.deck, sessions: 0, cards: 0, lastDate: h.date }
    e.sessions++
    e.cards += num(h.cardsStudied)
    if (h.date > e.lastDate) e.lastDate = h.date
    map.set(h.deck, e)
  }
  return [...map.values()]
}
