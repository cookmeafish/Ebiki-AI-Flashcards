// CHOICES THE HINT AND "IT'S IN MY DECK" CAN'T GIVE AWAY (pure, tested by choicePool.test.js). The owner (2026-10-10):
// the first letter gave a choice question away, and so did knowing which word is in the deck: an option the model
// invented is one the learner never studied, so "the one I know" was the answer. One planner for Study, raids and
// Legends (they only build the pool and apply the plan):
//   1. WORD choices: the distractors are OTHER cards of the same deck the learner has ALREADY STUDIED, the same kind of
//      thing (part of speech where known, the same number of words) and, in a language mode, SHARING THE SHOWN PREFIX
//      (utils/prefixHint.js: the same first letters), so neither the hint nor familiarity picks the tile. Length no
//      longer matters. Offered when at least 3 such distractors exist.
//   2. Else the MEANING form: the question shows the learned word and asks for its meaning; the distractors are other
//      studied cards' meanings (same kind). Choices stay available (the owner's earlier rule).
//   3. Else, the last resort: the model's own options, kept only as they are ('ai'); its distractors that share the
//      prefix are preferred when 3 of them do.
// General modes: deck terms of the same shape when 3 exist, else the model's options (they are often the better kind:
// "21, 23, 80" for an SSH port), and never a prefix.
// The pool entries come from cards (front/back as plain text); `swap` reads a card whose learned word is on the BACK.
import { prefixHint, hintTokens, fold } from './prefixHint'

