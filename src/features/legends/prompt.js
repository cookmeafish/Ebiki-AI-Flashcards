// LEGENDS PROMPTS (pure): every AI request Legends makes, and the parsers for the replies. Subject-agnostic:
// `subject.isLanguage` only changes wording (a Spanish map teaches Spanish; a CompTIA map teaches CompTIA, never
// "CompTIA vocabulary in Spanish"). Replies are parsed with ai.json and checked here before anything is shown.
import { sanitizeQuestions, leaksAnswer } from '../kit/grade'
import { MOTIFS, PALETTES, AREAS, ITEMS, NODES, LESSONS, PER_LESSON, STORY, CAN_DO, cleanBossName } from './map'
import { TIERS } from './placement'
import { tierInstruction, CLEAR_ANSWER_RULE, QUESTION_CHECK_RULES, clampTier } from '../../utils/questionTier'
import { canonKeys } from '../../utils/aiJson'

// Roles pick the model tier like everywhere else: planning is `general`, questions are `study`, items that may
// become cards are `deck` (they get memorized: the strongest tier).
export const ROLE = { plan: 'general', area: 'deck', quiz: 'study', quizCheck: 'qcheck', talk: 'chat', hint: 'help', bossName: 'help', edit: 'general', placement: 'study', talkScore: 'study' }
// The job of each call (Settings > AI & cost > Models per job, src/config/aiJobs.js); ROLE is its fallback.
export const JOB = { plan: 'legends.plan', area: 'legends.area', quiz: 'legends.quiz', quizCheck: 'legends.check', talk: 'legends.talk', hint: 'legends.hint', bossName: 'legends.bossName', edit: 'legends.edit', placement: 'legends.placement', talkScore: 'legends.talkScore' }
export const MAX_TOKENS = { plan: 2500, area: 5000, quiz: 5000, talk: 600, talkScore: 800, hint: 200, bossName: 120, quizCheck: 1500, edit: 2500, placement: 3500 }
// Questions per step (a learn level asks its new items two ways plus a few earlier ones; the boss is always 20).
export const QUIZ_SIZE = { learn: 10, practice: 8, rule: 8, weak: 10, boss: 20, legendary: 20 }
export const TALK_TURNS = 4
export const ADVENTURE_TURNS = 10 // an Adventure step ends when its goal is reached, or after this many turns
export const GOAL_TAG = '[GOAL-DONE]' // Ebi ends a reply with it once the learner has reached the goal
const NO_DASH = 'No dashes. Never write a shrimp emoji.'

// Why the learner is here, for prompts (the questionnaire's answer keys).
export const REASONS = { work: 'for work', school: 'for school or an exam', travel: 'for travel', fun: 'for fun', person: 'to talk with someone they care about', other: 'for their own reasons' }

const subjectLine = (s) => `Subject: ${s.name}${s.description ? ` (${s.description})` : ''}.`
// Quizzes see the mode's description as the LEARNER'S OWN CONTEXT (why they learn, where, with whom: "moving to
// Texas with my uncle"): situations may draw on it, answers never come from it.
// `phrasing`: the fight's language line (kit/fightSettings.js: full immersion, or "Ebi speaks" another language).
const quizSubjectLine = (s) => `Subject: ${s.name}.${s.description ? ` The learner's own context, in their words (their real goal; situations may draw on it): "${s.description}"` : ''}${s.phrasing ? `\n${s.phrasing}` : ''}`
// Study's cue: a typed language answer is pinned by a short sense cue in parentheses right at the blank (in the language
// the instructions are written in) plus the answer's first letter in quotes; an answer written in Han characters or kana
// is cued by the first letter of its romanization (pinyin, romaji) instead. Never the answer itself.
const cueRule = (s) => `A typed answer asks for ONE form: right after the blank (or at the end) add a short sense cue in parentheses, written in ${s.userLang}, with the answer's first letter in quotes, for example (to rain, "l"). For an answer written in Han characters or kana, give the first letter of its romanization (pinyin, romaji) instead. The cue never contains the answer.`

const scope = (s) => (s.isLanguage
  ? `This mode teaches ${s.learnLang} to someone who reads ${s.userLang}. ${s.rules || ''}`.trim()
  : `This mode teaches ${s.name}, in ${s.userLang}. It is never a language lesson: keep terms, names, code and formulas as they are.`)
const itemList = (items, max = 220) => items.map((it, i) => `${i + 1}. [${it.kind}]${hasTier(it) ? ` TIER ${clampTier(it.tier)}` : ''} ${it.front} = ${String(it.back || '').replace(/\s+/g, ' ').slice(0, max)}`).join('\n')

