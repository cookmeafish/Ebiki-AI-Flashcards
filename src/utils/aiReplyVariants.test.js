// REAL REPLY VARIANTS through the shared parser (parseAiJson) and every feature parser behind it.
//
// Whatever provider or model a job runs on (Settings > AI & cost > Models per job), the JSON a prompt asks for comes
// back dressed differently: in ```json fences, after "Here you go:", with a closing remark, with a leaked
// <thinking> block, with curly quotes or single quotes as the JSON quotes, bare keys, Python's True/None, comments,
// trailing commas, wrapped in one key or sent bare, keys capitalized, numbers and flags as strings, or cut off by the
// output limit. Each variant here is one a real model family has sent; each parser must read it the same as the
// clean reply (or, cut off, keep every complete row).
import { describe, it, expect, vi } from 'vitest'
import { parseAiJson, canonKeys, pickObject, pickList, asList } from './aiJson'
import { parseQuestionReview, parseOpenChoices } from './questionTier'
import { parseVerdict, parseExplain, parseRecheck, gradeObject } from '../features/kit/fightJudge'
import { parseQuestions, parseQuizCheck, parseTalkScore, parseBossName } from '../features/legends/prompt'
import { parseRaidQuestions } from '../features/legends/raidQuestions'
import { parseMapPlan, parseAreaDetail, parseMapEdit } from '../features/legends/map'
import { parseTaunt } from '../features/kit/taunt'
import { parseScene } from '../features/kit/scene'
import { parseRuleCard } from '../features/kit/ruleCard'
import { parseEvidenceLevel } from '../features/kit/evidence'
import { parseScenarios, cleanScenario, normalizeScorecard } from '../features/roleplay/scoring'
import { parseDiagnoses } from '../features/leech-doctor/leeches'
import { workoutQuestions } from '../features/mistake-gym/prompt'
import { splitReply } from '../features/ebi-call/grades'
import { shapeSuggestion } from '../discover/suggestion'
import { studioReply } from '../components/studioReply'
import { processHelpReply } from '../components/HelpChat'

// HelpChat's renderer needs a DOM; it is not under test here.
vi.mock('../components/Markdown', () => ({ default: () => null }))


const P = (v) => JSON.stringify(v, null, 2)
const id = (s) => s

// Text variants every provider family produces around the same JSON value.
const dressed = (v) => ({
  plain: JSON.stringify(v),
  pretty: P(v),
  fenced: '```json\n' + P(v) + '\n```',
  fencedBare: '```\n' + P(v) + '\n```',
  preface: 'Here is the JSON you asked for:\n\n' + P(v),
  trailing: P(v) + '\n\nLet me know if you want more!',
  prosebrackets: 'Following your rules (see [1]):\n```json\n' + P(v) + '\n```\nNote: I kept {it} short.',
  thinking: '<thinking>The user wants JSON. Draft: {"draft": true}</thinking>\n' + P(v),
  think: '<think>\nok [draft]\n</think>\n\n' + P(v),
  trailingCommas: P(v).replace(/\n(\s*)([}\]])/g, ',\n$1$2'),
  pythonic: JSON.stringify(v).replace(/"([A-Za-z_]\w*)":/g, "'$1':").replace(/:true\b/g, ':True').replace(/:false\b/g, ':False').replace(/:null\b/g, ':None'),
  bareKeys: JSON.stringify(v).replace(/"([A-Za-z_]\w*)":/g, '$1:'),
  comment: P(v).replace('\n', '\n  // the answer\n'),
  stringified: JSON.stringify(JSON.stringify(v)),
})
// Curly quotes AS the JSON quotes (only realistic for values without inner quotes).
const curly = (v) => JSON.stringify(v).replace(/"([^"]*)"/g, '“$1”')

