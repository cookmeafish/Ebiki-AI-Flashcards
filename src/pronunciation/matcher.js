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
const fold = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// Rank candidate audio files for (language, region, word). Returns [{ file, score }]
// sorted best-first; empty array when nothing plausible matches.
export function pickAudioFiles(files, { iso1, iso3 = [], region = '', word }) {
  const w = fold(word)
  // Accents can make a DIFFERENT word (schön "beautiful" vs schon "already", papá vs papa "potato"),
  // and the fold above made them score identically, so the wrong word's recording could win and be
  // embedded in the card. A file whose name carries the word WITH its exact accents is preferred; one
  // that matches only once accents are folded away is penalized, and dropped when an exact one exists.
  const exact = String(word || '').toLowerCase().normalize('NFC')
  const accentExact = (file) => file.replace(AUDIO_EXT_RE, '').toLowerCase().normalize('NFC').includes(exact)
  const reg = fold(region)
  // How well the word part matches: exact > variant suffix ("schön2", "haus fcm") > phrase.
  // Both looser forms need a WORD boundary: a plain prefix/substring test scored recordings of other
  // words as strong matches ("sol" took soldado, sola, girasol; "pa" took papá) and embedded them.
  const esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const asWord = new RegExp(`(^|[^\\p{L}])${esc}([^\\p{L}]|$)`, 'u')
  const wordPts = (rest) => rest === w ? 30
    : (rest.startsWith(w) && rest.length <= w.length + 4 && !/^\p{L}/u.test(rest.slice(w.length))) ? 20
    : (w && asWord.test(rest)) ? 10 : null

  const out = []
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
      const langPts = l3 && iso3.includes(l3) ? 110 : 55 // no (xxx): language hides in the Q-id — keep low
      const wp = wordPts(m[2])
      if (wp !== null) best = langPts + wp
    } else if (classic && (classic[1] === iso1 || iso3.includes(classic[1]))) {
      // A 2-letter chunk after the language code is AMBIGUOUS: region ("en-us-schedule")
      // or part of a hyphenated word ("fr-va-t-en"). Score both parses, keep the better.
      const parses = [{ rest: base.slice(classic[1].length + 1), pts: 120 }] // bare-language reading
      if (classic[2]) parses.push({ rest: classic[3], pts: reg && classic[2] === reg ? 140 : 95 })
      for (const p of parses) {
        const wp = wordPts(p.rest)
        if (wp !== null) best = Math.max(best ?? -1, p.pts + wp)
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
      out.push({ file, score: ok ? best : best - 40, accentOk: ok })
    }
  }
  const anyExact = out.some((c) => c.accentOk)
  return out.filter((c) => c.accentOk || !anyExact).map(({ file, score }) => ({ file, score })).sort((a, b) => b.score - a.score)
}

// Candidates below this score have NO language-convention evidence in the filename
// (bare "Perro.ogg" could as easily be a bark as a pronunciation) — they must prove
// themselves via their Commons page categories before being played.
export const STRONG_SCORE = 80
export const looksLikePronunciationPage = (categories) =>
  /pronunciation|pronunciación|prononciation|aussprache|lingua libre/i.test((categories || []).join(' '))

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
