// LEGENDS PROMPTS (pure): every AI request Legends makes, and the parsers for the replies. Subject-agnostic:
// `subject.isLanguage` only changes wording (a Spanish map teaches Spanish; a CompTIA map teaches CompTIA, never
// "CompTIA vocabulary in Spanish"). Replies are parsed with ai.json and checked here before anything is shown.
import { sanitizeQuestions } from '../kit/grade'
import { MOTIFS, PALETTES, AREAS, ITEMS, NODES, LESSONS, PER_LESSON, STORY, CAN_DO, cleanBossName } from './map'
import { TIERS } from './placement'

// Roles pick the model tier like everywhere else: planning is `general`, questions are `study`, items that may
// become cards are `deck` (they get memorized: the strongest tier).
export const ROLE = { plan: 'general', area: 'deck', quiz: 'study', quizCheck: 'study', talk: 'chat', hint: 'help', bossName: 'help', edit: 'general', placement: 'study' }
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
const itemList = (items, max = 220) => items.map((it, i) => `${i + 1}. [${it.kind}] ${it.front} = ${String(it.back || '').replace(/\s+/g, ' ').slice(0, max)}`).join('\n')
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
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.questions) ? raw.questions : []
  return sanitizeQuestions(list.map((q) => ({
    ...q, question: clean(String(q?.question || '')), explanation: clean(String(q?.explanation || '')),
    ...(Array.isArray(q?.choices) ? { choices: q.choices.map((c) => clean(String(c))) } : {}),
  })), opts)
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

export function buildQuizPrompt(subject, area, node, { choiceItems = [], typedItems = [], reviewItems = [], count, level = '', knowledge = '', misses = [], strict = false, avoid = [], nemesis = [] } = {}) {
  const boss = node.kind === 'boss' || node.kind === 'legendary'
  const items = [...choiceItems, ...typedItems, ...reviewItems]
  const n = Math.max(2, Math.min(count || QUIZ_SIZE[node.kind] || QUIZ_SIZE.practice, items.length * QUIZ_PER_ITEM_MAX))
  const kindLine = {
    learn: 'These items were JUST taught in this level: for each one, first a recognition question (multiple choice), then a recall or use question (typed). Gentle, one step at a time.',
    practice: 'Practice these items: recall and use them.',
    rule: 'Drill the RULE(S) among these items: questions that make the learner apply the rule to new cases.',
    boss: `BOSS TEST of the whole area. Push the learner to the limit of what the area taught, so passing proves real understanding: use the items in NEW sentences and situations (never a copy of an example), combine two items in one question, make them produce rather than recognize. Mostly questions answered with a ${subject.isLanguage ? `${subject.learnLang} sentence` : 'sentence'} ("open": true with a model answer in "accepted"); a few multiple choice whose wrong options are CLOSE (the tempting mistake), yet only one is right. Hard, never unfair: every answer still follows from the material.`,
    legendary: `LEGENDARY TEST of an area the learner already beat: the hardest version. EVERY question typed (no multiple choice) and produced by the learner: ${subject.isLanguage ? `${subject.learnLang} sentences` : 'explanations and applications'} in new situations, combining items. Still only what the material taught.`,
    weak: 'WEAK SPOTS: these are the items this learner got wrong most often. Ask each one from a new angle (not the way it was asked before), starting easier and ending harder, so the gap closes.',
  }[node.kind] || 'Practice these items.'
  return {
    system: `You write quiz questions for a learning app about material the learner was JUST shown. Reply with JSON only: {"questions": [${QUESTION_SHAPE}]}. Every question checks ONE item of that material, and its correct answer is stated in, or follows directly from, that item's text: the learner must be able to answer it from what they were shown. Never ask about a word, fact, rule, example or topic that is not in the material, even when it belongs to the same area or subject. Every question has exactly one correct answer; choices are 4 real, plausible options with no duplicates (the RIGHT one comes from the material; every wrong one must be clearly false, never an option a fair reader could defend, such as "they mean the same" for two greetings that are mostly interchangeable). Ask what an item plainly teaches (its meaning, its use, its example), not a fine nuance it only hints at; typed questions list every acceptable answer in "accepted". Never reveal the answer in the question. "target" = the item's "front", copied exactly. ${NO_DASH}`,
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
      !boss && node.kind !== 'learn' && choiceItems.length ? `New or shaky (ask these as multiple choice): ${choiceItems.map((it) => it.front).join(' | ')}` : '',
      !boss && node.kind !== 'learn' && typedItems.length ? `Known well (ask these typed: recall, fill in, or a short sentence): ${typedItems.map((it) => it.front).join(' | ')}` : '',
      avoid.length ? `Questions the learner already got in this area's other steps. Write NEW ones: never repeat or reword these; ask from another angle, with other sentences and examples:\n${avoid.map((q) => `- ${String(q).replace(/\s+/g, ' ').slice(0, 200)}`).join('\n')}` : '',
      misses.length ? `The learner recently missed these (include them again, differently): ${misses.slice(0, 8).join(' | ')}` : '',
      // The rematch: a boss that won last time comes back with what beat the learner, but mostly the whole area.
      nemesis.length ? `REMATCH: last time the learner lost this fight on these items: ${nemesis.slice(0, 10).join(' | ')}. About ${NEMESIS_SHARE}% of the questions test them again (new wording and situations); the rest cover the whole area at random.` : '',
      subject.isLanguage
        ? `Instructions in ${subject.userLang}; answers in ${subject.learnLang}. ${cueRule(subject)} ${subject.rules || ''}`.trim()
        : `Everything in ${subject.userLang}. Test understanding and application, not wording.`,
      `Write ${n} questions. "explanation" in ${subject.userLang}: why the answer is right, in one sentence.`,
      knowledge ? `Background from the learner's own material (only to keep facts accurate; never ask about anything in it that the learning material above does not teach):\n${knowledge}` : '',
    ].filter(Boolean).join('\n'),
  }
}

