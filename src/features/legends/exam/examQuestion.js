// THE EXAM QUESTION (pure, tested; docs/plans/2026-11-16-exam-format-questions.md D2): one frozen shape (format 1)
// for the pre-made course bank and, later, live questions. Here: the shape and its limits (`shapeExamQuestion`, check
// C1), the canonical key order the build hashes and ships, grading an answer (select-N too), the card signature a
// question is bound to (`cardSig`, the same function the build uses), the quiz-wide letter dealing (`balancedOrder`)
// and the mapping to the choice question QuizRunner reads (`toRunnerQuestion`). No network, no storage, no DOM.
import { fnv } from '../hash.js'

export const EXAM_FORMAT = 1
export const QUESTION_KINDS = ['definition', 'scenario', 'artifact']
export const ASK_WORDS = ['', 'BEST', 'MOST', 'NEXT', 'FIRST', 'NOT']
export const ARTIFACT_TYPES = ['log', 'config', 'rule', 'output', 'url', 'input', 'message']
export const SOURCE_PARTS = ['definition', 'example', 'keyPoints']
export const LIMITS = {
  stem: 600, level1Sentences: 4, bullet: 120, ask: 160, artifactLines: 8, artifactLine: 100,
  option: 60, why: 200, edge: 200, explain: 400, explainSentences: 3, bankSlots: 10, liveSlots: [10, 15],
}
// The frozen key order: what ships, what is hashed (without `rev`), what a reviewer stamps.
export const FIELD_ORDER = ['id', 'item', 'obj', 'slot', 'rev', 'cardSig', 'kind', 'level', 'pick', 'word', 'neg', 'stem',
  'bullets', 'ask', 'artifact', 'options', 'detail', 'runner', 'edge', 'explain', 'source']
const OPTION_ORDER = ['t', 'ok', 'item', 'partly', 'why']
const ARTIFACT_ORDER = ['type', 'lines', 'mark']
const SOURCE_ORDER = ['card', 'chapter']

// A card's signature: the text every review pass ran against (D3.6). front + U+0001 + back, FNV-1a base 36.
export const cardSig = (card) => fnv(`${card?.front ?? ''}\u0001${card?.back ?? ''}`)

// Sentences as the design counts them: split on . ! or ? followed by a space or the end.
export const sentences = (s) => String(s || '').split(/[.!?](?:\s|$)/).map((x) => x.trim()).filter(Boolean)

const isInt = (n) => Number.isInteger(n)
const isStr = (s) => typeof s === 'string'
const ordered = (obj, order) => {
  const out = {}
  for (const k of order) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}

// The question with its keys in the frozen order (`partly` kept only when true). `withRev: false` = the hash form.
export function canonicalQuestion(q, { withRev = true } = {}) {
  const c = ordered(q, FIELD_ORDER)
  if (!withRev) delete c.rev
  c.bullets = Array.isArray(q.bullets) ? [...q.bullets] : q.bullets
  c.artifact = q.artifact && typeof q.artifact === 'object' ? ordered({ ...q.artifact, lines: [...(q.artifact.lines || [])], mark: [...(q.artifact.mark || [])] }, ARTIFACT_ORDER) : q.artifact
  c.options = Array.isArray(q.options) ? q.options.map((o) => {
    const x = ordered(o || {}, OPTION_ORDER)
    if (x.partly !== true) delete x.partly
    return x
  }) : q.options
  c.source = q.source && typeof q.source === 'object' ? ordered(q.source, SOURCE_ORDER) : q.source
  return c
}

const ASK_END = { 1: /\?$/, 2: /\? \(Select TWO\)$/, 3: /\? \(Select THREE\)$/ }

