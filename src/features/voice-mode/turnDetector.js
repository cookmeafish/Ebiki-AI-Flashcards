// HANDS-FREE TURN TAKING for Chat's voice mode (pure, tested). Fed the microphone's loudness (0..1) with the real time
// it was read (ms, any clock), it says when the learner STARTED talking and when they are DONE: a pause of
// `silenceMs` after at least `minSpeechMs` of speech. A cough or a click shorter than that never counts. The threshold
// follows the room: the quietest recent QUIET reading (the noise floor) times `overFloor`, never under `minLevel`. The
// floor starts at `minLevel` and learns only from readings under the threshold, so a learner already talking when the
// mic opens (right after Interrupt) is heard at once instead of being taken for the room's noise.
// Timing is wall-clock (never frames), so it acts the same at any rate the level arrives.
export const TURN = { minLevel: 0.012, overFloor: 2.6, silenceMs: 1200, minSpeechMs: 300, maxSpeechMs: 45000, noSpeechMs: 15000, floorMs: 4000 }

export function createTurnDetector(opts = {}) {
  const k = { ...TURN, ...opts }
  let started = null      // when this listen began
  let speechAt = null     // first loud reading of the current stretch
  let talkStart = null    // when speech was confirmed
  let talking = false
  let lastLoud = null
  const quiet = []        // [t, level] quiet readings of the last floorMs
  const floor = () => (quiet.length ? Math.min(...quiet.map((x) => x[1])) : k.minLevel)
  const threshold = () => Math.max(k.minLevel, floor() * k.overFloor)
  return {
    // → 'start' (speech confirmed), 'end' (done talking), 'timeout' (nothing said for noSpeechMs), or null.
    feed(level, t) {
      const v = Math.max(0, Number(level) || 0)
      if (started == null) started = t
      const loud = v >= threshold()
      // The floor learns from quiet readings only (never from speech, never while talking).
      if (!loud && !talking) {
        quiet.push([t, v])
        while (quiet.length && t - quiet[0][0] > k.floorMs) quiet.shift()
      }
      if (loud) {
        lastLoud = t
        if (speechAt == null) speechAt = t
        if (!talking && t - speechAt >= k.minSpeechMs) { talking = true; talkStart = t; return 'start' }
      } else if (!talking && speechAt != null && lastLoud != null && t - lastLoud > k.silenceMs / 2) {
        speechAt = null // a short noise, then quiet: forget it
      }
      if (talking && lastLoud != null && t - lastLoud >= k.silenceMs) return 'end'
      if (talking && t - talkStart >= k.maxSpeechMs) return 'end'
      if (!talking && t - started >= k.noSpeechMs) return 'timeout'
      return null
    },
    get talking() { return talking },
    get threshold() { return threshold() },
  }
}