// ── THE QUESTION LADDER (utils/questionTier.js; the SAME ladder as Study) ──────────────────────────────────────
// Each card or item carries a `tier` (raids: tierOf(the Anki card); Legends: tierOfItem(its codex tier, { kind })); the
// prompt names it next to the card and spells out what each tier present asks. No tier = the ladder is off (today's
// question). The model's "type" words map onto this app's question shape here.
const hasTier = (x) => x && x.tier != null && Number.isFinite(Number(x.tier))
const TIER_TYPES = 'In the tier texts, "recall" and "fill_blank" mean a typed question with "open": false and every correct answer in "accepted"; "explanation" means a typed question with "open": true and one good model answer in "accepted".'
export function ladderBlock(subject, things = []) {
  const tiers = [...new Set(things.filter(hasTier).map((x) => clampTier(x.tier)))].sort((a, b) => a - b)
  if (!tiers.length) return ''
  const opts = { isLanguage: !!subject.isLanguage, learnLang: subject.learnLang || 'the learned language', quizLang: subject.userLang || 'the learner\'s language' }
  return [
    'THE QUESTION LADDER: every card/item above is marked with its TIER (how well the learner knows it). Ask about each one AT ITS TIER, as described here:',
    ...tiers.map((t) => tierInstruction(t, opts)),
    TIER_TYPES,
    'A TIER 0 question teaches the answer while asking it (it may show the answer); every other tier never shows its answer.',
  ].join('\n')
}
// Study's AMBIGUITY SELF-CHECK, the same words for every fight and quiz (App.jsx's question prompt says it this way).
export function ambiguityRule(subject) {
  return subject.isLanguage
    ? `AMBIGUITY SELF-CHECK (apply to EVERY typed recall or fill-in question before finalizing): mentally substitute 2 to 3 plausible alternative ${subject.learnLang} words, ESPECIALLY synonyms, into the question. If ANY of them still fits after reading the WHOLE question, it is INVALID until you embed a compact parenthetical cue in ${subject.userLang} right at the blank naming the target's precise meaning or nuance, with its first letter in quotes. A bare sentence with a generic predicate is never enough; a slightly over-specified question with a clear cue beats an elegant ambiguous one.`
    : `AMBIGUITY SELF-CHECK (apply to EVERY typed question): if another term from this subject would also fit, add a compact parenthetical cue in ${subject.userLang} naming the precise concept or context, or list every fair answer in "accepted". Never a letter of the answer and never the term itself.`
}
const QUESTION_SHAPE = '{"type": "choice"|"typed", "question": "...", "choices": ["..."], "answer": <index or text>, "accepted": ["..."], "open": true|false, "explanation": "...", "target": "..."}'

// ── Placement exam ──────────────────────────────────────────────────────────────────────────────────────────
export function buildPlacementPrompt(subject, tier, n, { avoid = [], knowledge = '' } = {}) {
  const t = TIERS[tier] || TIERS[0]
  return {
    system: `You write placement exam questions for a learning app. Reply with JSON only: {"questions": [${QUESTION_SHAPE}]}. Every question has exactly one correct answer. "target" = the short topic the question checks (2 to 4 words, in English). ${NO_DASH}`,
    user: [
      subjectLine(subject),
      scope(subject),
      `Write ${n} questions at this difficulty: ${t.brief}. Stay strictly inside the subject.`,
      subject.isLanguage
        ? `Mostly questions the learner answers with a ${subject.learnLang} sentence or phrase (translate a short ${subject.userLang} sentence, complete a sentence, say something for a situation): mark those "open": true and put one good model answer in "accepted". Include one question on a rule (grammar, spelling, accents, agreement) and one multiple choice question with 4 real options. Write instructions in ${subject.userLang}.`
        : `Mostly questions the learner answers in a sentence (explain why, what to do, what happens): mark those "open": true and put one good model answer in "accepted". Include one question on a principle or procedure and one multiple choice question with 4 real options. Write everything in ${subject.userLang}.`,
      'Cover different topics; never reveal the answer in the question.',
      avoid.length ? `Already asked (never repeat or rephrase these): ${avoid.slice(-30).join(' | ')}` : '',
      knowledge ? `The learner's own material (prefer its topics):\n${knowledge}` : '',
    ].filter(Boolean).join('\n'),
  }
}

// Questions for QuizRunner: [{ kind, prompt, ... , target }] (sanitized; unusable ones dropped).
export function parseQuestions(raw, clean, opts = {}) {
  // The list under another key ({"quiz": [...]}, {"items": [...]}): the first list of question objects.
  // Keys in another case ("Question") count too, and ONE question sent as a bare object is a list of one.
  const isQ = (q) => q && typeof q === 'object' && !Array.isArray(q) && Object.keys(q).some((k) => /^question$/i.test(k))
  const other = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? Object.values(raw).find((v) => Array.isArray(v) && v.some(isQ))
    : null
  const list = (Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : other || (isQ(raw) ? [raw] : []))
    .map((q) => canonKeys(q, ['question', 'explanation', 'choices']))
  // `tierFor(rawQuestion)`: the question ladder's tier for it (its card or item), set before sanitizing so a TIER 0
  // teaching question passes the leak guard. The model's own "tier" is never trusted; without tierFor it is dropped.
  const { tierFor, ...rest } = opts
  return sanitizeQuestions(list.map((q) => ({
    ...q, tier: tierFor ? tierFor(q) : undefined, question: clean(String(q?.question || '')), explanation: clean(String(q?.explanation || '')),
    ...(Array.isArray(q?.choices) ? { choices: q.choices.map((c) => clean(String(c))) } : {}),
  })), rest)
}

// What a fight's screen promises about its questions, enforced on what the model sent (boss, Legendary, raid): every
// question stands TYPED, its choices the `alt` the learner may switch to (a safe strike, less damage), offered in every
// phase and on attacks too (the owner: a question can be ambiguous, so that way out never goes away). A choice-only
// question becomes typed (the right option is the answer, the options its alt), unless it cannot stand without them
// ("which of these", true/false, "all of the above") or would then give its answer away. The set is then topped up.
// `ladder` (a lesson under the question ladder): typed by default there too, so a choice-only question becomes typed
// with its options as `alt` when it can stand alone; one that cannot ("which of these") stays a choice question (a
// lesson is not a fight: nothing promises typing there).
export function fitQuestionsToKind(qs, kind, { ladder = false } = {}) {
  const list = Array.isArray(qs) ? qs : []
  const fightKind = kind === 'boss' || kind === 'raid' || kind === 'legendary'
  if (!fightKind && !ladder) return list
  const out = []
  for (const q of list) {
    if (!q || typeof q !== 'object') continue
    if (q.kind !== 'choice') { out.push(q); continue }
    const typedQ = choiceToTyped(q)
    if (typedQ) out.push(typedQ)
    // A lesson keeps it as a choice question, unless it names its own answer (the leak guard; TIER 0 teaches).
    else if (!fightKind && (q.tier === 0 || !leaksAnswer(String(q.prompt || ''), [q.choices?.[q.answerIdx]].filter(Boolean)))) out.push(q)
  }
  return out
}

