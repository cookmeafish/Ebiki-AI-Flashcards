// BOSS TAUNTS (pure, tested): one short line a boss says after the learner misses, in its own voice. Works for ANY
// subject (the owner): the joke is about the mistake, in plain everyday words, never a lecture, never about the
// person. The persona text comes from the caller (raid bosses: legends/raidVoices.js; Legends bosses: a voice made
// from the boss's name and island, `islandVoice`). The model answers in the learner's own language.
//
// Every line must be NEW (the owner: "all must be unique"): the boss's last RECENT_MAX lines are sent as "never
// repeat these", and a reply that shares a 3+ word phrase with any of them (or with the boss's sample line) is
// rejected (`sharesPhrase`); one retry, then nothing is shown rather than a repeat.
// What the VOICE MANDATES is never a repeat (`voice`: a raid boss's PERSONAS entry, whose opener, signature and
// nickname every line is told to use): a word run touching one of them is left out of the check on both sides, and so
// are the first words of a line that does not start with the opener itself (the opener's slot, `leadOf`: a
// translated opener is the same in every line too). Only the line's OWN wording must be new. Before this, a boss
// obeying its voice repeated itself by definition, and after one line (often before any) nothing was ever shown.

export const TAUNT_JOB = 'fight.taunt'
export const TAUNT_ROLE = 'help' // the cheap tier (providers.js ROLE_TIER): one line per miss
export const TAUNT_MAX_TOKENS = 160
export const TAUNT_MAX_CHARS = 220
export const RECENT_MAX = 12
export const PHRASE_WORDS = 3