export const MIN_DISTRACTORS = 3
const str = (v) => String(v ?? '').replace(/\s+/g, ' ').trim()
// Lines of a card side; the learner context joins a card's lines with " · " (kit/learnerContextGather.js).
const lines = (s) => String(s ?? '').split(/\r?\n| · /).map((l) => l.trim()).filter(Boolean)
const words = (s) => str(s).split(' ').filter((w) => /\p{L}|\p{N}/u.test(w))
const key = (s) => fold(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

// Part-of-speech tags, any language (data, not code): the label a card writes in "(...)" after its word, or a line of
// its back. Only whole tokens count.
const POS_TAGS = {
  noun: ['n', 'nm', 'nf', 'nn', 'noun', 'sust', 'sustantivo', 'nombre', 'nom', 'substantif', 'substantiv', 'sostantivo', 'subst', 'm', 'f', 'masc', 'fem', '名詞', '名词', '명사'],
  verb: ['v', 'vb', 'vt', 'vi', 'vr', 'verb', 'verbo', 'verbe', 'zeitwort', '動詞', '动词', '동사'],
  adj: ['adj', 'adjective', 'adjetivo', 'adjectif', 'adjektiv', 'aggettivo', '形容詞', '形容词', '형용사'],
  adv: ['adv', 'adverb', 'adverbio', 'adverbe', 'avverbio', '副詞', '副词', '부사'],
  prep: ['prep', 'preposition', 'preposición', 'préposition', 'präposition', 'preposizione', '前置詞', '介词'],
  pron: ['pron', 'pronoun', 'pronombre', 'pronom', 'pronomen', 'pronome', '代名詞', '代词'],
  conj: ['conj', 'conjunction', 'conjunción', 'conjonction', 'konjunktion', 'congiunzione', '接続詞', '连词'],
  interj: ['interj', 'interjection', 'interjección', 'interjektion', '感動詞', '感叹词'],
}
const TAG_POS = new Map(Object.entries(POS_TAGS).flatMap(([pos, tags]) => tags.map((t) => [t, pos])))
// The FULL names only, for a back's label lines (an abbreviation like "v" or "m" inside a meaning is just a letter).
const FULL_TAG = new Map([...TAG_POS].filter(([t]) => [...t].length >= 4 || /[^\x00-\x7f]/.test(t)))
const tagOf = (tok, full = false) => (full ? FULL_TAG : TAG_POS).get(fold(tok).replace(/[.]/g, '')) || ''
export function posOf(front = '', back = '') {
  const paren = str(front).match(/\(([^)]{1,30})\)\s*$/)
  if (paren) for (const tok of paren[1].split(/[\s.,/;]+/)) { const p = tagOf(tok); if (p) return p }
  for (const l of lines(back).slice(0, 4)) {
    const parens = l.match(/\(([^)]{1,30})\)/g) || []
    for (const p0 of parens) for (const tok of p0.slice(1, -1).split(/[\s.,/;]+/)) { const p = tagOf(tok); if (p) return p }
    const label = l.match(/^[*_\s]*[\p{L} ]{0,24}[:：][*_\s]*(.+)$/u)
    const head = label ? label[1] : l
    const first = head.split(/[\s.,/;()]+/).find(Boolean)
    if (first && (label || words(l).length === 1)) { const p = tagOf(first, true); if (p) return p }
  }
  return ''
}
// The learned word of a card: its front without a trailing "(...)" label and without edge punctuation.
export const cardWord = (s) => str(s).replace(/\s*\([^)]*\)\s*$/, '').replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '')
// ITS MEANING (the review: the app's own default Spanish back starts "Pronunciación: /…/", so "the first line" was the
// IPA and every meaning check was dead). Per line of the other side, in order of trust:
//   1. the line under the mode's own meaning label (`label`, from its back template: meaningLabel);
//   2. a line labelled as a meaning in any language (MEANING_LABEL: Traducción, Translation, Definición, 意味...);
//   3. the first line that is not pronunciation, part of speech, synonyms, an example or a note (NOT_MEANING_LABEL),
//      not IPA-shaped ("/ˈpe.ro/", "[pero]"), not a bare part-of-speech tag and not the headword itself (`head`).
// "Label:" prefixes dropped, cut at 80 characters. Data tables, never `if (lang === ...)`.
const MEANING_LABEL = /^(?:translations?|traducci[oó]n|traduction|[uü]bersetzung|traduzione|tradu[cç][aã]o|meanings?|significado|signification|sens|bedeutung|significato|definitions?|definici[oó]n|d[eé]finition|definizione|defini[cç][aã]o|gloss|english|意味|意思|翻译|翻譯|释义|뜻|번역|의미)$/iu
const NOT_MEANING_LABEL = /^(?:pronunciations?|pronunciaci[oó]n|prononciation|aussprache|pronuncia|pron[uú]ncia|ipa|phonetics?|fon[eé]tica|reading|lectura|lecture|furigana|pinyin|romaji|发音|發音|読み|発音|발음|part of speech|pos|categor[ií]a gramatical|categor[ií]a|word class|wortart|tipo|classe|synonyms?|sin[oó]nimos?|synonymes?|synonyme|sinonimi|antonyms?|ant[oó]nimos?|examples?|ejemplos?|exemples?|beispiele?|esempio|exemplos?|例句|例文|예문|notes?|notas?|tags?|gender|g[eé]nero|genre|geschlecht|plural|conjugation|conjugaci[oó]n|usage|uso|register|registro|region|regi[oó]n|audio|sound)$/iu
const IPA_LIKE = /^\s*[/[].{1,60}[/\]]\s*$/u
const LABELLED = /^[*_\s]*([\p{L}\p{M} ]{1,28})[:：][*_\s]*(.*)$/u
const clipMeaning = (v) => { const out = str(String(v || '').replace(/\*\*|__/g, '')); return out.length > 80 ? `${out.slice(0, 80).replace(/\s+\S*$/, '')}…` : out }
// The meaning line's label in a back template ("Traducción: {translation}" → "Traducción"), or ''.
export function meaningLabel(template = '') {
  const rows = String(template || '').split(/\r?\n/)
  for (const ph of ['translation', 'meaning', 'definition', 'gloss']) {
    const row = rows.find((r) => new RegExp(`\\{${ph}\\}`, 'i').test(r))
    const m = row && row.match(/^\s*([^:{：]{1,28})[:：]/u)
    if (m) return m[1].trim()
  }
  return ''
}
// Odd backs (the review): "EN → dog" (a language arrow), "/ˈpe.ro/ (n.) dog" (a one-liner: IPA and a tag before the
// meaning), "🔊 Audio" (an unlabelled non-meaning line behind an emoji), "n." (a line that is only a tag).
const LANG_ARROW = /^[\p{L}]{2,3}\s*(?:→|->|=>|›|»)\s*/u
const IPA_LEAD = /^\s*[/[][^/\]]{1,60}[/\]]\s*/u
const TAG_LEAD = /^\(([^)]{1,20})\)\s*/u
const cleanMeaning = (v) => {
  let out = String(v || '').replace(LANG_ARROW, '')
  const ipa = out.match(IPA_LEAD)
  if (ipa && ipa[0].length < out.length) out = out.slice(ipa[0].length)
  const tag = out.match(TAG_LEAD)
  if (tag && tag[0].length < out.length && tag[1].split(/[\s.,/;]+/).filter(Boolean).every((tk) => tagOf(tk))) out = out.slice(tag[0].length)
  return out.trim()
}
const bareLabel = (v) => String(v || '').replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
export function cardMeaning(s, { head = '', label = '' } = {}) {
  const rows = lines(s).map((l) => { const m = l.match(LABELLED); return m ? { label: m[1].trim(), value: cleanMeaning(m[2].trim()) } : { label: '', value: cleanMeaning(l) } })
  const hk = key(cardWord(head))
  const onlyTag = (v) => { const toks = v.split(/[\s.,/;()]+/).filter(Boolean); return !!toks.length && toks.length <= 2 && toks.every((tk) => tagOf(tk)) }
  const usable = (r) => !!r.value && !IPA_LIKE.test(r.value) && !(hk && key(cardWord(r.value)) === hk) && !(words(r.value).length === 1 && tagOf(r.value, true)) &&
    !onlyTag(r.value) && !(!r.label && NOT_MEANING_LABEL.test(bareLabel(r.value))) && /\p{L}|\p{N}/u.test(r.value)
  const own = label ? rows.find((r) => r.label && key(r.label) === key(label) && usable(r)) : null
  const named = own || rows.find((r) => r.label && MEANING_LABEL.test(r.label) && usable(r))
  const plain = named || rows.find((r) => !(r.label && NOT_MEANING_LABEL.test(r.label)) && usable(r))
  return plain ? clipMeaning(plain.value) : ''
}
// A card as the pool sees it. `studied`: reviewed at least once (never a new card).
// `label`: the mode's meaning label (meaningLabel of its back template), when known.
export function poolEntry({ front = '', back = '', studied = true, swap = false, label = '' } = {}) {
  const wordSide = swap ? lines(back)[0] || '' : front
  const meaningSide = swap ? front : back
  const word = cardWord(wordSide)
  if (!word) return null
  return { word, meaning: cardMeaning(meaningSide, { head: word, label }), pos: posOf(front, back), studied: studied !== false }
}
// Is the learned word on the front (the usual) or the back? Read from THIS card and its answer.
export function wordOnBack({ front = '', back = '' } = {}, accepted = []) {
  const acc = (accepted || []).map(key).filter(Boolean)
  if (!acc.length) return false
  const f = key(cardWord(front))
  if (acc.some((a) => f === a || f.includes(a) || a.includes(f))) return false
  const b = key(cardWord(lines(back)[0] || ''))
  return !!b && acc.some((a) => b === a || b.includes(a) || a.includes(b))
}