describe('parseAiJson: every dressing of the same value', () => {
  const values = {
    list: [{ question: 'Translate: dog', answer: 'perro', n: 2, ok: true }, { question: "Translate: the water (l'eau)", answer: 'el agua', n: 3, ok: false }],
    object: { correct: true, note: 'Good, it fits.', score: 0.8, gaps: null },
    wrapper: { questions: [{ question: 'Q1', answer: 'a' }, { question: 'Q2', answer: 'b' }] },
  }
  for (const [name, v] of Object.entries(values)) {
    for (const [how, text] of Object.entries(dressed(v))) {
      it(`${name} / ${how}`, () => expect(parseAiJson(text)).toEqual(v))
    }
    it(`${name} / curly quotes`, () => expect(parseAiJson(curly(v))).toEqual(v))
  }
  it('single-quoted strings keep their apostrophes', () => {
    expect(parseAiJson("{'front': 'l'eau', 'back': 'the water', 'tags': ['a','b']}")).toEqual({ front: "l'eau", back: 'the water', tags: ['a', 'b'] })
  })
  it('curly quotes INSIDE a normal value stay text', () => {
    expect(parseAiJson('{"note": "He said “hola”, then left", "ok": true}')).toEqual({ note: 'He said “hola”, then left', ok: true })
  })
  it('rows one per line with no list brackets are the list', () => {
    expect(parseAiJson('{"a":1}\n{"a":2}\n{"a":3}')).toEqual([{ a: 1 }, { a: 2 }, { a: 3 }])
    expect(parseAiJson('Here are the rows:\n{"a":1},\n{"a":2}')).toEqual([{ a: 1 }, { a: 2 }])
  })
  it('a short bracket in the preface never wins over the real answer', () => {
    expect(parseAiJson('Step [1]: done.\n[{"a":1},{"a":2}]')).toEqual([{ a: 1 }, { a: 2 }])
    expect(parseAiJson('Questions [2] and [5] are flawed: [2, 5]')).toEqual([2, 5])
    expect(parseAiJson('Using the format {front, back}:\n[{"front":"x","back":"y"}]')).toEqual([{ front: 'x', back: 'y' }])
  })
  it('cut off by the output limit: every complete row, also behind a preface bracket', () => {
    const rows = [{ q: 'a' }, { q: 'b' }, { q: 'c' }]
    const cut = P(rows).slice(0, P(rows).lastIndexOf('{') + 4)
    expect(parseAiJson(cut)).toEqual(rows.slice(0, 2))
    expect(parseAiJson('Here [1] is:\n' + cut)).toEqual(rows.slice(0, 2))
    expect(parseAiJson('{"questions": ' + cut)).toEqual(rows.slice(0, 2))
    expect(parseAiJson("[{'q': 'a'}, {'q': 'b'}, {'q': 'c")).toEqual(rows.slice(0, 2))
  })
  it('a URL with // and a value with a colon are not touched by the repairs', () => {
    expect(parseAiJson('{"url": "https://x.com/a//b", "n": 1, // note\n}')).toEqual({ url: 'https://x.com/a//b', n: 1 })
    expect(parseAiJson("{'time': '10:30', 'ok': True}")).toEqual({ time: '10:30', ok: true })
  })
  it('prose with no JSON is null, never a throw', () => {
    for (const s of ['', 'I cannot help with that.', 'Sure!', '[', '{"a":', 'True']) expect(() => parseAiJson(s)).not.toThrow()
    expect(parseAiJson('I cannot help with that.')).toBe(null)
  })
})

describe('the shape helpers', () => {
  it('canonKeys fills asked keys from look-alikes, never overwriting', () => {
    expect(canonKeys({ Question: 'q', accents_only: true, question2: 1 }, ['question', 'accentsOnly'])).toEqual({ Question: 'q', accents_only: true, question2: 1, question: 'q', accentsOnly: true })
    expect(canonKeys({ question: 'a', Question: 'b' }, ['question']).question).toBe('a')
  })
  it('pickObject unwraps a list of one or one wrapper key', () => {
    expect(pickObject([{ Level: 3 }], ['level']).level).toBe(3)
    expect(pickObject({ result: { level: 3 } }, ['level']).level).toBe(3)
    expect(pickObject({ a: { level: 1 }, b: { level: 2 } }, ['level'])).toBe(null)
  })
  it('pickList reads a bare list, a named or other key, or one row alone', () => {
    const rows = [{ question: 'a' }]
    expect(pickList(rows, 'questions', ['question'])).toEqual(rows)
    expect(pickList({ Questions: rows }, 'questions', ['question'])).toEqual(rows)
    expect(pickList({ workout: rows }, 'questions', ['question'])).toEqual(rows)
    expect(pickList({ question: 'a' }, 'questions', ['question'])).toEqual(rows)
    expect(pickList('nope', 'questions', ['question'])).toEqual([])
  })
  it('asList: a list wrapped in one key is the list; one marked row is a list of one; anything else unchanged', () => {
    expect(asList({ questions: [1, 2] })).toEqual([1, 2])
    expect(asList({ question: 'q' }, ['question'])).toEqual([{ question: 'q' }])
    expect(asList({ a: 1 })).toEqual({ a: 1 })
    expect(asList(null)).toBe(null)
  })
})

