import { cardText } from '../utils/cardText'
import { stripAiDashes } from '../utils/dashes'

// The profile's rendered text fields as TEXT, for a built profile AND one read back from the cache or
// the Anki blob: an older build (or another computer) stored summary/level as objects, and the panel
// crashed on every visit with Re-analyze inside the crashed panel. Mutates and returns it.
export const shapeProfile = (p) => {
  if (!p || typeof p !== 'object') return p
  // A summary keyed by language ({"en": "..."}) showed as "en: ...": its first text value is the summary.
  if (p.summary && typeof p.summary === 'object' && !Array.isArray(p.summary)) {
    p.summary = Object.values(p.summary).find((v) => typeof v === 'string' && v.trim()) ?? p.summary
  }
  p.summary = cardText(p.summary)
  // A level RANGE keeps its hyphen ("A2–B1" went through the dash strip as "A2, B1").
  if (p.level && typeof p.level === 'object' && !Array.isArray(p.level)) p.level = { ...p.level, estimate: stripAiDashes(cardText(p.level.estimate).replace(/\s*[—–]\s*/g, '-')), scale: cardText(p.level.scale) }
  else delete p.level
  // A list of {name, status}: an object map ({"Grammar": 0.4}) or a null entry made every suggestion throw
  // until a Re-analyze happened to return a list.
  p.domains = Array.isArray(p.domains)
    ? p.domains.map((d) => (typeof d === 'string' ? { name: d } : d)).filter((d) => d && typeof d === 'object')
      .map((d) => ({ ...d, name: cardText(d.name), status: cardText(d.status) })).filter((d) => d.name)
    : []
  return p
}