// A second look at a new quiz before it is saved: which questions are unfair. A model asked to write questions
// still wrote "the correct way to use to be with I" where "I am Carlos" is as right as "I'm Carlos", and slipped in a
// place the step never taught. Reply: {"bad": [{"i": <index>, "why": "..."}]}; makeQuiz drops those.
export function buildQuizCheckPrompt(subject, items, questions) {
  const row = (q, i) => (q.kind === 'choice'
    ? `${i}. ${q.prompt}\n   options: ${q.choices.map((c, k) => `${k === q.answerIdx ? '[KEY] ' : ''}${c}`).join(' | ')}`
    : `${i}. ${q.prompt}\n   accepted: ${(q.accepted || []).join(' | ') || '(open answer)'}`)
  return {
    system: `You review quiz questions before a learner sees them. Reply with JSON only: {"bad": [{"i": <question index>, "why": "<short reason>"}]} (an empty list when all are fair). A question is BAD when: a second option (not the [KEY]) could also fairly be called correct, or a correct answer is missing from "accepted"; the [KEY] is actually wrong; it cannot be answered from the learning material alone; it relies on something the material never teaches (a place, a person, culture, a rule); or the question gives its answer away. When unsure about a choice question, mark it BAD. ${NO_DASH}`,
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
export function parseQuizCheck(raw, n) {
  if (!Array.isArray(raw?.bad) && !Array.isArray(raw)) return null
  const list = Array.isArray(raw?.bad) ? raw.bad : raw
  return new Set(list.map((b) => Number(typeof b === 'object' ? b?.i : b)).filter((i) => Number.isInteger(i) && i >= 0 && i < n))
}

// Which item a question checks (its "target" names the item's front), or ''.
const ITEM_MATCH_MIN = 3
export function itemIdFor(question, items) {
  const t = String(question?.target || '').trim().toLowerCase()
  if (!t) return ''
  // A partial match needs at least 3 characters on the shorter side: a target like "a" or "el" sits inside nearly
  // every item and let unrelated questions through the "only what was taught" filter.
  const part = (a, b) => Math.min(a.length, b.length) >= ITEM_MATCH_MIN && (a.includes(b) || b.includes(a))
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
export function hintGivesAway(hint, subject, items) {
  if (!subject.isLanguage) return false
  const norm = (s) => ` ${String(s || '').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}']+/gu, ' ').trim()} `
  const h = norm(hint)
  return items.some((it) => { const f = norm(String(it.front).replace(/\([^)]*\)/g, '')); return f.trim().length >= 3 && h.includes(f) })
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
export function parseTalkScore(raw, clean) {
  const s = raw?.score === '' || raw?.score == null ? NaN : Number(raw.score) // "" read as a real 0
  if (!raw || !Number.isFinite(s)) return null
  const list = (v) => (Array.isArray(v) ? v : []).map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 3)
  return { score: Math.max(0, Math.min(1, s > 1 ? s / 100 : s)), note: clean(String(raw.note || '')).slice(0, 400), strengths: list(raw.strengths), gaps: list(raw.gaps) }
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
export const RAID_MAX_TOKENS = 6000
export function buildRaidPrompt(subject, cards, { level = '' } = {}) {
  return {
    system: `You write the questions of a review fight in a learning app. Reply with JSON only: {"questions": [{"card": <1-based card number>, "question": "...", "accepted": ["..."], "choices": ["...", "...", "...", "..."], "answer": "<the right choice, exactly>", "target": "<the card's front>"}]}. ${NO_DASH}`,
    user: [
      quizSubjectLine(subject),
      level ? `Learner: ${level}.` : '',
      `Exactly ONE question per card below, in the same order, testing ONLY what that card says (never another card, never outside knowledge).`,
      subject.isLanguage
        ? `Ask in ${subject.userLang} for the ${subject.learnLang} word or phrase (recall), or give a short ${subject.learnLang} sentence with a blank for it. "accepted": every correct ${subject.learnLang} answer. ${cueRule(subject)} ${subject.rules || ''}`.trim()
        : `Ask for the term, or to apply the idea to a short new case. "accepted": the correct short answers (terms stay as written).`,
      '"choices": 4 options, the right one plus 3 CLOSE but clearly wrong ones (the tempting mistakes). The question must never contain its own answer.',
      'Situations are everyday or from the learner\'s own context above: never a city, region, country or person that neither the card nor that context names.',
      `Cards:\n${cards.map((c, i) => `${i + 1}. FRONT: ${c.front}\n   BACK: ${String(c.back || '').replace(/\n+/g, ' / ')}`).join('\n')}`,
    ].filter(Boolean).join('\n'),
  }
}