// The question names its options ("which of these", "pick", "choose", "cuál de", "以下哪", "次のうち"...).
const NEEDS_OPTIONS_RE = /\b(which\s+(?:of|one)|choose|pick|select|the\s+following|these\s+options|from\s+the\s+(?:list|options))\b|\bcu[aá]l(?:es)?\s+de\b|\belige\b|\bescoge\b|\bselecciona\b|以下|下列|哪(?:个|一|些|項|项)|どれ|次のうち|選んで|选择|選擇/iu
const OPTION_ANSWER_RE = /^(all|none|both|neither)\s+(of\s+)?(the\s+)?(above|these|them|options)$|^(true|false|yes|no|verdadero|falso|sí|si|vrai|faux|wahr|falsch|对|错|是|否|正しい|間違い|はい|いいえ)$/iu

function choiceToTyped(q) {
  const choices = Array.isArray(q.choices) ? q.choices.map((c) => String(c ?? '').trim()) : []
  const idx = Number.isInteger(q.answerIdx) ? q.answerIdx : -1
  if (choices.length < 2 || idx < 0 || idx >= choices.length || !choices[idx]) return null
  const prompt = String(q.prompt || '')
  const key = choices[idx]
  if (NEEDS_OPTIONS_RE.test(prompt) || OPTION_ANSWER_RE.test(key)) return null
  if (!(q.tier === 0) && leaksAnswer(prompt, [key])) return null // a TIER 0 question teaches: it shows its answer
  const { choices: _c, answerIdx: _a, ...rest } = q
  return { ...rest, kind: 'typed', accepted: [key], open: false, alt: { choices, answerIdx: idx } }
}

// ── The map plan ────────────────────────────────────────────────────────────────────────────────────────────
export function buildMapPrompt(subject, { start, level = '', knowledge = '', after = [], count = AREAS.plan } = {}) {
  const fresh = !after.length
  return {
    system: `You plan the adventure map of a learning app: a path of themed areas, each a unit of study. Reply with JSON only: {"areas": [{"title": "...", "theme": "...", "motif": "${MOTIFS.join('|')}", "palette": "${PALETTES.join('|')}"}]}. ${NO_DASH}`,
    user: [
      subjectLine(subject),
      scope(subject),
      start?.reason ? `The learner is learning this ${REASONS[start.reason] || REASONS.other}.` : '',
      level ? `Learner: ${level}.` : 'The learner is new to this.',
      fresh
        ? `Plan ${count} areas in order, from the learner's level upward (the first area is the easiest). Skip what the learner already knows, but start with one short review area when they are not a beginner.`
        : `The map so far (continue AFTER these, never repeat them): ${after.join('; ')}. Plan the next ${count} areas, each a step harder.`,
      subject.isLanguage
        ? `Each area is a real-life theme or skill in ${subject.learnLang} (greetings, food, travel, work, feelings, stories...). Include areas for rules too: grammar, orthography (spelling, accents, punctuation), and the forms the learner will need.`
        : `Each area is a coherent unit of ${subject.name}: concepts, principles, procedures, troubleshooting, real cases. Order them as a course would.`,
      `"title": 2 to 5 words in ${subject.userLang}. "theme": one sentence in ${subject.userLang} saying what the area covers. "motif": the landscape that fits it best (it picks the area's picture and boss from the app's drawings), a DIFFERENT one for every area. "palette": the color mood.`,
      knowledge ? `The learner's own material (follow its order and topics):\n${knowledge}` : '',
    ].filter(Boolean).join('\n'),
  }
}

// ── One area's content ──────────────────────────────────────────────────────────────────────────────────────
// The area's boss gets a character name built from what the area teaches ("El Relojero Tic-Tac" guards numbers,
// dates and time), in the user's language: "the guardian of <area title>" read like a label.
const bossLine = (subject) => `boss: a playful, memorable name for this area's final guardian, in ${subject.userLang}, 2 to 5 words, made from what the area teaches (for numbers, dates and time something like "the Tick-Tock Clockmaker"; for network ports "the Gatekeeper of Port 443"). A character's name, never the area title, no quotes.`
export function buildBossNamePrompt(subject, area) {
  return {
    system: `You name the final guardian (the boss) of one area of a learning app's adventure map. Reply with JSON only: {"name": "..."}. ${NO_DASH}`,
    user: [
      `Subject: ${subject.name}.`,
      `Area: "${area.title}". ${area.theme || ''}`,
      (area.items || []).length ? `It teaches: ${area.items.slice(0, 12).map((it) => it.front).join(' | ')}` : '',
      bossLine(subject),
    ].filter(Boolean).join('\n'),
  }
}
export const parseBossName = (raw, clean) => cleanBossName(raw?.name, clean)

