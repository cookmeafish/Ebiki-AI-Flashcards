// PBQ engine — pure logic for CompTIA-style performance-based questions (matching / ordering /
// categorize). No React, no network: everything here is deterministic and unit-tested, so the AI's
// only job is authoring content that must survive `compilePbq` + the blind-solve comparison before
// a student ever sees it.
//
// AUTHORING format (what the generator model returns) is deliberately index-free — models are bad
// at index bookkeeping, so they author in aligned/grouped text form:
//   matching:   { kind, title, scenario, pairs: [["left","right"], ...] }
//   ordering:   { kind, title, scenario, steps: ["first", "second", ...] }  // in CORRECT order
//   categorize: { kind, title, scenario, groups: { "Category": ["item", ...], ... } }
// plus optional  citations: [{ "quote": "..." }]  when a knowledge base grounded the content.
//
// COMPILED format (what the app stores/renders) is index-based with the presentation order already
// shuffled here (never trust the model to randomize):
//   matching:   { kind, title, scenario, left: [...], right: [...], answer: [rightIdx per left] }
//   ordering:   { kind, title, scenario, items: [...], answer: [correct position per item] }
//   categorize: { kind, title, scenario, categories: [...], items: [...], answer: [catIdx per item] }
//
// USER/SOLVER answers reduce to one canonical shape: an array `assign` aligned with the compiled
// left/items array (matching → right index, ordering → position, categorize → category index;
// null = unanswered).

export const PBQ_KINDS = ['matching', 'ordering', 'categorize']

const LIMITS = {
  matching: { min: 4, max: 6 },
  ordering: { min: 4, max: 6 },
  categorize: { minItems: 5, maxItems: 8, minCats: 2, maxCats: 3 },
}

// ---------------------------------------------------------------------------
// text normalization (shared by dedupe, citation checks, and solver matching)
// ---------------------------------------------------------------------------
export const norm = (s) => String(s ?? '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim()

const clean = (s) => String(s ?? '').replace(/\s+/g, ' ').trim()

// Fisher–Yates over index array; injectable rng for deterministic tests
const shuffledIndices = (n, rng = Math.random) => {
  const idx = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]
  }
  return idx
}

// ---------------------------------------------------------------------------
// icons: optional emoji per item/category, purely cosmetic. Rendered via the
// OS emoji font (Segoe UI Emoji / Noto Color Emoji) — no assets. Keyed by
// normalized item text; junk (letters/digits, over-long strings) is dropped.
// NEVER part of grading, and studentView excludes them (blind solver is text-only).
// ---------------------------------------------------------------------------
const parseIcons = (raw) => {
  const icons = {}
  if (raw?.icons && typeof raw.icons === 'object' && !Array.isArray(raw.icons)) {
    for (const [k, v] of Object.entries(raw.icons)) {
      const key = norm(k)
      const icon = String(v ?? '').trim()
      if (key && icon && icon.length <= 10 && !/[\p{L}\p{N}]/u.test(icon)) icons[key] = icon
    }
  }
  return icons
}

export const iconFor = (pbq, text) => pbq?.icons?.[norm(text)] || null