// Each feature parser: the clean reply, then the variants its model family really sends.
const viaText = (v) => Object.values(dressed(v)).map((t) => parseAiJson(t))

describe('fight grading (verdict, explanation, re-check)', () => {
  const clean = { target: true, all: false, accentsOnly: true }
  it('every dressing, a list of one, a wrapper, capitalized or snake_case keys, flags as text', () => {
    for (const j of viaText(clean)) expect(parseVerdict(j)).toEqual(clean)
    for (const raw of [[clean], { verdict: clean }, { result: [clean] }, { Target: true, All: false, AccentsOnly: true },
      { target: 'true', all: 'false', accents_only: 'yes' }, { TARGET: 'True', ALL: 'False', ACCENTSONLY: 'true' }]) {
      expect(parseVerdict(raw), JSON.stringify(raw)).toEqual(clean)
    }
  })
  it('the plain-question answer shape ({"correct": true}) is a whole verdict', () => {
    expect(parseVerdict({ Correct: 'yes' })).toEqual({ target: true, all: true, accentsOnly: false })
  })
  it('explanation and re-check read wrapped and capitalized replies', () => {
    expect(parseExplain({ Note: 'Use ser.', Fix: { question: 'Q?', answer: 'A' } })).toEqual({ note: 'Use ser.', attack: { prompt: 'Q?', accepted: ['A'] } })
    expect(parseRecheck({ result: { Right: 'true', All: 'true', Why: 'Synonym.' } }, 'miss')).toEqual({ verdict: 'clean', overturned: true, why: 'Synonym.' })
    expect(gradeObject([{ Correct: false, note: 'x' }], ['correct']).correct).toBe(false)
  })
})

describe('question lists (Legends quizzes, placement, raids, scenes, gym, listen)', () => {
  const typed = [{ type: 'typed', question: 'How do you say dog?', answer: 'perro', accepted: ['perro'], target: 'perro' }, { type: 'typed', question: 'How do you say cat?', accepted: ['gato'], target: 'gato' }]
  const prompts = (qs) => qs.map((q) => q.prompt)
  it('parseQuestions: every dressing, any list key, capitalized keys, one question alone, accepted as text', () => {
    for (const j of viaText({ questions: typed })) expect(prompts(parseQuestions(j, id))).toEqual(['How do you say dog?', 'How do you say cat?'])
    expect(prompts(parseQuestions(typed, id))).toHaveLength(2)
    expect(prompts(parseQuestions({ quiz: typed }, id))).toHaveLength(2)
    expect(prompts(parseQuestions([{ Type: 'typed', Question: 'How do you say dog?', Accepted: 'perro' }], id))).toEqual(['How do you say dog?'])
    expect(parseQuestions({ question: 'How do you say dog?', accepted: ['perro'] }, id)[0].accepted).toEqual(['perro'])
  })
  it('an answer index sent as text picks its choice', () => {
    const [q] = parseQuestions([{ type: 'choice', question: 'Pick dog', choices: ['gato', 'perro', 'pez', 'ave'], answer: '1' }], id)
    expect(q.choices[q.answerIdx]).toBe('perro')
  })
  it('parseRaidQuestions: wrapped, capitalized "Card", one question alone', () => {
    const cards = [{ cardId: 1, front: 'dog', back: 'perro' }]
    const row = { card: 1, type: 'typed', question: 'Say "dog" in Spanish', accepted: ['perro'] }
    expect(parseRaidQuestions({ questions: [row] }, cards).qs).toHaveLength(1)
    const { card: _c, ...noCard } = row
    expect(parseRaidQuestions({ items: [{ ...noCard, Card: 'Card 1' }] }, cards).qs).toHaveLength(1)
    expect(parseRaidQuestions(row, cards).qs).toHaveLength(1)
  })
  it('workoutQuestions (Mistake Gym): another key, one alone, capitalized', () => {
    expect(workoutQuestions({ workout: typed }, id)).toHaveLength(2)
    expect(workoutQuestions({ Questions: typed }, id)).toHaveLength(2)
    expect(workoutQuestions(typed[0], id)).toHaveLength(1)
  })
  it('parseScene: wrapped, capitalized keys, questions in another case', () => {
    const scene = { title: 'Café', cast: { A: 'Ana', B: 'Leo' }, lines: [{ speaker: 'A', text: 'Hola' }, { speaker: 'b', text: 'Hola, Ana' }, { speaker: 'A', text: '¿Café?' }], questions: [{ type: 'typed', question: 'What did Ana offer?', accepted: ['café'] }] }
    for (const j of viaText(scene)) expect(parseScene(j)?.lines).toHaveLength(3)
    const s = parseScene({ scene: { Title: 'Café', Lines: scene.lines.map((l) => ({ Speaker: l.speaker, Text: l.text })), Questions: [{ Type: 'typed', Question: 'What did Ana offer?', Accepted: ['café'] }] } })
    expect(s.title).toBe('Café')
    expect(s.lines.map((l) => l.speaker)).toEqual(['A', 'B', 'A'])
    expect(s.questions).toHaveLength(1)
  })
})

