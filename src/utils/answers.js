// Answer forms and the typed-answer matcher.
// Moved verbatim out of App.jsx (pure: no React, no app state) so they can be tested; App imports them back.
import { withoutSubjectPronoun } from './conjugation.js'

// Accepted answers the model packs into ONE string ("repleto/repleta", "actor/actriz") are also listed
// as their parts. Only the letter-count hint understood that shape: local matching marked a typed
// "repleta" wrong (red shake + hint), the leak guards missed "repleta" in the question or hint, and the
// letter-cue skeleton counted both halves. Split only when every part is a word ("km/h" stays one answer).
// A slash piece that is an ENDING of the word before it ("nosotros/as", "bonito/-a", "trabajador/ora"), not a
// word of its own: 2-letter endings used to count as full answers ("as" alone passed) and expanded to
// "nosotrosas". Needs a real base word (4+ letters), so "nos/os" stays two pronouns.
// Longer endings too ("inglés/esa", "catalán/ana", "campeón/ona", "bailarín/ina"): unknown, "esa" (that) became a
// standalone correct answer and "inglesa" was refused.
export const SLASH_ENDING = /^-?(?:[aeo]s?|s|oras?|esas?|anas?|onas?|inas?|se|ve|ne|le|la|ère|ere|euse|rice|trice|in|essa|ssa|ã|ães|ões|ãos|ая|ое|ые|яя|ее|ка|ces)$/i
// Endings whose spelling change is known (mostly French): the base must end in the letters shown, and the
// form is built from them (heureux/se = heureuse, lavar/se = lavarse, actif/ve = active, bon/ne = bonne, gentil/le = gentille,
// aquel/la = aquella, premier/ère = première, chanteur/euse = chanteuse, acteur/rice = actrice). A bare "se" or
// "la" used to count as a whole answer.
export const SLASH_SPELLED = {
  se: [/[xr]$/i, (b) => (/x$/i.test(b) ? b.slice(0, -1) : b) + 'se'], ve: [/f$/i, (b) => b.slice(0, -1) + 've'],
  ne: [/n$/i, (b) => b + 'ne'], le: [/l$/i, (b) => b + 'le'], la: [/l$/i, (b) => b + 'la'],
  'ère': [/er$/i, (b) => b.slice(0, -2) + 'ère'], ere: [/er$/i, (b) => b.slice(0, -2) + 'ère'],
  euse: [/eur$/i, (b) => b.slice(0, -3) + 'euse'], rice: [/eur$/i, (b) => b.slice(0, -3) + 'rice'], trice: [/teur$/i, (b) => b.slice(0, -4) + 'trice'],
  // German -in (Freund/in = Freundin, Kollege/in = Kollegin), Italian -essa (professore/essa, studente/ssa = studentessa),
  // Portuguese -ão forms (alemão/ã = alemã, irmão/ãos), Russian adjective endings (новый/ая = новая, синий/яя = синяя) and
  // the noun suffix -ка (студент/ка). Unknown, the bare ending ("in", "essa", "ая") passed as a whole answer and the
  // real form was refused.
  // Only noun-shaped bases (Lehrer, Student, Freund; a capitalised Kollege): "into/in", "sign/in", "noch/in" are two words,
  // and esse/essa (Portuguese "that") stays two words.
  in: [/(?:(?:er|ent|ant|ist|ling|nd|og|at)|^\p{Lu}\p{L}{2,}e)$/u, (b) => (/e$/i.test(b) ? b.slice(0, -1) : b) + 'in'],
  essa: [/[^s]e$/i, (b) => b.slice(0, -1) + 'essa'], ssa: [/[^s]e$/i, (b) => b.slice(0, -1) + 'essa'],
  'ã': [/ão$/i, (b) => b.slice(0, -2) + 'ã'], 'ães': [/ão$/i, (b) => b.slice(0, -2) + 'ães'], 'ões': [/ão$/i, (b) => b.slice(0, -2) + 'ões'], 'ãos': [/ão$/i, (b) => b.slice(0, -2) + 'ãos'],
  'ая': [/(ый|ий|ой)$/i, (b) => b.slice(0, -2) + 'ая'], 'ое': [/(ый|ий|ой)$/i, (b) => b.slice(0, -2) + 'ое'], 'ые': [/(ый|ой)$/i, (b) => b.slice(0, -2) + 'ые'],
  // Spanish z to ces plurals (lápiz/ces = lápices, luz/ces = luces).
  ces: [/z$/i, (b) => b.slice(0, -1) + 'ces'],
  'яя': [/ий$/i, (b) => b.slice(0, -2) + 'яя'], 'ее': [/ий$/i, (b) => b.slice(0, -2) + 'ее'], 'ка': [/(?:ент|ист|ант)$/i, (b) => b + 'ка'],
}
// A 3+ letter ending must echo the base's last two letters (ingl(és)/esa, catal(án)/ana, trabaj(ador)/ora): else
// "esta/esa", "esos/esas", "hermano/ana" are two WORDS and were glued into "estesa".
const slashNoAcc = (x) => String(x).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
export const isSlashEnding = (piece, base) => {
  const e = String(piece || '').replace(/^-/, '')
  if (!SLASH_ENDING.test(String(piece || '')) || !base || /\s/.test(base)) return false
  const n = [...String(base)].length
  const spelled = SLASH_SPELLED[e.toLowerCase()]
  if (spelled) return n >= 3 && spelled[0].test(base)
  // Short words take a one-letter a/o/e ending too ("tío/a", "feo/a", "mío/a", "uno/a", French "ami/e"): neither
  // form matched before. 2+ letter endings still need a 4+ letter base, so "nos/os" stays two pronouns.
  if (n < 4 && !(n === 3 && /^[aoe]s?$/i.test(e) && /[aeiouáéíóú]$/i.test(base))) return false
  // A plural "/s" ("estudiante/s") only after a vowel.
  if (e.toLowerCase() === 's') return /[aeiouáéíóú]$/i.test(base)
  return e.length < 3 || slashNoAcc(base).endsWith(slashNoAcc(e.slice(0, 2)))
}
export const expandSlashEnding = (base, piece) => {
  const e = String(piece).replace(/^-/, '')
  if (e.toLowerCase() === 's') return base + e // estudiante/s
  const spelled = SLASH_SPELLED[e.toLowerCase()]
  if (spelled && spelled[0].test(base)) return spelled[1](base)
  // The ending repeats the base's last letters: trabajad(or) + ora.
  // Compared without accents: ingl(és) + esa, catal(án) + ana.
  const noAcc = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  for (let k = Math.min(e.length - 1, 3); k >= 2; k--) if (noAcc(base).endsWith(noAcc(e.slice(0, k)))) return base.slice(0, -k) + e
  if (/[aeo]s$/i.test(base) && /s$/i.test(e)) return base.slice(0, -2) + e   // nosotr(os) + as
  if (/[aeo]$/i.test(base)) return base.slice(0, -1) + e                     // bonit(o) + a, president(e) + a
  if (/[iu]$/i.test(base)) return base + e                                     // French ami + e = amie, joli + e = jolie
  // A final ACCENTED vowel stays and the ending is appended (French fatigué/e = fatiguée, marié/e = mariée): replacing
  // it gave another real word ("fatigue", "marie") that was graded correct while "fatiguée" was refused.
  if (/[áéíóúàèìòù]$/i.test(base)) return base + e
  // profesor + a. A written accent on the last syllable goes once a syllable is added (alemán + a = alemana,
  // francés + a = francesa): kept, "alemána" was the accepted form and the accent drill demanded it.
  const i = base.search(/[áéíóú](?=[^aeiouáéíóú]*$)/i)
  const b = i < 0 ? base : base.slice(0, i) + base[i].normalize('NFD')[0] + base.slice(i + 1)
  return b + e
}