// ---------------------------------------------------------------------------
// compile: authoring JSON → validated, shuffled, index-based PBQ
// ---------------------------------------------------------------------------
export const compilePbq = (raw, rng = Math.random) => {
  const errors = []
  if (!raw || typeof raw !== 'object') return { ok: false, errors: ['not an object'] }
  const kind = String(raw.kind || '').toLowerCase()
  if (!PBQ_KINDS.includes(kind)) return { ok: false, errors: [`unknown kind "${raw.kind}"`] }
  const title = clean(raw.title)
  const scenario = clean(raw.scenario)
  if (!title) errors.push('missing title')
  if (!scenario) errors.push('missing scenario')

  const dupes = (arr) => {
    const seen = new Set(); const d = []
    for (const x of arr) { const n = norm(x); if (!n) { d.push('(empty)') } else if (seen.has(n)) d.push(x); else seen.add(n) }
    return d
  }

  let pbq = null
  if (kind === 'matching') {
    const pairs = Array.isArray(raw.pairs) ? raw.pairs.filter(p => Array.isArray(p) && p.length === 2) : []
    if (pairs.length < LIMITS.matching.min || pairs.length > LIMITS.matching.max) {
      errors.push(`matching needs ${LIMITS.matching.min}-${LIMITS.matching.max} pairs, got ${pairs.length}`)
    } else {
      const left = pairs.map(p => clean(p[0]))
      const right = pairs.map(p => clean(p[1]))
      const dl = dupes(left), dr = dupes(right)
      if (dl.length) errors.push(`duplicate/empty left items: ${dl.join(', ')}`)
      if (dr.length) errors.push(`duplicate/empty right items: ${dr.join(', ')}`)
      if (!errors.length) {
        // shuffle the right column; answer[i] = where left i's match landed
        const order = shuffledIndices(right.length, rng)          // order[newPos] = oldIdx
        const shuffledRight = order.map(oi => right[oi])
        const posOfOld = []; order.forEach((oi, pos) => { posOfOld[oi] = pos })
        pbq = { kind, title, scenario, left, right: shuffledRight, answer: left.map((_, i) => posOfOld[i]) }
      }
    }
  } else if (kind === 'ordering') {
    const steps = Array.isArray(raw.steps) ? raw.steps.map(clean) : []
    if (steps.length < LIMITS.ordering.min || steps.length > LIMITS.ordering.max) {
      errors.push(`ordering needs ${LIMITS.ordering.min}-${LIMITS.ordering.max} steps, got ${steps.length}`)
    } else {
      const d = dupes(steps)
      if (d.length) errors.push(`duplicate/empty steps: ${d.join(', ')}`)
      if (!errors.length) {
        const order = shuffledIndices(steps.length, rng)          // order[pos] = correct-seq idx shown at pos
        const items = order.map(ci => steps[ci])
        pbq = { kind, title, scenario, items, answer: order.map(ci => ci) } // answer[i] = item i's correct position
      }
    }
  } else if (kind === 'categorize') {
    const groups = (raw.groups && typeof raw.groups === 'object' && !Array.isArray(raw.groups)) ? raw.groups : null
    const categories = groups ? Object.keys(groups).map(clean) : []
    const catItems = groups ? Object.values(groups).map(v => (Array.isArray(v) ? v.map(clean) : [])) : []
    const items = catItems.flat()
    if (!groups || categories.length < LIMITS.categorize.minCats || categories.length > LIMITS.categorize.maxCats) {
      errors.push(`categorize needs ${LIMITS.categorize.minCats}-${LIMITS.categorize.maxCats} categories, got ${categories.length}`)
    } else if (items.length < LIMITS.categorize.minItems || items.length > LIMITS.categorize.maxItems) {
      errors.push(`categorize needs ${LIMITS.categorize.minItems}-${LIMITS.categorize.maxItems} items total, got ${items.length}`)
    } else if (catItems.some(list => list.length === 0)) {
      errors.push('every category needs at least one item')
    } else {
      const dc = dupes(categories), di = dupes(items)
      if (dc.length) errors.push(`duplicate/empty categories: ${dc.join(', ')}`)
      if (di.length) errors.push(`duplicate/empty items: ${di.join(', ')}`)
      if (!errors.length) {
        const catOf = []
        catItems.forEach((list, ci) => list.forEach(() => catOf.push(ci)))
        const order = shuffledIndices(items.length, rng)
        pbq = { kind, title, scenario, categories, items: order.map(oi => items[oi]), answer: order.map(oi => catOf[oi]) }
      }
    }
  }

  if (errors.length || !pbq) return { ok: false, errors: errors.length ? errors : ['could not compile'] }
  pbq.icons = parseIcons(raw)
  return { ok: true, pbq }
}

// ---------------------------------------------------------------------------
// citations: every quoted claim must literally appear in the source material
// ---------------------------------------------------------------------------
export const checkCitations = (raw, sourceText) => {
  const quotes = Array.isArray(raw?.citations) ? raw.citations.map(c => clean(c?.quote)).filter(q => q.length >= 12) : []
  if (quotes.length === 0) return { ok: false, missing: ['no usable citations (need quotes of 12+ chars)'] }
  const hay = norm(sourceText)
  const missing = quotes.filter(q => !hay.includes(norm(q)))
  return { ok: missing.length === 0, missing }
}

// ---------------------------------------------------------------------------
// student view (also what the blind solver sees — never contains the key)
// ---------------------------------------------------------------------------
export const studentView = (pbq) => {
  const v = { kind: pbq.kind, title: pbq.title, scenario: pbq.scenario }
  if (pbq.kind === 'matching') { v.left = [...pbq.left]; v.right = [...pbq.right] }
  if (pbq.kind === 'ordering') { v.items = [...pbq.items] }
  if (pbq.kind === 'categorize') { v.categories = [...pbq.categories]; v.items = [...pbq.items] }
  return v
}

