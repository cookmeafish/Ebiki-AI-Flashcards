import { describe, it, expect } from 'vitest'
import { AI_JOBS } from './aiJobs'
import {
  TASKS, taskOfJob, jobsWithoutTask, roleDefaults, resolveRoleModel, levelOf, modelName, costPerUse, costWords,
  unseenChatModels, planStatus, autoReplanDue, planDiff, newerPlanEntry, AUTO_REPLAN_INTERVAL_MS, taskModels, pickerModels, likelyTextOnly, taskSignature,
} from './modelPlan'

// An invented provider state: presets on a newer release than an old saved plan.
const PRESETS = { cheap: 'claude-haiku-5-5', normal: 'claude-sonnet-5-5', max: 'claude-opus-5-5' }
const presetModel = (t) => PRESETS[t]
const ROLE_TIER = { pose: 'cheap', help: 'cheap', chat: 'normal', study: 'normal', qcheck: 'normal', general: 'normal', deck: 'max', picture: 'normal', discover: 'cheap' }
const OLD_PLAN = { chat: 'claude-haiku-4-5-20251001', deck: 'claude-opus-4-6', picture: 'claude-sonnet-4-6' }

describe('tasks', () => {
  it('every chat job is in exactly one task', () => {
    expect(jobsWithoutTask()).toEqual([])
    const seen = new Map()
    for (const t of TASKS) for (const j of t.jobs) { expect(seen.has(j), j).toBe(false); seen.set(j, t.id) }
  })
  it('every task job is a real job', () => {
    const ids = new Set(AI_JOBS.map((j) => j.id))
    for (const t of TASKS) for (const j of t.jobs) expect(ids.has(j), j).toBe(true)
  })
  it('finds a job\'s task', () => {
    expect(taskOfJob('chat.reply').id).toBe('talk')
    expect(taskOfJob('factcheck.reply').id).toBe('factcheck')
    expect(taskOfJob('nope')).toBeNull()
  })
})

describe('roleDefaults and hand picks', () => {
  it('an old saved plan resolves to the newer preset of the same family', () => {
    const d = roleDefaults({ intel: 'optimized', presetModel, plan: OLD_PLAN, roleTier: ROLE_TIER })
    expect(d.chat).toBe('claude-haiku-5-5')
    expect(d.deck).toBe('claude-opus-5-5')
    expect(d.picture).toBe('claude-sonnet-5-5')
    expect(d.pose).toBe('claude-haiku-5-5')
  })
  it('a hand pick stays EXACTLY as set, even an old model', () => {
    const defaults = roleDefaults({ intel: 'optimized', presetModel, plan: OLD_PLAN, roleTier: ROLE_TIER })
    expect(resolveRoleModel('chat', { overrides: { chat: 'claude-haiku-4-5-20251001' }, defaults })).toBe('claude-haiku-4-5-20251001')
    expect(resolveRoleModel('chat', { overrides: { chat: '  ' }, defaults })).toBe('claude-haiku-5-5')
  })
  it('normal and max put every role on that preset, the pose on normal', () => {
    const d = roleDefaults({ intel: 'max', presetModel, roleTier: ROLE_TIER })
    expect(d.chat).toBe('claude-opus-5-5')
    expect(d.pose).toBe('claude-sonnet-5-5')
  })
})