// C1: every type and limit of the frozen v1 shape. → { ok, q (canonical, when ok), problems: [string] }.
// `live`: slots 10..15 instead of the bank's 0..9.
export function shapeExamQuestion(raw, { live = false } = {}) {
  const p = []
  const q = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : null
  if (!q) return { ok: false, q: null, problems: ['not an object'] }
  for (const k of Object.keys(q)) if (!FIELD_ORDER.includes(k)) p.push(`unknown field "${k}"`)
  for (const k of FIELD_ORDER) if (q[k] === undefined) p.push(`missing field "${k}"`)
  const need = (cond, msg) => { if (!cond) p.push(msg) }
  need(isStr(q.id) && q.id.length > 0, 'id must be a non-empty string')
  need(isStr(q.item) && q.item.length > 0, 'item must be a non-empty string')
  need(isStr(q.obj) && /^\d+\.\d+$/.test(q.obj), 'obj must be "N.N"')
  const [lo, hi] = live ? LIMITS.liveSlots : [0, LIMITS.bankSlots - 1]
  need(isInt(q.slot) && q.slot >= lo && q.slot <= hi, `slot must be an integer ${lo}..${hi}`)
  need(isInt(q.rev) && q.rev >= 1, 'rev must be an integer >= 1')
  need(isStr(q.cardSig) && q.cardSig.length > 0, 'cardSig must be a non-empty string')
  need(QUESTION_KINDS.includes(q.kind), `kind must be one of ${QUESTION_KINDS.join(', ')}`)
  need(q.level === 1 || q.level === 2, 'level must be 1 or 2')
  need(q.pick === 1 || q.pick === 2 || q.pick === 3, 'pick must be 1, 2 or 3')
  need(ASK_WORDS.includes(q.word), 'word must be "", BEST, MOST, NEXT, FIRST or NOT')
  need(typeof q.neg === 'boolean', 'neg must be a boolean')
  if (!isStr(q.stem)) p.push('stem must be a string')
  else {
    need(q.stem.length <= LIMITS.stem, `stem over ${LIMITS.stem} characters`)
    need(q.stem.trim() !== '' || q.kind === 'definition', 'stem may be empty only for kind "definition"')
    if (q.level === 1) need(sentences(q.stem).length <= LIMITS.level1Sentences, `level 1 stem over ${LIMITS.level1Sentences} sentences`)
  }
  if (!Array.isArray(q.bullets)) p.push('bullets must be a list')
  else {
    need([0, 3, 4].includes(q.bullets.length), 'bullets must hold 0, 3 or 4 entries')
    q.bullets.forEach((b, i) => need(isStr(b) && b.trim() && b.length <= LIMITS.bullet, `bullet ${i} must be text of at most ${LIMITS.bullet} characters`))
  }
  if (!isStr(q.ask)) p.push('ask must be a string')
  else {
    need(q.ask.trim() !== '' && q.ask.length <= LIMITS.ask, `ask must be text of at most ${LIMITS.ask} characters`)
    if (ASK_END[q.pick]) need(ASK_END[q.pick].test(q.ask), q.pick === 1 ? 'ask must end with "?"' : `ask must end with "? (Select ${q.pick === 2 ? 'TWO' : 'THREE'})"`)
  }
  if (q.artifact !== undefined) need((q.kind === 'artifact') === (q.artifact !== null), 'artifact must be set exactly when kind is "artifact"')
  if (q.artifact !== null) {
    const a = q.artifact
    if (!a || typeof a !== 'object' || Array.isArray(a)) p.push('artifact must be null or an object')
    else {
      for (const k of Object.keys(a)) if (!ARTIFACT_ORDER.includes(k)) p.push(`artifact: unknown field "${k}"`)
      need(ARTIFACT_TYPES.includes(a.type), `artifact.type must be one of ${ARTIFACT_TYPES.join(', ')}`)
      need(Array.isArray(a.lines) && a.lines.length >= 1 && a.lines.length <= LIMITS.artifactLines, `artifact.lines must hold 1 to ${LIMITS.artifactLines} lines`)
      if (Array.isArray(a.lines)) a.lines.forEach((l, i) => need(isStr(l) && l.length <= LIMITS.artifactLine, `artifact line ${i} must be text of at most ${LIMITS.artifactLine} characters`))
      need(Array.isArray(a.mark) && a.mark.every(isInt), 'artifact.mark must be a list of integers')
    }
  }
  if (!Array.isArray(q.options)) p.push('options must be a list')
  else {
    const [min, max] = q.pick === 1 ? [4, 7] : [5, 7]
    need(q.options.length >= min && q.options.length <= max, `pick ${q.pick} needs ${min} to ${max} options`)
    q.options.forEach((o, i) => {
      if (!o || typeof o !== 'object') { p.push(`option ${i} must be an object`); return }
      for (const k of Object.keys(o)) if (!OPTION_ORDER.includes(k)) p.push(`option ${i}: unknown field "${k}"`)
      need(isStr(o.t) && o.t.trim() && o.t.length <= LIMITS.option, `option ${i}: t must be text of at most ${LIMITS.option} characters`)
      need(typeof o.ok === 'boolean', `option ${i}: ok must be a boolean`)
      need(o.item === null || (isStr(o.item) && o.item.length > 0), `option ${i}: item must be a card id or null`)
      need(o.partly === undefined || typeof o.partly === 'boolean', `option ${i}: partly must be a boolean when present`)
      need(isStr(o.why) && o.why.trim() && o.why.length <= LIMITS.why, `option ${i}: why must be text of at most ${LIMITS.why} characters`)
    })
    need(q.options.filter((o) => o && o.ok === true).length === q.pick, `exactly ${q.pick} option(s) must have ok true`)
  }
  need(isStr(q.detail), 'detail must be a string')
  if (isStr(q.detail) && !(q.kind === 'definition' && q.word === '')) need(q.detail.trim() !== '', 'detail is required unless kind is "definition" and word is ""')
  need(q.runner === null || (isInt(q.runner) && Array.isArray(q.options) && q.runner >= 0 && q.runner < q.options.length), 'runner must be null or an option index')
  need(q.edge === null || (isStr(q.edge) && q.edge.trim() && q.edge.length <= LIMITS.edge), `edge must be null or text of at most ${LIMITS.edge} characters`)
  need((q.runner === null) === (q.edge === null), 'edge must be set exactly when runner is set')
  if (!isStr(q.explain)) p.push('explain must be a string')
  else {
    const n = sentences(q.explain).length
    need(n >= 1 && n <= LIMITS.explainSentences && q.explain.length <= LIMITS.explain, `explain must be 1 to ${LIMITS.explainSentences} sentences, at most ${LIMITS.explain} characters`)
  }
  const s = q.source
  if (!s || typeof s !== 'object' || Array.isArray(s)) p.push('source must be an object')
  else {
    for (const k of Object.keys(s)) if (!SOURCE_ORDER.includes(k)) p.push(`source: unknown field "${k}"`)
    need(SOURCE_PARTS.includes(s.card), `source.card must be one of ${SOURCE_PARTS.join(', ')}`)
    need(isStr(s.chapter) && s.chapter.trim() !== '', 'source.chapter must be a heading')
  }
  return p.length ? { ok: false, q: null, problems: p } : { ok: true, q: canonicalQuestion(q), problems: [] }
}

