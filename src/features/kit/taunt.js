// BOSS TAUNTS (pure, tested): one short line a boss says after the learner misses, in its own voice. Works for ANY
// subject (the owner): the joke is about the mistake, in plain everyday words, never a lecture, never about the
// person. The persona text comes from the caller (raid bosses: legends/raidVoices.js; Legends bosses: a voice made
// from the boss's name and island, `islandVoice`). The model answers in the learner's own language.
//
// Every line must be NEW (the owner: "all must be unique"): the boss's last RECENT_MAX lines are sent as "never
// repeat these", and a reply that shares a 3+ word phrase with any of them (or with the boss's sample line) is
// rejected (`sharesPhrase`); one retry, then nothing is shown rather than a repeat.

export const TAUNT_ROLE = 'help' // the cheap tier (providers.js ROLE_TIER): one line per miss
export const TAUNT_MAX_TOKENS = 160
export const TAUNT_MAX_CHARS = 220
export const RECENT_MAX = 12
export const PHRASE_WORDS = 3

const words = (text) => String(text || '').toLowerCase().normalize('NFKC')
  .replace(/[^\p{L}\p{N}\s']/gu, ' ').split(/\s+/).map((w) => w.replace(/^'+|'+$/g, '')).filter(Boolean)
// Scripts written without spaces (Chinese, Japanese, Thai, Lao, Khmer, Burmese): their "words" are characters, so phrases are character runs.
const NO_SPACES = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}\p{Script=Lao}\p{Script=Khmer}\p{Script=Myanmar}]/u

// Every run of `n` words of a line (characters, for a line in a script without spaces), as strings.
export function phrasesOf(text, n = PHRASE_WORDS) {
  const s = String(text || '')
  const toks = NO_SPACES.test(s) ? [...s.replace(/[\s\p{P}\p{S}]/gu, '')] : words(s)
  const out = new Set()
  const size = NO_SPACES.test(s) ? Math.max(n, 4) : n // 4 characters, about one short phrase
  for (let i = 0; i + size <= toks.length; i++) out.add(toks.slice(i, i + size).join(' '))
  return out
}

// Does `line` share a phrase of `n` or more words with any of `others`? (The overlap check.)
export function sharesPhrase(line, others = [], n = PHRASE_WORDS) {
  const mine = phrasesOf(line, n)
  if (!mine.size) return false
  return (others || []).some((o) => { for (const p of phrasesOf(o, n)) if (mine.has(p)) return true; return false })
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
  s = s.split(/\n+/).map((x) => x.trim()).filter(Boolean)[0] || ''
  s = s.replace(/^(taunt|line|boss)\s*:\s*/i, '').replace(/^["'“”«»「『]+|["'“”«»」』]+$/g, '').trim()
  s = String(clean(s) || '').trim()
  if (!s || s.length > TAUNT_MAX_CHARS * 1.3) return ''
  return s
}

// A reply that repeats the boss (its recent lines or its sample) is refused.
export const tauntRepeats = (line, recent = [], sample = '') => sharesPhrase(line, [...(recent || []), ...(sample ? [sample] : [])])
