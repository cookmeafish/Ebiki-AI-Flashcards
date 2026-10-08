import { C } from '../config/tokens'

// Colors come from the theme tokens. The hardcoded dark-theme grays (#c9d1d9 text) were nearly
// invisible on the light theme's pale tooltip, and a CSS-variable accent + "33" made an invalid
// border color, so the section rule never showed.
export default function FormattedText({ text, accentColor = C.brand }) {
  if (!text) return null
  const lines = String(text).split('\n') // a non-string (an AI field that came back as a list) threw on .split
  const sections = []
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      if (current) current.lines.push('')
      continue
    }
    const headerMatch = trimmed.match(
      /^(?:\*{0,2})?\s*(?:\d+\.\s*)?([A-Z][A-Z\s/&]+(?:FORM|WORDS|USAGE|SENTENCES|PATTERNS|REGISTER|CONJUGATIONS|EXPLANATION|MEANING|SPEECH|ROOT|INFINITIVE|RELATED|REGIONAL|EXAMPLE)[A-Z\s/&]*?)\s*[:*]*\s*(?:\*{0,2})?(.*)$/
    ) || trimmed.match(
      /^(?:\*{0,2})\s*\d+\.\s*([^*:]+?)\s*[:*]+\s*(?:\*{0,2})?\s*(.*)$/
    )

    if (headerMatch) {
      current = { title: headerMatch[1].trim().replace(/\*+/g, ''), lines: [] }
      sections.push(current)
      if (headerMatch[2]?.trim()) current.lines.push(headerMatch[2].trim())
    } else {
      if (!current) {
        current = { title: null, lines: [] }
        sections.push(current)
      }
      current.lines.push(trimmed)
    }
  }

  return (
    <div>
      {sections.map((section, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          {section.title && (
            <div style={{
              fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '.08em', color: accentColor, marginBottom: 6,
              paddingBottom: 4, borderBottom: `1px solid ${C.border}`,
            }}>
              {section.title}
            </div>
          )}
          <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.8 }}>
            {section.lines.map((line, j) => {
              if (!line) return <div key={j} style={{ height: 6 }} />
              const isBullet = /^[-•–]/.test(line)
              const isExample = /^["“„«]/.test(line) || /ejemplo|example|translation/i.test(line)
              return (
                <div key={j} style={{
                  paddingLeft: isBullet ? 12 : 0,
                  fontStyle: isExample ? 'italic' : 'normal',
                  color: isExample ? C.inkDim : C.ink,
                  marginBottom: 2,
                }}>
                  {line}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
