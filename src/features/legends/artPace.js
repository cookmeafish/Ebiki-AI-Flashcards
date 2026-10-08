// ART PACE (pure, tested): how many boss redraws per second this computer can afford, right now.
//
// A boss is a big vector drawing; every redraw re-rasters thousands of shapes (about 12 to 25 ms of GPU per redraw on
// an integrated GPU, more for a bigger drawing), so the redraws are the app's biggest cost. No fixed rate fits every
// machine or every screen (one boss in a fight, a dozen in the bestiary): the art clock (art.jsx) asks this governor
// for a BUDGET of redraws per second for the whole page and shares it among the drawings on screen (each at most
// ART_PACE.maxFps). The governor watches how smoothly the page keeps up, as the ratio of the page's frame intervals to
// the display's refresh period, and shrinks the budget quickly when frames come late, grows it slowly when smooth.
// Animation SPEED never changes: drawings are always set to the real elapsed time; only how often they are redrawn.
export const ART_PACE = {
  maxFps: 30, // one drawing never redraws more often than this
  levels: [480, 320, 240, 160, 110, 75, 50, 34, 22, 14, 8], // redraws per second for the whole page, best first
  start: 4, // the level a page starts at (a fight boss gets its full rate; a crowd starts careful)
  slowLag: 1.6, // median frame interval over the display's period above this = the page is falling behind
  calmLag: 1.2, // below this = smooth
  calmToRise: 3, // smooth samples in a row before stepping back up (rise slowly, fall fast)
  maxPeriod: 20, // ms: the display is taken to refresh at least 50 times a second (a page that was slow from its
  //                first frame never shows the real period, and would read its slowness as normal)
}

// The display's refresh period from observed frame intervals: the shortest typical one (a low percentile, so one
// glitchy fast frame does not count), never more than maxPeriod. ms; null with too few samples.
export function displayPeriod(intervals) {
  const xs = intervals.filter((x) => x > 2).sort((a, b) => a - b)
  if (xs.length < 5) return null
  return Math.min(ART_PACE.maxPeriod, xs[Math.floor(xs.length * 0.1)])
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b)
  return s.length ? s[Math.floor(s.length / 2)] : 0
}

export const newPace = () => ({ level: ART_PACE.start, calm: 0 })

// One governor step. state = { level, calm } (level = index into ART_PACE.levels); sample = frame intervals (ms) the
// page just produced; period = the display's refresh period (ms). A very late sample drops two levels at once.
export function paceStep(state, sample, period) {
  const s = { ...newPace(), ...state }
  if (!period || !sample || sample.length < 5) return s
  const lag = median(sample) / period
  const last = ART_PACE.levels.length - 1
  if (lag > ART_PACE.slowLag) return { level: Math.min(last, s.level + (lag > ART_PACE.slowLag * 2 ? 2 : 1)), calm: 0 }
  if (lag < ART_PACE.calmLag) {
    const calm = s.calm + 1
    if (calm >= ART_PACE.calmToRise && s.level > 0) return { level: s.level - 1, calm: 0 }
    return { level: s.level, calm }
  }
  return { level: s.level, calm: 0 }
}

export const paceBudget = (state) => ART_PACE.levels[Math.max(0, Math.min(ART_PACE.levels.length - 1, state?.level ?? ART_PACE.start))]
// How often each of `count` animating drawings may redraw (per second) under the budget.
export const paceFps = (state, count = 1) => Math.min(ART_PACE.maxFps, paceBudget(state) / Math.max(1, count))