// THE GUARD: a wrong option that is really RIGHT marks a correct answer wrong (the worst failure here: "buen día" among
// the options for "buenos días", which also means good morning). A distractor goes when its MEANING overlaps the
// answer's (the same back, a shared gloss word, or both in one class of stand-ins: two greetings), or when it is an
// accepted answer or another form of one (closeForm, sameLemma). Data, never `if (lang === ...)`.
const STOP_WORDS = new Set(('the a an to of in on at for by with from and or as be is are was it its this that sb sth ' +
  'someone something one some any very more most not no oneself yourself el la los las un una de del al y o en con por ' +
  'para que se su sus lo le les le la les des du et ou au aux en dans pour par sur der die das ein eine und oder zu von ' +
  'mit il lo gli le di da e o per con su il os as um uma do da dos das em com por para').split(' '))
const glossWords = (m) => key(m).split(' ').filter((w) => [...w].length >= 3 && !STOP_WORDS.has(w))
// The same word, or one a STEM of 4+ letters of the other ("thank"/"thanks"); "car"/"card", "pen"/"pencil" are different words.
// The same CONTENT words ("perro" for "el perro", "veces" for "a veces", "los perros"): an article or a little word less,
// or another form of the rest, is no other answer.
const contentWords = (s) => key(s).split(' ').filter((w) => w && !STOP_WORDS.has(w)).sort().join(' ')
export const sameContent = (a, b) => { const x = contentWords(a), y = contentWords(b); return !!x && !!y && !numbersDiffer(a, b) && (x === y || closeForm(x, y)) }
// NUMBERS ARE THE ANSWER (the review: "Port 22"/"Port 23", "RAID 5"/"RAID 6", "IPv4"/"IPv6", "TLS 1.2"/"TLS 1.3" read as
// another form of the answer, so a CompTIA fight lost every choice): two texts that both carry digits, different
// ones, are never the same ("3 años" and "tres años" still compare as words).
const digitsOf = (s) => (String(s ?? '').match(/\p{N}+/gu) || []).join(',')
export const numbersDiffer = (a, b) => { const x = digitsOf(a), y = digitsOf(b); return !!x && !!y && x !== y }
// The same text but for case, spacing and punctuation ("RAID-5", "raid5", "RAID 5"): general modes' only "same answer".
// "+" and "#" are part of a name ("C", "C++" and "C#" are three languages), and so is the case of a SHORT token written
// once mixed and once in capitals ("Co" cobalt, "CO" carbon monoxide; `caseClash`); all lowercase is neutral ("ssh").
// Only 1 or 2 letters (chemical symbols): at 3, "Dns"/"Ssh" from a model are DNS/SSH, never another answer.
const compactKey = (s) => fold(s).replace(/[^\p{L}\p{N}+#]+/gu, '')
const shortCase = (t) => { const n = (t.match(/\p{L}/gu) || []).length; return n < 1 || n > 2 ? '' : /^\p{Lu}[\p{Ll}\p{N}]*$/u.test(t) && /\p{Ll}/u.test(t) ? 'mixed' : !/\p{Ll}/u.test(t) ? 'caps' : '' }
const caseClash = (a, b) => {
  const x = str(a).split(/[^\p{L}\p{N}]+/u).filter(Boolean), y = str(b).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  return x.length === y.length && x.some((t, i) => { const p = shortCase(t), q = shortCase(y[i]); return p && q && p !== q })
}
export const sameCompact = (a, b) => { const x = compactKey(a), y = compactKey(b); return !!x && x === y && !caseClash(a, b) }
const sameStem = (x, y) => x === y || (Math.min(x.length, y.length) >= 4 && (x.startsWith(y) || y.startsWith(x)))
// Classes whose members stand in for each other (the meanings, in English: card backs are usually in it; extend here).
const MEANING_CLASSES = [
  /\b(hello|hi|hey|howdy|greeting|good (?:morning|day|afternoon|evening))\b/,
  /\b(bye|goodbye|farewell|good night|see you|so long|take care)\b/,
  /\b(thanks?|thank you|cheers|grateful)\b/,
  /\b(sorry|excuse me|pardon|apolog\w*)\b/,
  /\b(yes|yeah|of course|sure|certainly|okay|ok)\b/,
]
// `loose` (general modes: long definitions share ordinary words): only a mostly-shared definition counts.
export function meaningsOverlap(a, b, { loose = false } = {}) {
  const ka = key(a), kb = key(b)
  if (!ka || !kb) return false
  if (ka === kb) return true
  const wa = glossWords(a), wb = glossWords(b)
  if (loose) {
    if (!wa.length || !wb.length) return false
    const shared = wa.filter((x) => wb.some((y) => sameStem(x, y))).length
    return shared / Math.min(wa.length, wb.length) >= 0.6
  }
  if (wa.some((x) => wb.some((y) => sameStem(x, y)))) return true
  return MEANING_CLASSES.some((re) => re.test(ka) && re.test(kb))
}
// Another form of the same word (comer/comió, hablar/hablé): a long shared start.
export function sameLemma(a, b) {
  const x = key(a), y = key(b)
  if (!x || !y || numbersDiffer(x, y)) return false
  if (closeForm(x, y)) return true
  let i = 0
  while (i < x.length && i < y.length && x[i] === y[i]) i++
  return i >= 4 && i >= 0.75 * Math.min(x.length, y.length)
}

// Which letters a script uses (a card whose word and meaning differ in script tells each pool card's sides apart).
const SCRIPTS = ['Latin', 'Cyrillic', 'Greek', 'Arabic', 'Hebrew', 'Han', 'Hiragana', 'Katakana', 'Hangul', 'Devanagari', 'Thai', 'Georgian', 'Armenian']
const SCRIPT_RES = SCRIPTS.map((n) => [n, new RegExp(`\\p{Script=${n}}`, 'u')])
export function scriptOf(s) {
  for (const ch of String(s || '')) {
    if (!/\p{L}/u.test(ch)) continue
    const hit = SCRIPT_RES.find(([, re]) => re.test(ch))
    return hit ? (hit[0] === 'Hiragana' || hit[0] === 'Katakana' ? 'Kana' : hit[0]) : 'Other'
  }
  return ''
}
// THE POOL, each card read on its OWN sides (a deck mixes forward and reversed cards: a reversed card's front is the
// user's word, and "pig" must never stand as a Spanish distractor). card: the asked card ({ front, back }); swap: its
// learned word is on its back. Per pool card:
//   1. a script difference (the asked word in Cyrillic, its meaning in Latin): the side in the learned script is the word;
//      neither = not a card of this language, dropped;
//   2. else the shape: the asked card's word side is one line and its other side several; a pool card shaped the other way
//      round is a reversed card, read flipped;
//   3. a word of the asked card's meaning is the user's language: dropped; a card whose word is another card's MEANING
//      (both directions of one note in the pool) keeps the side that LOOKS like the learned words (letter pairs shared
//      with the asked word and the pool's unambiguous words), and is dropped when that can't be told.
export function poolEntries(pool = [], { card = null, swap = false, label = '' } = {}) {
  const askWord = card ? (swap ? lines(card.back)[0] || '' : card.front) : ''
  const askMeaning = card ? (swap ? card.front : card.back) : ''
  const wScript = scriptOf(cardWord(askWord))
  const askMean = cardMeaning(askMeaning, { head: askWord, label })
  const mScript = scriptOf(askMean)
  const byScript = wScript && mScript && wScript !== mScript
  const askShort = card && lines(askWord).length === 1 && lines(askMeaning).length >= 2
  const out = []
  for (const c of pool || []) {
    if (!c) continue
    let flip = swap
    if (byScript) {
      const f = scriptOf(cardWord(c.front)), b = scriptOf(cardWord(lines(c.back)[0] || ''))
      if (f === wScript) flip = false
      else if (b === wScript) flip = true
      else continue
    } else if (askShort) {
      const [wordSide, otherSide] = flip ? [c.back, c.front] : [c.front, c.back]
      if (lines(wordSide).length >= 2 && lines(otherSide).length === 1) flip = !flip
    }
    const e = poolEntry({ front: c.front, back: c.back, studied: c.studied !== false, swap: flip, label })
    if (e) out.push(e)
  }
  const askGloss = new Set([key(askMean), ...glossWords(askMean)].filter(Boolean))
  const kept = out.filter((e) => !askGloss.has(key(e.word)))
  const meaningKeys = new Set(kept.map((e) => key(e.meaning)).filter(Boolean))
  const paired = (e) => meaningKeys.has(key(e.word))
  const ref = new Set(bigramsOf([cardWord(askWord), ...kept.filter((e) => !paired(e)).map((e) => e.word)].join(' ')))
  const looks = (w) => { const b = bigramsOf(w); return b.length ? b.filter((x) => ref.has(x)).length / b.length : 0 }
  return kept.filter((e) => !paired(e) || looks(e.word) > looks(e.meaning))
}
const bigramsOf = (s) => { const out = []; for (const w of key(s).split(' ')) for (let i = 0; i + 1 < w.length; i++) out.push(w.slice(i, i + 2)); return out }

// Another FORM of the answer (perro/perra, pantalón/pantalones) or a typo of it is no fair distractor: it may be right.
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = tmp
    }
  }
  return prev[b.length]
}
export function closeForm(a, b) {
  const x = key(a), y = key(b)
  if (!x || !y) return false
  if (x === y) return true
  if (numbersDiffer(x, y)) return false
  const [s, l] = x.length <= y.length ? [x, y] : [y, x]
  if (l.startsWith(s) && l.length - s.length <= 3) return true
  return Math.min(x.length, y.length) >= 4 && editDistance(x, y) <= (Math.min(x.length, y.length) >= 7 ? 2 : 1)
}
// Does a word start the way the hint shows (each word's own initial for a phrase)?
export function sharesPrefix(word, tokens) {
  if (!tokens || !tokens.length) return true
  const ws = words(word).map(fold)
  if (tokens.length === 1) return ws.length >= 1 && ws[0].startsWith(tokens[0]) && ws.join(' ').length > tokens[0].length
  return ws.length === tokens.length && ws.every((w, i) => w.startsWith(tokens[i]))
}
// A word in the answer's case (a lowercase answer gets lowercase options), except an acronym or a general mode's term.
const sameCase = (word, answer, general = false) => (!general && answer === answer.toLowerCase() && word !== word.toUpperCase() ? word.toLowerCase() : word)
const TERM_MAX_WORDS = 6
const termShaped = (s) => { const w = words(s); return w.length >= 1 && w.length <= TERM_MAX_WORDS && str(s).length <= 48 && !/[?？]/.test(s) }
const shapeOf = (s) => ({ n: words(s).length, num: /^[\p{N}\s.,:/%+-]+$/u.test(str(s)), caps: /^[\p{Lu}\p{N}\s-]{2,}$/u.test(str(s)) })

