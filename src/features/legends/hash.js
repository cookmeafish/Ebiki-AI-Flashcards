// FNV-1a over code points, base 36 (pure). The one short hash Legends keys and signatures use: saved step keys and
// sigs (store.js) and a course card's `cardSig` (exam/examQuestion.js), so the build and the app always agree.
export const fnv = (s) => { let h = 0x811c9dc5; for (const ch of String(s)) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0 } return h.toString(36) }
