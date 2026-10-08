// Seeded property tests for the pure helpers several screens lean on. Each property runs over a few
// hundred generated inputs from a fixed seed, so a failure is reproducible (the failing case is printed).
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { splitTapTokens } from './tapTokens.js'
import { flattenConfig, diffConfig, mergeConfigPatch, NESTED_CONFIG_KEYS } from './configDiff.js'
import { cleanChatReply, boundChatHistory } from './chatReply.js'
import { snapWordsToBoxes, overlayBoxes, readingLines, hoverTooltipPos } from './ocrBoxes.js'
import { rng } from './testRng.js'
import { planChatSave } from '../server/chatSave.js'
import { detectHeadings, extractOutline, sliceSections, tocNorm } from '../server/knowledgeOutline.js'

const forAll = (n, seed, gen, check) => {
  const r = rng(seed)
  for (let i = 0; i < n; i++) {
    const input = gen(r, i)
    try { check(input) } catch (e) {
      e.message = `case ${i} (seed ${seed}): ${JSON.stringify(input)?.slice(0, 400)}\n${e.message}`
      throw e
    }
  }
}

// Text pieces from many scripts, including the awkward ones: emoji ZWJ sequences, flags, combining marks,
// RTL, CJK, Thai, a lone surrogate, NBSP and odd whitespace.
const PIECES = ['a', 'Z', 'é', 'é', 'ñ', 'ß', '1', '42', ' ', '  ', '\t', '\n', '\r\n', ' ', '　',
  '.', ',', '!', '?', '"', "'", '(', ')', '[', ']', '{', '}', ':', '-', '—', '–', '/', '\\', '*', '_',
  '你好', '世界', 'ひらがな', 'カタカナ', '学校에', '한국어', 'สวัสดี', 'ລາວ', 'ខ្មែរ', 'မြန်မာ',
  'مرحبا', 'שלום', 'नमस्ते', 'Ελλάδα', 'Россия', '👩‍👩‍👧', '🏳️‍🌈', '🇪🇸', '👍🏽', '🦐', '\ud800', '​', '‍']
const randText = (r, max = 12) => Array.from({ length: r.int(max) }, () => r.pick(PIECES)).join('')

// ── parseAiJson (lives in App.jsx; its block is self-contained, so the test loads that source) ──────────
const APP = fs.readFileSync(path.resolve(__dirname, '../App.jsx'), 'utf8')
const startAt = APP.indexOf('function escapeControlsInStrings(')
const endAt = APP.indexOf('// ONE JSON object embedded in an AI reply')
const parseAiJson = new Function(`${APP.slice(startAt, endAt)}\nreturn parseAiJson`)()

const JSON_KEYS = ['front', 'back', 'tags', 'id', 'correct', 'note', 'a', 'b', 'x y', 'ñ', '你好']
// JSON values whose strings never hold a backtick (parseAiJson strips ``` fences by design).
const SAFE_STR = ['', 'cat', "don't", "l'eau", 'say "hi"', 'a\nb', 'tab\there', '{ not json }', '[1, 2]', 'x}y', 'ü', '你好', '🦐', '\\', '/', 'a,b', ': ;']
const jsonValue = (r, depth = 0) => {
  const k = depth > 2 ? r.int(4) : r.int(6)
  if (k === 0) return r.pick(SAFE_STR)
  if (k === 1) return r.bool(0.5) ? r.int(1000) - 500 : Math.round(r.next() * 1000) / 10
  if (k === 2) return r.pick([true, false, null])
  if (k === 3) return r.pick(SAFE_STR) + r.int(10)
  if (k === 4) return Array.from({ length: r.int(4) }, () => jsonValue(r, depth + 1))
  return jsonObject(r, depth + 1)
}
const jsonObject = (r, depth = 0) => {
  const o = {}
  const n = 1 + r.int(4)
  for (let i = 0; i < n; i++) o[r.pick(JSON_KEYS)] = jsonValue(r, depth + 1)
  return o
}

