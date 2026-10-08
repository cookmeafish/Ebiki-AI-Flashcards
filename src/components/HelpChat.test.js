import { describe, it, expect, vi } from 'vitest'
import { buildSystemPrompt, processHelpReply, dockSizes } from './HelpChat'

// HelpChat renders replies with Markdown (DOMPurify needs a DOM); only its prompt builder is tested here.
vi.mock('./Markdown', () => ({ default: () => null }))

const question = { number: 1, of: 3, type: 'recall', question: 'How do you say "dog"? (p)', acceptedAnswers: ['perro'], cardFront: 'perro', cardBack: 'dog' }
const base = { activeMode: { name: 'Spanish', type: 'language' }, studyActive: true, studyDeck: 'Spanish', studyPhase: 'question', currentQuestion: question }

describe('Help secrecy: the live card is gated by the screen', () => {
  it('on Study, the question is on screen and its answer and front are marked SECRET', () => {
    const p = buildSystemPrompt({ ...base, activeTab: 'study' })
    expect(p).toMatch(/QUESTION CURRENTLY ON SCREEN/)
    expect(p).toMatch(/Expected answer \(SECRET\)[^\n]*perro/)
    expect(p).toMatch(/Card front \(also SECRET[^\n]*perro/)
  })
  it('on any other screen, a paused session never puts its question, answer or card in the prompt', () => {
    for (const tab of ['stats', 'chat', 'deck', 'legends', 'picture']) {
      const p = buildSystemPrompt({ ...base, activeTab: tab })
      expect(p).not.toMatch(/QUESTION CURRENTLY ON SCREEN/)
      expect(p).not.toMatch(/perro/)
      expect(p).toMatch(/NOT on screen: a study session is paused/)
    }
  })
  it('the RIGHT NOW line names the screen in view', () => {
    expect(buildSystemPrompt({ ...base, activeTab: 'stats' })).toMatch(/RIGHT NOW the user is looking at the STATS screen/)
    expect(buildSystemPrompt({ activeTab: 'zzz' })).toMatch(/RIGHT NOW the user is looking at the "zzz" screen/)
  })
  it('a feature entry for the screen in view is ON SCREEN NOW, others are BACKGROUND', () => {
    const featureContext = [{ id: 'legends', text: 'map open', screen: 'legends' }, { id: 'game', text: 'streak 3', screen: 'stats' }]
    const p = buildSystemPrompt({ activeTab: 'legends', featureContext })
    expect(p).toMatch(/ON SCREEN NOW \(legends\)[^]*map open/)
    expect(p).toMatch(/BACKGROUND, game[^]*streak 3/)
  })
  it('the legends action is offered only when Legends is installed', () => {
    expect(buildSystemPrompt({ activeTab: 'chat' })).not.toMatch(/legends_edit/)
    expect(buildSystemPrompt({ activeTab: 'chat', legendsAvailable: true })).toMatch(/legends_edit/)
  })
  it('a learner-context builder that throws never costs the prompt', () => {
    const p = buildSystemPrompt({ activeTab: 'chat', learnerContext: () => { throw new Error('x') } })
    expect(p).toMatch(/CURRENT APP STATE/)
  })
})

describe('Help knows every screen and every action', () => {
  it('every sidebar screen (core and feature) has its own SCREEN label, never the generic fallback', async () => {
    const { CORE_NAV } = await import('../shell/layout')
    const { registry } = await import('../features/index')
    const ids = [...CORE_NAV.map((n) => n.id), ...registry.features.flatMap((f) => (f.navItems || []).map((n) => n.id))]
    expect(ids).toContain('legends')
    for (const id of ids) {
      const p = buildSystemPrompt({ activeTab: id, activeMode: { name: 'X' } })
      expect(p, id).not.toContain(`the "${id}" screen`)
    }
  })
  it('the capability text offers exactly the action types App applies', () => {
    const p = buildSystemPrompt({ activeTab: 'chat', activeMode: { name: 'X' }, legendsAvailable: true })
    const offered = [...p.matchAll(/<action>\{"type":"([a-z_]+)"/g)].map((m) => m[1]).sort()
    // App.jsx onAction branches (Help): keep in sync when adding one (CLAUDE.md: CAPABILITIES text + onAction + receipt).
    expect(offered).toEqual(['deck_edit', 'legends_edit', 'question_preference', 'set_dialect'])
    const noLegends = buildSystemPrompt({ activeTab: 'chat', activeMode: { name: 'X' } })
    expect(noLegends).not.toMatch(/legends_edit/)
  })
})

describe('processHelpReply: actions, receipts and the text cleanup', () => {
  const t = (k) => k
  const run = (a) => (a.type === 'set_dialect' ? `set ${a.dialect}` : null)
  it('runs each action, strips the tag and appends the app receipt', () => {
    const out = processHelpReply('Done!\n<action>{"type":"set_dialect","dialect":"Rioplatense"}</action>\nEnjoy.', { t, run })
    expect(out).not.toMatch(/<action>/)
    expect(out).toMatch(/^Done!\n\nEnjoy\.\n\n\*\*hr_header\*\*\n- set Rioplatense$/)
  })
  it('an unreadable, unknown or non-string result says hr_notApplied', () => {
    const run2 = (a) => (a.type === 'async' ? Promise.resolve('x') : a.type === 'blank' ? '  ' : null)
    const out = processHelpReply('a<action>{oops</action>b<action>{"type":"async"}</action><action>{"type":"blank"}</action><action>"str"</action>', { t, run: run2 })
    expect(out.match(/- hr_notApplied/g)).toHaveLength(4)
  })
  it('an action split over lines still runs', () => {
    const seen = []
    processHelpReply('<action>{\n "type": "set_dialect",\n "dialect": "x"\n}</action>', { t, run: (a) => { seen.push(a.type); return 'ok' } })
    expect(seen).toEqual(['set_dialect'])
  })
  it('a reply cut off inside an action hides the JSON and says hr_cutOff', () => {
    const out = processHelpReply('Sure, saving it. <action>{"type":"question_pre', { t, run })
    expect(out).toBe('Sure, saving it.\n\n**hr_header**\n- hr_cutOff')
  })
  it('dashes are line-aware and digit ranges keep a hyphen', () => {
    expect(processHelpReply('Pick 2 – 3 cards — then rest.\n— a list item\nend —', { t })).toBe('Pick 2-3 cards, then rest.\na list item\nend')
  })
  it('never shows a shrimp emoji, and keeps indentation', () => {
    expect(processHelpReply('Hi 🦐 there!🦞\n  - nested 🦀️', { t })).toBe('Hi there!\n  - nested')
  })
  it('an empty or action-only reply still shows something', () => {
    expect(processHelpReply('', { t })).toBe('…')
    expect(processHelpReply(null, { t })).toBe('…')
    expect(processHelpReply('<action>{"type":"set_dialect","dialect":"x"}</action>', { t, run })).toBe('…\n\n**hr_header**\n- set x')
  })
})

describe('processHelpReply: a shrimp before punctuation takes its space with it', () => {
  it('"enjoy 🦐!" reads "enjoy!"', () => {
    expect(processHelpReply('Done, enjoy 🦐! Bye 🦞.', {})).toBe('Done, enjoy! Bye.')
    expect(processHelpReply('🦐 Hello', {})).toBe('Hello')
  })
})

describe('Help dock sizes take a fair share of narrow or zoomed windows', () => {
  it('big screens keep the old clamp (24%, 250 to 380 px)', () => {
    expect(dockSizes(1440, 800).side).toBe(345)
    expect(dockSizes(2560, 1400).side).toBe(380)
    expect(dockSizes(1440 / 1.35, 800 / 1.35).side).toBe(255)
  })
  it('a narrow window caps the side dock at 42% instead of a fixed 250 px', () => {
    const s = dockSizes(900 / 2, 800 / 2) // 900px at zoom 2: the old 250 was 56%
    expect(s.drawer).toBe(false)
    expect(s.side / 450).toBeLessThanOrEqual(0.42)
    expect(dockSizes(700 / 1.35, 800 / 1.35).side / (700 / 1.35)).toBeLessThanOrEqual(0.42)
  })
  it('with no room for a side dock the side zones become a drawer over the page', () => {
    const s = dockSizes(700 / 2, 800 / 2)
    expect(s.drawer).toBe(true)
    expect(s.side).toBeLessThanOrEqual(350 - 32)
  })
  it('the under-question dock keeps at most 45% of a short window and the floating panel fits', () => {
    expect(dockSizes(450, 400).bottom / 400).toBeLessThanOrEqual(0.45)
    expect(dockSizes(1440, 800).bottom).toBe(304)
    expect(dockSizes(350, 400).freeW).toBeLessThanOrEqual(340)
    expect(dockSizes(1440, 800).freeW).toBe(340)
  })
  it('odd input never yields NaN', () => {
    const s = dockSizes(undefined, 'x')
    for (const v of [s.side, s.bottom, s.freeW]) expect(Number.isFinite(v)).toBe(true)
  })
})
