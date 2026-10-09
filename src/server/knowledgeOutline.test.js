// Knowledge-base outline: chapter detection, running heads, toc.txt matching, and the linear-time rule (a
// backtracking regex once froze the whole server on one spaced dotted leader).
import { describe, it, expect } from 'vitest'
import { detectHeadings, extractOutline, sliceSections, tocNorm, TOC_NAME_RE } from './knowledgeOutline.js'

const titles = (o) => o.map((h) => h.title)
const book = (...parts) => parts.join('\n')

describe('linear time on adversarial lines (5000 characters)', () => {
  const LINES = [
    'a' + ' .'.repeat(2500) + 'x',
    '.'.repeat(5000) + 'x',
    ' '.repeat(5000) + 'x 1',
    '1 ' + 'and '.repeat(1250),
    'Chapter 1 ' + 'a, '.repeat(1600),
    '…'.repeat(5000) + 'x',
    '_ '.repeat(2500) + 'iv x',
    '第1章' + '一'.repeat(5000),
    '1.' + '1.'.repeat(2500) + ' x',
    ' \t'.repeat(2500) + '9',
  ]
  it.each(LINES.map((l) => [l.slice(0, 10), l]))('%s', (_, line) => {
    const start = Date.now()
    detectHeadings({ name: 'a.txt', text: line })
    tocNorm(line, false)
    extractOutline([{ name: 'toc.txt', text: `${line}\n${line}` }, { name: 'b.txt', text: `${line}\n${line}` }])
    expect(Date.now() - start).toBeLessThan(500)
  })
})

describe('detectHeadings', () => {
  it('finds chapter words, Roman numerals and CJK units with their levels', () => {
    const o = detectHeadings({ name: 'b.txt', text: book('Part I', 'x', 'CHAPTER IV', 'body', '第１章 はじめに', '本文', '第2节 细节', 'y') })
    expect(o.map((h) => [h.title, h.level])).toEqual([['Part I', 0], ['CHAPTER IV', 1], ['第１章 はじめに', 1], ['第2节 细节', 2]])
  })
  it('reads Windows line endings without a stray carriage return in titles', () => {
    const o = detectHeadings({ name: 'b.txt', text: 'Chapter 1: Basics\r\ntext\r\nChapter 2: More\r\ntext' })
    expect(titles(o)).toEqual(['Chapter 1: Basics', 'Chapter 2: More'])
  })
  it('wrapped prose that starts with a chapter word is not a heading', () => {
    expect(detectHeadings({ name: 'b.txt', text: 'Chapter 5 when we cover routing in depth' })).toEqual([])
  })
  it('a repeated running head keeps only the real chapter start', () => {
    const text = book('Chapter 2 Routing', 'long body '.repeat(50), 'Chapter 2 Routing 47', 'x', 'Chapter 2 Routing 49', 'y', 'Chapter 2 Routing 51', 'z')
    expect(titles(detectHeadings({ name: 'b.txt', text }))).toEqual(['Chapter 2 Routing'])
  })
  it('ignores headings inside code fences in markdown', () => {
    expect(titles(detectHeadings({ name: 'b.md', text: '# Real\n```\n# comment\n```\n## Also real' }))).toEqual(['Real', 'Also real'])
  })
})

describe('toc.txt', () => {
  it('is recognised by name', () => {
    expect(TOC_NAME_RE.test('toc.txt')).toBe(true)
    expect(TOC_NAME_RE.test('Table of Contents.md')).toBe(true)
    expect(TOC_NAME_RE.test('stock.txt')).toBe(false)
  })
  it('matches entries in order and slices a section up to the next one', () => {
    const files = [
      { name: 'toc.txt', text: 'Introduction ..... 1\nRouting . . . . 9\nSwitching ...... 20\nWireless .... 31' },
      { name: 'book.txt', text: book('Introduction', 'intro text', 'Routing', 'routing text', 'Switching', 'switch text', 'Wireless', 'wifi text') },
    ]
    const o = extractOutline(files)
    expect(titles(o)).toEqual(['Introduction', 'Routing', 'Switching', 'Wireless'])
    const sec = sliceSections(files.slice(1), o, [1], 10000)
    expect(sec).toContain('routing text')
    expect(sec).not.toContain('switch text')
  })
})

