// Ebi's Help prompt stays inside a size budget on every screen, built the way App builds it with a HEAVY learner
// (a big deck, long histories, a finished Legends map, the raid catalog, a big knowledge base, a long session).
// HELP_SIZES=1 prints the size per screen (characters and ~tokens at 4 characters each).
import { describe, it, expect, vi } from 'vitest'
import { makeT } from '../i18n'
import { buildSystemPrompt, HELP_PROMPT_BUDGET, HELP_KNOWLEDGE_CAP } from './HelpChat'
import { buildLegendsHelpText, legendsWhere } from '../features/legends/helpContext'
import { raidCatalogText, raidCatalogMaxFor } from '../features/legends/bestiaryHelp'
import { raidHelpText, raidWhere, RAID_ORDER, raidBossIndex } from '../features/legends/raid'
import { gameHelpText } from '../features/game/helpText'
import { buildLearnerSnapshot } from '../features/kit/learnerContext'
import { learnerContextFor } from '../features/kit/learnerContextUse'

vi.mock('./Markdown', () => ({ default: () => null }))

const en = makeT('en')
const words = (n, w = 'palabra') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ')

// --- a heavy learner ------------------------------------------------------------------------------------------
const info = (cardId, front, interval, extra = {}) => ({ cardId, front, back: `${front} means something long enough to matter in a prompt`, interval, reps: 6, lapses: cardId % 7, factor: 2500, type: interval ? 2 : 0, ...extra })
const snap = buildLearnerSnapshot({
  modeId: 7, modeName: 'Spanish', isLanguage: true,
  deck: { ok: true, name: 'Spanish::Core', total: 4200, newTotal: 1800, studied: Array.from({ length: 400 }, (_, i) => info(i, `palabra${i}`, 5 + (i % 60))), fresh: Array.from({ length: 200 }, (_, i) => info(1000 + i, `nueva${i}`, 0)) },
  study: { ok: true, sessions: Array.from({ length: 60 }, (_, i) => ({ date: `2026-09-${String((i % 28) + 1).padStart(2, '0')}`, cardsStudied: 30, totalQuestions: 70, correct: 55 })) },
  slips: { ok: true, items: Array.from({ length: 30 }, (_, i) => ({ text: `ser vs estar slip number ${i} with a longer explanation`, n: 3 })) },
  chats: { ok: true, total: 40, items: Array.from({ length: 12 }, (_, i) => ({ title: `Chat about the subjunctive ${i}`, messages: [{ role: 'user', content: words(30) }, { role: 'assistant', content: words(40, 'respuesta') }] })) },
  discover: { ok: true, profile: { summary: words(60, 'perfil'), level: 'B1' } },
  level: { ok: true, value: 64, line: 'level 64 of 130, B1' },
  practice: { ok: true, items: Array.from({ length: 40 }, (_, i) => ({ kind: i % 2 ? 'card' : 'topic', label: `practiced thing ${i} in a roleplay`, src: 'roleplay', at: i })) },
  extra: [{ id: 'legends', title: 'Legends (adventure map and raids)', text: words(300, 'legendsfact') }],
})

const area = (i, status) => ({
  id: `a${i}`, title: `Area number ${i} about food and travel`, theme: 'a market town by the sea with many stalls', status, detailed: true, bossName: `Boss ${i}`,
  nodes: [...Array.from({ length: 8 }, (_, j) => ({ id: `n${i}-${j}`, kind: 'learn', title: `Level ${j} of area ${i}`, status: status === 'done' ? 'done' : j < 3 ? 'done' : 'open', stars: 3, attempts: 2, goal: 'order a coffee and pay with exact change at the counter' })), { id: `b${i}`, kind: 'boss', status: status === 'done' ? 'done' : 'locked' }],
  items: Array.from({ length: 24 }, (_, j) => ({ id: `it${i}-${j}`, front: `elemento${i}_${j}`, back: 'a meaning that is quite long so the help text has to cut it short somewhere', seen: 4, right: j % 4 })),
  canDo: ['order food', 'ask for the bill', 'talk about the weather'],
})
const map = { start: { reason: 'moving to Madrid', goal: 'talk with my in-laws', placement: { level: 40 } }, helpers: { scroll: 2, shield: 1 }, days: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`2026-09-${String(i + 1).padStart(2, '0')}`, 3])), areas: Array.from({ length: 24 }, (_, i) => area(i, i < 10 ? 'done' : i === 10 ? 'open' : 'locked')) }
const raid = { boss: raidBossIndex(RAID_ORDER[11]), day: { date: '2026-10-07', hp: 30, damage: 9, attempts: 1 }, siege: { boss: raidBossIndex(RAID_ORDER[11]), hp: 30, damage: 9, hearts: 6, date: '2026-10-07' }, trophies: RAID_ORDER.slice(0, 11).map((m) => ({ motif: m, date: '2026-09-01' })) }
const learner = { level: 64, confidence: 0.6, strengths: ['greetings', 'food'], gaps: ['subjunctive'], history: [] }
const player = { name: 'Sam', goalXp: 50, days: {} }

