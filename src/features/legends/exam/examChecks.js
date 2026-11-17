// THE DETERMINISTIC CHECKS of an exam question (pure, tested; docs/plans/2026-11-16-exam-format-questions.md D3.2):
// C1 to C23 as written there, shared by the bank build (dev/careers/build-bank.mjs) and, later, the live writer, so
// the two can never disagree. Checks code cannot do (grammar parallelism, one family of terms, renamed copies, the
// partly flags being right, a plain deciding detail) are the reviewer's pass 3 checklist, never pretended here.
//
// A finding = { check: 'C9', level: 'fail' | 'warn', id, msg }. `checkQuestion(q, ctx)` runs the per-question checks,
// `checkSet(questions, ctx)` the ones across questions (rates, duplicates, the per-card mix). C19 (own words) and C21
// (stamps) need the outline and SHA-256, which only the build has: they take those as injected functions.
// `ctx` = courseIndex(pkg) plus optional `headingsFor(obj) → Set<string>` (C20).
import { shapeExamQuestion, cardSig, sentences } from './examQuestion.js'

// fold(x) = NFKC, lower case, every non-letter and non-digit a space, spaces collapsed.
export const fold = (x) => String(x ?? '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const tokens = (x) => fold(x).split(' ').filter(Boolean)
const letterCount = (x) => (fold(x).match(/\p{L}/gu) || []).length

// Common English words of 5+ letters that never count as content words (C10, C13).
export const STOP_WORDS = new Set(`about above across actually after again against almost along already although always among
amount another answer anyone anything appear apply around asked aside based because become becomes before begin behind being
below best better between beyond bring brings cannot cause certain change clear close comes could daily describe described
describes during early either enough entire every everyone everything exact example except fully further given going great
group happen happens having however include included includes including indeed inside instead itself large later least leave
likely little longer lower makes maybe means might minor month months moves never newer nothing notice number often option
options order other others otherwise outside overall perhaps place placed point possible prior quite rather really reason
recent right scenario second seems seven several shall short should shown shows similar since single small something sometimes
soon start state statement statements still such taken takes their theirs them themselves there thereby therefore these thing
things think third those though three through today together total toward towards under unless until upper usual usually
value various wants whatever when where whether which while whole whose within without would years yesterday young
following question questions correct describe describes describing likely mostly first next best
`.split(/\s+/).filter(Boolean))

export const ASK_OPENERS = ['Which of the following', 'Which', 'What should', 'What', 'How should', 'Where should', 'When should', 'Who should']
// Capitalized tokens that are plain words, not acronyms (C14).
export const PLAIN_CAPS = new Set(['IT', 'ID', 'PC', 'USB', 'OK', 'TV', 'CEO', 'CFO', 'HR', 'AM', 'PM', 'US', 'UK', 'EU', 'A', 'I'])
// C15: an artifact of a type at level 1 only when the card itself names that kind of thing (whole word, plural s too).
export const ARTIFACT_WORDS = {
  log: ['log'], config: ['config', 'setting'], rule: ['rule', 'ACL'], output: ['output', 'command'],
  url: ['URL', 'link', 'address'], input: ['input', 'string', 'field'], message: ['message', 'error', 'alert'],
}
export const NEG_SHARE_MAX = 0.05
export const LONGEST_SHARE_MAX = 0.35
export const LONGEST_PER_CARD_MAX = 5
export const LONGEST_FACTOR = 1.5
export const POSITION_MIN_QUESTIONS = 40
export const POSITION_SHARE = [0.15, 0.35]
export const JACCARD_MAX = 0.8
export const REAL_TLDS = ['com', 'net', 'org', 'io', 'gov', 'edu', 'co', 'info', 'biz']
export const UPPER_WORDS = ['BEST', 'MOST', 'NEXT', 'FIRST', 'NOT']

// Content words: fold tokens of 5+ letters that are not stop words (no stemming).
export const contentWords = (text) => new Set(tokens(text).filter((w) => w.length >= 5 && /^\p{L}+$/u.test(w) && !STOP_WORDS.has(w)))
const shownText = (q) => [q.stem, ...(q.bullets || []), ...(q.artifact?.lines || [])].join('\n')
// Every text field of a question (C4, C17).
export const allTexts = (q) => [q.stem, ...(q.bullets || []), q.ask, ...(q.artifact?.lines || []), ...(q.options || []).flatMap((o) => [o.t, o.why]), q.detail, q.edge || '', q.explain, q.source?.chapter || '']
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// A whole-word phrase inside folded text.
const hasPhrase = (foldedText, phrase) => !!phrase && ` ${foldedText} `.includes(` ${phrase} `)

// The package as the checks need it: cards by id (with their objective lesson index), acronyms, front tokens.
export function courseIndex(pkg) {
  const items = new Map()
  const acronyms = new Map()
  const expansionOf = new Map()
  const frontTokens = new Set()
  for (const a of pkg?.areas || []) {
    const lessonIdx = new Map()
    const perSection = new Map()
    for (const l of a.lessons || []) {
      const n = perSection.get(l.section) || 0
      perSection.set(l.section, n + 1)
      for (const id of l.itemIds || []) if (!lessonIdx.has(id)) lessonIdx.set(id, n)
    }
    for (const it of a.items || []) {
      items.set(it.id, { ...it, area: a.number, lesson: lessonIdx.has(it.id) ? lessonIdx.get(it.id) : null })
      for (const t of String(it.front || '').split(/[^\p{L}\p{N}]+/u)) if (t) frontTokens.add(t)
    }
    for (const x of a.acronyms || []) {
      const all = [...(x.expansions || []), ...(x.listed || [])]
      acronyms.set(x.acronym, [...new Set([...(acronyms.get(x.acronym) || []), ...all])])
      for (const e of all) expansionOf.set(fold(e), x.acronym)
    }
  }
  return { items, acronyms, expansionOf, frontTokens }
}

const F = (check, id, msg, level = 'fail') => ({ check, level, id, msg })
const DASHES = new RegExp(`[${String.fromCharCode(0x2013, 0x2014)}]`) // en dash, em dash

// ── per question ──
export function checkQuestion(q, ctx, { live = false } = {}) {
  const shaped = shapeExamQuestion(q, { live })
  if (!shaped.ok) return shaped.problems.map((m) => F('C1', q?.id, m))
  const out = []
  const id = q.id
  const card = ctx.items.get(q.item)

  // C2 counts
  if (q.options.filter((o) => o.ok).length !== q.pick) out.push(F('C2', id, `options with ok must equal pick (${q.pick})`))
  const [min, max] = q.pick === 1 ? [4, 7] : [5, 7]
  if (q.options.length < min || q.options.length > max) out.push(F('C2', id, `pick ${q.pick} needs ${min} to ${max} options`))
  const seen = new Set()
  for (const o of q.options) { const k = fold(o.t); if (seen.has(k)) out.push(F('C2', id, `two options read the same: "${o.t}"`)); seen.add(k) }

  // C3 refs
  if (!card) out.push(F('C3', id, `item ${q.item} is not in the package`))
  else {
    if (card.kind === 'brief') out.push(F('C3', id, `item ${q.item} is a briefing (never quizzed)`))
    if (q.obj !== card.section) out.push(F('C3', id, `obj ${q.obj} is not the card's section ${card.section}`))
  }
  for (const o of q.options) if (o.item !== null && !ctx.items.has(o.item)) out.push(F('C3', id, `option "${o.t}" names ${o.item}, not in the package`))
  if (id !== `${q.item}.${q.slot}`) out.push(F('C3', id, `id must be "${q.item}.${q.slot}"`))

  // C4 text
  const texts = allTexts(q)
  if (texts.some((s) => DASHES.test(s))) out.push(F('C4', id, 'has an en or em dash'))
  if (texts.some((s) => /<[\p{L}/]/u.test(s))) out.push(F('C4', id, 'has "<" before a letter or "/" (HTML)'))
  if ([q.stem, ...q.bullets, q.ask].some((s) => /\byou(r|rs)?\b/i.test(s))) out.push(F('C4', id, 'second person ("you") in the stem, bullets or ask'))
  for (const o of q.options) {
    const f = fold(o.t)
    if (/^(all|none|both|neither) of (the )?(above|these)$/.test(f) || f === 'true' || f === 'false') out.push(F('C4', id, `banned option "${o.t}"`))
  }

  // C5 ask
  const ask = q.ask
  if (!/\?( \(Select (TWO|THREE)\))?$/.test(ask)) out.push(F('C5', id, 'ask must end with "?" or "? (Select TWO|THREE)"'))
  const suffix = ask.match(/\(Select (TWO|THREE)\)$/)?.[1] || ''
  if (suffix !== ({ 1: '', 2: 'TWO', 3: 'THREE' })[q.pick]) out.push(F('C5', id, `the (Select ...) suffix must match pick ${q.pick}`))
  if (!ASK_OPENERS.some((a) => ask.startsWith(a))) out.push(F('C5', id, `ask must start with one of: ${ASK_OPENERS.join(', ')}`))
  const upper = (w) => (ask.match(new RegExp(`\\b${w}\\b`, 'g')) || []).length
  if (q.word && upper(q.word) !== 1) out.push(F('C5', id, `"${q.word}" must appear exactly once in upper case in the ask`))
  for (const w of UPPER_WORDS) if (w !== q.word && upper(w) > 0) out.push(F('C5', id, `"${w}" in upper case but word is "${q.word}"`))

  // C6 detail
  const detailNeeded = !(q.kind === 'definition' && q.word === '')
  if (detailNeeded && !q.detail.trim()) out.push(F('C6', id, 'detail is required'))
  if (q.detail.trim() && ![q.stem, ...q.bullets, ...(q.artifact?.lines || [])].some((s) => s.includes(q.detail))) out.push(F('C6', id, 'detail is not a literal part of the stem, a bullet or an artifact line'))

  // C7 runner
  if (q.options.some((o) => o.partly && o.ok)) out.push(F('C7', id, 'partly is only for wrong options'))
  const hasPartly = q.options.some((o) => o.partly && !o.ok)
  const wantRunner = (q.word === 'BEST' || q.word === 'MOST') && hasPartly
  if (wantRunner !== (q.runner !== null)) out.push(F('C7', id, wantRunner ? 'runner is required (BEST or MOST with a partly true option)' : 'runner must be null here'))
  if (q.runner !== null && !(q.options[q.runner]?.partly && !q.options[q.runner]?.ok)) out.push(F('C7', id, 'runner must point at a partly true wrong option'))
  if ((q.edge !== null) !== (q.runner !== null)) out.push(F('C7', id, 'edge is set exactly when runner is'))

  // C8 negative (the share is a set check)
  if (q.neg !== (q.word === 'NOT')) out.push(F('C8', id, 'neg must be true exactly when word is NOT'))

  // C9 key in stem. The ask is read too (a definition question has no stem: its whole text is the ask).
  const rawShown = `${shownText(q)}\n${q.ask}`
  const shown = fold(rawShown)
  for (const o of q.options.filter((x) => x.ok)) {
    const ft = fold(o.t)
    if (letterCount(o.t) >= 4 && hasPhrase(shown, ft)) out.push(F('C9', id, `the stem gives away the answer "${o.t}"`))
    const acr = ctx.acronyms.has(o.t.trim()) ? o.t.trim() : ctx.expansionOf.get(ft)
    if (acr) {
      if (new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(acr)}([^\\p{L}\\p{N}]|$)`, 'u').test(rawShown)) out.push(F('C9', id, acr === o.t.trim() ? `the stem names the answer "${acr}"` : `the stem names "${acr}", the acronym of the answer`))
      for (const e of ctx.acronyms.get(acr) || []) if (fold(e) !== ft && hasPhrase(shown, fold(e))) out.push(F('C9', id, `the stem spells out the answer "${o.t}" as "${e}"`))
    }
  }

  // C10 one-option word (stem, bullets, artifact and the ask, as C9)
  for (const w of contentWords(rawShown)) {
    const holders = q.options.filter((o) => tokens(o.t).includes(w))
    if (holders.length !== 1) continue
    if (holders[0].ok && q.pick === 1) out.push(F('C10', id, `"${w}" from the stem appears only in the answer "${holders[0].t}"`))
    else if (!holders[0].ok) out.push(F('C10', id, `"${w}" from the stem appears only in the wrong option "${holders[0].t}" (look at it in pass 3)`, 'warn'))
  }

  // C11 length tell (single question)
  if (q.pick === 1) {
    const lens = q.options.map((o) => o.t.length)
    const key = q.options.findIndex((o) => o.ok)
    const sorted = [...lens].sort((a, b) => a - b)
    const mid = sorted.length % 2 ? sorted[(sorted.length - 1) / 2] : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    if (lens.every((l, i) => i === key || l < lens[key]) && lens[key] > LONGEST_FACTOR * mid) out.push(F('C11', id, `the answer is the longest option by far (${lens[key]} characters, median ${mid})`))
  }

  // C14 acronyms
  const capsRe = /\b[A-Z][A-Z0-9]{1,5}\b/g
  for (const o of q.options) for (const tok of o.t.match(capsRe) || []) {
    if (!ctx.acronyms.has(tok) && !ctx.frontTokens.has(tok) && !PLAIN_CAPS.has(tok)) out.push(F('C14', id, `option "${o.t}": "${tok}" is not a known acronym or card term`))
  }
  if (q.level === 1 && card) {
    const own = `${card.front}\n${card.back}`
    for (const s of [q.stem, ...q.bullets]) {
      for (const m of s.matchAll(capsRe)) {
        const tok = m[0]
        if (PLAIN_CAPS.has(tok)) continue
        const inCard = new RegExp(`(^|[^\\p{L}\\p{N}])${escRe(tok)}([^\\p{L}\\p{N}]|$)`, 'u').test(own)
        const spelled = /^\s*\(/.test(s.slice(m.index + tok.length))
        if (!inCard && !spelled) out.push(F('C14', id, `level 1 stem uses "${tok}", which the card does not teach and the stem does not spell out`))
      }
    }
  }

  // C15 level 1
  if (q.level === 1) {
    if (sentences(q.stem).length > 4) out.push(F('C15', id, 'level 1 stem over 4 sentences'))
    if (q.neg) out.push(F('C15', id, 'level 1 is never negative'))
    if (q.artifact && card) {
      const words = ARTIFACT_WORDS[q.artifact.type] || []
      const own = `${card.front}\n${card.back}`
      if (!words.some((w) => new RegExp(`\\b${escRe(w)}s?\\b`, 'i').test(own))) out.push(F('C15', id, `level 1 ${q.artifact.type} artifact, but the card names no ${words.join(' or ')}`))
    }
  }

  // C16 lesson options
  if (q.level === 1 && card) {
    for (const o of q.options) {
      if (o.ok && o.item !== null && o.item !== q.item) out.push(F('C16', id, `level 1 answer "${o.t}" must be this card or null`))
      if (!o.ok && o.item !== null) {
        const other = ctx.items.get(o.item)
        const ok = other && other.section === card.section && other.lesson !== null && card.lesson !== null && other.lesson <= card.lesson
        if (!ok) out.push(F('C16', id, `level 1 wrong option "${o.t}" is a card not taught by this or an earlier lesson of ${card.section}`))
      }
    }
  }

  // C17 artifact (addresses and host names are checked in every text of the question)
  if (q.artifact) {
    for (const m of q.artifact.mark) if (m < 0 || m >= q.artifact.lines.length) out.push(F('C17', id, `artifact mark ${m} is not a line`))
  }
  for (const s of texts) {
    for (const ip of s.match(/(?<![\d.])\d{1,3}(?:\.\d{1,3}){3}(?!\.?\d)/g) || []) if (!docIPv4(ip)) out.push(F('C17', id, `IPv4 ${ip} is not in a documentation range`))
    for (const ip of ipv6Candidates(s)) if (!/^2001:0?db8(:|$)/i.test(ip)) out.push(F('C17', id, `IPv6 ${ip} is not in 2001:db8::/32`))
    const tld = s.match(new RegExp(`\\b[\\w-]+(?:\\.[\\w-]+)*\\.(?:${REAL_TLDS.join('|')})\\b`, 'i'))
    if (tld) out.push(F('C17', id, `host "${tld[0]}" ends in a real top-level domain (use .example, .test or .invalid)`))
  }

  // C18 cardSig
  if (card && q.cardSig !== cardSig(card)) out.push(F('C18', id, `cardSig ${q.cardSig} is not the card's ${cardSig(card)} (the card changed after the passes)`))

  // C20 source
  if (card) {
    const label = { definition: 'Definition', example: 'Example', keyPoints: 'Key Points' }[q.source.card]
    if (!new RegExp(`^${label}:`, 'm').test(card.back)) out.push(F('C20', id, `the card has no "${label}:" part`))
  }
  const heads = ctx.headingsFor ? ctx.headingsFor(q.obj) : null
  if (!heads || !heads.has(q.source.chapter.trim())) out.push(F('C20', id, `source.chapter "${q.source.chapter}" is not a heading of the chapters for ${q.obj}`))

  // C23 article
  if (/\b(a|an)\?/.test(q.ask) || /\b(a|an) _+/.test(q.ask)) {
    const v = q.options.map((o) => /^[aeiou]/i.test((o.t.match(/\p{L}/u) || [''])[0]))
    if (!(v.every(Boolean) || v.every((x) => !x))) out.push(F('C23', id, 'the ask ends with "a" or "an": options must all start with a vowel or all with a consonant'))
  }
  return out
}

const docIPv4 = (ip) => ip.split('.').every((n) => Number(n) <= 255) && (/^192\.0\.2\.\d+$/.test(ip) || /^198\.51\.100\.\d+$/.test(ip) || /^203\.0\.113\.\d+$/.test(ip))
// IPv6-looking tokens: hex groups with "::", or 4+ colons; a MAC address (six 2-digit groups) and clock times are not.
export function ipv6Candidates(s) {
  const out = []
  for (const m of String(s).matchAll(/(?<![\w:])(?:[0-9a-f]{0,4}:){2,7}[0-9a-f]{0,4}(?![\w:])/gi)) {
    const t = m[0]
    if (/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/i.test(t)) continue
    if (t.includes('::') || (t.match(/:/g) || []).length >= 4) out.push(t)
  }
  return out
}

// ── across questions ──
// `questions` = shaped questions (C1 passed) of one bank build; `opts.allowShort` = at least 6 per card, not 10;
// `opts.shortOk(cardId)` decides per card instead (a short card needs a recorded reason, see SHORT_REASON_MIN).
// `opts.cards` = the card ids whose questions are being built (every quizzable card of each objective present).
export function checkSet(questions, ctx, { allowShort = false, shortOk = null } = {}) {
  const out = []
  const byObj = groupBy(questions, (q) => q.obj)
  const byCard = groupBy(questions, (q) => q.item)

  // C3 (set): ids unique
  for (const [id, list] of groupBy(questions, (q) => q.id)) if (list.length > 1) out.push(F('C3', id, `id ${id} is used ${list.length} times`))

  for (const [obj, list] of byObj) {
    // C8 share
    const neg = list.filter((q) => q.neg).length
    if (neg && neg / list.length >= NEG_SHARE_MAX) out.push(F('C8', obj, `objective ${obj}: ${neg} of ${list.length} questions are negative (under ${NEG_SHARE_MAX * 100}% allowed)`))
    // C11 per objective
    const ones = list.filter((q) => q.pick === 1)
    const longest = ones.filter(keyStrictlyLongest)
    if (ones.length && longest.length / ones.length > LONGEST_SHARE_MAX) out.push(F('C11', obj, `objective ${obj}: the answer is the longest option in ${longest.length} of ${ones.length} questions (at most ${LONGEST_SHARE_MAX * 100}%)`))
    // C12 stored position
    const four = ones.filter((q) => q.options.length === 4)
    if (four.length >= POSITION_MIN_QUESTIONS) {
      for (let p = 0; p < 4; p++) {
        const share = four.filter((q) => q.options[p].ok).length / four.length
        if (share < POSITION_SHARE[0] || share > POSITION_SHARE[1]) out.push(F('C12', obj, `objective ${obj}: position ${'ABCD'[p]} holds the answer in ${Math.round(share * 100)}% (15 to 35%)`))
      }
    }
    // C13 near copies across cards of one objective (warn)
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      if (list[i].item === list[j].item) continue
      if (jaccard(cw(list[i]), cw(list[j])) >= JACCARD_MAX) out.push(F('C13', list[j].id, `reads like ${list[i].id} (another card of ${obj})`, 'warn'))
    }
    // C22 coverage: every quizzable card of the objective has its questions
    for (const [cid, it] of ctx.items) if (it.section === obj && it.kind !== 'brief' && !byCard.has(cid)) out.push(F('C22', cid, `card ${cid} (${it.front}) of ${obj} has no questions`))
  }

  // C13 course-wide stem duplicates
  for (const [k, list] of groupBy(questions, stemKey)) if (k && list.length > 1) out.push(F('C13', list[1].id, `same stem and ask as ${list[0].id}`))

  for (const [cid, list] of byCard) {
    // C11 per card
    const longest = list.filter((q) => q.pick === 1 && keyStrictlyLongest(q)).length
    if (longest > LONGEST_PER_CARD_MAX) out.push(F('C11', cid, `card ${cid}: the answer is the longest option in ${longest} questions (at most ${LONGEST_PER_CARD_MAX})`))
    // C13 within a card
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i]; const b = list[j]
      if (keyText(a) === keyText(b) && fold(a.detail) === fold(b.detail)) out.push(F('C13', b.id, `same answer and deciding detail as ${a.id}`))
      if (jaccard(cw(a), cw(b)) >= JACCARD_MAX) out.push(F('C13', b.id, `reads like ${a.id} (same card)`))
    }
    // C22 mix and count
    const l1 = list.filter((q) => q.level === 1)
    const d = l1.filter((q) => q.kind === 'definition').length
    const s = l1.filter((q) => q.kind === 'scenario').length
    if (d < 2 || s < 2) out.push(F('C22', cid, `card ${cid}: needs at least 2 definition and 2 scenario questions at level 1 (has ${d} and ${s})`))
    if (list.filter((q) => q.kind === 'artifact').length > 2) out.push(F('C22', cid, `card ${cid}: at most 2 artifact questions`))
    if (list.filter((q) => q.pick > 1).length > 2) out.push(F('C22', cid, `card ${cid}: at most 2 select-N questions`))
    const short = shortOk ? shortOk(cid) : allowShort
    const need = short ? 6 : 10
    if (list.length < need) out.push(F('C22', cid, `card ${cid}: ${list.length} questions, ${need} needed${short ? ' (short card)' : shortOk || allowShort ? ' (6 to 9 only with --allow-short and its reason in bank/short.json)' : ''}`))
    if (list.length > 10) out.push(F('C22', cid, `card ${cid}: ${list.length} questions, at most 10`))
  }
  return out
}