export function buildAreaPrompt(subject, area, { level = '', knowledge = '', before = [], later = [] } = {}) {
  return {
    system: `You write the lessons of one area of a learning app's map. Reply with JSON only: {"items": [{"kind": "term"|"rule"|"skill", "front": "...", "back": "..."}], "boss": "...", "nodes": [{"kind": "learn"|"scene"|"rule"|"talk"|"adventure", "title": "...", "items": [<1-based item numbers>], "goal": "..."}], "story": ["...", "...", "..."], "canDo": ["...", "..."], "bonus": {"front": "...", "back": "..."}}. Accuracy matters: the learner memorizes the items and may add them to flashcards. Never invent a word, rule or fact. ${NO_DASH}`,
    user: [
      subjectLine(subject),
      scope(subject),
      `Area: "${area.title}". ${area.theme}`,
      level ? `Learner: ${level}.` : '',
      before.length ? `Earlier areas (already covered, do not repeat): ${before.join('; ')}` : '',
      later.length ? `Later areas (leave their topics for them): ${later.join('; ')}` : '',
      `items: ${LESSONS * PER_LESSON.min} to ${LESSONS * PER_LESSON.max} things this area teaches, as flashcards.`,
      subject.isLanguage
        ? `"front" = the ${subject.learnLang} word, phrase or pattern (a rule item: a question naming the rule). "back" = in ${subject.userLang}: the meaning, then one short ${subject.learnLang} example sentence with its translation. Separate lines with \\n. Include at least one "rule" item (grammar or orthography) the area needs.`
        : `"front" = a term, a principle or a question about a procedure, in ${subject.userLang} (terms stay as the field writes them). "back" = a clear explanation in ${subject.userLang}, then one concrete example. Separate lines with \\n. Include at least one "rule" item (a principle or rule of thumb).`,
      `nodes: EXACTLY ${LESSONS} levels climbed in order, then the app adds a boss test itself. EVERY level teaches ${PER_LESSON.min} or ${PER_LESSON.max} NEW items that no earlier level taught (each item belongs to exactly one level; together the levels cover every item) and then quizzes them, so never a level that only repeats earlier items. Kinds: "learn" (most levels), exactly one "rule" (it teaches the rule item(s)) and exactly one "scene" (a short ${subject.isLanguage ? 'story' : 'case study'} that brings in its own new items). Order from easiest to hardest. Add one optional "talk" step as well (a short conversation on the area's topic, items = the ones it practices; it is not one of the ${LESSONS}). "title": 2 to 4 words in ${subject.userLang} naming what THAT level teaches. "items": the 1-based numbers of the items the level teaches.`,
      `Add one optional "adventure" step too (not one of the ${LESSONS}): an open real-life mission where the learner uses the area's items their own way. "title": 2 to 4 words in ${subject.userLang}. "goal": ONE sentence in ${subject.userLang} saying what to achieve, never how or with which words (for example "Buy two tickets to the museum and ask when it closes."). "items": the numbers it practices.`,
      subject.isLanguage
        ? `"story": the area's short story, ${STORY.lines} lines in ${subject.learnLang}, simple enough for the learner's level, using several of the items (it opens the area).`
        : `"story": the area's short opening story, ${STORY.lines} lines in ${subject.userLang}, a situation where the area's ideas matter.`,
      `"canDo": 2 to ${CAN_DO.lines} "I can..." statements in ${subject.userLang}, each a real thing the learner can DO after this area (for example "I can order food and ask for the bill.").`,
      subject.isLanguage
        ? `"bonus": ONE extra authentic ${subject.learnLang} phrase or saying that fits the area and is NOT one of the items (a treasure the learner finds): "front" the phrase, "back" its meaning and when natives say it, in ${subject.userLang}.`
        : `"bonus": ONE extra surprising fact or rule of thumb that fits the area and is NOT one of the items: "front" a short title, "back" the explanation in ${subject.userLang}.`,
      bossLine(subject),
      knowledge ? `The learner's own material (prefer its content and wording):\n${knowledge}` : '',
    ].filter(Boolean).join('\n'),
  }
}

// ── A step's questions ──────────────────────────────────────────────────────────────────────────────────────
// choiceItems: new or weak items (asked as multiple choice); typedItems: known ones (recall, sentences).
// Questions come ONLY from the items the learner was taught (their full text is the source): a quiz about things
// the step never showed felt random and unfair. makeQuiz also drops any question whose "target" is not one of the
// items, and `strict` is its retry after too many were dropped.
export const QUIZ_PER_ITEM_MAX = 3
export const NEMESIS_SHARE = 30 // % of a rematch's questions on the items that beat the learner last time