// The distractors for a word answer from the pool (see the header). → [word] best first.
export function rankDistractors(answer, entries = [], { prefix = null, pos = '', meaning = '', accepted = [], general = false } = {}) {
  const acc = [answer, ...(accepted || [])].map(key).filter(Boolean)
  const n = words(answer).length
  const want = general ? shapeOf(answer) : null
  const meaningKey = key(meaning)
  const seen = new Set(acc)
  const out = []
  for (const e of entries || []) {
    if (!e || e.studied === false || !e.word) continue
    const k = key(e.word)
    if (!k || seen.has(k)) continue
    if (acc.some((a) => sameLemma(a, k) || sameContent(a, k))) continue // another form of the answer ("perro" for "el perro")
    if (meaningKey && e.meaning && meaningsOverlap(e.meaning, meaning, { loose: general })) continue // a stand-in: two right answers
    if (general) {
      if (!termShaped(e.word)) continue
      const s = shapeOf(e.word)
      if (Math.abs(s.n - want.n) > 1 || s.num !== want.num || s.caps !== want.caps) continue
    } else {
      if (words(e.word).length !== n) continue
      if (!sharesPrefix(e.word, prefix)) continue
      if (pos && e.pos && e.pos !== pos) continue
    }
    seen.add(k)
    out.push({ w: sameCase(e.word, answer, general), score: pos && e.pos === pos ? 1 : 0 })
  }
  return out.map((x, i) => ({ ...x, i })).sort((a, b) => b.score - a.score || a.i - b.i).map((x) => x.w)
}
// Other studied cards' meanings (same kind first), for the meaning form.
export function rankMeanings(meaning, entries = [], { pos = '', head = '' } = {}) {
  const mk = key(meaning)
  const hk = key(head)
  const seen = new Set([mk])
  const out = []
  for (const e of entries || []) {
    if (!e || e.studied === false || !e.meaning) continue
    const k = key(e.meaning)
    if (!k || seen.has(k) || key(e.word) === hk) continue
    if (meaningsOverlap(e.meaning, meaning)) continue // a meaning that is also right
    if (pos && e.pos && e.pos !== pos) continue
    seen.add(k)
    out.push({ m: e.meaning, score: pos && e.pos === pos ? 1 : 0 })
  }
  return out.map((x, i) => ({ ...x, i })).sort((a, b) => b.score - a.score || a.i - b.i).map((x) => x.m)
}