// Articles that carry a gender (data, per language): beside a gendered word with a slash ending they fix which form is meant.
export const GENDERED_ARTICLES = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'il', 'lo', 'le', 'gli', 'une', 'o', 'os', 'as', 'um', 'uma', 'umas', 'uns', 'der', 'die', 'das', 'ein', 'eine'])
export const expandSlashAnswers = (list) => {
  const out = []
  for (const a of list || []) {
    const s = String(a).trim()
    if (!s) continue
    if (!out.includes(s)) out.push(s)
    const parts = s.includes('/') ? s.split('/').map((x) => x.trim()) : []
    // Every part needs 2+ letters: "km/h" is one answer ("km" alone must not pass). And "el/la estudiante"
    // is one phrase whose slash only covers the article: a SHORT lone word (3 letters or fewer) beside a
    // phrase is not an alternative, or a bare "el" was a correct answer. Real alternatives still split,
    // phrases included ("echar de menos/extrañar", "tener que/deber").
    const letters = (p) => [...p.replace(/[^\p{L}]/gu, '')].length
    // A gender ENDING inside a phrase ("compañero/a de clase", "chico/a guapo/a", "los/las alumnos/as") expands WORD
    // BY WORD, genders aligned: split on the slash as a whole, it gave "compañero" and "a de clase" (junk that
    // passed) and never "compañera de clase". Word alternatives in the same phrase (los/las) align by position.
    // A fraction ("1/2 taza", "3/4 cup") is a number, never two answers: split, "1 taza" and "2 taza" passed.
    if (/\d\s*\/\s*\d/.test(s)) continue
    const words = /\s/.test(s) ? s.split(/\s+/) : []
    const slashWords = words.filter((w) => w.includes('/')).length
    const wordForms = words.map((w) => {
      if (!w.includes('/')) return null
      const ps = w.split('/')
      if (!(ps.length > 1 && ps.slice(1).every((p) => isSlashEnding(p, ps[0])))) return null
      // A plural ending beside ANOTHER slash ("el/la joven/es") is a different axis: paired by position it made
      // "la jovenes". Only the singular is kept there.
      if (slashWords > 1 && ps.slice(1).every((p) => /^-?e?s$/i.test(p))) return [ps[0]]
      return [ps[0], ...ps.slice(1).map((p) => expandSlashEnding(ps[0], p))]
    })
    if (wordForms.some(Boolean)) {
      const opts = words.map((w, i) => wordForms[i] || (w.includes('/') && w.split('/').every((p) => letters(p) >= 1) ? w.split('/') : [w]))
      // An article WITHOUT a slash fixes the gender ("el médico/a"): pairing it with the other ending gave "el médica"
      // (accepted, while "la médica" was not). Only the form that agrees with it is expanded then.
      const fixedArticle = words.some((w, i) => !wordForms[i] && !w.includes('/') && GENDERED_ARTICLES.has(w.toLowerCase()))
      const n = fixedArticle ? 1 : Math.max(...opts.map((o) => o.length))
      for (let k = 0; k < n; k++) {
        const form = opts.map((o) => o[Math.min(k, o.length - 1)]).join(' ')
        if (!out.includes(form)) out.push(form)
      }
      continue
    }
    const hasPhrase = parts.some((p) => /\s/.test(p))
    // An EMPTY piece (a stray slash: "el o/", "/asos x") is no alternative: as a "lone article" it was glued to the
    // phrase's tail and shipped half-forms with a leading or trailing space ("el ", " 1ces").
    const articleSlash = hasPhrase && parts.some((p) => p && !/\s/.test(p) && letters(p) <= 3)
    // A one-letter ENDING ("bonito/-a", "niño/a") is a form, not a stray letter: it passed the 2-letter gate
    // only in theory, so "bonita" typed against "bonito/-a" was graded wrong.
    if (parts.length > 1 && !articleSlash && parts.every((p, i) => letters(p) >= 2 || (i > 0 && isSlashEnding(p, parts[0])))) {
      for (const [i, p] of parts.entries()) {
        const form = i > 0 && isSlashEnding(p, parts[0]) ? expandSlashEnding(parts[0], p) : p
        if (!out.includes(form)) out.push(form)
      }
    }
    // "el/la estudiante": each article with the phrase's tail ("el estudiante", "la estudiante"), never the
    // bare article. The phrase stayed whole, so "el estudiante" typed against it was graded wrong.
    if (parts.length > 1 && articleSlash) {
      // The lone piece replaces the phrase's FIRST word when it comes before it ("el/la estudiante"), its LAST
      // word when it comes after ("hace frío/sol" → "hace sol", never "sol frío").
      const pi = parts.findIndex((p) => /\s/.test(p))
      const phrase = parts[pi]
      const head = phrase.match(/^(\S+)\s+(.+)$/), tail = phrase.match(/^(.+)\s+(\S+)$/)
      for (const [i, p] of parts.entries()) {
        const form = !p ? null : i === pi ? p : i < pi ? (head ? `${p} ${head[2]}` : null) : (tail ? `${tail[1]} ${p}` : null)
        if (form && !out.includes(form)) out.push(form)
      }
    }
  }
  return out
}