// ---------------------------------------------------------------------------
// solver answer (text-based JSON) → canonical assign array
// ---------------------------------------------------------------------------
// Resolve a free-text mention against a list; exact normalized equality first,
// then unique containment either way (solvers sometimes echo abbreviated text).
const resolveText = (text, list) => {
  const n = norm(text)
  if (!n) return -1
  const exact = list.findIndex(x => norm(x) === n)
  if (exact !== -1) return exact
  const contains = list.map((x, i) => ({ i, n: norm(x) })).filter(e => e.n.includes(n) || n.includes(e.n))
  return contains.length === 1 ? contains[0].i : -1
}

export const parseSolverAnswer = (pbq, solved) => {
  if (!solved || typeof solved !== 'object') return null
  const assign = new Array(pbq.kind === 'matching' ? pbq.left.length : pbq.items.length).fill(null)
  if (pbq.kind === 'matching') {
    const pairs = Array.isArray(solved.pairs) ? solved.pairs : []
    for (const p of pairs) {
      if (!Array.isArray(p) || p.length !== 2) continue
      const li = resolveText(p[0], pbq.left)
      const ri = resolveText(p[1], pbq.right)
      if (li !== -1 && ri !== -1) assign[li] = ri
    }
  } else if (pbq.kind === 'ordering') {
    const order = Array.isArray(solved.order) ? solved.order : []
    order.forEach((text, pos) => {
      const ii = resolveText(text, pbq.items)
      if (ii !== -1) assign[ii] = pos
    })
  } else if (pbq.kind === 'categorize') {
    const groups = (solved.groups && typeof solved.groups === 'object') ? solved.groups : {}
    for (const [cat, list] of Object.entries(groups)) {
      const ci = resolveText(cat, pbq.categories)
      if (ci === -1 || !Array.isArray(list)) continue
      for (const item of list) {
        const ii = resolveText(item, pbq.items)
        if (ii !== -1) assign[ii] = ci
      }
    }
  }
  return assign
}

// ---------------------------------------------------------------------------
// grading + key comparison (same core: assign vs pbq.answer)
// ---------------------------------------------------------------------------
export const gradePbq = (pbq, assign) => {
  const labels = pbq.kind === 'matching' ? pbq.left : pbq.items
  const targets = pbq.kind === 'matching' ? pbq.right
    : pbq.kind === 'categorize' ? pbq.categories
    : labels.map((_, i) => `#${i + 1}`) // ordering: target = position label
  const perItem = labels.map((label, i) => {
    const expected = pbq.answer[i]
    const got = Array.isArray(assign) ? assign[i] : null
    const correct = got !== null && got !== undefined && got === expected
    return {
      label,
      correct,
      expected,
      got: (got === null || got === undefined) ? null : got,
      expectedText: pbq.kind === 'ordering' ? `#${expected + 1}` : targets[expected],
      gotText: (got === null || got === undefined) ? null : (pbq.kind === 'ordering' ? `#${got + 1}` : targets[got]),
    }
  })
  const correct = perItem.filter(p => p.correct).length
  return { perItem, correct, total: perItem.length, fraction: perItem.length ? correct / perItem.length : 0 }
}

export const compareToKey = (pbq, assign) => {
  if (!Array.isArray(assign)) return { match: false, diffs: ['solver answer missing or unparseable'] }
  const { perItem, fraction } = gradePbq(pbq, assign)
  const diffs = perItem.filter(p => !p.correct).map(p =>
    `"${p.label}": key says ${JSON.stringify(p.expectedText)}, solver says ${p.gotText === null ? '(none)' : JSON.stringify(p.gotText)}`)
  return { match: fraction === 1, diffs }
}

// ---------------------------------------------------------------------------
// prompts
// ---------------------------------------------------------------------------
export const PBQ_GEN_SYSTEM = 'You author performance-based exam questions (PBQs). Always respond with a single valid JSON object. No markdown, no backticks, no commentary.'
export const PBQ_SOLVER_SYSTEM = 'You are an expert taking an exam. Solve the exercise using only what is shown. Always respond with a single valid JSON object. No markdown, no backticks.'
export const PBQ_JUDGE_SYSTEM = 'You adjudicate disagreements about exam answer keys. Always respond with a single valid JSON object. No markdown, no backticks.'

