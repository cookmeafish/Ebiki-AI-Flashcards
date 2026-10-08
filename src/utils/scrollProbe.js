// SCROLL PROBE (diagnostics): the owner's app window scrolled "slow and clunky" while a browser tab on the same
// computer (same GPU, same engine version) was smooth. Passive: it never scrolls anything. After a user scroll it
// times the next frames (requestAnimationFrame intervals) and counts long main-thread tasks, then every
// REPORT_EVERY_MS (only if there was scrolling) posts one summary line per kind of window to /api/log, with the state
// that could differ between the two windows (size, zoom, screen, animated drawings). Off in the overlay.
import { apiFetch } from '../platform'

const WATCH_MS = 900 // how long after a scroll event frames are timed
const REPORT_EVERY_MS = 20000

const pct = (arr, p) => (arr.length ? arr.slice().sort((a, b) => a - b)[Math.min(arr.length - 1, Math.floor(arr.length * p))] : 0)

export function startScrollProbe({ kind }) {
  if (typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return () => {}
  let frames = [] // ms between frames while watching
  let longTasks = [] // ms of main-thread tasks over 50 ms while watching
  let watchUntil = 0
  let last = 0
  let looping = false
  let scrolls = 0
  const tick = (t) => {
    if (last) frames.push(t - last)
    last = t
    if (performance.now() < watchUntil) requestAnimationFrame(tick)
    else { looping = false; last = 0 }
  }
  const onScroll = () => {
    scrolls++
    watchUntil = performance.now() + WATCH_MS
    if (!looping) { looping = true; requestAnimationFrame(tick) }
  }
  let obs = null
  try {
    obs = new PerformanceObserver((list) => {
      if (performance.now() > watchUntil + 100) return
      for (const e of list.getEntries()) longTasks.push(Math.round(e.duration))
    })
    obs.observe({ entryTypes: ['longtask'] })
  } catch { /* no long-task timing in this engine */ }
  window.addEventListener('scroll', onScroll, { capture: true, passive: true })
  window.addEventListener('wheel', onScroll, { capture: true, passive: true })
  const report = () => {
    if (!frames.length) return
    const f = frames; const lt = longTasks
    frames = []; longTasks = []
    const median = pct(f, 0.5)
    const line = {
      probe: 'scroll', kind, at: new Date().toISOString(), scrolls,
      frames: f.length, medianMs: +median.toFixed(2), p95Ms: +pct(f, 0.95).toFixed(2), maxMs: +Math.max(...f).toFixed(1),
      fps: +(1000 / (median || 1)).toFixed(0), slowFrames: f.filter((x) => x > Math.max(median * 2, 20)).length,
      longTasks: lt.length, longTaskMs: lt.reduce((a, b) => a + b, 0), worstTaskMs: lt.length ? Math.max(...lt) : 0,
      win: [window.innerWidth, window.innerHeight], dpr: window.devicePixelRatio,
      zoom: getComputedStyle(document.documentElement).getPropertyValue('--app-zoom').trim(),
      ua: navigator.userAgent.replace(/^.*?(Chrome\/[\d.]+).*?(Electron\/[\d.]+)?.*$/, '$1 $2').trim(),
      nodes: document.getElementsByTagName('*').length,
      svgs: document.querySelectorAll('svg').length,
      animating: document.getAnimations ? document.getAnimations().filter((a) => a.playState === 'running').length : -1,
      screen: document.querySelector('main') ? (document.querySelector('[aria-current="page"]')?.textContent || '').trim().slice(0, 30) : '',
    }
    scrolls = 0
    apiFetch('/api/log', { method: 'POST', body: `SCROLL-PROBE ${JSON.stringify(line)}` }).catch(() => {})
  }
  const timer = setInterval(report, REPORT_EVERY_MS)
  return () => {
    clearInterval(timer)
    window.removeEventListener('scroll', onScroll, { capture: true })
    window.removeEventListener('wheel', onScroll, { capture: true })
    try { obs && obs.disconnect() } catch { /* already gone */ }
  }
}
