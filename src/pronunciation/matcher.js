// Pure audio-filename matcher for Wiktionary/Commons candidates. No network, fully
// testable. Filename conventions observed live (see matcher.test.js fixtures):
//   en-us-schedule.ogg            classic language-region-word
//   De-Haus.ogg / Es-hola.oga     language-word, NO region (most non-English audio)
//   De-at-schön.ogg               language-region on a non-English word
//   LL-Q1321 (spa)-Rodelar-perro.wav   Lingua Libre, ISO-639-3 in parens
//   LL-Q9186-Luilui6666-犬.wav         Lingua Libre, language only via the Q-id (no parens)
//   Hola.ogg                      bare word, no language info at all
//   De-ein benachbartes Haus.ogg  phrase recording containing the word
// Graceful degradation (spec hard requirement): exact region → bare language →
// Lingua Libre → wrong-region same-language → bare word. Never fail solely because
// the region tag is absent; DO reject files identifiably from another language.
import { KNOWN_ISO1, KNOWN_ISO3 } from './langcodes'

// Region codes that name the same place (data, never per-language code).
export const REGION_ALIASES = { uk: ['gb'], gb: ['uk'] }
// Region codes recording file names use after each language ("En-us-", "Es-mx-", "Pt-br-"): data, never branches.
// Per language, because a code can be a piece of a word elsewhere ("au" is Australia in English, "au-dessus" in French).
const REGION_CODES = {
  en: ['us', 'uk', 'gb', 'au', 'ca', 'nz', 'ie', 'in', 'za', 'sg', 'ph', 'jm', 'sc'],
  es: ['es', 'mx', 'ar', 'co', 'cl', 'pe', 've', 'cu', 'uy', 'bo', 'ec', 'cr', 'pr', 'us'],
  pt: ['br', 'pt', 'ao', 'mz'], fr: ['fr', 'be', 'ch', 'ca', 'qc', 'lu'], de: ['de', 'at', 'ch', 'li'],
  zh: ['cn', 'tw', 'hk', 'mo', 'sg'], nl: ['nl', 'be'], it: ['it', 'ch'], ko: ['kr', 'kp'],
}

const AUDIO_EXT_RE = /\.(ogg|oga|wav|mp3|opus|flac)$/i
// Namespace prefixes seen across editions/APIs ("File:", German "Medium:"/"Datei:", …).
const NS_RE = /^(file|image|medium|media|datei|archivo|fichier|ficheiro|plik|bestand|ファイル|文件|파일):/i