// The right option indexes of a question: a bank question's `ok` flags, or a runner question's `exam.right`.
export const rightIndexes = (q) => (q?.exam ? [...q.exam.right] : (q?.options || []).map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0))

// Grading by code: right only when the picks are exactly the right set (select-N: all N, nothing else).
// → { correct, rightPicks, wrongPicks, missed } (index lists, in the question's own order).
export function gradeExamAnswer(q, picks) {
  const right = rightIndexes(q)
  const chosen = [...new Set((Array.isArray(picks) ? picks : [picks]).filter((i) => isInt(i)))]
  const rightPicks = chosen.filter((i) => right.includes(i))
  const wrongPicks = chosen.filter((i) => !right.includes(i))
  const missed = right.filter((i) => !chosen.includes(i))
  return { correct: wrongPicks.length === 0 && missed.length === 0 && right.length > 0, rightPicks, wrongPicks, missed }
}

// LETTER DEALING (D2.4): the stored order is never shown. Each question of one quiz gets its display order from
// shuffled BAGS of positions (one bag per option count; select-N right answers from their own bag), so the right
// answers of a quiz spread evenly over the letters by construction. → [order], order[k] = stored index shown at k.
// `rand` = a () => [0, 1) function (Math.random in the app, seeded in tests).
export function balancedOrder(questions, rand = Math.random) {
  const bags = new Map()
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
  const draw = (key, n, taken) => {
    let bag = bags.get(key)
    if (!bag || !bag.length) { bag = shuffle(Array.from({ length: n }, (_, i) => i)); bags.set(key, bag) }
    let at = bag.findIndex((x) => !taken.has(x))
    if (at < 0) { bag.push(...shuffle(Array.from({ length: n }, (_, i) => i))); at = bag.findIndex((x) => !taken.has(x)) }
    return bag.splice(at, 1)[0]
  }
  return (questions || []).map((q) => {
    const opts = q?.options || []
    const n = opts.length
    const right = opts.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0)
    const wrong = shuffle(opts.map((o, i) => (o.ok ? -1 : i)).filter((i) => i >= 0))
    const order = new Array(n).fill(-1)
    const taken = new Set()
    const key = right.length > 1 ? `${n}:multi` : `${n}`
    for (const r of shuffle([...right])) { const pos = draw(key, n, taken); taken.add(pos); order[pos] = r }
    for (let k = 0; k < n; k++) if (order[k] < 0) order[k] = wrong.shift()
    return order
  })
}

// The choice question QuizRunner reads (D2.2): today's fields plus an `exam` block, in DISPLAY order.
// `order` from balancedOrder (default: stored order); `front` = the card's front (QuizRunner's `target`).
export function toRunnerQuestion(q, { order = null, front = '', by = 'bank' } = {}) {
  const ord = order || q.options.map((_, i) => i)
  const opts = ord.map((i) => q.options[i])
  const right = opts.map((o, i) => (o.ok ? i : -1)).filter((i) => i >= 0)
  return {
    kind: 'choice',
    prompt: q.stem ? `${q.stem}\n\n${q.ask}` : q.ask,
    choices: opts.map((o) => o.t),
    answerIdx: right[0],
    target: front,
    explanation: q.explain,
    itemId: q.item,
    qid: q.id,
    exam: {
      pick: q.pick, right, whys: opts.map((o) => o.why), optItems: opts.map((o) => o.item ?? null),
      partly: opts.map((o, i) => (o.partly ? i : -1)).filter((i) => i >= 0),
      stem: q.stem, ask: q.ask, word: q.word, neg: q.neg, bullets: [...q.bullets], artifact: q.artifact,
      detail: q.detail, runner: q.runner === null ? null : ord.indexOf(q.runner), edge: q.edge,
      obj: q.obj, level: q.level, kind: q.kind, by,
    },
  }
}

// The manifest's two-character slot code (D3.1): d/s/a (upper case = level 2), then 1/2/3 (n = pick 1, negative).
export const slotCode = (q) => {
  if (!q) return '--'
  const k = { definition: 'd', scenario: 's', artifact: 'a' }[q.kind] || '?'
  return `${q.level === 2 ? k.toUpperCase() : k}${q.pick === 1 && q.neg ? 'n' : q.pick}`
}