export function buildQuizPrompt(subject, area, node, { choiceItems = [], typedItems = [], reviewItems = [], count, level = '', knowledge = '', misses = [], strict = false, avoid = [], nemesis = [], ladder = false } = {}) {
  const boss = node.kind === 'boss' || node.kind === 'legendary'
  const items = [...choiceItems, ...typedItems, ...reviewItems]
  const n = Math.max(2, Math.min(count || QUIZ_SIZE[node.kind] || QUIZ_SIZE.practice, items.length * QUIZ_PER_ITEM_MAX))
  const kindLine = {
    learn: ladder
      ? 'These items were JUST taught in this level: ask each one twice, from two different angles, both at its TIER (the ladder below). Gentle, one step at a time.'
      : 'These items were JUST taught in this level: for each one, first a recognition question (multiple choice), then a recall or use question (typed). Gentle, one step at a time.',
    practice: 'Practice these items: recall and use them.',
    rule: 'Drill the RULE(S) among these items: questions that make the learner apply the rule to new cases.',
    boss: `BOSS TEST of the whole area. Push the learner to the limit of what the area taught, so passing proves real understanding: use the items in NEW sentences and situations (never a copy of an example), combine two items in one question, make them produce rather than recognize. Mostly questions answered with a ${subject.isLanguage ? `${subject.learnLang} sentence` : 'sentence'} ("open": true with a model answer in "accepted"). Every question is answered TYPED and has its answers in "accepted"; for EVERY question, ALSO add 4 "choices" (the right one plus CLOSE wrong ones, the tempting mistake, only one right) as an easier way to answer (it deals less damage), but the question must make full sense without them (never "which of these", "which of the following", "choose", "true or false", "all of the above"). Hard, never unfair: every answer still follows from the material.`,
    legendary: `LEGENDARY TEST of an area the learner already beat: the hardest version. EVERY question is answered TYPED and produced by the learner; for every question ALSO add 4 "choices" (the right one plus CLOSE wrong ones, only one right) as an easier way out that deals less damage, but the question must make full sense without them (never "which of these", "true or false", "all of the above"). The questions: ${subject.isLanguage ? `${subject.learnLang} sentences` : 'explanations and applications'} in new situations, combining items. Still only what the material taught.`,
    weak: 'WEAK SPOTS: these are the items this learner got wrong most often. Ask each one from a new angle (not the way it was asked before), starting easier and ending harder, so the gap closes.',
  }[node.kind] || 'Practice these items.'
  return {
    system: `You write quiz questions for a learning app about material the learner was JUST shown. Reply with JSON only: {"questions": [${QUESTION_SHAPE}]}. Every question checks ONE item of that material, and its correct answer is stated in, or follows directly from, that item's text: the learner must be able to answer it from what they were shown. Never ask about a word, fact, rule, example or topic that is not in the material, even when it belongs to the same area or subject. Every question has exactly one correct answer; choices are 4 real, plausible options with no duplicates (the RIGHT one comes from the material; every wrong one must be clearly false, never an option a fair reader could defend, such as "they mean the same" for two greetings that are mostly interchangeable). Ask what an item plainly teaches (its meaning, its use, its example), not a fine nuance it only hints at; typed questions list every acceptable answer in "accepted". Never reveal the answer in the question (only a TIER 0 teaching question shows it, on purpose). "target" = the item's "front", copied exactly. ${NO_DASH}`,
    user: [
      quizSubjectLine(subject),
      scope(subject),
      `Area: "${area.title}". Step: ${node.title || node.kind}. ${kindLine}`,
      level ? `Learner: ${level}.` : '',
      `LEARNING MATERIAL THE LEARNER WAS SHOWN (the only source of questions; front = back):\n${itemList(items, 600)}`,
      'What is ASKED comes only from this material. A situation may be an everyday one or one from the learner\'s own context above; never a city, region, country or person that neither the material nor that context names.',
      reviewItems.length ? `REVIEW: the last ${reviewItems.length} items above were taught in EARLIER levels (${reviewItems.map((it) => it.front).join(' | ')}). Ask about ${Math.min(reviewItems.length, 4)} of the ${n} questions over them (spaced review); the rest over this level's new items.` : '',
      `Spread the ${n} questions over these ${items.length} items (about ${Math.max(1, Math.round(n / Math.max(1, items.length)))} each). More questions than items? Ask the same item another way (meaning, use in a sentence, recognition, its example), never about something else.`,
      strict ? 'Your last questions asked about things that are NOT in the material above. Every question must now check one listed item, with "target" copied from its front.' : '',
      !ladder && !boss && node.kind !== 'learn' && choiceItems.length ? `New or shaky (ask these as multiple choice): ${choiceItems.map((it) => it.front).join(' | ')}` : '',
      !ladder && !boss && node.kind !== 'learn' && typedItems.length ? `Known well (ask these typed: recall, fill in, or a short sentence): ${typedItems.map((it) => it.front).join(' | ')}` : '',
      avoid.length ? `Questions the learner already got in this area's other steps. Write NEW ones: never repeat or reword these; ask from another angle, with other sentences and examples:\n${avoid.map((q) => `- ${String(q).replace(/\s+/g, ' ').slice(0, 200)}`).join('\n')}` : '',
      misses.length ? `The learner recently missed these (include them again, differently): ${misses.slice(0, 8).join(' | ')}` : '',
      // The rematch: a boss that won last time comes back with what beat the learner, but mostly the whole area.
      nemesis.length ? `REMATCH: last time the learner lost this fight on these items: ${nemesis.slice(0, 10).join(' | ')}. About ${NEMESIS_SHARE}% of the questions test them again (new wording and situations); the rest cover the whole area at random.` : '',
      subject.isLanguage
        ? `Instructions in ${subject.userLang}; answers in ${subject.learnLang}. ${cueRule(subject)} ${subject.rules || ''}`.trim()
        : `Everything in ${subject.userLang}. Test understanding and application, not wording.`,
      // The ladder: typed by default on every question, its 4 options an optional way out (Study's "Show choices").
      ladder && !boss ? 'Every question is answered TYPED by default and has its answers in "accepted"; for EVERY question ALSO add 4 "choices" (the right one plus close wrong ones, only one right) as an optional easier way to answer, but the question must make full sense without them (never "which of these", "true or false", "all of the above").' : '',
      ladderBlock(subject, items),
      CLEAR_ANSWER_RULE,
      ambiguityRule(subject),
      `Write ${n} questions. "explanation" in ${subject.userLang}: why the answer is right, in one sentence.`,
      knowledge ? `Background from the learner's own material (only to keep facts accurate; never ask about anything in it that the learning material above does not teach):\n${knowledge}` : '',
    ].filter(Boolean).join('\n'),
  }
}