// A short card's reason (bank/short.json, recorded in the manifest) must say something: at least this many characters.
export const SHORT_REASON_MIN = 15
export const shortReasonOk = (r) => typeof r === 'string' && r.trim().length >= SHORT_REASON_MIN

const groupBy = (list, fn) => { const m = new Map(); for (const x of list) { const k = fn(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x) } return m }
export const stemKey = (q) => fold(`${q.stem} ${q.ask}`).replace(/\d+/g, '#')
const keyText = (q) => q.options.filter((o) => o.ok).map((o) => fold(o.t)).sort().join('|')
const cw = (q) => contentWords([q.stem, ...q.bullets, q.ask, ...(q.artifact?.lines || [])].join('\n'))
export const jaccard = (a, b) => {
  if (!a.size && !b.size) return 0
  let n = 0
  for (const x of a) if (b.has(x)) n++
  return n / (a.size + b.size - n)
}
const keyStrictlyLongest = (q) => {
  const k = q.options.findIndex((o) => o.ok)
  return q.options.every((o, i) => i === k || o.t.length < q.options[k].t.length)
}

// C19 own words: `findCopies(texts) → [{ where, run }]` (the build passes verbatim.mjs against the outline).
export const questionTexts = (q) => [
  { where: `${q.id} stem`, text: q.stem }, ...q.bullets.map((b, i) => ({ where: `${q.id} bullet ${i}`, text: b })),
  { where: `${q.id} ask`, text: q.ask }, ...(q.artifact?.lines || []).map((l, i) => ({ where: `${q.id} artifact ${i}`, text: l })),
  ...q.options.flatMap((o, i) => [{ where: `${q.id} option ${i}`, text: o.t }, { where: `${q.id} why ${i}`, text: o.why }]),
  { where: `${q.id} explain`, text: q.explain }, ...(q.edge ? [{ where: `${q.id} edge`, text: q.edge }] : []),
]
export function checkOwnWords(q, findCopies) {
  return findCopies(questionTexts(q)).map((c) => F('C19', q.id, `shares wording with the outline, rewrite it: ${c.where}: "${c.run}"`))
}