describe('realistic PDF books', () => {
  const para = (s) => `${s} explains the idea in plain words, with an example and a short note. `.repeat(4)
  it('drops contents-page lines with dotted leaders and keeps the real chapter starts', () => {
    const text = book(
      'Contents', 'Chapter 1 Networking .......... 1', '1.1 Topologies .......... 2', 'Chapter 2 Switching .......... 21', '2.1 VLANs .......... 22',
      'Chapter 3 Routing .......... 41', '3.1 Static Routes .......... 42', '',
      'Chapter 1 Networking', para('one'), '1.1 Topologies', para('topo'),
      'Chapter 2 Switching', para('two'), '2.1 VLANs', para('vlans'),
      'Chapter 3 Routing', para('three'), '3.1 Static Routes', para('static'))
    const o = detectHeadings({ name: 'book.txt', text })
    expect(titles(o)).toEqual(['Chapter 1 Networking', '1.1 Topologies', 'Chapter 2 Switching', '2.1 VLANs', 'Chapter 3 Routing', '3.1 Static Routes'])
    expect(o.every((h) => !/\.{3}/.test(h.title))).toBe(true)
  })
  it('page 1 running head "1 Chapter 1 ..." never beats the real chapter start', () => {
    const text = book('Chapter 1 Networking', para('intro'), '1.1 Topologies', para('a'), '1 Chapter 1 Networking', '1.2 Cables', para('b'),
      '3 Chapter 1 Networking', para('c'), '5 Chapter 1 Networking', para('d'), 'Chapter 2 Switching', para('e'))
    const o = detectHeadings({ name: 'book.txt', text })
    expect(o[0]).toMatchObject({ title: 'Chapter 1 Networking', start: 0 })
    expect(titles(o).filter((t) => /Chapter 1/.test(t))).toEqual(['Chapter 1 Networking'])
  })
  it('a bare "CHAPTER N" takes its title from the next line', () => {
    const text = book('CHAPTER 1', 'Getting Started', para('a'), 'CHAPTER 2', 'Installing the Tools', para('b'), 'CHAPTER 3', '', 'Your First Project', para('c'))
    expect(titles(detectHeadings({ name: 'g.txt', text }))).toEqual(['CHAPTER 1: Getting Started', 'CHAPTER 2: Installing the Tools', 'CHAPTER 3: Your First Project'])
  })
  it('a bare chapter followed by prose or a section keeps its bare title', () => {
    const text = book('Chapter 1', 'This chapter covers the basics of everything you need.', para('a'), 'Chapter 2', '2.1 Setup', para('b'))
    expect(titles(detectHeadings({ name: 'g.txt', text }))).toEqual(['Chapter 1', 'Chapter 2', '2.1 Setup'])
  })
  it('short CJK numbered titles count ("2.1 助詞")', () => {
    const text = book('第１章　はじめに', 'この章では基本を学びます。', '1.1 ひらがな', '本文。', '第２章　文法', '本文。', '2.1 助詞', '助詞は大切です。', '2.2 帧', '本文。')
    expect(titles(detectHeadings({ name: 'j.txt', text }))).toEqual(['第１章　はじめに', '1.1 ひらがな', '第２章　文法', '2.1 助詞', '2.2 帧'])
  })
  it('full-width numbered titles count, title kept as written ("１.１ ひらがな", "１．２ カタカナ")', () => {
    const text = book('第１章　はじめに', 'この章では基本を学びます。', '１.１ ひらがな', '本文。', '１．２ カタカナ', '本文。', '第２章　文法', '本文。', '２.１ 助詞', '本文。')
    const o = detectHeadings({ name: 'j.txt', text })
    expect(titles(o)).toEqual(['第１章　はじめに', '１.１ ひらがな', '１．２ カタカナ', '第２章　文法', '２.１ 助詞'])
    expect(o.find((h) => h.title === '１．２ カタカナ').level).toBe(2)
  })
  it('Arabic-Indic numbered titles count ("١٫١ مقدمة")', () => {
    const text = book('١ الشبكات', 'نص طويل هنا عن الشبكات.', '١٫١ مقدمة', 'نص.', '٢ التوجيه', 'نص.')
    expect(titles(detectHeadings({ name: 'a.txt', text }))).toEqual(['١ الشبكات', '١٫١ مقدمة', '٢ التوجيه'])
  })
  it('NBSP or a tab after the number still makes a heading', () => {
    const text = book('Chapter 1 Networking', 'Body text here.', '1.1 Topologies', 'Body.', '1.2\tCables', 'Body.')
    expect(titles(detectHeadings({ name: 'n.txt', text }))).toEqual(['Chapter 1 Networking', '1.1 Topologies', '1.2\tCables'])
  })
  it('full-width running heads with page numbers collapse like ASCII ones', () => {
    const p = 'Body text that fills a page with words. '.repeat(5)
    const text = book('第１章　文法', p, '２ 第１章　文法', p, '３ 第１章　文法', p, '４ 第１章　文法', p, '第２章　語彙', p)
    expect(titles(detectHeadings({ name: 'r.txt', text })).filter((t) => /第１章/.test(t))).toHaveLength(1)
  })
  it('tocNorm reads full-width digits and page numbers like ASCII ones', () => {
    expect(tocNorm('１．２ カタカナ……１２', false)).toBe(tocNorm('1.2 カタカナ……12', false))
    expect(tocNorm('第１章　はじめに　１２', false)).toBe('第1章　はじめに')
  })
  it('stays linear on 5000-char adversarial full-width lines', () => {
    const lines = ['１'.repeat(5000), '１．'.repeat(2500), '١٫'.repeat(2500), '１ ' + 'あ'.repeat(4998), '第' + '１'.repeat(4999)]
    const t0 = Date.now()
    for (const l of lines) detectHeadings({ name: 'x.txt', text: book(l, l, l) })
    expect(Date.now() - t0).toBeLessThan(500)
  })
})

describe('a big toc.txt of numbered entries sharing one word stays fast', () => {
  it('1,500 "Exercise N" entries over a 20k-line book match in order, well under a second', () => {
    const N = 1500
    const toc = Array.from({ length: N }, (_, i) => `Exercise ${i + 1}`).join('\n')
    const body = []
    for (let i = 1; i <= N; i++) { body.push(`Exercise ${i}`); for (let k = 0; k < 12; k++) body.push(`line ${k} of exercise ${i} text`) }
    const start = Date.now()
    const o = extractOutline([{ name: 'toc.txt', text: toc }, { name: 'book.txt', text: body.join('\n') }])
    expect(Date.now() - start).toBeLessThan(1000)
    expect(o).toHaveLength(N)
    expect(titles(o).slice(0, 3)).toEqual(['Exercise 1', 'Exercise 2', 'Exercise 3'])
    expect(titles(o)[N - 1]).toBe(`Exercise ${N}`)
  })
})