// A second look at a new quiz before it is saved: which questions are unfair. A model asked to write questions
// still wrote "the correct way to use to be with I" where "I am Carlos" is as right as "I'm Carlos", and slipped in a
// place the step never taught. Reply: {"bad": [{"i": <index>, "why": "..."}]}; makeQuiz drops those.
// THE REVIEW PASS for every Legends quiz AND every raid (the same independent look Study runs, QUESTION_CHECK_RULES):
// each row shows the question's TIER (the ladder), its accepted answers, and its options with the [KEY] (a choice
// question's own, or a typed question's optional `alt`). `items`: the material ({ kind, front, back, tier? }; a raid
// passes its cards).
const optionsRow = (choices, key) => choices.map((c, k) => `${k === key ? '[KEY] ' : ''}${c}`).join(' | ')
export function buildQuizCheckPrompt(subject, items, questions) {
  const row = (q, i) => {
    const head = `${i}. ${hasTier(q) ? `[TIER ${clampTier(q.tier)}${q.open ? ', open' : ''}] ` : q.open ? '[open] ' : ''}${q.prompt}`
    if (q.kind === 'choice') return `${head}\n   options: ${optionsRow(q.choices, q.answerIdx)}`
    const alt = q.alt && Array.isArray(q.alt.choices) ? `\n   optional options: ${optionsRow(q.alt.choices, q.alt.answerIdx)}` : ''
    return `${head}\n   accepted: ${(q.accepted || []).join(' | ') || '(open answer)'}${alt}`
  }
  return {
    system: `You review quiz questions before a learner sees them. Reply with JSON only: {"bad": [{"i": <question index>, "why": "<short reason>"}]} (an empty list when all are fair). A question is BAD when: a second option (not the [KEY]) could also fairly be called correct, or a correct answer is missing from "accepted"; the [KEY] is actually wrong; it cannot be answered from the learning material alone; it relies on something the material never teaches (a place, a person, culture, a rule); or the question gives its answer away (except a TIER 0 teaching question, which shows it on purpose). When unsure about a choice question, mark it BAD.\n${QUESTION_CHECK_RULES}\n${NO_DASH}`,
    user: [
      quizSubjectLine(subject),
      subject.isLanguage ? `The learner is learning ${subject.learnLang}; judge the ${subject.learnLang} as a native teacher would (a form that is correct but less casual is still CORRECT).` : '',
      'Also BAD: a question naming a city, region, country or person that neither the material below nor the learner\'s own context above names.',
      `Learning material (front = back):\n${itemList(items, 600)}`,
      `Questions:\n${questions.map(row).join('\n')}`,
    ].filter(Boolean).join('\n'),
  }
}
// Indexes the review marked bad (numbers only, in range).
// null = no usable verdict (prose, a cut-off reply): the review did not run, and the set is not stamped as reviewed.
export function parseQuizCheck(raw0, n) {
  const raw = canonKeys(raw0, ['bad']) // {"Bad": [...]} too
  if (!Array.isArray(raw?.bad) && !Array.isArray(raw)) return null
  const list = Array.isArray(raw?.bad) ? raw.bad : raw
  return new Set(list.map((b) => Number(typeof b === 'object' ? b?.i : b)).filter((i) => Number.isInteger(i) && i >= 0 && i < n))
}
// The same verdict with the reviewer's reasons (index -> why), for a rewrite that must fix them. null = no verdict.
export function parseQuizCheckWhy(raw0, n) {
  const raw = canonKeys(raw0, ['bad'])
  const set = parseQuizCheck(raw, n)
  if (!set) return null
  const list = Array.isArray(raw?.bad) ? raw.bad : raw
  const out = new Map([...set].map((i) => [i, '']))
  for (const b of list) {
    const i = Number(b && typeof b === 'object' ? b.i : b)
    if (out.has(i) && b && typeof b === 'object' && b.why) out.set(i, String(b.why).replace(/\s+/g, ' ').trim().slice(0, 200))
  }
  return out
}

// Which item a question checks (its "target" names the item's front), or ''.
const ITEM_MATCH_MIN = 3
export function itemIdFor(question, items) {
  const t = String(question?.target || '').trim().toLowerCase()
  if (!t) return ''
  // A partial match needs at least 3 characters on the shorter side: a target like "a" or "el" sits inside nearly
  // every item and let unrelated questions through the "only what was taught" filter.
  // Han and kana pack a word into 1 to 2 characters, so 2 is enough there (你好 inside "你好吗").
  const min = (a, b) => (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(a + b) ? 2 : ITEM_MATCH_MIN)
  const part = (a, b) => Math.min(a.length, b.length) >= min(a, b) && (a.includes(b) || b.includes(a))
  const hit = items.find((it) => it.front.toLowerCase() === t) || items.find((it) => part(it.front.toLowerCase(), t))
  return hit?.id || ''
}

// ── Talk steps ──────────────────────────────────────────────────────────────────────────────────────────────
// `scene`: the step's own title ("Conversation with your uncle"): when it names someone, Ebi plays that person.
export function buildTalkSystem(subject, area, items, { level = '', scene = '', goal = '' } = {}) {
  return [
    `You are Ebi, a friendly red shrimp tutor, having a short conversation with a learner about "${area.title}" (${area.theme}).`,
    scene ? `This step's scene: "${scene}". If it names a person or a role, PLAY that person (speak as them, not as Ebi) and keep to the situation.` : '',
    subjectLine(subject),
    subject.isLanguage
      ? `Speak only ${subject.learnLang}, simply, at the learner's level (short sentences). Gently recast a mistake once, then move on. ${subject.rules || ''}`
      : `Speak ${subject.userLang}. Ask the learner to explain, apply or decide things about the topic; push for reasons; correct misunderstandings kindly.`,
    `Work in these items naturally: ${items.map((it) => it.front).join(', ')}.`,
    level ? `Learner: ${level}.` : '',
    'Move the conversation forward: never ask again for something the learner already told you; build on their answers.',
    goal
      ? `This is an ADVENTURE with an open goal for the learner: "${goal}". Play the scene and react to whatever the learner does; never reach the goal for them and never say what they should say. The learner gets there their own way. If they seem stuck (off track, or two turns with no progress), steer with the situation (a question, a detail, a small complication), never with the words. The moment the learner has fully reached the goal, answer naturally and end your reply with ${GOAL_TAG}. One to three sentences per turn. ${NO_DASH}`
      : `One or two sentences per turn, always ending with a question. ${NO_DASH}`,
  ].filter(Boolean).join('\n')
}

