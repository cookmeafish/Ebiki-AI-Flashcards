// Seeded generator for property tests (mulberry32): a failing case is reproducible from its seed.
export function rng(seed) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (n) => Math.floor(next() * n)
  const pick = (arr) => arr[int(arr.length)]
  return { next, int, pick, bool: (p = 0.5) => next() < p }
}
