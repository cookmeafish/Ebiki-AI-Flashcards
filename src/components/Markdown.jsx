import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Renders markdown (chat/help messages) as sanitized HTML, themed via the global
// `.md-body` rules in App.jsx's <style> block so it flips with Ocean Light / Dark.
// Links open in a new tab. Inline + block markdown both supported.
marked.setOptions({ breaks: true, gfm: true })

// Open all rendered links in a new tab (added once at module load).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

export default function Markdown({ text, style }) {
  const html = useMemo(() => {
    const raw = marked.parse(String(text || ''), { async: false })
    const clean = DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] })
    return clean
  }, [text])

  return (
    <div
      className="md-body"
      style={style}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
