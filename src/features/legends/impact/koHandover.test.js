// THE KNOCKOUT HANDOVER (StrikeFxLayer.jsx): the DEFEATED stamp becomes the still defeated tag with never two plates at
// once. The real tag's own timer ran on the arena's mount clock and popped in while the stamp still faded (about 200 ms
// of two plates on every boss); now the stamp's own layer plays the tag's pop on the stamp's clock and hides the real
// tag (its next sibling) until the layer goes.
import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import StrikeFxLayer, { KoTag, KO_TAG_LEAD } from '../StrikeFxLayer'
import { koTiming } from './styles'
import { RAID_ORDER } from '../raid'

const t = (k) => k

describe('knockout handover', () => {
  it('every boss: the layer pops the tag in as its stamp ends, and hides the real tag meanwhile', () => {
    for (const motif of RAID_ORDER) {
      const kt = koTiming(motif)
      const html = renderToStaticMarkup(createElement(StrikeFxLayer, { t, moment: 'ko', motif, n: 1 }))
      // the stamp ends at kt.ms; the tag's pop starts KO_TAG_LEAD before (the stamp under 3% opaque by then)
      expect(html, motif).toMatch(new RegExp(`lgsStamp ${kt.stampMs}ms [^;"]* ${kt.stampAt}ms both`))
      expect(kt.stampAt + kt.stampMs).toBe(kt.ms)
      expect(html, motif).toMatch(new RegExp(`data-ko-tag-in[^>]*lgsKoTag 380ms cubic-bezier\\(\\.2,\\.9,\\.3,1\\) ${kt.ms - KO_TAG_LEAD}ms both`))
      expect(html.replaceAll('&quot;', '"')).toContain('[data-strike-fx="ko"] ~ [data-ko-tag] { opacity: 0 !important }')
    }
    expect(KO_TAG_LEAD).toBeGreaterThan(0)
    expect(KO_TAG_LEAD).toBeLessThanOrEqual(60)
  })
  it('the pop matches the real tag: same text, place and both sizes (14 px, 10.5 px on the compact arena)', () => {
    const html = renderToStaticMarkup(createElement(StrikeFxLayer, { t, moment: 'ko', motif: 'kitsune', n: 1 }))
    const real = renderToStaticMarkup(createElement(KoTag, { t, motif: 'kitsune' }))
    const small = renderToStaticMarkup(createElement(KoTag, { t, motif: 'kitsune', small: true }))
    expect(real).toMatch(/font-size:14px;padding:0 10px/)
    expect(small).toMatch(/font-size:10.5px;padding:0 6px/)
    expect(html).toContain('.lgs-kotag { font-size: 14px; padding: 0 10px }')
    expect(html).toContain('@container (max-width: 100px) { .lgs-kotag { font-size: 10.5px; padding: 0 6px } }')
    const where = (s) => /top:calc\(100% - 10px\);transform:translateX\(-50%\) rotate\(-4deg\)/.test(s)
    expect(where(real) && where(html)).toBe(true)
  })
  it('no other moment hides the tag or plays a pop', () => {
    for (const moment of ['hit', 'crit', 'hurtBig', 'block', 'shield', 'wind']) {
      const html = renderToStaticMarkup(createElement(StrikeFxLayer, { t, moment, motif: 'kitsune', n: 1 }))
      expect(html, moment).not.toMatch(/data-ko-tag/)
    }
  })
})