export const buildGeneratorPrompt = ({ subject, front, back, lang, knowledgeContext, priorFailure }) => `Create ONE performance-based question (PBQ) — the interactive exercise style used at the start of CompTIA exams — for the subject "${subject}", exercising this flashcard's topic:

Card front: "${front}"
Card back: "${back}"

Pick whichever ONE of these formats fits the topic best, and return EXACTLY that JSON shape:

1. matching — pair each item with its description/counterpart:
{"kind":"matching","title":"...","scenario":"...","pairs":[["left item","its matching right item"], ...4-6 pairs...]${knowledgeContext ? ',"citations":[{"quote":"..."}]' : ''}}

2. ordering — put steps of a process in the correct sequence:
{"kind":"ordering","title":"...","scenario":"...","steps":["first step","second step", ...4-6 steps IN CORRECT ORDER...]${knowledgeContext ? ',"citations":[{"quote":"..."}]' : ''}}

3. categorize — sort items into the correct buckets:
{"kind":"categorize","title":"...","scenario":"...","groups":{"Category A":["item",...],"Category B":["item",...]}${knowledgeContext ? ',"citations":[{"quote":"..."}]' : ''}}
(2-3 categories, 5-8 items total, every category non-empty)

HARD REQUIREMENTS:
- "scenario" = 1-3 sentences of realistic exam framing (a situation, not a definition dump). "title" = a short imperative instruction ("Match each attack to its description").
- EXACTLY ONE defensible answer key. No item may plausibly fit two right-hand matches or two categories; no two steps whose order could be argued either way. If the topic can't support that, pick a different format or angle within the same topic.
- Every left item, right item, step, and category must be SHORT (≤ 12 words) and mutually distinct.
- Do NOT reveal any answer inside the scenario or title.
- OPTIONAL "icons": additionally return an object mapping item/category texts to ONE fitting emoji each, e.g. {"icons":{"Keyboard":"⌨️","Firewall":"🧱","Phishing":"🎣"}}. Only include entries where a standard emoji obviously depicts the item; omit the rest (an empty or missing map is fine). The emoji must depict the item ITSELF and must NEVER hint at its correct match, category, or position.
- Write everything in ${lang}.
${knowledgeContext ? `- GROUND every fact in the reference material below and return "citations": 2-4 VERBATIM quotes (12+ chars each) copied from it that justify the answer key. Quotes must appear word-for-word in the material.\n\nREFERENCE MATERIAL:\n${knowledgeContext}` : '- Use only facts you are certain of; prefer textbook-standard content for this subject.'}
${priorFailure ? `\nYOUR PREVIOUS ATTEMPT WAS REJECTED: ${priorFailure}\nFix that specific problem — change the content, not just the wording.` : ''}
Output ONLY the raw JSON object.`

export const buildSolverPrompt = (view, lang) => {
  const body = view.kind === 'matching'
    ? `Left items: ${JSON.stringify(view.left)}\nRight items: ${JSON.stringify(view.right)}\n\nPair every left item with exactly one right item.\nReturn: {"pairs":[["<left item text>","<right item text>"], ...]}`
    : view.kind === 'ordering'
    ? `Steps (shuffled): ${JSON.stringify(view.items)}\n\nPut ALL the steps in the correct order.\nReturn: {"order":["<step text first>", "<step text second>", ...]}`
    : `Categories: ${JSON.stringify(view.categories)}\nItems (shuffled): ${JSON.stringify(view.items)}\n\nPlace EVERY item into exactly one category.\nReturn: {"groups":{"<category>":["<item>", ...], ...}}`
  return `Solve this exercise. Copy item texts EXACTLY as given (same language: ${lang}).\n\n${view.title}\n${view.scenario}\n\n${body}\n\nOutput ONLY the raw JSON object.`
}

export const buildJudgePrompt = ({ pbq, diffs, solverRaw, knowledgeContext }) => `An exam question's answer key disagrees with an independent expert who solved it blind. Decide who is right.

EXERCISE:
${JSON.stringify(studentView(pbq), null, 1)}

ANSWER KEY (as item → correct target):
${JSON.stringify(gradePbq(pbq, pbq.answer).perItem.map(p => `${p.label} → ${p.expectedText}`), null, 1)}

DISAGREEMENTS:
${diffs.join('\n')}

EXPERT'S RAW ANSWER:
${solverRaw}
${knowledgeContext ? `\nREFERENCE MATERIAL (authoritative):\n${knowledgeContext}` : ''}
Verdicts:
- "solver_wrong": the key is right; the expert made a mistake.
- "key_wrong": the key has at least one wrong entry.
- "ambiguous": more than one assignment is defensible (a flawed question).

Return: {"verdict":"solver_wrong"|"key_wrong"|"ambiguous","reason":"one concise sentence"}
Output ONLY the raw JSON object.`