// A nudge for the learner's next message: WHAT to say (an intention, in their own language), never the words.
export function buildTalkHintPrompt(subject, area, items, history, { scene = '', unused = [] } = {}) {
  return {
    system: `You coach a learner during a short practice conversation. Reply with ONE short sentence in ${subject.userLang}: what they could say or do next, as an intention (for example "Ask how he is doing." or "Tell him where you are from."). ${subject.isLanguage ? `Never give the ${subject.learnLang} words, phrases, sentences or translations they would use: they must build the reply themselves.` : 'Never give the answer itself: point them to what to explain or decide.'} ${NO_DASH}`,
    user: [
      subjectLine(subject),
      `Topic: ${area.title}.${scene ? ` Scene: ${scene}.` : ''}`,
      unused.length ? `Phrases this step practices that the learner has not used yet (steer toward one, WITHOUT writing it): ${unused.join(' | ')}` : '',
      `Conversation so far:\n${history.map((m) => `${m.role === 'ebi' ? 'Partner' : 'Learner'}: ${m.text}`).join('\n')}`,
      'Suggest the learner\'s next move, as a fitting reply to the partner\'s last message.',
    ].filter(Boolean).join('\n'),
  }
}
// A hint that shows the learned-language words it must not (a practice phrase, or 3+ words of the partner's line).
// `partner`: the partner's (Ebi's) lines so far; checked only when the hint language differs from the learned one
// (with full immersion the hint is in the learned language anyway and shares ordinary words with any line).
export const PARTNER_RUN = { words: 3, chars: 4 }
export function hintGivesAway(hint, subject, items, partner = []) {
  if (!subject.isLanguage) return false
  const norm = (s) => ` ${String(s || '').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}']+/gu, ' ').trim()} `
  const h = norm(hint)
  // Scripts written without spaces (Han, kana, Thai): a phrase sits inside a run of letters, so it is matched as a
  // plain substring, from 2 characters (你好 is a whole phrase).
  const unspaced = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Thai}]/u
  const phrase = (items || []).some((it) => {
    const f = norm(String(it?.front ?? '').replace(/\([^)]*\)/g, ''))
    if (unspaced.test(f)) return f.trim().length >= 2 && h.includes(f.trim())
    return f.trim().length >= 3 && h.includes(f)
  })
  if (phrase) return true
  const sameLang = String(subject.userLang || '').trim().toLowerCase() === String(subject.learnLang || '').trim().toLowerCase()
  if (sameLang) return false
  return (Array.isArray(partner) ? partner : []).some((line) => {
    const p = norm(line).trim()
    if (!p) return false
    if (unspaced.test(p)) {
      const runs = p.replace(/\s+/g, '')
      for (let i = 0; i + PARTNER_RUN.chars <= runs.length; i++) if (h.replace(/\s+/g, '').includes(runs.slice(i, i + PARTNER_RUN.chars))) return true
      return false
    }
    const w = p.split(' ')
    for (let i = 0; i + PARTNER_RUN.words <= w.length; i++) if (h.includes(` ${w.slice(i, i + PARTNER_RUN.words).join(' ')} `)) return true
    return false
  })
}
// Ebi's turn as the model wrote it: the goal tag read (any spacing or case, "[goal done]", "[GOAL_DONE]") and
// dropped, a leading "Ebi:" dropped, and anything after the model went on to write the LEARNER's next line cut
// (the turn prompt is a transcript ending in "Ebi:", so a model sometimes continues it).
const GOAL_TAG_RE = /\[\s*goal[\s_-]*(?:done|reached)\s*\]/gi
export function parseTalkReply(raw) {
  let s = String(raw ?? '')
  const reached = GOAL_TAG_RE.test(s)
  GOAL_TAG_RE.lastIndex = 0
  s = s.replace(GOAL_TAG_RE, '')
  const cut = s.search(/(^|\n)\s*(?:Learner|Student|User)\s*:/i)
  if (cut > 0) s = s.slice(0, cut)
  s = s.replace(/^\s*Ebi\s*:\s*/i, '').trim()
  return { text: s, reached }
}
export const buildTalkTurn = (history) => (history.length
  ? history.map((m) => `${m.role === 'ebi' ? 'Ebi' : 'Learner'}: ${m.text}`).join('\n') + '\nEbi:'
  : 'Start the conversation with a friendly opening question.')

export function buildTalkScorePrompt(subject, area, history, { hints = 0, goal = '', goalDone = false } = {}) {
  return {
    system: `You grade a short learning conversation. Reply with JSON only: {"score": <0 to 1>, "note": "...", "strengths": ["..."], "gaps": ["..."]}. ${NO_DASH}`,
    user: [
      subjectLine(subject),
      `Topic: ${area.title}.`,
      subject.isLanguage
        ? `Score the learner's ${subject.learnLang}: accuracy, range, and whether they were understood.`
        : 'Score the learner\'s understanding: correctness and reasoning.',
      hints ? `The learner asked for ${hints} hint(s) about WHAT to say (never the words): count it a little against independence.` : '',
      goal ? `The learner's goal was: "${goal}". It was ${goalDone ? 'REACHED' : 'NOT reached'}. Weigh it heavily.` : '',
      `"note": two short sentences of feedback in ${subject.userLang}. "strengths"/"gaps": up to 3 short topic names each, in English.`,
      `Conversation:\n${history.map((m) => `${m.role === 'ebi' ? 'Ebi' : 'Learner'}: ${m.text}`).join('\n')}`,
    ].filter(Boolean).join('\n'),
  }
}
export function parseTalkScore(raw0, clean) {
  const raw = canonKeys(raw0, ['score', 'note', 'strengths', 'gaps']) // {"Score": 0.8} too
  // "" read as a real 0; "85%" and "8/10" are read too. Scales: 0..1 as is, above 10 out of 100, 1..10 out of 10 (an
  // "8" was a near fail at 0.08).
  const v = typeof raw?.score === 'string' ? raw.score.trim() : raw?.score
  const frac = typeof v === 'string' && /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(v)
  // A percent is always out of 100 ("5%" read as 5 out of 10 passed a near fail at 0.5).
  const pct = typeof v === 'string' && /%$/.test(v)
  let s = v === '' || v == null ? NaN : frac ? Number(frac[1]) / (Number(frac[2]) || NaN) : Number(typeof v === 'string' ? v.replace(/\s*%$/, '') : v)
  if (Number.isFinite(s) && pct) s /= 100
  else if (Number.isFinite(s) && !frac) s = s > 10 ? s / 100 : s > 1 ? s / 10 : s
  if (!raw || !Number.isFinite(s)) return null
  const list = (v) => (Array.isArray(v) ? v : []).map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 3)
  return { score: Math.max(0, Math.min(1, s)), note: clean(String(raw.note || '')).slice(0, 400), strengths: list(raw.strengths), gaps: list(raw.gaps) }
}