// THE PLAN for one question. input:
//   answer      the main accepted answer (the word the question asks for)
//   accepted    every accepted answer
//   isLanguage  a language mode (the prefix rule and the meaning form)
//   entries     the pool (poolEntry rows; the card itself is skipped by its word)
//   head        the card's learned word (shown by the meaning form), default the answer
//   meaning     the card's meaning (the right option of the meaning form)
//   pos         the card's part of speech, when known
//   ai          { choices, answerIdx } the model's own options, or null
// → { kind: 'word'|'meaning'|'ai', choices, answerIdx (0 = the answer first; callers shuffle), word? } or null.
//   hintSeen    the learner saw the typed question first (default): options must share the shown prefix, no meaning form
//   shownPrefix the folded tokens of a LONGER prefix the learner saw (a retry hint, a bought Hint), else the hint's own
export function planChoices({ answer = '', accepted = [], isLanguage = false, entries = [], head = '', meaning = '', pos = '', ai = null, need = MIN_DISTRACTORS, hintSeen = true, typedSeen = hintSeen, allowMeaning = false, shownPrefix = null } = {}) {
  // Shown as the card writes it ("TPM", not the lowercased accepted answer "tpm"); the others follow its case.
  const a0 = str(answer)
  if (!a0) return null
  const a = head && key(head) === key(a0) ? str(head) : a0
  const acc = [a0, ...(accepted || [])].map(str).filter(Boolean)
  const aiOk = ai && Array.isArray(ai.choices) && Number.isInteger(ai.answerIdx) && ai.choices[ai.answerIdx] != null
  const own = (entries || []).filter((e) => e && key(e.word) !== key(head || a))
  // A model option that is a pool card whose meaning overlaps the answer's, or a form of an accepted answer, is out.
  const poolMeaning = new Map(own.map((e) => [compactKey(e.word), e.meaning]))
  // In a language mode a model option has the answer's number of words too (a one-word option beside "buenos días"
  // and "bien dicho" stood out).
  const fairAi = (c, right, { loose = false } = {}) => (!isLanguage || words(c).length === words(right).length) &&
    optionIsFair(c, right, { accepted: acc, meaning, poolMeaning, loose })
  const done = (kind, right, list, extra = {}) => ({ kind, choices: [right, ...list.slice(0, need)], answerIdx: 0, spare: list.slice(need), ...extra })
  if (!isLanguage) {
    // Deck terms only when the answer IS the card's term ("TPM" for the TPM card): for "What does TPM stand for?" other
    // cards' terms (Secure Boot, FDE) are no rivals to "Trusted Platform Module", and the right one stood out.
    const isTerm = !head || key(head) === key(a0) || key(cardWord(head)) === key(a0)
    // SIBLINGS FIRST (a CompTIA "Port 22" among deck terms "802.11ac, TLS 1.3, IPv6" was the only port): when the
    // model offers a fair option of the answer's own family ("Port 23"; "RAID 6"; "IPv4") and 2+ fair ones in all, the
    // model's set leads (its family first).
    if (aiOk) {
      const right = str(ai.choices[ai.answerIdx])
      const fair = ai.choices.map(str).filter((c, i) => i !== ai.answerIdx && fairAi(c, right, { loose: true }))
      const fam = fair.filter((c) => sameFamily(c, right))
      if (fam.length && fair.length >= 2) return done('ai', right, [...fam, ...fair.filter((c) => !fam.includes(c))])
    }
    if (termShaped(a) && isTerm) {
      const picks = rankDistractors(a, own, { accepted, general: true, meaning })
      if (picks.length >= need) return done('word', a, picks)
    }
    if (!aiOk) return null
    const right = str(ai.choices[ai.answerIdx])
    const fair = ai.choices.map(str).filter((c, i) => i !== ai.answerIdx && fairAi(c, right, { loose: true }))
    // Fewer than 2 fair: the model's set as it is, marked `raw` (Study's buildChoices and the option check judge it;
    // fights keep only the fair ones: fairModelOptions).
    return fair.length >= Math.min(need, 2) ? done('ai', right, fair) : rawSet(ai)
  }
  // The letters the learner has SEEN: the prefix hint (or a longer one: a retry hint, a bought Hint), none when the
  // choices open first or the question shows no hint (`hintSeen: false`).
  const hint = prefixHint(a)
  const prefix = !hintSeen ? null : Array.isArray(shownPrefix) && shownPrefix.length ? shownPrefix : hint ? hintTokens(hint) : null
  // Headword distractors only for a headword answer: an inflected answer ("comió" for comer) among headwords
  // ("casa", "cantar") would be the odd one out.
  const w = str(head) || a
  const headAnswer = !head || key(head) === key(a) || closeForm(head, a)
  const picks = headAnswer ? rankDistractors(a, own, { prefix, pos, meaning, accepted }) : []
  if (picks.length >= need) return done('word', a, picks)
  // The MEANING form only when nothing typed was shown first (`typedSeen: false`): the typed question names the
  // meaning ("How do you say 'dog'"), so after it the right meaning would stand out. `allowMeaning`: the caller's last
  // resort after a hint was already on screen (better than options the hint gives away).
  const m = str(meaning)
  const meaningForm = () => {
    if (!m || (typedSeen && !allowMeaning)) return null
    const ms = rankMeanings(m, own, { pos, head: w })
    return ms.length >= need ? done('meaning', m, ms, { word: w }) : null
  }
  if (!aiOk) return meaningForm()
  const right = str(ai.choices[ai.answerIdx])
  const obey = ai.choices.map(str).filter((c, i) => i !== ai.answerIdx && sharesPrefix(c, prefix) && fairAi(c, right))
  // The deck's own fitting words first, the model's fitting options to fill up.
  const mixed = [...picks, ...obey.filter((c) => !picks.some((p) => key(p) === key(c)))]
  if (mixed.length >= need) return done(picks.length ? 'word' : 'ai', right, mixed)
  const mf = meaningForm()
  if (mf) return mf
  // Nothing keeps to the hint: the model's (fair) options, marked `loose`. Callers never show them after the hint:
  // the question then shows NO hint (fights `noHint`, Study's plan), or (hint already on screen) the meaning form.
  // The deck's fitting words first here too (only the model's would drop "bien dicho" for nothing).
  const fair = ai.choices.map(str).filter((c, i) => i !== ai.answerIdx && fairAi(c, right))
  const all = [...picks, ...fair.filter((c) => !picks.some((p) => key(p) === key(c)))]
  return { kind: 'ai', choices: [right, ...all.slice(0, need)], answerIdx: 0, spare: all.slice(need), loose: true }
}
// One FAMILY of numbered terms: the same letters around different numbers ("Port 22"/"Port 23", "IPv4"/"IPv6", "TLS
// 1.2"/"TLS 1.3"), or the same leading number ("802.11ac"/"802.11n"). Only for answers that carry a number.
function sameFamily(a, b) {
  const x = key(a).replace(/\s+/g, ''), y = key(b).replace(/\s+/g, '')
  if (!/\p{N}/u.test(x) || !/\p{N}/u.test(y)) return false
  const letters = (s) => s.replace(/\p{N}+/gu, '#')
  if (letters(x) === letters(y)) return true
  const lead = (s) => (s.match(/^\p{N}{3,}/u) || [''])[0]
  return !!lead(x) && lead(x) === lead(y)
}
// The model's set as it is, but never one option twice in another case, spacing or punctuation ("raid5", "RAID-5"
// beside "RAID 5"): the right one is kept, a near copy of an earlier option dropped.
function rawSet(ai) {
  const right = str(ai.choices[ai.answerIdx])
  const kept = [right]
  for (const c of ai.choices.map(str)) if (c && !kept.some((k) => sameCompact(k, c))) kept.push(c)
  return { kind: 'ai', choices: kept, answerIdx: 0, spare: [], raw: true }
}
// THE CODE GUARD on one model option (no shape rule): not the answer or a near form of it, not another form or the same
// content words of an accepted answer ("perro" beside "el perro"), not a pool card whose meaning overlaps the answer's.
// `loose` (general modes): a NEAR FORM of the answer or an accepted answer is no wrong option either (`generalNearForm`,
// review rounds 4 to 6). Only these, never a spelling distance (exam distractors ARE one letter apart: Vishing/Phishing,
// Ileum/Ilium, Hypotension/Hypertension, Austria/Australia) and never "it adds words" (Sodium chloride, South Sudan,
// React Native, Equatorial Guinea are other things):
//   - the same text but for case, spacing and punctuation ("RAID-5", "raid5"); "+" and "#" count ("C", "C++", "C#")
//     and so does the case of a short token ("CO" carbon monoxide, "Co" cobalt);
//   - a leading article ("the TPM", "a firewall");
//   - a PLURAL of the last word, either way ("Firewalls", "TPMs", "tpms", "Trusted Platform Modules", "policies"); an
//     uppercase or digit ending is another standard ("HTTPS", "RAID 10", "WPA3"), other endings other words ("Porter");
//   - the answer followed by words set off in parentheses or after a comma, colon or spaced dash ("Port 22 (SSH)",
//     "Port 22 - SSH", "Firewall: network"), unless what follows is only a number or version;
//   - an acronym and its expansion, either way ("Trusted Platform Module" for "TPM"; one trailing letter may be
//     missing: "United States" for "USA"), and the names one thing goes by (`SAME_TERMS`: "Wi-Fi 6" is 802.11ax).
// Siblings stay offered: "802.11n", "RAID 6", "Port 23", "TLS 1.2", "IPv4", "Louis XVI", "World War II", "Objective-C".
// What this cannot see (synonyms, a fragment like "Lincoln") is the AI option check's job (utils/distractorCheck.js).
export function optionIsFair(c, right, { accepted = [], meaning = '', poolMeaning = null, loose = false } = {}) {
  const o = str(c)
  if (!o) return false
  const acc = (accepted || []).map(str).filter(Boolean)
  if (loose) { if ([right, ...acc].some((x) => generalNearForm(o, x))) return false }
  else {
    if (closeForm(o, right) || sameContent(o, right)) return false
    if (acc.some((x) => sameLemma(x, o) || sameContent(x, o))) return false
  }
  const pm = poolMeaning && poolMeaning.get(compactKey(o))
  return !(meaning && pm && meaningsOverlap(pm, meaning, { loose }))
}
// The names one thing goes by (data; extend here). Compared in compact form (sameCompact).
const SAME_TERMS = [
  ['802.11be', 'Wi-Fi 7'], ['802.11ax', 'Wi-Fi 6', 'Wi-Fi 6E'], ['802.11ac', 'Wi-Fi 5'], ['802.11n', 'Wi-Fi 4'],
  ['JS', 'JavaScript'], ['TS', 'TypeScript'],
  ['NaCl', 'Sodium chloride', 'Table salt'], ['H2O', 'Water'],
  ['MI', 'Myocardial infarction', 'Heart attack'], ['CVA', 'Stroke', 'Cerebrovascular accident'],
  ['Angina', 'Angina pectoris'], ['Magna Carta', 'Magna Carta Libertatum'], ['Certiorari', 'Writ of certiorari'],
  ['Stare decisis', 'Precedent'],
]
const sameTerm = (a, b) => { const x = compactKey(a), y = compactKey(b); return SAME_TERMS.some((g) => { const c = g.map(compactKey); return c.includes(x) && c.includes(y) }) }
const ARTICLES = new Set(['the', 'a', 'an'])
// The words as written ("+"/"#" kept), a leading article dropped.
const termTokens = (s) => { const t = str(s).split(/[^\p{L}\p{N}'’+#]+/u).filter(Boolean); return t.length > 1 && ARTICLES.has(t[0].toLowerCase()) ? t.slice(1) : t }
const PLURALS = new Set(['s', 'es', "'s", '’s'])
// `long` is `short` plus a plural ending, written in lowercase ("TPMs", "Firewalls", "Modules"; "policies"/"policy").
const pluralOf = (long, short) => {
  if (!/\p{L}$/u.test(short)) return false
  if (long.toLowerCase().startsWith(short.toLowerCase()) && PLURALS.has(long.slice(short.length))) return true
  return /y$/i.test(short) && long.toLowerCase() === short.toLowerCase().slice(0, -1) + 'ies' && /ies$/.test(long)
}
const sameTokens = (x, y) => {
  if (!x.length || x.length !== y.length) return false
  const n = x.length - 1
  for (let i = 0; i < n; i++) if (!sameCompact(x[i], y[i])) return false
  return sameCompact(x[n], y[n]) || pluralOf(x[n], y[n]) || pluralOf(y[n], x[n])
}
// The text before words set off by "(", ",", ":" or a SPACED dash, and what follows ("Port 22 (SSH)" → "Port 22", "SSH").
// A hyphen inside a name ("Guinea-Bissau", "Objective-C") sets nothing off.
const SET_OFF = /\s*(?:\(|,|:|\s[-–—]\s)/u
const setOff = (s) => { const m = SET_OFF.exec(s); return m && m.index > 0 ? [s.slice(0, m.index), s.slice(m.index + m[0].length)] : null }
// One of them is the other plus words set off, more than a number or version ("Port 22 (SSH)"; not "HTTP (2)").
const addsSetOff = (o, a) => {
  for (const [long, short] of [[o, a], [a, o]]) {
    const p = setOff(long)
    if (!p || setOff(short)) continue
    const rest = key(p[1])
    if (rest && !/^(?:v?\p{N}+\s*)+$/u.test(rest) && (sameCompact(p[0], short) || sameTokens(termTokens(p[0]), termTokens(short)))) return true
  }
  return false
}
const CONNECTORS = new Set(['of', 'and', 'for', 'the', 'a', 'an', 'to', 'in', 'on', 'over', 'with', 'by', 'at'])
const isAcronym = (s) => /^\p{Lu}{2,7}s?$/u.test(str(s))
// "TPM" and "Trusted Platform Module" (initials of every word, or of every word but the little ones); a 3+ letter
// acronym may have ONE more letter at its end than the phrase has words ("USA", "United States"). Never a letter in
// the middle: "Intrusion Prevention System" stays a fair option for "IDS".
const expands = (acr, phrase) => {
  const a = str(acr).replace(/s$/, '').toLowerCase()
  const ws = str(phrase).split(/[\s-]+/).filter((w) => /\p{L}/u.test(w))
  if (ws.length < 2) return false
  const ini = (list) => list.map((w) => w.match(/\p{L}/u)[0].toLowerCase()).join('')
  return [ini(ws), ini(ws.filter((w) => !CONNECTORS.has(w.toLowerCase())))].some((i) =>
    i === a || (a.length >= 3 && i.length === a.length - 1 && a.startsWith(i)))
}
function generalNearForm(o, a) {
  if (!a) return false
  if (sameCompact(a, o) || sameTerm(a, o) || addsSetOff(o, a)) return true
  if (!caseClash(o, a) && sameTokens(termTokens(o), termTokens(a))) return true
  return (isAcronym(a) && expands(a, o)) || (isAcronym(o) && expands(o, a))
}
// The model's wrong options that pass the guard (no shape rule), for a fallback that must keep SOME choice (fights).
export function fairModelOptions({ ai = null, accepted = [], meaning = '', entries = [], head = '', isLanguage = true } = {}) {
  if (!ai || !Array.isArray(ai.choices) || !Number.isInteger(ai.answerIdx) || ai.choices[ai.answerIdx] == null) return []
  const right = str(ai.choices[ai.answerIdx])
  const fair = optionGuard({ answer: right, accepted, meaning, entries, head, isLanguage })
  return ai.choices.map(str).filter((c, i) => i !== ai.answerIdx && fair(c))
}
// THE CODE GUARD as one check for a question: (option) → fair? Never the answer twice (`seen`, compact form), the deck
// pool's meanings against the card's (`entries`, `meaning`, `head`), the accepted answers. Used by fairModelOptions and
// the fresh-options retry (kit/choiceCheck.js), so the retry never skips the meaning guard ("buen día" for "buenos días").
export function optionGuard({ answer = '', accepted = [], meaning = '', entries = [], head = '', isLanguage = true } = {}) {
  const right = str(answer)
  const acc = [right, ...(accepted || [])].map(str).filter(Boolean)
  const poolMeaning = new Map((entries || []).filter((e) => e && e.word && key(e.word) !== key(head || right)).map((e) => [compactKey(e.word), e.meaning]))
  const seen = [right]
  return (c) => {
    if (!compactKey(c) || seen.some((s) => sameCompact(s, c))) return false
    seen.push(c)
    return optionIsFair(c, right, { accepted: acc, meaning, poolMeaning, loose: !isLanguage })
  }
}
// The options in a random order (models and the planner both put the answer first). → { choices, answerIdx }
export function shuffleChoices(choices, answerIdx, rnd = Math.random) {
  const list = (choices || []).map((c, i) => ({ c, right: i === answerIdx }))
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [list[i], list[j]] = [list[j], list[i]] }
  return { choices: list.map((x) => x.c), answerIdx: list.findIndex((x) => x.right) }
}

// THE PROMPT LINE every option writer gets (Study, raids, Legends, the background options call): the model's options
// are the last resort, so they must follow the same rules.
export function distractorRule(isLanguage, learnLang = 'the learned language') {
  return isLanguage
    ? `WRONG OPTIONS: real, common ${learnLang} words the learner is likely to have met, the SAME kind as the answer (same part of speech, same number of words) and STARTING WITH THE SAME LETTERS as the answer (the app shows the answer's first letters as a hint: about its first 20%, or each word's first letter for a phrase), so neither that hint nor the word's length picks the right one. Never another form, a synonym or a misspelling of the answer.`
    : 'WRONG OPTIONS: real terms or values of the same subject and the same kind as the answer (same category, same shape), tempting to someone who half-knows it, never defensible as correct.'
}
