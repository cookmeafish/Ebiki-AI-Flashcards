import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { stillImageSvg } from './plan'

const FILE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
<g class="lg-loop"><animateTransform attributeName="transform" type="rotate" values="0;10;0" dur="2s" repeatCount="indefinite"/>
<path d="M0 0L10 10" fill="var(--lg-tint, #f00)"/></g>
<g><animateMotion dur="1s" repeatCount="indefinite"><mpath href="#p"/></animateMotion><circle r="2" fill="var(--lg-ink, #123)"/></g>
</svg>`

describe('stillImageSvg', () => {
  const out = stillImageSvg(FILE, { width: 127, height: 127, grow: 0.2, lookup: (n) => (n === '--lg-tint' ? '#0f0' : '') })
  it('drops every animation, self-closing or with children', () => {
    expect(out).not.toMatch(/animate|mpath/)
    expect(out).toContain('<circle')
  })
  it('sizes the root, keeps the page aspect rule and widens the viewBox by the headroom', () => {
    expect(out).toMatch(/<svg[^>]*width="127" height="127" preserveAspectRatio="xMidYMid slice" overflow="visible">/)
    expect(out).toContain('viewBox="-24 -24 168 168"')
    expect(out.match(/width=/g).length).toBe(1)
  })
  it('resolves var()s from the box, else their fallback', () => {
    expect(out).toContain('fill="#0f0"')
    expect(out).toContain('fill="#123"')
    expect(out).not.toContain('var(')
  })
  it('leaves a banner viewBox alone and refuses a non-SVG', () => {
    expect(stillImageSvg(FILE, { width: 10, height: 10 })).toContain('viewBox="0 0 120 120"')
    expect(stillImageSvg('<html></html>', { width: 1, height: 1 })).toBe('')
  })
  it('every art file is well-formed enough for an image (no attribute given twice in one tag)', () => {
    const root = path.resolve(__dirname, '../../../../public/assets/legends')
    for (const dir of ['raids', 'bosses', 'areas']) {
      for (const f of fs.readdirSync(path.join(root, dir)).filter((x) => x.endsWith('.svg'))) {
        const text = fs.readFileSync(path.join(root, dir, f), 'utf8')
        for (const tag of text.match(/<[a-zA-Z][^>]*>/g) || []) {
          const names = [...tag.matchAll(/\s([\w:-]+)\s*=\s*"/g)].map((m) => m[1])
          expect(new Set(names).size, `${dir}/${f}: ${tag.slice(0, 120)}`).toBe(names.length)
        }
      }
    }
  })
})