describe('parseAiJson (property)', () => {
  it('never throws on any text', () => {
    const chars = ['{', '}', '[', ']', '"', "'", ',', ':', '\\', '`', '```json', '```', '\n', ' ', 'a', '1', 'true', 'null']
    forAll(1500, 11, (r) => Array.from({ length: r.int(60) }, () => (r.bool(0.8) ? r.pick(chars) : r.pick(PIECES))).join(''), (s) => {
      expect(() => parseAiJson(s)).not.toThrow()
    })
  })

  it('reads back any valid object or list, also inside a fence or after a preamble', () => {
    forAll(600, 12, (r) => (r.bool() ? jsonObject(r) : Array.from({ length: r.int(5) }, () => jsonObject(r))), (v) => {
      const text = JSON.stringify(v)
      expect(parseAiJson(text)).toEqual(v)
      expect(parseAiJson('```json\n' + JSON.stringify(v, null, 2) + '\n```')).toEqual(v)
      expect(parseAiJson('Here you go:\n' + text + '\nHope that helps.')).toEqual(v)
    })
  })

  it('a list cut off mid-way gives back only rows that were really there, in order', () => {
    forAll(600, 13, (r) => {
      const rows = Array.from({ length: 1 + r.int(6) }, () => jsonObject(r))
      const text = JSON.stringify(rows)
      return { rows, cut: text.slice(0, 1 + r.int(text.length - 1)) }
    }, ({ rows, cut }) => {
      const got = parseAiJson(cut)
      if (got == null) return
      const list = Array.isArray(got) ? got : [got]
      // Every row returned is one of the originals, in their order (a subsequence): nothing invented.
      let at = 0
      for (const row of list) {
        while (at < rows.length && JSON.stringify(rows[at]) !== JSON.stringify(row)) at++
        expect(at).toBeLessThan(rows.length)
        at++
      }
    })
  })

  it('a stray closing brace between rows does not lose the rows after it', () => {
    const got = parseAiJson('[{"front":"a"}}, {"front":"b"}, {"front":"c"}')
    expect([...got]).toEqual([{ front: 'a' }, { front: 'b' }, { front: 'c' }])
  })

  it('stays linear on 100k-character adversarial replies', () => {
    const N = 100000
    const cases = [
      '{'.repeat(N), '['.repeat(N), '"'.repeat(N), '{"a":'.repeat(N / 5), ', '.repeat(N / 2), '{}'.repeat(N / 2),
      '[{"a":"' + 'x'.repeat(N) , '{"a":"' + '\\"'.repeat(N / 2), "{'a':'" + "b'".repeat(N / 2),
      '[' + '{"a":1},'.repeat(N / 8), '}'.repeat(N) + '{"a":1}', '"a" '.repeat(N / 4) + '{',
    ]
    for (const c of cases) {
      const t0 = Date.now()
      parseAiJson(c)
      expect(Date.now() - t0, c.slice(0, 12)).toBeLessThan(1500)
    }
  })
})

// ── tapTokens ───────────────────────────────────────────────────────────────
describe('splitTapTokens (property)', () => {
  it('the tokens joined give the text back, with or without a word segmenter', () => {
    forAll(1500, 21, (r) => randText(r, 20), (text) => {
      expect(splitTapTokens(text).join('')).toBe(text)
      expect(splitTapTokens(text, null).join('')).toBe(text)
    })
  })
  it('no token mixes whitespace with text', () => {
    forAll(800, 22, (r) => randText(r, 20), (text) => {
      for (const tok of splitTapTokens(text)) if (/\s/.test(tok)) expect(tok).toMatch(/^\s+$/)
    })
  })
})

