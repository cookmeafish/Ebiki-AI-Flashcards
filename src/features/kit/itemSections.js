// A lesson item's back as SECTIONS to show (pure, tested): the owner found "Definition: ... Example: ... Key Points:
// a; b; c" walls of text "so hard and awful to read". Each "Label: text" line becomes a section with a role
// (meaning, example, points, category, sound, other) so the card can lay it out; key points split into bullets.
// Any subject and language: labels are matched by meaning in several languages, unknown labels stay as they are.
const ROLES = [
  ['meaning', /^(definition|meaning|definición|significado|traducción|translation|définition|sens|bedeutung|定義|意味|定义|意思|含义)$/i],
  ['example', /^(example|examples|ejemplo|ejemplos|exemple|beispiel|例|例文|例子|例句)$/i],
  ['points', /^(key points?|remember|notes?|puntos clave|notas|points clés|à retenir|merkpunkte|ポイント|要点|重点)$/i],
  ['category', /^(category|categoría|catégorie|kategorie|カテゴリ|類別|类别|分类)$/i],
  ['sound', /^(pronunciation|pronunciación|prononciation|aussprache|発音|发音)$/i],
]
export const SECTION_ICON = { meaning: '📖', example: '💡', points: '⭐', category: '🏷️', sound: '🔊' }

const roleOf = (label) => (ROLES.find(([, re]) => re.test(label.trim())) || ['other'])[0]
// "a; b; c" → bullets (a plain sentence stays one item). Commas never split: they belong inside a point.
export const splitPoints = (text) => String(text || '').split(/\s*;\s*|\s*\n\s*/).map((s) => s.trim().replace(/[.;]$/, '')).filter(Boolean)

// → [{ role, label, text, points? }]. A line without a "Label:" joins the section before it (or opens a plain one).
export function itemSections(back) {
  const out = []
  for (const raw of String(back || '').split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    const m = line.match(/^([^:：]{1,28})[:：]\s*(.*)$/)
    if (m && m[1].trim().split(/\s+/).length <= 3 && !/^https?$/i.test(m[1].trim())) {
      const role = roleOf(m[1])
      out.push({ role, label: m[1].trim(), text: m[2].trim() })
    } else if (out.length) {
      out[out.length - 1].text = `${out[out.length - 1].text}\n${line}`.trim()
    } else {
      out.push({ role: 'other', label: '', text: line })
    }
  }
  for (const s of out) if (s.role === 'points') s.points = splitPoints(s.text)
  return out.filter((s) => s.text || s.points?.length)
}
