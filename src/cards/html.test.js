import { describe, it, expect } from 'vitest'
import { cardHtmlForText, escapeStrayLt } from './html'

// The tag strip the app runs after cardHtmlForText (stand-in for the inert DOM parse: no DOM in these tests).
const tags = (s) => s.replace(/<[^>]*>/g, '')
const text = (h) => tags(cardHtmlForText(h))

describe('cardHtmlForText (shared-deck markup read as text)', () => {
  it('drops script and style bodies, closed or not', () => {
    expect(text('<script>window.x=1</script>Traducción: danger<style>body{display:none}</style>')).toBe('Traducción: danger')
    expect(text('ok<SCRIPT type="text/javascript">a<b</SCRIPT >!')).toBe('ok!')
    expect(text('ok<script>never closed')).toBe('ok')
    expect(text('<template><b>x</b></template>y<noscript>z</noscript>')).toBe('y')
  })
  it('keeps an <img onerror> as markup for the inert parse (no text of its own)', () => {
    expect(text('peligro<img src=x onerror="window.p=1">')).toBe('peligro')
  })
  it('puts furigana readings in brackets and drops <rp>', () => {
    expect(text('<ruby>日本<rt>にほん</rt></ruby>')).toBe('日本(にほん)')
    expect(text('<ruby>漢<rp>(</rp><rt>かん</rt><rp>)</rp>字<rp>(</rp><rt>じ</rt><rp>)</rp></ruby>')).toBe('漢(かん)字(じ)')
    expect(text('<ruby><rb>東京</rb><rt> とうきょう </rt></ruby>')).toBe('東京(とうきょう)')
    expect(text('<ruby>x<rt></rt></ruby>')).toBe('x')
  })
  it('separates table cells and rows', () => {
    const t = '<table><tr><td>ser</td><td>permanent</td></tr><tr><th>estar</th> <td>temporary</td></tr></table>'
    expect(text(t)).toBe('ser | permanent\nestar | temporary')
  })
  it('leaves ordinary card HTML alone', () => {
    const h = '<b>Traducción:</b> dog<br>[sound:ebiki-perro.mp3]<div>🔊 <a href="https://x">A</a></div> \\(a^2\\) {{c1::x}}'
    expect(cardHtmlForText(h)).toBe(h)
    expect(cardHtmlForText(null)).toBe('')
  })
  it('is linear on a long unclosed field', () => {
    const big = '<script>' + 'a<b '.repeat(20000)
    const t0 = Date.now(); cardHtmlForText(big + '<style>' + 'x'.repeat(50000)); expect(Date.now() - t0).toBeLessThan(500)
  })
})

describe('escapeStrayLt', () => {
  it('keeps real tags, escapes code', () => {
    expect(escapeStrayLt('#include <stdio.h> and a < b')).toBe('#include &lt;stdio.h> and a &lt; b')
    expect(escapeStrayLt('<b>x</b><ruby>日<rt>ひ</rt></ruby>')).toBe('<b>x</b><ruby>日<rt>ひ</rt></ruby>')
  })
})

describe('cardHtmlForText after a caller turned </tr> into text', () => {
  it('still ends the row inside the cell', () => {
    expect(text('<table><tr><td>a</td><td>b</td> · <tr><td>c</td></tr></table>')).toBe('a | b\n · c')
  })
})

describe('escapeStrayLt: bare placeholders and generics', () => {
  it('escapes a bare tag-named placeholder that nothing closes', () => {
    expect(escapeStrayLt('cp <source> <dest>')).toBe('cp &lt;source> &lt;dest>')
    expect(escapeStrayLt('prog <input> <output>')).toBe('prog &lt;input> &lt;output>')
    expect(escapeStrayLt('List<Object> and Promise<Data>')).toBe('List&lt;Object> and Promise&lt;Data>')
  })
  it('keeps real markup: closed bare tags, void breaks, tags with attributes, closing tags', () => {
    expect(escapeStrayLt('a<b>x</b> line<br>next<hr>')).toBe('a<b>x</b> line<br>next<hr>')
    expect(escapeStrayLt('<div>one</div><DIV>two</div>')).toBe('<div>one</div><DIV>two</div>')
    expect(escapeStrayLt('<img src="a.jpg"><span class="x">y</span>')).toBe('<img src="a.jpg"><span class="x">y</span>')
    expect(escapeStrayLt('<br/>ok')).toBe('<br/>ok')
  })
})