// ── Ebi's edits ─────────────────────────────────────────────────────────────────────────────────────────────
export function buildMapEditPrompt(subject, map, request) {
  const rows = map.areas.map((a) => JSON.stringify({ id: a.id, title: a.title, theme: a.theme, motif: a.motif, palette: a.palette, started: !!(a.frozen || a.status === 'done') }))
  return {
    system: `You edit the adventure map of a learning app. Reply with JSON only: {"areas": [{"id": "<existing id, or omit for a new area>", "title": "...", "theme": "...", "motif": "${MOTIFS.join('|')}", "palette": "${PALETTES.join('|')}"}], "note": "..."}. ${NO_DASH}`,
    user: [
      subjectLine(subject),
      scope(subject),
      `The map now, in order (first = easiest):\n${rows.join('\n')}`,
      `The learner asks: "${request}"`,
      'Return the WHOLE map in its new order. Copy every area with "started": true exactly, first and unchanged (the learner is in it). Change, reorder, add or remove only the others; keep an unchanged area\'s id. A new area has no id. Stay inside the subject.',
      `"title"/"theme" in ${subject.userLang}; "note": one sentence in ${subject.userLang} saying what you changed, or why you could not.`,
    ].join('\n'),
  }
}

// ── Raids: one question per due card ────────────────────────────────────────────────────────────────────────
// cards: [{ front, back }] (plain text). Every question tests ITS card only, asked both ways at once: a typed answer
// (the power strike) and 4 options (the safe strike), so the learner picks how to answer.
export const RAID_ROLE = 'study'
export const RAID_JOBS = { questions: 'raid.questions', check: 'raid.check' }
export const RAID_MAX_TOKENS = 6000
// cards may carry `tier` (the question ladder: tierOf(the Anki card)); none = the ladder is off (today's question).
// `redo`: [{ prompt, why }] = the questions these cards got before, rejected by the review pass (or dropped for
// showing their answer): the replacement must fix that.
export function buildRaidPrompt(subject, cards, { level = '', redo = [] } = {}) {
  const tiered = cards.some(hasTier)
  return {
    system: `You write the questions of a review fight in a learning app. Reply with JSON only: {"questions": [{"card": <1-based card number>, "question": "...", "accepted": ["..."], "open": true|false, "choices": ["...", "...", "...", "..."], "answer": "<the right choice, exactly>", "target": "<the card's front>"}]}. ${NO_DASH}`,
    user: [
      quizSubjectLine(subject),
      level ? `Learner: ${level}.` : '',
      `Exactly ONE question per card below, in the same order, testing ONLY what that card says (never another card, never outside knowledge).`,
      tiered ? ladderBlock(subject, cards) : '',
      CLEAR_ANSWER_RULE,
      ambiguityRule(subject),
      redo.length ? `A REVIEWER REJECTED the last questions for these cards. Write NEW ones that fix the problem:\n${redo.map((r, i) => `${i + 1}. ${r.prompt ? `"${String(r.prompt).replace(/\s+/g, ' ').slice(0, 200)}"` : '(no usable question was written)'}${r.why ? ` (rejected: ${String(r.why).slice(0, 160)})` : ''}`).join('\n')}` : '',
      subject.isLanguage
        ? `Ask in ${subject.userLang} for the ${subject.learnLang} word or phrase (recall), or give a short ${subject.learnLang} sentence with a blank for it. "accepted": every correct ${subject.learnLang} answer. ${cueRule(subject)} ${subject.rules || ''}`.trim()
        : `Ask for the term, or to apply the idea to a short new case. "accepted": the correct short answers (terms stay as written). Write questions and choices in ${subject.userLang}; subject terms, acronyms, code and numbers stay as written.`,
      '"choices": 4 options, the right one plus 3 CLOSE but clearly wrong ones (the tempting mistakes), an optional easier way to answer (a safe strike, less damage). Every question must be answerable TYPED without its options, with its answers in "accepted": never "which of these", "which of the following", "choose", "true or false" or "all of the above". The question must never contain its own answer (only a TIER 0 teaching question shows it, on purpose).',
      'Situations are everyday or from the learner\'s own context above: never a city, region, country or person that neither the card nor that context names.',
      `Cards:\n${cards.map((c, i) => `${i + 1}.${hasTier(c) ? ` TIER ${clampTier(c.tier)}` : ''} FRONT: ${c.front}\n   BACK: ${String(c.back || '').replace(/\n+/g, ' / ')}`).join('\n')}`,
    ].filter(Boolean).join('\n'),
  }
}