export function normalizeFileName(raw) {
  let s = String(raw || '').trim()
  try { s = decodeURIComponent(s) } catch { /* keep as-is */ }
  s = s.replace(/^\.\//, '').replace(NS_RE, '').replace(/_/g, ' ').trim()
  return s
}

// Case/accent-insensitive fold for word comparison ("schön" ≈ "schon", "Hola" ≈ "hola").
// Curly apostrophes fold to "'" (a typed l’eau never matched Fr-l'eau.ogg).
const fold = (s) => String(s || '').toLowerCase().replace(/[’‘ʼ]/g, "'").normalize('NFD').replace(/[̀-ͯ]/g, '')

// Rank candidate audio files for (language, region, word). Returns [{ file, score }]
// sorted best-first; empty array when nothing plausible matches.
export function pickAudioFiles(files, { iso1, iso3 = [], region = '', word }) {
  const w = fold(word)
  // Accents can make a DIFFERENT word (schön "beautiful" vs schon "already", papá vs papa "potato"),
  // and the fold above made them score identically, so the wrong word's recording could win and be
  // embedded in the card. A file whose name carries the word WITH its exact accents is preferred; one
  // that matches only once accents are folded away is penalized, and dropped when an exact one exists.
  const exact = String(word || '').toLowerCase().replace(/[’‘ʼ]/g, "'").normalize('NFC')
  // On a WORD boundary: a plain substring test found "e" inside a Lingua Libre speaker's name
  // ("LL-Q5146 (por)-Pedrohenrique-é.wav"), so the recording of "é" counted as accent-exact for "e" and was embedded.
  const exactRe = exact ? new RegExp(`(^|[^\\p{L}\\p{M}])${exact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=[^\\p{L}\\p{M}]|$)`, 'u') : null
  const accentExact = (file) => !!exactRe && exactRe.test(file.replace(AUDIO_EXT_RE, '').toLowerCase().replace(/[’‘ʼ]/g, "'").normalize('NFC'))
  const wordHasMarks = /\p{M}/u.test(String(word || '').normalize('NFD'))
  const reg = fold(region)
  // How well the word part matches: exact > variant suffix ("schön2", "haus fcm") > phrase.
  // Both looser forms need a WORD boundary: a plain prefix/substring test scored recordings of other
  // words as strong matches ("sol" took soldado, sola, girasol; "pa" took papá) and embedded them.
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // A combining MARK is part of the word too (Hindi/Thai vowel signs, a dakuten): as a boundary, "कम" took
  // "कमी" (another word) and "は" took "ば", scored strong, played and embedded.
  const asWord = new RegExp(`(^|[^\\p{L}\\p{M}])${esc}([^\\p{L}\\p{M}]|$)`, 'u')
  const wordPts = (rest) => rest === w ? 30
    : (rest.startsWith(w) && rest.length <= w.length + 4 && !/^[\p{L}\p{M}]/u.test(rest.slice(w.length))) ? 20
    : (w && asWord.test(rest)) ? 10 : null

  const out = []
  // Region names people type differ from the tags files use: Commons says "uk", the standard tag is "gb".
  const sameRegion = (a, b) => a === b || (REGION_ALIASES[a] || []).includes(b)
  for (const raw of files || []) {
    const file = normalizeFileName(raw)
    if (!AUDIO_EXT_RE.test(file)) continue
    const base = fold(file.replace(AUDIO_EXT_RE, ''))
    let best = null

    // Lingua Libre ("LL-Q1321 (spa)-Speaker-word") and the bare "(spa)-Speaker-word"
    // variant seen in Commons search results share the parenthesized-ISO-639-3 shape.
    const ll = base.match(/^ll-q\d+(?:\s*\(([a-z]{3})\))?-[^-]+-(.+)$/)
    const paren = !ll && base.match(/^\(([a-z]{3})\)-[^-]+-(.+)$/)
    const classic = !ll && !paren && base.match(/^([a-z]{2,3})(?:-([a-z]{2}))?-(.+)$/)
    if (ll || paren) {
      const m = ll || paren
      const l3 = m[1] || null
      if (l3 && !iso3.includes(l3)) continue // an explicit (xxx) always names the language: another one, even outside our list (glg, ast)
      // No (xxx): the language hides in the Q-id (Q9186 is Cantonese), so it must stay BELOW STRONG_SCORE and
      // prove its language through its Commons categories. At 55 (+30 for the word) it counted as strong and a
      // Cantonese recording was played, and embedded, for a Japanese word.
      const langPts = l3 && iso3.includes(l3) ? 110 : 20
      const wp = wordPts(m[2])
      if (wp !== null) best = langPts + wp
    } else if (classic && (classic[1] === iso1 || iso3.includes(classic[1]))) {
      // A 2-letter chunk after the language code is AMBIGUOUS: region ("en-us-schedule")
      // or part of a hyphenated word ("fr-va-t-en"). Score both parses, keep the better.
      // When the region reading matches the word it wins outright: scored against the bare reading too,
      // "En-us-the house" read as the phrase "us-the house" (120 + 10) and tied the exact "En-us-house", so a
      // phrase recording could be played and embedded. No region asked = no penalty (most English files are
      // region-tagged); another region = 95.
      // Only a REAL region code wins this way: French "au-dessus", "là-bas" begin with a 2-letter piece of the word,
      // and read as a region "Fr-au-dessus" outranked the exact "Fr-dessus". Anything else keeps both readings.
      const regWp = classic[2] ? wordPts(classic[3]) : null
      const bareWp = wordPts(base.slice(classic[1].length + 1)) // bare-language reading ("fr-va-t-en")
      if (regWp !== null && (REGION_CODES[iso1] || []).includes(classic[2])) best = (reg ? (sameRegion(classic[2], reg) ? 140 : 95) : 120) + regWp
      else {
        if (bareWp !== null) best = 120 + bareWp
        if (regWp !== null) best = Math.max(best ?? -1, (reg && sameRegion(classic[2], reg) ? 140 : 95) + regWp)
      }
    } else if (classic && (KNOWN_ISO1.has(classic[1]) || KNOWN_ISO3.has(classic[1]))) {
      continue // another language's recording — never offer it
    } else {
      // No recognizable language info ("Hola.ogg"): last resort, only on a TIGHT word match.
      // A loose startsWith let animal/noise recordings through ("Perro ladrando.ogg" = a dog
      // BARKING) — require the filename to be essentially just the word.
      const wp = wordPts(base)
      if (wp !== null && wp >= 20) best = wp
    }

    if (best !== null) {
      const ok = accentExact(file)
      // A sense suffix right after the word ("en-us-live-verb", "En-us-wind-air"): see senseSplit below.
      const sense = (base.match(new RegExp(`${esc}-([a-z]{2,})$`)) || [])[1] || null
      out.push({ file, score: ok ? best : best - 40, accentOk: ok, sense })
    }
  }
  // Two or more DIFFERENT sense suffixes for one word = a word with two pronunciations (live verb /laɪv/ vs
  // adjective /lɪv/, wind air vs turn): the card's sense can't be told from the file, so those files still play
  // but are never embedded (approx), like the papa/papá rule. Numbered or speaker variants are not senses.
  const senseSplit = new Set(out.map((c) => c.sense).filter(Boolean)).size >= 2
  for (const c of out) c.sure = c.accentOk && !(senseSplit && c.sense)
  const anyExact = out.some((c) => c.sure)
  // `approx`: an accented word matched only WITHOUT its accents. Often just an unaccented file name (Es-cafe
  // for café), but it can be another word (papá/papa, schön/schon): playable, never embedded into the card.
  // Both directions: an UNaccented word matched to an accented file ("papa" to Es-papá, "schon" to De-schön) is
  // just as likely another word, so it is never embedded either.
  void wordHasMarks
  return out.filter((c) => c.sure || !anyExact).map(({ file, score, sure }) => ({ file, score, ...(!sure ? { approx: true } : {}) })).sort((a, b) => b.score - a.score)
}

// Candidates below this score have NO language-convention evidence in the filename
// (bare "Perro.ogg" could as easily be a bark as a pronunciation) — they must prove
// themselves via their Commons page categories before being played.
export const STRONG_SCORE = 80
// With `lang` ({ iso3, names }), a category that NAMES a language must name ours: "Lingua Libre
// pronunciation-yue" or "Cantonese pronunciation" no longer passes for a Japanese or Mandarin word, nor
// "French pronunciation" for a Spanish one. Categories that name no language keep the old rule.
export const looksLikePronunciationPage = (categories, lang = null) => {
  const cats = (categories || []).map((c) => String(c))
  if (!/pronunciation|pronunciación|prononciation|aussprache|lingua libre/i.test(cats.join(' '))) return false
  if (!lang) return true
  const iso3 = (lang.iso3 || []).map((x) => String(x).toLowerCase())
  const names = (lang.names || []).map((n) => String(n).toLowerCase())
  let named = false, ours = false
  for (const c of cats) {
    const ll = c.match(/lingua libre pronunciation-([a-z]{3})/i)
    if (ll) { named = true; if (iso3.includes(ll[1].toLowerCase())) ours = true; continue }
    const en = c.match(/^(?:category:)?\s*(.+?)\s+pronunciation$/i)
    if (en && names.length) { named = true; const x = en[1].toLowerCase(); if (names.some((n) => x.includes(n))) ours = true }
  }
  return !named || ours
}

// Union + dedupe candidates from the two Wiktionary sources (media-list ∪ wikitext).
// Live probes showed each source misses files the other finds, direction varies by edition.
export function unionCandidates(...lists) {
  const seen = new Set()
  const out = []
  for (const list of lists) {
    for (const raw of list || []) {
      const f = normalizeFileName(raw)
      const key = f.toLowerCase()
      if (!f || seen.has(key)) continue
      seen.add(key)
      out.push(f)
    }
  }
  return out
}