const words = (text) => String(text || '').toLowerCase().normalize('NFKC')
  .replace(/[^\p{L}\p{N}\s']/gu, ' ').split(/\s+/).map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean)
// Scripts written without spaces (Chinese, Japanese, Thai, Lao, Khmer, Burmese): their "words" are characters, so phrases are character runs.
const NO_SPACES = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u

const tokensOf = (s, cjk) => (cjk ? [...String(s || '').toLowerCase().normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '')] : words(s))
// How many leading tokens of a line are the OPENER'S SLOT: the opener's words plus one (a translated opener may take
// one more word), or two characters per opener word plus one in a script without spaces (an opener already written in
// such a script: its characters plus one).
export function leadOf(opener, cjk = false) {
  const o = String(opener || '').trim()
  if (!o) return 0
  if (NO_SPACES.test(o)) return tokensOf(o, true).length + 1
  const n = words(o).length
  return n ? (cjk ? n * 2 + 1 : n + 1) : 0
}

// Every run of `n` words of a line (characters, for a line in a script without spaces), as strings.
// opts.keep: phrases the voice MANDATES (a run touching any occurrence of one is left out); opts.opener: the opener,
// whose slot (the line's first `leadOf` tokens) is left out too. Runs made only of the line's other words still count.
export function phrasesOf(text, n = PHRASE_WORDS, opts = {}) {
  const { toks, held, cjk } = heldTokens(text, opts)
  const out = new Set()
  const size = cjk ? Math.max(n, 4) : n // 4 characters, about one short phrase
  for (let i = 0; i + size <= toks.length; i++) {
    if (held.slice(i, i + size).some(Boolean)) continue
    out.add(toks.slice(i, i + size).join(' '))
  }
  return out
}
// A line's tokens and which of them are HELD (the mandated words, or the opener's slot).
function heldTokens(text, { keep = [], opener = '', slot = true } = {}) {
  const s = String(text || '')
  const cjk = NO_SPACES.test(s)
  const toks = tokensOf(s, cjk)
  // The opener's slot is for a TRANSLATED opener only: a line that starts with the opener itself holds exactly its
  // words (below), so the words after it are checked like the rest.
  const ot = tokensOf(opener, cjk)
  const literal = ot.length > 0 && ot.every((w, j) => toks[j] === w)
  const held = toks.map((_, i) => slot && !literal && i < leadOf(opener, cjk))
  for (const k of [...(Array.isArray(keep) ? keep : []), ...(literal ? [opener] : [])]) {
    const kt = tokensOf(k, cjk)
    if (!kt.length) continue
    for (let i = 0; i + kt.length <= toks.length; i++) {
      if (kt.every((w, j) => toks[i + j] === w)) for (let j = 0; j < kt.length; j++) held[i + j] = true
    }
  }
  return { toks, held, cjk }
}
// The words of a line that are its OWN (not held), as one string.
const ownWords = (text, opts) => { const { toks, held } = heldTokens(text, opts); return toks.filter((_, i) => !held[i]).join(' ') }

// Does `line` share a phrase of `n` or more words with any of `others`? (The overlap check.) `opts`: phrasesOf's
// keep / opener, applied to both sides. With words exempt, a line whose OWN words equal another's is a repeat too: a
// short line of mandated words plus one or two of its own has no run left to compare (it was shown every miss).
export function sharesPhrase(line, others = [], n = PHRASE_WORDS, opts = {}) {
  const mine = phrasesOf(line, n, opts)
  const exempt = !!((Array.isArray(opts.keep) && opts.keep.length) || opts.opener)
  const own = exempt ? ownWords(line, opts) : ''
  return (others || []).some((o) => {
    if (exempt && ownWords(o, opts) === own) return true
    if (!mine.size) return false
    for (const p of phrasesOf(o, n, opts)) if (mine.has(p)) return true
    return false
  })
}

// The newest line first, deduped, at most `max`.
export function pushRecent(list, line, max = RECENT_MAX) {
  const s = String(line || '').trim()
  const rest = (Array.isArray(list) ? list : []).filter((x) => typeof x === 'string' && x && x !== s)
  return (s ? [s, ...rest] : rest).slice(0, max)
}

// A voice for a Legends boss (no hand-written persona): the boss named after what its island teaches.
export function islandVoice({ bossName = '', areaTitle = '', theme = '' } = {}) {
  const who = bossName || `the boss of ${areaTitle || 'this island'}`
  return `You are ${who}, the boss who guards the island "${areaTitle}"${theme ? ` (${theme})` : ''} in a learning adventure. `
    + 'Your personality comes from your name and your island: pick one clear mood (smug, playful, grumpy, proud or eerie) and keep it. '
    + 'Your images come from your own island and its world.'
}

// opts: { voice (persona text), rules (shared voice rules), avoidWords ([words never to use]), bossName, isLanguage,
// subjectName, learnLang, question, expected, answer, userLang, recent ([lines already said]), retry (the line that
// repeated one, on the second try) }
export function buildTauntPrompt(o = {}) {
  const recent = (o.recent || []).slice(0, RECENT_MAX)
  const system = [
    String(o.voice || '').trim(),
    o.rules ? String(o.rules).trim() : '',
    o.avoidWords?.length ? `Never use these words: ${o.avoidWords.map((w) => `"${w}"`).join(', ')}.` : '',
    `Reply with the taunt ONLY: one or two short sentences, at most ${TAUNT_MAX_CHARS} characters, written in ${o.userLang || 'English'}. No quotes around it, no stage directions, no emoji names, no dashes.`,
  ].filter(Boolean).join('\n')
  const user = [
    `The learner is studying ${o.subjectName || 'a subject'}${o.isLanguage && o.learnLang ? ` (${o.learnLang})` : ''}. They just answered a question WRONG in a fight against you.`,
    `Question: ${String(o.question || '').slice(0, 400)}`,
    o.expected ? `The right answer: ${String(o.expected).slice(0, 200)}` : '',
    `What they answered: ${String(o.answer || '(nothing)').slice(0, 200)}`,
    'Tease them about THIS mistake, in your own voice. Easy to understand on first read, plain everyday words, nothing technical, no explanation of the answer. Mock the mistake, never the person.',
    recent.length ? `You already said these lines. Never repeat them, their wording, their structure or their jokes; say something completely new:\n${recent.map((l) => `- ${l}`).join('\n')}` : '',
    o.retry ? `Your last try reused words from a line you already said ("${String(o.retry).slice(0, 200)}"). Write a completely different line.` : '',
  ].filter(Boolean).join('\n')
  return { system, user }
}

// The model's reply as one clean line, or '' (empty, too long, or not a line).
export function parseTaunt(raw, clean = (s) => s) {
  let s = String(raw || '').trim()
  if (!s) return ''
  // The line sent as JSON ({"taunt": "..."}, {"line": "..."}): its one text value.
  if (/^\{[\s\S]*\}$/.test(s)) {
    try { const v = Object.values(JSON.parse(s)).filter((x) => typeof x === 'string' && x.trim()); if (v.length === 1) s = v[0].trim() } catch { /* a line in braces */ }
  }
  // Code fences and a preamble on its own line ("Here's my taunt:") are not the line (some models add them).
  const lines = s.split(/\n+/).map((x) => x.trim()).filter((x) => x && !/^```/.test(x))
  s = (lines.length > 1 && /[:：]$/.test(lines[0]) ? lines[1] : lines[0]) || ''
  s = s.replace(/^(taunt|line|boss)\s*:\s*/i, '').replace(/^["'“”«»「『]+|["'“”«»」』]+$/g, '').trim()
  // Markdown emphasis, and a stage direction before the words (*cackles*, (grins), [smirks]) despite the prompt.
  s = s.replace(/^(?:\*[^*\n]{1,40}\*|_[^_\n]{1,40}_|\([^)\n]{1,40}\)|\[[^\]\n]{1,40}\])\s+(?=\S)/u, '')
    .replace(/\*\*|__/g, '').replace(/^\*([^*]+)\*$/, '$1').replace(/^["'“”«»「『]+|["'“”«»」』]+$/g, '').trim()
  s = String(clean(s) || '').trim()
  if (!s || s.length > TAUNT_MAX_CHARS * 1.3) return ''
  return s
}

// The phrases a voice mandates ({ opener, signature, nickname }, a raid boss's PERSONAS entry); [] for none.
export const mandatedPhrases = (voice) => (voice && typeof voice === 'object'
  ? [voice.opener, voice.signature, voice.nickname].filter((x) => typeof x === 'string' && x.trim()) : [])
// A reply that repeats the boss (its recent lines or its sample) is refused; `voice` (optional): what it MUST say is not
// a repeat (see the top). `translated`: the line is in another language than the voice (its English opener): only then
// does a line not starting with the opener get the opener's slot.
export const tauntRepeats = (line, recent = [], sample = '', voice = null, { translated = true } = {}) => sharesPhrase(line, [...(recent || []), ...(sample ? [sample] : [])],
  PHRASE_WORDS, { keep: mandatedPhrases(voice), opener: voice && typeof voice.opener === 'string' ? voice.opener : '', slot: !!translated })
// Is the taunt written in a language other than English (the voices are English)? '' = the prompt's default, English.
export const tauntTranslated = (userLang) => !/^\s*(en|english)\b/i.test(String(userLang || 'English'))