// What every feature has published on this screen (as App's featureHelp holds it).
function features(tab, extra = []) {
  const live = tab === 'raid' ? { view: 'raid' } : { view: 'map' }
  const screen = tab === 'raid' ? 'legends' : tab
  const out = [
    { id: 'legends', screen: 'legends', text: buildLegendsHelpText({ map, learner, raid, live, isLanguage: true, today: '2026-10-07', onLegends: screen === 'legends' }), ...(screen === 'legends' ? { where: legendsWhere(live), depth: 1 } : {}) },
    { id: 'raid-bosses', screen: '', text: raidCatalogText({ t: en, raid, today: '2026-10-07', max: raidCatalogMaxFor(screen), fxName: (ab, key) => key }) },
    { id: 'game', screen: '', text: gameHelpText(player, [{ name: 'Alex', days: {} }], '2026-10-07') },
    ...extra,
  ]
  return out.map((f) => ({ ...f, text: String(f.text).slice(0, 6000) }))
}

const base = (tab, more = {}) => ({
  legendsAvailable: true,
  navScreens: ['Chat', 'Study', 'Deck', 'Discover', 'Picture', 'Stats', 'Legends', 'Practice'],
  practiceActivities: ['Daily raid', 'Ebi Call', 'Roleplay', 'Mistake Gym', 'Scenes', 'Listen & Speak', 'Leech Doctor'],
  activeTab: tab === 'raid' ? 'legends' : tab,
  activeMode: { id: 7, name: 'Spanish', type: 'language', ankiDeck: 'Spanish::Core', dialect: 'Latin American Spanish' },
  grammarSlips: Array.from({ length: 12 }, (_, i) => `ser vs estar slip ${i}: use estar for temporary states [seen 3x]`),
  learnerLevel: 'level 64 of 130, B1 (strong at greetings, food; working on the subjunctive)',
  learnerContext: (opts = {}) => learnerContextFor(snap, 7, 'help', { omit: ['level', 'slips'], ...opts }),
  chatSettings: { focus: 'grammar', level: 'B1', explain: 'English', attachedDeck: null },
  ankiConnected: true,
  ankiDecks: Array.from({ length: 120 }, (_, i) => `Deck ${i}::Sub deck with a long name ${i}`),
  questionPreferences: Array.from({ length: 12 }, (_, i) => `Always give a full sentence context for question style rule ${i}`),
  progressObservations: words(400, 'observation').slice(0, 2500),
  chatTabMsgs: Array.from({ length: 5 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: words(60).slice(0, 200) })),
  knowledge: words(4000, 'knowledgebase').slice(0, 12000),
  featureContext: features(tab),
  ...more,
})

const studyReview = { counts: { good: 10, hard: 6, again: 8 }, wrong: Array.from({ length: 8 }, (_, i) => ({ front: `palabra${i} a long front`.slice(0, 80), rating: 'again', wrong: Array.from({ length: 3 }, () => ({ q: words(40, 'question').slice(0, 160), answer: words(20, 'ans').slice(0, 80), expected: 'expected answer here', note: words(60, 'note').slice(0, 200) })) })), insights: words(200, 'insight').slice(0, 800) }

const SCREENS = {
  study: () => base('study', {
    studyActive: true, studyDeck: 'Spanish::Core', studyPhase: 'question', studyStats: { easy: 3, good: 10, hard: 6, again: 8 }, studyDeckStats: { new_count: 20, learn_count: 5, review_count: 140 },
    currentQuestion: { number: 1, of: 3, type: 'recall', question: 'How do you say "dog"? (p)', acceptedAnswers: ['perro'], cardFront: 'perro', cardBack: 'dog' },
    studySession: { studyMode: 'flashcards', answerStyle: 'typed', completed: 24, activeCards: 3, poolRemaining: 130, learning: 'Spanish', ebiSpeaks: 'English', questionDepth: 'adaptive', questionsPerCard: 3, gradedRecent: Array.from({ length: 5 }, (_, i) => ({ front: `palabra${i}`, rating: 'good' })) },
    studyReview,
  }),
  deck: () => base('deck', { deckBrowser: { deck: 'Spanish::Core', cards: 4200, search: '', quickAdd: Array.from({ length: 8 }, (_, i) => `quick card ${i}`), review: { kind: 'custom', request: 'add an example sentence to every card', count: 120, first: Array.from({ length: 5 }, (_, i) => ({ front: `palabra${i}`, reason: words(30, 'reason').slice(0, 160) })) }, duplicates: 4 }, studyActive: true, studyDeck: 'Spanish::Core', studySession: { completed: 24, activeCards: 3 }, studyReview }),
  chat: () => base('chat', { studyActive: true, studyDeck: 'Spanish::Core', studySession: { completed: 24, activeCards: 3 }, studyReview }),
  legends: () => base('legends'),
  raid: () => base('raid', { featureContext: features('raid', [
    { id: 'raid', screen: 'legends', where: raidWhere({ view: 'fight', boss: 'The Lich Sovereign' }), depth: 3, text: raidHelpText({ view: 'fight', boss: 'The Lich Sovereign', ability: 'Raise Dead: misses raise minions', hpLeft: 21, hpMax: 30, livesLeft: 4, lives: 6, phase: 2, asked: 6, total: 20, powers: 'Powers brought: Focus (armed), Ward, Bandage.' }) },
    { id: 'quiz', screen: 'legends', text: 'A question is on screen: "How do you say \'to remember\'? (r)". Question 7 of 20.' },
  ]) }),
  practice: () => base('practice', { featureContext: features('practice', [
    { id: 'practice', screen: 'practice', text: 'The Practice hub: Mistake Gym is open.' },
    { id: 'mistake-gym', screen: 'practice', text: `Mistake Gym workout running: ${words(400, 'gymitem')}`.slice(0, 4000) },
  ]) }),
  stats: () => base('stats', { stats: { source: 'Anki', streak: 41, cardsToday: 80, accuracyToday: 84, recentSessions: Array.from({ length: 8 }, (_, i) => ({ date: `2026-10-0${i + 1}`, deck: 'Spanish::Core', cards: 30, accuracy: 80 })) } }),
  // Settings is a dialog over the screen below (the study start screen here): Help sees that screen.
  settings: () => base('study', { studyStart: { deck: 'Spanish::Core', type: 'flashcards', answerStyle: 'typed', questionDepth: 'adaptive', questionsPerCard: 3 } }),
}