describe('words', () => {
  it('levels', () => {
    expect(levelOf('claude-opus-5-5', { presetModel })).toBe('max')
    expect(levelOf('claude-haiku-4-5', { presetModel })).toBeNull() // older than the cheap preset: no level claimed
    expect(levelOf('claude-haiku-5-5-20260101', { presetModel })).toBe('cheap')
    expect(levelOf('other-model', { presetModel, fallbackTier: 'normal' })).toBe('normal')
  })
  it('model names', () => {
    expect(modelName('claude-haiku-5-5')).toBe('Claude Haiku 5.5')
    expect(modelName('claude-haiku-4-5-20251001')).toBe('Claude Haiku 4.5')
    expect(modelName('gpt-4o-mini-2024-07-18')).toBe('GPT 4o Mini')
    expect(modelName('gpt-5.1-mini')).toBe('GPT 5.1 Mini')
    expect(modelName('models/gemini-3.8-flash')).toBe('Gemini 3.8 Flash')
    expect(modelName('grok-4-0709')).toBe('Grok 4')
    expect(modelName('')).toBe('')
  })
  it('cost per use: measured after 5 uses, typical before, never a guessed price', () => {
    const typical = [1000, 100]
    expect(costPerUse({ usage: { calls: 2, input: 99999, output: 9 }, typical, price: [1, 10] })).toMatchObject({ source: 'typical', usd: 0.002 })
    expect(costPerUse({ usage: { calls: 10, input: 20000, output: 2000 }, typical, price: [1, 10] })).toMatchObject({ source: 'measured', usd: 0.004 })
    expect(costPerUse({ usage: null, typical, price: null }).usd).toBeNull()
  })
  it('cost words never round a fraction of a cent 30% off', () => {
    expect(costWords(null)).toEqual({ kind: 'unknown' })
    expect(costWords(0.00025)).toEqual({ kind: 'perCent', n: 40 })
    expect(costWords(0.0085)).toEqual({ kind: 'fraction', x: '0.9' })
    expect(costWords(0.0042)).toEqual({ kind: 'fraction', x: '0.4' })
    expect(costWords(0.034)).toEqual({ kind: 'cents', n: 3 })
  })
  it('an unknown family has no level (never a guessed "Standard"), nor an OLDER model of a preset family', () => {
    expect(levelOf('claude-fable-5-2', { presetModel })).toBeNull()
    expect(levelOf('claude-opus-4-6', { presetModel })).toBeNull()
    expect(levelOf('claude-opus-6', { presetModel })).toBe('max')
  })
  it('photo tasks never get text-only or coding models', () => {
    for (const id of ['gpt-3.5-turbo', 'gpt-4', 'o3-mini', 'gpt-5.1-codex', 'grok-3-mini']) expect(likelyTextOnly(id), id).toBe(true)
    for (const id of ['gpt-4o', 'gpt-4.1', 'claude-haiku-5-5', 'gemini-3.8-flash', 'grok-4']) expect(likelyTextOnly(id), id).toBe(false)
    expect(pickerModels(['gpt-5', 'gpt-5.1-codex'])).toEqual(['gpt-5'])
  })
  it('a task signature names every model', () => {
    expect(taskSignature([{ model: 'a' }, { model: 'b' }])).toBe('a + b')
  })
  it('a task names every model it runs on, the most used first', () => {
    const task = { jobs: ['a', 'b', 'c'] }
    expect(taskModels(task, (j) => (j === 'b' ? 'y' : 'x'))).toEqual([{ model: 'x', jobs: ['a', 'c'] }, { model: 'y', jobs: ['b'] }])
  })
  it('picker lists: one per visible name, no previews, the current pick kept', () => {
    const ids = ['gpt-3.5-turbo', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'gpt-5-preview', 'gpt-5', 'whisper-1']
    expect(pickerModels(ids)).toEqual(['gpt-3.5-turbo', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo-1106', 'gpt-5'].filter((x, i, a) => a.findIndex((y) => modelName(y) === modelName(x)) === i))
    expect(pickerModels(ids, ['gpt-3.5-turbo-1106'])).toContain('gpt-3.5-turbo-1106')
    expect(pickerModels(ids, ['gpt-5-preview'])).toContain('gpt-5-preview')
  })
})

describe('plan status and the automatic re-plan', () => {
  const entry = { plan: OLD_PLAN, knownModels: ['claude-haiku-4-5-20251001', 'claude-opus-4-6', 'claude-sonnet-4-6'], decidedAt: 1000 }
  it('an old plan already lifted to the newest family is "freshened", never "newer models came out"', () => {
    expect(planStatus({ entry, liveIds: null, presetIds: Object.values(PRESETS) }).state).toBe('freshened')
    expect(planStatus({ entry, liveIds: Object.values(PRESETS), presetIds: Object.values(PRESETS) }).state).toBe('freshened')
  })
  it('"newer" only when a model newer than what RUNS is listed', () => {
    const s = planStatus({ entry, liveIds: [...Object.values(PRESETS), 'claude-opus-6'], presetIds: Object.values(PRESETS) })
    expect(s.state).toBe('newer')
    expect(s.newer).toContainEqual({ from: 'claude-opus-5-5', to: 'claude-opus-6' })
  })
  it('a current plan with a failed list is "unknown", never "up to date"', () => {
    const cur = { plan: { chat: 'claude-haiku-5-5' }, decidedAt: 5 }
    expect(planStatus({ entry: cur, liveIds: null, presetIds: Object.values(PRESETS) }).state).toBe('unknown')
    expect(planStatus({ entry: cur, liveIds: ['claude-haiku-5-5'], presetIds: Object.values(PRESETS) }).state).toBe('current')
    expect(planStatus({ entry: null, liveIds: [] }).state).toBe('never')
  })
  it('unseen chat models only', () => {
    expect(unseenChatModels(entry, ['claude-opus-4-6', 'claude-opus-5-5', 'some-tts-model'])).toEqual(['claude-opus-5-5'])
    expect(unseenChatModels(entry, null)).toEqual([])
  })
  it('runs at most once a day, never in the overlay, before onboarding, frozen, on a fixed plan or with no key', () => {
    const base = { now: AUTO_REPLAN_INTERVAL_MS * 3, lastAutoAt: 0, unseen: ['x'] }
    expect(autoReplanDue(base)).toBe(true)
    expect(autoReplanDue({ ...base, lastAutoAt: base.now - 1000 })).toBe(false)
    expect(autoReplanDue({ ...base, unseen: [] })).toBe(false)
    for (const k of ['overlay', 'fixedModels', 'frozen']) expect(autoReplanDue({ ...base, [k]: true }), k).toBe(false)
    expect(autoReplanDue({ ...base, onboarded: false })).toBe(false)
    expect(autoReplanDue({ ...base, hasKey: false })).toBe(false)
  })
  it('what changed, leaving hand-picked tasks out', () => {
    expect(planDiff({ talk: 'a', cards: 'b', helpers: 'c' }, { talk: 'a2', cards: 'b2', helpers: 'c' }, ['cards']))
      .toEqual([{ task: 'talk', from: 'a', to: 'a2' }])
  })
  it('the plan decided later wins (two computers)', () => {
    expect(newerPlanEntry({ decidedAt: 5 }, { decidedAt: 9 }).decidedAt).toBe(9)
    expect(newerPlanEntry({ decidedAt: 9 }, { decidedAt: 5 }).decidedAt).toBe(9)
  })
})