// ── Typed-answer matcher pieces (submitStudyAnswer) ──────────────────────────────────────────
// Russian \u0451 is optional in writing (\u0435\u0449\u0435 = \u0435\u0449\u0451): the same letter, never an accent slip for the drill.
export const answerNormalize = (s) => s.normalize('NFC').toLowerCase().trim().replace(/\u0451/g, '\u0435').replace(/[\u064B-\u065F\u0670\u0591-\u05C7]/g, '').replace(/^(?:l|un)['’ʼ]\s*/, '') /* never all'/dell'/nell': those prepositions are what a blank tests */.replace(/[.!?,;:¿¡«»"“”‘’'ʼ`´。，、？！：；]/g, '').replace(/\s+/g, ' ').trim()
export const stripLeadArticles = (s) => s.replace(/^(el|la|los|las|un|una|unos|unas|lo|al|del|the|a|an|to)\s+/, '')
// SPANISH expected answers lose only true articles ("a menudo", "lo siento", "al final" keep their first word).
export const stripAccArticlesFor = (s, spanishTarget) => (spanishTarget ? s.replace(/^(el|la|los|las|un|una|unos|unas|the|an)\s+/, '') : stripLeadArticles(s))
// й is its own letter (мой/мои are different words), not и with an accent: kept through the strip.
export const stripAccentsKeepYot = (s) => s.replace(/й/g, '').replace(/Й/g, '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(//g, 'й').replace(//g, 'Й')
export const escapeAnswerRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
// Exact match (accent- and spelling-sensitive). `ans`/`ansNoArt` are the typed answer, normalized, with and
// without a leading article.
export const exactAnswerMatch = (a, { ans, ansNoArt, isConjugation = false, spanishTarget = false } = {}) => {
  // Conjugation drills compare the form as written: stripping "a"/"lo"/"la" made a bare "hablo" match
  // an expected "lo hablo" (and the reverse), the pronoun being part of the drilled form.
  // A leading SUBJECT pronoun ("yo hablo", "j'aime") is optional: the question names the subject, so the bare
  // form is the answer (typing it was a red miss with a hint, then a wait for the grader). Object and reflexive
  // pronouns stay required (withoutSubjectPronoun knows only subjects).
  if (isConjugation) {
    const acc = answerNormalize(a)
    if (acc === ans || (acc.length >= 3 && new RegExp(`(^|\\s)${escapeAnswerRe(acc)}(\\s|$)`).test(ans))) return true
    const bare = withoutSubjectPronoun(a)
    return bare != null && answerNormalize(bare) === ans
  }
  const acc = answerNormalize(a)
  const accNoArt = stripAccArticlesFor(acc, spanishTarget)
  if (acc === ans || accNoArt === ansNoArt || acc === ansNoArt || accNoArt === ans) return true
  // accept the exact correct word/phrase appearing as a whole token within the answer
  // Also test the answer AS TYPED: the typed side loses a leading "lo"/"a", so "Lo siento mucho" no
  // longer contained the expected "lo siento" (which keeps its first word, see stripAccArticles).
  const tokRe = new RegExp(`(^|\\s)${escapeAnswerRe(accNoArt)}(\\s|$)`)
  return accNoArt.length >= 3 && (tokRe.test(ansNoArt) || tokRe.test(ans))
}
