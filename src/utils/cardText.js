// A model's value as card TEXT: strings as is, lists one per line, objects as "label: value" lines.
// Moved verbatim out of App.jsx so modules outside it (Discover's profile shaper) share the one rule.
export const cardText = (v) => {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return v.map(cardText).filter(Boolean).join('\n')
  // A list under a label stays on that label's line ("Traducción: cat, tomcat"); split into lines, its later
  // items landed unlabeled and unbolded on lines of their own.
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => `${k}: ${Array.isArray(x) ? x.map(cardText).filter(Boolean).join(', ') : cardText(x)}`).join('\n')
  return String(v)
}