// ── configDiff ──────────────────────────────────────────────────────────────
const CFG_TOP = ['appTheme', 'appLanguage', 'provider', 'intelligence', 'showTokenUsage', ...NESTED_CONFIG_KEYS]
const CFG_SUB = ['gemini', 'openai', 'anthropic', 'defaultRegions', 'legends', 'game']
const CFG_LEAF = ['chat', 'deck', 'cheap', 'max', 'es', 'fr', 'taunts', 'raidLoadout']
const cfgLeafValue = (r) => r.pick(['a', 'b', 1, 2, true, false, null, ['x'], ['x', 'y'], { deep: 1 }, { deep: 2 }])
const cfgMap = (r, level) => {
  const o = {}
  const keys = level === 1 ? CFG_SUB : CFG_LEAF
  for (let i = r.int(4); i > 0; i--) {
    const k = r.pick(keys)
    // An entry may be a map, a value, or (sometimes) change type between configs.
    o[k] = level === 1 && r.bool(0.75) ? cfgMap(r, 2) : cfgLeafValue(r)
  }
  return o
}
const cfg = (r) => {
  const o = {}
  for (const k of CFG_TOP) {
    if (r.bool(0.3)) continue
    o[k] = NESTED_CONFIG_KEYS.includes(k) && r.bool(0.85) ? cfgMap(r, 1) : cfgLeafValue(r)
  }
  return o
}
// Mutate a config a little: change, add or remove entries at every level, sometimes change a type.
const mutate = (r, c) => {
  const out = JSON.parse(JSON.stringify(c))
  for (let n = 1 + r.int(4); n > 0; n--) {
    const k = r.pick(CFG_TOP)
    const roll = r.int(5)
    if (roll === 0) delete out[k]
    else if (roll === 1 || !NESTED_CONFIG_KEYS.includes(k)) out[k] = r.bool(0.8) && NESTED_CONFIG_KEYS.includes(k) ? cfgMap(r, 1) : cfgLeafValue(r)
    else {
      if (out[k] == null || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {}
      const s = r.pick(CFG_SUB)
      const sub = r.int(4)
      if (sub === 0) delete out[k][s]
      else if (sub === 1) out[k][s] = cfgLeafValue(r)
      else {
        if (out[k][s] == null || typeof out[k][s] !== 'object' || Array.isArray(out[k][s])) out[k][s] = {}
        const l = r.pick(CFG_LEAF)
        if (r.bool(0.3)) delete out[k][s][l]
        else out[k][s][l] = cfgLeafValue(r)
      }
    }
  }
  return out
}
const jsonEq = (a, b) => expect(JSON.parse(JSON.stringify(a ?? null))).toEqual(JSON.parse(JSON.stringify(b ?? null)))

describe('configDiff (property)', () => {
  it('posting the diff over the stored copy gives the new config (keys still in the state)', () => {
    forAll(1500, 31, (r) => { const prev = cfg(r); return { prev, next: mutate(r, prev) } }, ({ prev, next }) => {
      const d = diffConfig(flattenConfig(prev), flattenConfig(next), next)
      const stored = d ? mergeConfigPatch(prev, d.body) : prev
      for (const k of Object.keys(next)) jsonEq(stored[k], next[k])
      // A key that left the state is never posted, so the disk keeps it (another computer may still use it).
      for (const k of Object.keys(prev)) if (!(k in next)) jsonEq(stored[k], prev[k])
    })
  })
  it('no change posts nothing', () => {
    forAll(500, 32, (r) => cfg(r), (c) => {
      expect(diffConfig(flattenConfig(c), flattenConfig(JSON.parse(JSON.stringify(c))), c)).toBeNull()
    })
  })
  it('the posted patch never touches entries this computer did not change', () => {
    forAll(800, 33, (r) => { const prev = cfg(r); return { prev, next: mutate(r, prev), other: cfg(r) } }, ({ prev, next, other }) => {
      // Another computer's disk copy: the patch from prev → next lands on it.
      const d = diffConfig(flattenConfig(prev), flattenConfig(next), next)
      if (!d) return
      const stored = mergeConfigPatch(other, d.body)
      const isMap = (v) => !!v && typeof v === 'object' && !Array.isArray(v)
      const same = (a, b) => JSON.stringify(a) === JSON.stringify(b)
      for (const k of Object.keys(other)) {
        // A top-level key this computer did not post keeps the other computer's value.
        const unset = d.body.__unset || []
        if (!(k in d.body) && !unset.some((u) => u[0] === k)) { jsonEq(stored[k], other[k]); continue }
        // Inside a map both sides kept as a map: an entry this computer left exactly as it was keeps theirs.
        if (!NESTED_CONFIG_KEYS.includes(k) || !isMap(prev[k]) || !isMap(next[k]) || !isMap(other[k])) continue
        for (const s of Object.keys(other[k])) {
          const untouched = Object.hasOwn(prev[k], s) === Object.hasOwn(next[k], s) && same(prev[k][s], next[k][s])
          if (untouched && !(s in (d.body[k] || {})) && !unset.some((u) => u[0] === k && u[1] === s)) jsonEq(stored[k][s], other[k][s])
        }
      }
    })
  })
})

// ── chatReply ───────────────────────────────────────────────────────────────
const REPLY_PIECES = [...PIECES, '<anki-card>{"front":"a"}</anki-card>', '<sources>x</sources>', '<progress-update>', '1 – 2', ' — ', '🦐!', ' 🦐 ', '🦞', '\n  code', '<offer-search>q</offer-search>']
describe('chatReply (property)', () => {
  it('cleaning a reply twice changes nothing more', () => {
    forAll(1500, 41, (r) => Array.from({ length: r.int(15) }, () => r.pick(REPLY_PIECES)).join(''), (s) => {
      const once = cleanChatReply(s)
      expect(cleanChatReply(once)).toBe(once)
    })
  })
  it('a cleaned reply holds no em dash, no shrimp and no machine tag', () => {
    forAll(1500, 42, (r) => Array.from({ length: r.int(15) }, () => r.pick(REPLY_PIECES)).join(''), (s) => {
      const out = cleanChatReply(s)
      expect(out).not.toMatch(/[—🦐🦞🦀]|<\/?(anki-card|progress-update|sources|offer-search)>/u)
    })
  })
  it('history stays within its budget and always keeps the newest turn', () => {
    forAll(500, 43, (r) => ({
      msgs: Array.from({ length: r.int(30) }, () => ({ role: r.pick(['user', 'assistant']), content: 'x'.repeat(r.int(3000)), error: r.bool(0.1) })),
      budget: 1000 + r.int(20000),
    }), ({ msgs, budget }) => {
      const out = boundChatHistory(msgs, { budget, firstCap: 500 })
      const real = msgs.filter((m) => !m.error)
      if (!real.length) { expect(out).toBe(''); return }
      const newest = `${real[real.length - 1].role === 'user' ? 'User' : 'Assistant'}: ${real[real.length - 1].content}`
      expect(out.endsWith(newest)).toBe(true)
      // Budget, plus the one newest turn that may exceed it alone, plus the capped opening and the marker.
      expect(out.length).toBeLessThanOrEqual(Math.max(budget, newest.length) + 500 + 200 + real.length * 2)
    })
  })
})

// ── chatSave ────────────────────────────────────────────────────────────────
const msg = (r) => ({
  role: r.pick(['user', 'assistant']), content: r.pick(['hi', 'hola', 'x', '']),
  ...(r.bool(0.1) ? { error: true } : {}),
  ...(r.bool(0.3) ? { cards: [{ front: r.pick(['a', 'b']), back: 'B', ...(r.bool(0.5) ? { synced: true, addedTo: 'Deck' } : {}) }] } : {}),
})
describe('planChatSave (property)', () => {
  it('never saves an error bubble, forks only when the disk copy is not a prefix, never un-adds a card', () => {
    forAll(1500, 51, (r) => {
      const disk = Array.from({ length: r.int(6) }, () => msg(r))
      const keepPrefix = r.bool(0.6)
      const incoming = keepPrefix ? [...JSON.parse(JSON.stringify(disk)).map((m) => (m.cards && r.bool(0.5) ? { ...m, cards: m.cards.map((c) => ({ ...c, synced: false })) } : m)), ...Array.from({ length: r.int(4) }, () => msg(r))] : Array.from({ length: r.int(8) }, () => msg(r))
      return { body: { messages: incoming, title: 't', type: r.pick(['chat', 'help', undefined]), mode: 'M', keepTitle: r.bool(), hasId: r.bool(0.8) }, disk: { messages: disk, title: 'Disk', type: 'chat', mode: 'D' } }
    }, ({ body, disk }) => {
      const plan = planChatSave(body, disk)
      expect(plan.messages.some((m) => m && m.error)).toBe(false)
      const inc = body.messages.filter((m) => !m.error)
      expect(plan.messages.map((m) => [m.role, m.content])).toEqual(inc.map((m) => [m.role, m.content]))
      const had = disk.messages.filter((m) => !m.error)
      const isPrefix = had.length <= inc.length && had.every((m, i) => m.role === inc[i].role && m.content === inc[i].content)
      expect(plan.fork).toBe(!!body.hasId && !isPrefix)
      // A card the incoming copy marks added stays added.
      plan.messages.forEach((m, i) => (inc[i].cards || []).forEach((c, j) => { if (c.synced) expect(m.cards[j].synced).toBe(true) }))
      if (plan.type === 'help') expect(plan.mode).toBeUndefined()
    })
  })
})

// ── knowledge outline ───────────────────────────────────────────────────────
describe('knowledge outline (property)', () => {
  it('stays linear on 100k-character lines built from the risky pieces', () => {
    const risky = [' .', '.', ' ', '…', '_ ', '1.', '1 ', 'iv', 'Chapter ', '第', '章', ' \t', 'a, ', '·', '9']
    forAll(12, 61, (r) => Array.from({ length: 30000 }, () => r.pick(risky)).join('').slice(0, 100000), (line) => {
      const t0 = Date.now()
      detectHeadings({ name: 'a.txt', text: line })
      tocNorm(line, false)
      extractOutline([{ name: 'toc.txt', text: line }, { name: 'b.txt', text: line }])
      expect(Date.now() - t0).toBeLessThan(2000)
    })
  })
  it('finds every chapter of a generated book, in order, and section slices respect the cap', () => {
    const WORDS = ['Networks', 'Ports', 'Cabling', 'Security', 'Routing', 'Wireless', 'Storage', 'Cloud', 'Printers', 'Mobile']
    forAll(200, 62, (r) => {
      const n = 2 + r.int(8)
      const titles = Array.from({ length: n }, (_, i) => `${WORDS[i]} ${r.pick(['Basics', 'in Depth', 'Explained', 'Overview'])}`)
      const style = r.pick(['chapter', 'md', 'num'])
      const parts = titles.map((t, i) => {
        const head = style === 'chapter' ? `Chapter ${i + 1}: ${t}` : style === 'md' ? `# ${t}` : `${i + 1}. ${t}`
        const body = Array.from({ length: 1 + r.int(4) }, () => 'This paragraph explains the topic in plain words and ends with a period.').join('\n')
        return `${head}\n${body}`
      })
      return { titles, style, text: parts.join(r.pick(['\n', '\n\n', '\r\n'])) }
    }, ({ titles, style, text }) => {
      const name = style === 'md' ? 'book.md' : 'book.txt'
      const outline = detectHeadings({ name, text })
      const found = outline.map((h) => h.title)
      titles.forEach((t) => expect(found.some((f) => f.includes(t))).toBe(true))
      const idx = titles.map((t) => found.findIndex((f) => f.includes(t)))
      expect([...idx].sort((a, b) => a - b)).toEqual(idx)
      const cap = 50 + titles.length * 10
      expect(sliceSections([{ name, text }], outline.map((h) => ({ ...h, file: name })), outline.map((_, i) => i), cap).length).toBeLessThanOrEqual(cap)
    })
  })
})

// ── ocrBoxes ────────────────────────────────────────────────────────────────
const OCR_TEXT = ['por', 'favor', 'New', 'York', '你', '好', '世界', 'café', 'cafe', 'Hola', '¡Hola!', '', '42', 'مرحبا']
const box = (r) => { const x0 = r.int(900), y0 = r.int(900); return { x0, y0, x1: x0 + 5 + r.int(200), y1: y0 + 5 + r.int(40) } }
describe('ocrBoxes (property)', () => {
  it('every vision word ends either snapped or approximate, never both; the count matches; nothing throws', () => {
    forAll(1500, 71, (r) => ({
      words: Array.from({ length: r.int(10) }, () => (r.bool(0.05) ? null : { text: r.pick(OCR_TEXT) + (r.bool(0.2) ? ' ' + r.pick(OCR_TEXT) : ''), ...(r.bool(0.95) ? { bbox: box(r) } : {}) })),
      tess: Array.from({ length: r.int(12) }, () => ({ text: r.pick(OCR_TEXT), bbox: box(r), confidence: r.int(100) })),
    }), ({ words, tess }) => {
      const n = snapWordsToBoxes(words, tess)
      const real = words.filter(Boolean)
      expect(real.filter((w) => w._snapped).length).toBe(n)
      for (const w of real) expect(!!w._snapped !== !!w._approxBox).toBe(true)
    })
  })
  it('the same texts in any order all snap to their own boxes', () => {
    forAll(600, 72, (r) => {
      const texts = [...new Set(Array.from({ length: 1 + r.int(8) }, () => r.pick(OCR_TEXT)).filter((t) => t && t.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '')))]
        .filter((t, i, all) => all.findIndex((u) => u.toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '') === t.toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '')) === i)
      const tess = texts.map((t) => ({ text: t, bbox: box(r), confidence: 90 }))
      const words = texts.map((t) => ({ text: t, bbox: box(r) })).sort(() => r.next() - 0.5)
      return { tess, words }
    }, ({ tess, words }) => {
      snapWordsToBoxes(words, tess)
      for (const w of words) {
        expect(w._snapped).toBe(true)
        expect(w.bbox).toEqual(tess.find((t) => t.text === w.text).bbox)
      }
    })
  })
  it('drawn overlays on one row never overlap; reading lines cover every boxed word once', () => {
    forAll(800, 73, (r) => Array.from({ length: r.int(12) }, () => ({ text: r.pick(OCR_TEXT), bbox: box(r) })), (words) => {
      const boxes = overlayBoxes(words)
      expect(boxes.length).toBe(words.length)
      const idxs = readingLines(words).flatMap((l) => l.idxs).sort((a, b) => a - b)
      expect(idxs).toEqual(words.map((_, i) => i))
    })
  })
  it('a hover tooltip stays inside the zoomed viewport', () => {
    forAll(800, 74, (r) => ({ rect: { left: r.int(3000) - 200, top: r.int(2000) - 100, width: r.int(300), height: 20, bottom: 0 }, zoom: [1, 1.35, 2][r.int(3)], vw: 200 + r.int(3000) }), ({ rect, zoom, vw }) => {
      rect.bottom = rect.top + rect.height
      const p = hoverTooltipPos(rect, zoom, vw)
      const layoutW = vw / zoom
      if (layoutW > 320) { expect(p.x).toBeGreaterThanOrEqual(160); expect(p.x).toBeLessThanOrEqual(layoutW - 160) } else expect(p.x).toBe(layoutW / 2)
    })
  })
})
