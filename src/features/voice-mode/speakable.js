// What Ebi SAYS out loud in Chat's voice mode (pure, tested): a chat reply turned into plain speech. Card widgets,
// sources and other tags, links, code and markdown symbols are never read aloud ("asterisk asterisk"); a code block
// becomes a short phrase; the cards Ebi made are named; table rows become sentences. Then split into sentences, so
// the next one is made while one plays. Numbers stay whole ("TLS 1.2", "192.168.1.1", "802.11ac" are never split).

// Pictographic emoji (a voice reads "smiling face with ..."), and the dashes a voice pauses oddly on.
const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}]/gu
const TAGGED = /<(anki-card|sources|progress-update|offer-search|mode|action|think)\b[^>]*>[\s\S]*?<\/\1>/gi
const ANY_TAG = /<\/?[a-z][\w-]*(?:\s[^<>]*)?>/gi

// `codePhrase`: said in place of a code block ("the code is on screen"); `cards`: the reply's cards ({ front }) and
// `cardsPhrase(fronts)` names them.
export function speakableText(text, { codePhrase = '', cards = [], cardsPhrase = null } = {}) {
  let s = String(text || '')
  s = s.replace(TAGGED, ' ')
  s = s.replace(/```[\s\S]*?(```|$)/g, codePhrase ? `\n${codePhrase}.\n` : '\n')
  s = s.replace(ANY_TAG, ' ')
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ') // images
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links: their words only
  s = s.replace(/\s*\(?https?:\/\/[^\s)]*[^\s).,;:!?]\)?/g, '') // bare links (a word left dangling before one is tidied below)
  s = s.replace(/`([^`]*)`/g, '$1')
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
  s = s.replace(/^\s*>\s?/gm, '') // quotes
  s = s.replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '') // list markers
  s = s.replace(/^\s*\|?\s*:?-{2,}:?(\s*\|\s*:?-{2,}:?)*\s*\|?\s*$/gm, '') // table rules
  // Table rows: the outer pipes go, the cells read as one sentence.
  s = s.replace(/^[ \t]*\|(.*)\|[ \t]*$/gm, (_, row) => row.split('|').map((c) => c.trim()).filter(Boolean).join(', '))
  s = s.replace(/\s*\|\s*/g, ', ')
  // Bold, italic, strike: only as markers around words (never inside one: first_name, 2*3*4 stay).
  s = s.replace(/(?<![\p{L}\p{N}])(\*\*|__|\*|_|~~)(?=\S)([\s\S]*?\S)\1(?![\p{L}\p{N}])/gu, '$2')
  s = s.replace(/\s*[—–]\s*/g, ', ')
  s = s.replace(EMOJI, '')
  s = s.replace(/\b(or|and|see|at)\s*([.,;:!?]|$)/gim, (m, w, p) => (p ? p : '')) // a word left dangling by a removed link
  s = s.replace(/[ \t]+/g, ' ').replace(/[ \t]+([.,!?;:])/g, '$1').replace(/\s*\n\s*/g, '\n').trim()
  // A line ending without a stop reads into the next one: give it a period.
  s = s.split('\n').filter((l) => l.trim()).map((l) => (/[.!?:;,。！？…]$/.test(l) ? l : `${l}.`)).join(' ')
  const fronts = (cards || []).map((c) => String(c?.front || '').replace(/<[^>]*>/g, '').trim()).filter(Boolean)
  if (fronts.length && typeof cardsPhrase === 'function') s = `${s} ${cardsPhrase(fronts)}`.trim()
  return s.replace(/\s+/g, ' ').replace(/^[.,;:]\s*/, '').trim()
}

const ABBREV = /(?:^|[\s(])(?:e\.g|i\.e|etc|vs|approx|incl|fig|mr|mrs|ms|dr|st|no)\.$/i
// Sentence ends: . ! ? … followed by a space or the end (so 1.2, e.g. inside, 192.168.1.1 stay whole), or a CJK stop.
const sentenceEnds = (s) => {
  const out = []
  const re = /[.!?…]+["')\]]*(?=\s|$)|[。！？]+/g
  let m
  // Not after an abbreviation ("e.g. at home", "Dr. Smith"): the sentence goes on.
  while ((m = re.exec(s))) if (!ABBREV.test(s.slice(Math.max(0, m.index - 8), m.index + 1))) out.push(m.index + m[0].length)
  return out
}

// Pieces to speak one after another, cut from the source text (its own spacing kept): sentences, very short ones
// joined to the next, very long ones cut at a comma or a space. `max` characters per piece.
export function speechChunks(text, { max = 220, min = 24 } = {}) {
  const s = String(text || '').trim()
  if (!s) return []
  const ends = sentenceEnds(s)
  if (!ends.length || ends[ends.length - 1] < s.length) ends.push(s.length)
  const sentences = []
  let from = 0
  for (const e of ends) { const piece = s.slice(from, e).trim(); if (piece) sentences.push(piece); from = e }
  const out = []
  const push = (p) => {
    let rest = p
    while (rest.length > max) {
      const cut = Math.max(rest.lastIndexOf(', ', max), rest.lastIndexOf(' ', max))
      const at = cut > max / 3 ? cut + 1 : max
      out.push(rest.slice(0, at).trim()); rest = rest.slice(at).trim()
    }
    if (rest) out.push(rest)
  }
  const join = (a, b) => (/[。！？]$/.test(a) ? `${a}${b}` : `${a} ${b}`)
  let cur = ''
  for (const p of sentences) {
    cur = cur ? join(cur, p) : p
    if (cur.length >= min) { push(cur); cur = '' }
  }
  if (cur) { const last = out[out.length - 1]; if (last && last.length + cur.length + 1 <= max) out[out.length - 1] = join(last, cur); else push(cur) }
  return out
}

// The language a DEVICE voice should read a piece in (AI voices hear the language themselves): by script first
// (kana → ja, Hangul → ko, Han → the learned language when it is Chinese or Japanese, else zh, Cyrillic, Arabic...),
// else the learned language when the piece shows its letters, else the user's language.
const SCRIPT = [[/[぀-ヿ]/, 'ja'], [/[가-힯]/, 'ko'], [/[Ѐ-ӿ]/, 'ru'], [/[؀-ۿ]/, 'ar'], [/[֐-׿]/, 'he'], [/[฀-๿]/, 'th'], [/[ऀ-ॿ]/, 'hi'], [/[Ͱ-Ͽ]/, 'el']]
const LATIN_MARKS = { es: /[ñ¿¡áéíóú]/i, fr: /[àâçèéêëîïôœùûü]/i, pt: /[ãõçáâêéíóôú]/i, de: /[äöüß]/i, it: /[àèéìíòóù]/i, pl: /[ąćęłńóśźż]/i, tr: /[çğıöşü]/i, vi: /[ăâđêôơư]/i }
export function chunkLang(piece, { learnIso = '', userIso = '' } = {}) {
  const s = String(piece || '')
  for (const [re, iso] of SCRIPT) if (re.test(s)) return iso
  if (/[一-鿿]/.test(s)) return learnIso === 'ja' || learnIso === 'zh' ? learnIso : 'zh'
  if (learnIso && LATIN_MARKS[learnIso]?.test(s)) return learnIso
  return userIso || ''
}

// Speech cost per hour of talking, the learner and Ebi each about half of it (`costs` = USD per minute of audio, as
// src/speech COSTS). Recordings also bill the pause before speech, so the real figure is a little higher.
export const speechCostPerHour = (costs, stt, tts) => ((costs?.stt?.[stt] || 0) + (costs?.tts?.[tts] || 0)) * 30