describe('reviews and checks', () => {
  it('parseQuestionReview: verdicts under any key, one verdict alone, capitalized, "i" as text', () => {
    expect(parseQuestionReview({ verdicts: [{ i: 0, ok: true }, { i: '1', ok: 'false', reason: 'two answers' }] }, 2)).toEqual({ complete: true, reviewed: [0, 1], fails: [{ i: 1, reason: 'two answers' }] })
    expect(parseQuestionReview({ results: [{ I: 0, OK: 'yes' }] }, 1).complete).toBe(true)
    expect(parseQuestionReview({ i: 0, ok: false, reason: 'leak' }, 1)).toEqual({ complete: true, reviewed: [0], fails: [{ i: 0, reason: 'leak' }] })
    expect(parseQuestionReview(null, 1).complete).toBe(false)
  })
  it('parseOpenChoices: index under another name, options as objects', () => {
    const choices = ['a', 'b', 'c', 'd']
    expect(parseOpenChoices({ choices, answerIdx: '2' })).toEqual({ choices, answerIdx: 2 })
    expect(parseOpenChoices({ Choices: choices, answer_index: 1 })).toEqual({ choices, answerIdx: 1 })
    expect(parseOpenChoices({ choices, answer: 3 })).toEqual({ choices, answerIdx: 3 })
    expect(parseOpenChoices({ choices: choices.map((text, i) => ({ text, correct: i === 0 })) })).toEqual({ choices, answerIdx: 0 })
    expect(parseOpenChoices({ choices })).toBe(null) // no index: never guessed
  })
  it('parseQuizCheck: "Bad", bare list, objects or numbers as text', () => {
    expect([...parseQuizCheck({ Bad: [{ i: '1', why: 'x' }] }, 3)]).toEqual([1])
    expect([...parseQuizCheck(['0', 2], 3)]).toEqual([0, 2])
    expect(parseQuizCheck('All fine.', 3)).toBe(null)
  })
  it('parseTalkScore: wrapped or capitalized, scores as "8/10" or "85%"', () => {
    expect(parseTalkScore({ Score: '8/10', Note: 'Nice' }, id)).toMatchObject({ score: 0.8, note: 'Nice' })
    expect(parseTalkScore({ score: '85%' }, id).score).toBeCloseTo(0.85)
  })
})

describe('Legends map, boss name, evidence level', () => {
  const areas = [{ title: 'Greetings', theme: 'Hello', motif: 'forest', palette: 'original' }, { title: 'Food', theme: 'Eat' }, { title: 'Travel', theme: 'Go' }]
  it('parseMapPlan: any list key, capitalized keys, a list of titles', () => {
    for (const j of viaText({ areas })) expect(parseMapPlan(j, id)?.map((a) => a.title)).toEqual(['Greetings', 'Food', 'Travel'])
    expect(parseMapPlan({ plan: areas.map((a) => ({ Title: a.title })) }, id)?.length).toBe(3)
    expect(parseMapPlan(['A', 'B', 'C'], id)?.length).toBe(3)
  })
  it('parseAreaDetail: a wrapped area', () => {
    const detail = {
      items: [1, 2, 3, 4, 5].map((i) => ({ kind: i === 5 ? 'rule' : 'term', front: `w${i}`, back: `m${i}` })),
      nodes: [{ kind: 'learn', items: [1, 2] }, { kind: 'learn', items: [3] }, { kind: 'rule', items: [4, 5] }],
    }
    expect(parseAreaDetail(detail, id)?.items).toHaveLength(5)
    expect(parseAreaDetail({ area: detail }, id)?.items).toHaveLength(5)
    expect(parseAreaDetail({ Items: detail.items, Nodes: detail.nodes }, id)?.items).toHaveLength(5)
  })
  it('parseMapEdit and the boss name', () => {
    expect(parseMapEdit({ proposal: { Areas: areas, note: 'ok' } }, id)?.areas).toHaveLength(3)
    expect(parseBossName({ name: '"The Clockmaker"' }, id)).toBe('The Clockmaker')
  })
  it('parseEvidenceLevel: wrapped, capitalized, numbers as text', () => {
    expect(parseEvidenceLevel({ result: { Level: '42', Confidence: '60%', Strengths: 'greetings, numbers' } })).toMatchObject({ level: 42, strengths: ['greetings', 'numbers'] })
  })
})

