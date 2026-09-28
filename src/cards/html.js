// Card-content safety, shared by EVERY card backend (not Anki-specific): anything written onto a card
// passes through here first, whichever store keeps it.
import DOMPurify from 'dompurify'

// Plain text that contains "<" (code: "#include <stdio.h>", "vector<int>", "a < b") was written to
// a card as HTML, where "<stdio.h>" parses as a tag and disappears from the card. Every "<" that does NOT
// open a real HTML element (or a comment) is escaped on the way in, so the app's own markup (<b>,
// <br>, <div>, the audio credit <a>) and any HTML already on a card pass through untouched.
const HTML_TAGS = new Set(('a abbr address area article aside audio b base bdi bdo big blockquote body br button canvas caption ' +
  'center cite code col colgroup data dd del details dfn dialog div dl dt em embed fieldset figcaption figure font footer form ' +
  'h1 h2 h3 h4 h5 h6 head header hr html i iframe img input ins kbd label legend li link main map mark math meta meter nav ' +
  'noscript object ol optgroup option output p param picture pre progress q rp rt ruby s samp script section select small ' +
  'source span strike strong style sub summary sup svg table tbody td template textarea tfoot th thead time title tr track tt u ul var video wbr ' +
  // ruby (furigana). NOT generic SVG/MathML names: "<path>", "<text>", "<line>" are everyday code
  // placeholders ("git add <path>"), and only NEW text reaches this function now (updateNoteFields writes
  // existing card HTML as given).
  'rb rtc nobr').split(' '))
// A real HTML tag name (for turning card HTML into plain text without eating "<stdio.h>" or "a < b").
export const isHtmlTagName = (name) => !!name && (HTML_TAGS.has(String(name).toLowerCase()) || String(name).includes('-'))
export const escapeStrayLt = (html) => {
  const text = String(html ?? '')
  // A hyphenated name is a custom element only when the text also CLOSES it (<anki-mathjax>…</anki-mathjax>);
  // on its own it is a placeholder ("git checkout <branch-name>") and must stay visible.
  const closed = new Set([...text.matchAll(/<\/([a-zA-Z][\w-]*-[\w-]*)\s*>/g)].map((m) => m[1].toLowerCase()))
  // Kept as markup only when it really is a tag: a known name FOLLOWED by whitespace, "/", ">" or the end
  // ("a<b && c>d" and "j<i;" are code, not <b>/<i>), not a lone uppercase letter (the generics in
  // "PhantomData<S>", "fn f<A, B>"), and "<!" only for a comment ("List<?> items" lost its "<?>" to the
  // HTML parser's bogus-comment rule, "<?php ... ?>" vanished).
  return text.replace(/<(?!!--)(\/?)([a-zA-Z][\w-]*)?/g, (m, slash, name, offset) => {
    const next = text.charAt(offset + m.length)
    // With attributes, what follows must READ as attributes up to the ">" ("<b && c>" is code).
    const attrsOk = !/\s/.test(next) || /^(\s+[a-zA-Z_:][\w:.-]*(\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+))?)*\s*\/?>/.test(text.slice(offset + m.length))
    // A real tag CLOSES: ">" or "/>" right after the name, or attributes up to ">" (attrsOk). At the END of the
    // text or before a bare "/" it is not one ("True when a<b", "if a<b/2 then c"): kept as markup, the HTML
    // parser threw away everything from there.
    const real = name && (next === '>' || text.startsWith('/>', offset + m.length) || /\s/.test(next)) && attrsOk && !/^[A-Z]$/.test(name)
      && (HTML_TAGS.has(name.toLowerCase()) || (name.includes('-') && closed.has(name.toLowerCase())))
    return real ? m : '&lt;' + slash + (name || '')
  })
}

// NEW card content (AI-written, or typed) as safe card HTML. Anki's reviewer RUNS script in a card, and
// AnkiWeb carries the card to every device, so text a web-search result, a knowledge file or an
// attached deck smuggled into a model reply ("<img src=x onerror=…>") would execute on every review.
// Script-capable markup goes; formatting, [sound:…] and ordinary inline styles stay. Never applied to
// HTML read back from an existing card (copies, the audio embed): that is the user's own content.
const CARD_FORBID = ['script', 'iframe', 'frame', 'object', 'embed', 'style', 'link', 'meta', 'base', 'form', 'input', 'textarea', 'select', 'button']
export const sanitizeCardHtml = (html) => {
  const s = escapeStrayLt(html)
  try { return (DOMPurify && DOMPurify.isSupported) ? DOMPurify.sanitize(s, { FORBID_TAGS: CARD_FORBID }) : s } catch { return s }
}