// The knowledge base always keeps at least this much room, even for this heavy learner.
const KB_ROOM = 4000

describe('Help prompt size per screen (heavy learner)', () => {
  const sizes = Object.fromEntries(Object.entries(SCREENS).map(([k, f]) => [k, buildSystemPrompt(f()).length]))
  // Without the knowledge base (it gives way to fit the budget, so the rest is what must stay small).
  const rest = Object.fromEntries(Object.entries(SCREENS).map(([k, f]) => [k, buildSystemPrompt({ ...f(), knowledge: '' }).length]))
  if (process.env.HELP_SIZES) {
    for (const [k, n] of Object.entries(sizes)) console.log(`${k.padEnd(9)} ${String(n).padStart(6)} chars  ~${Math.round(n / 4)} tokens  (without the knowledge base ${rest[k]}, ~${Math.round(rest[k] / 4)})`)
  }
  for (const k of Object.keys(SCREENS)) {
    it(`${k} stays inside the budget (${HELP_PROMPT_BUDGET} characters) and leaves room for the knowledge base`, () => {
      expect(sizes[k]).toBeLessThanOrEqual(HELP_PROMPT_BUDGET)
      expect(rest[k]).toBeLessThanOrEqual(HELP_PROMPT_BUDGET - KB_ROOM)
    })
  }
  it('the knowledge base gets at most its Help cap', () => {
    const p = buildSystemPrompt(SCREENS.chat())
    const kb = p.split('Knowledge base for this mode')[1] || ''
    expect(kb.length).toBeLessThan(HELP_KNOWLEDGE_CAP + 300)
  })
})

describe('trimming keeps what Ebi must know', () => {
  it('the screen in view keeps its whole entry; the raid fight and its running question stay', () => {
    const p = buildSystemPrompt(SCREENS.raid())
    expect(p).toMatch(/ON SCREEN NOW \(raid\)[^]*Daily raid RUNNING against The Lich Sovereign/)
    expect(p).toMatch(/ON SCREEN NOW \(quiz\)/)
    expect(p).toMatch(/ON SCREEN NOW \(legends\)/)
    expect(p).toMatch(/BACKGROUND, raid-bosses[^]*Current boss in full/)
    expect(p).toMatch(/BACKGROUND, game[^]*Streak/)
  })
  it('every raid boss stays named in the catalog on every screen', () => {
    for (const k of Object.keys(SCREENS)) {
      const p = buildSystemPrompt(SCREENS[k]())
      RAID_ORDER.forEach((m, i) => expect(p, `${k} #${i + 1}`).toContain(`- #${i + 1} `))
    }
  })
  it('a background feature entry over its share is cut, never dropped, and says so', () => {
    const p = buildSystemPrompt(SCREENS.chat())
    expect(p).toMatch(/BACKGROUND, legends[^]*Legends map: 10\/24 areas cleared/)
  })
  it('secrecy holds after trimming: the live answer and front stay marked SECRET on Study only', () => {
    const p = buildSystemPrompt(SCREENS.study())
    expect(p).toMatch(/Expected answer \(SECRET\)[^\n]*perro/)
    expect(buildSystemPrompt(SCREENS.deck())).not.toMatch(/perro/)
  })
  it('the newest wrong answers of the session survive when the list is cut', () => {
    const r = { ...studyReview, wrong: studyReview.wrong.map((w, i) => ({ ...w, front: `card${i}` })) }
    const p = buildSystemPrompt({ ...SCREENS.chat(), studyReview: r })
    expect(p).toContain('"card7"')
    expect(p).toMatch(/THIS STUDY SESSION SO FAR/)
  })
  it('the Legends source is not repeated inside the learner context (Help has its own Legends entry)', () => {
    const p = buildSystemPrompt(SCREENS.chat())
    expect(p).not.toMatch(/LEGENDS \(ADVENTURE MAP AND RAIDS\):/)
  })
})