// C21 stamps: every required pass stamped with the hash of the text as it is now. `hashOf(q)` is injected (SHA-256).
export const REQUIRED_PASSES = ['p1', 'p2', 'p3', 'p4', 'oversight']
export const requiredPasses = (q) => ((q.word === 'BEST' || q.word === 'MOST') ? ['p1', 'p2', 'p2b', 'p3', 'p4', 'oversight'] : REQUIRED_PASSES)
export function checkStamps(q, stamp, hashOf) {
  const h = hashOf(q)
  const missing = requiredPasses(q).filter((p) => !stamp || !stamp[p])
  const stale = requiredPasses(q).filter((p) => stamp && stamp[p] && stamp[p] !== h)
  const out = []
  if (missing.length) out.push(F('C21', q.id, `not stamped by ${missing.join(', ')}`))
  if (stale.length) out.push(F('C21', q.id, `changed after ${stale.join(', ')} (the stamp no longer matches the text)`))
  return out
}

// THE FORBIDDEN PHRASES check (a local, gitignored list): a question must not contain a near match of a listed
// phrase in anything the learner sees: stem, bullets, ask, artifact lines, options, why lines, and the explanation's
// explain, edge and detail. A content word HERE is 3+ letters and not a small or stop word (stricter than C10's 5+
// letters, so short phrases still count). Near match, after fold: the whole phrase; a
// run of 3+ consecutive phrase words that holds at least one content word (a bare "of the following" is not a match);
// or, for a phrase with 3+ content words, 70% or more of them inside any 12-word window.
export const PHRASE_RUN = 3
export const PHRASE_SHARE = 0.7
export const PHRASE_WINDOW = 12
const isContent = (w) => w.length >= 3 && !SMALL_WORDS.has(w) && !STOP_WORDS.has(w)
const SMALL_WORDS = new Set('the and for with from that this into onto its are was were has have had not but nor can may will his her him she they them their our you your who whom what when which why how all any each its own per via one two out off too than then also only such these those there here'.split(' '))
export function phraseHit(text, phrase) {
  const t = tokens(text)
  const p = tokens(phrase)
  if (!p.length || !t.length) return null
  const tj = ` ${t.join(' ')} `
  if (tj.includes(` ${p.join(' ')} `)) return `the whole phrase`
  for (let i = 0; i + PHRASE_RUN <= p.length; i++) {
    for (let n = p.length - i; n >= PHRASE_RUN; n--) {
      const run = p.slice(i, i + n)
      if (!run.some(isContent)) continue
      if (tj.includes(` ${run.join(' ')} `)) return `a ${n}-word run "${run.join(' ')}"`
    }
  }
  const content = [...new Set(p.filter(isContent))]
  if (content.length >= 3) {
    for (let i = 0; i < Math.max(1, t.length - PHRASE_WINDOW + 1); i++) {
      const win = new Set(t.slice(i, i + PHRASE_WINDOW))
      const n = content.filter((w) => win.has(w)).length
      if (n / content.length >= PHRASE_SHARE) return `${n} of its ${content.length} content words in 12 words`
    }
  }
  return null
}
export function checkForbidden(q, phrases) {
  const where = [['stem', q.stem], ...q.bullets.map((b, i) => [`bullet ${i}`, b]), ['ask', q.ask],
    ...(q.artifact?.lines || []).map((l, i) => [`artifact ${i}`, l]),
    ...q.options.flatMap((o, i) => [[`option ${i}`, o.t], [`why ${i}`, o.why]]),
    ['explain', q.explain], ['edge', q.edge || ''], ['detail', q.detail]]
  const out = []
  phrases.forEach((ph, k) => {
    for (const [w, text] of where) {
      const hit = phraseHit(text, ph)
      // The listed phrase itself is never printed (the list stays private): only its number.
      if (hit) { out.push(F('CF', q.id, `${w} near-matches forbidden phrase #${k + 1} (${hit.replace(/".*"/, 'a run')})`)); break }
    }
  })
  return out
}