describe('practice features', () => {
  it('parseTaunt: a plain line, quoted, labeled, fenced, or as JSON', () => {
    for (const raw of ['Is that all?', '"Is that all?"', 'Taunt: Is that all?', "Here's my taunt:\nIs that all?", '```\nIs that all?\n```', '{"taunt": "Is that all?"}']) {
      expect(parseTaunt(raw), raw).toBe('Is that all?')
    }
  })
  it('parseRuleCard: wrapped or capitalized, skip as text', () => {
    expect(parseRuleCard({ card: { Front: 'When does qué take an accent?', Back: 'In questions.' } })).toMatchObject({ front: 'When does qué take an accent?' })
    expect(parseRuleCard([{ skip: 'true', why: 'one-off typo' }])).toEqual({ skip: true, why: 'one-off typo' })
  })
  it('roleplay: scenarios under any key, a wrapped scenario, scores in another case or as "4/5"', () => {
    const sc = { title: 'Bank', emoji: '🏦', setting: 'You open an account.', role: 'the clerk', goal: 'open it' }
    expect(parseScenarios({ options: [sc, { ...sc, title: 'Shop' }] }, id)).toHaveLength(2)
    expect(parseScenarios([{ Title: 'Bank', Setting: sc.setting, Role: sc.role }], id)).toHaveLength(1)
    expect(cleanScenario({ scenario: sc })?.role).toBe('the clerk')
    const card = normalizeScorecard({ scorecard: { Scores: { Accuracy: '4/5', complexity: 3, VOCABULARY: '5' }, overall: '4', goalMet: 'yes' } }, ['accuracy', 'complexity', 'vocabulary'])
    expect(card).toMatchObject({ scores: { accuracy: 4, complexity: 3, vocabulary: 5 }, overall: 4, goalMet: true })
  })
  it('leech doctor: a bare list, capitalized keys and cause', () => {
    const patients = [{ noteId: 11 }]
    expect(parseDiagnoses([{ noteId: 11, cause: 'Confusable', explanation: 'x' }], patients).get('11').cause).toBe('confusable')
    expect(parseDiagnoses({ results: [{ NoteId: '11', Explanation: 'x' }] }, patients).size).toBe(1)
  })
  it('Ebi Call grades: a lone object, "Good", "id 11", fenced inside the tag', () => {
    const r = splitReply('¡Muy bien!<grades>```json\n{"id": "id 11", "verdict": "Good"}\n```</grades>', ['11'], parseAiJson)
    expect(r).toEqual({ say: '¡Muy bien!', grades: [{ id: '11', verdict: 'good', why: '' }] })
  })
  it('Discover suggestion: wrapped or listed', () => {
    for (const raw of [{ term: 'perro', translation: 'dog' }, [{ term: 'perro', translation: 'dog' }], { suggestion: { term: 'perro', translation: 'dog' } }]) {
      expect(shapeSuggestion(raw)?.term).toBe('perro')
    }
  })
})

describe('tagged JSON inside free text (Ebi Studio <mode>, Help <action>)', () => {
  it('Studio reads a fenced, prefaced or pythonic <mode> block', () => {
    for (const block of ['```json\n{"name": "Kitchen Safety", "type": "general"}\n```', 'Here: {"name": "Kitchen Safety", "type": "general",}', "{'name': 'Kitchen Safety', 'type': 'general'}"]) {
      expect(studioReply(`Plan ready.\n<mode>${block}</mode>`, parseAiJson).spec?.name, block).toBe('Kitchen Safety')
    }
  })
  it('Help runs an action written with single quotes, a trailing comma or fences', () => {
    const parse = (s) => { const o = parseAiJson(s); return o && typeof o === 'object' && !Array.isArray(o) ? o : null }
    const seen = []
    const run = (a) => { seen.push(a.dialect); return 'ok' }
    processHelpReply("<action>{'type': 'set_dialect', 'dialect': 'Rioplatense'}</action>", { parse, run })
    processHelpReply('<action>{"type":"set_dialect","dialect":"Andaluz",}</action>', { parse, run })
    processHelpReply('<action>```json\n{"type":"set_dialect","dialect":"Chileno"}\n```</action>', { parse, run })
    expect(seen).toEqual(['Rioplatense', 'Andaluz', 'Chileno'])
  })
})
