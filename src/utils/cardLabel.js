// A card back line's leading "Label:" (bolded on cards and wherever a back is shown), or null when the line
// has none. ONE rule for every surface: Anki writes (cardBackToHtml), Study's card back row, the tappable back
// (Learn it, graded cards) and the deck browser's expanded row. Those three re-implemented the match without
// the exceptions, so a shared deck's "🔊 User:Foo" credit, a cloze "{{c1::a:b}}" or MathJax "\(x:y\)" showed
// with half of it bold.
// Full-width colon too: Chinese/Japanese labels are written 发音：/ 意味：.
// Never a label: a "[sound:file]" line, a bare "https:" address (or one inside the label), a cloze, MathJax
// ("\(" / "\["), a clock time ("10:30"; "1: step" and "Método HTTP: GET" still are labels) or the audio credit.
export const splitCardLabel = (line) => {
  const s = String(line ?? '')
  const m = s.match(/^([^:：\n]{1,30})([:：])(.*)$/s)
  if (!m) return null
  const [, label, sep, rest] = m
  if (/^\s*\[/.test(s)) return null
  if (/^\s*https?$/i.test(label) || (/https?$/i.test(label) && rest.startsWith('//'))) return null
  if (/\{\{|\\[([]/.test(label)) return null
  if (/^\s*\d{1,2}$/.test(label) && /^\d{2}/.test(rest)) return null
  if (/^\s*\u{1F50A}/u.test(s)) return null
  return { label, sep, rest }
}
