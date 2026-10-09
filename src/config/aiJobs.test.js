// The AI job registry (src/config/aiJobs.js): complete, translated, resolved in the right order, saved like a role
// override, healed at its role's tier, and actually USED by every AI call in the app and its features.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import {
  AI_JOBS, JOB_BY_ID, JOB_GROUPS, jobKey, jobLabelKey, jobHintKey, jobGroupKey, resolveJob, speechJobModel, pinnedTierFor,
  roleOfOverrideKey, jobsForProvider, jobOverridesOf, withoutJobOverrides, jobMatches,
  isChatModelId, chatModelsOnly,
} from './aiJobs'
import { LANGUAGES } from '../i18n/languages'
import { flattenConfig, diffConfig, mergeConfigPatch } from '../utils/configDiff'
import { MODELS } from '../speech/engines'

const SRC = path.resolve(__dirname, '..')
const read = (rel) => fs.readFileSync(path.join(SRC, rel), 'utf8')
const APP = read('App.jsx')
// The real roles, read from App.jsx's ROLE_TIER so this test can't drift from it.
const ROLE_TIER = Object.fromEntries([...APP.match(/const ROLE_TIER = \{([^}]*)\}/)[1].matchAll(/(\w+):\s*'(\w+)'/g)].map((m) => [m[1], m[2]]))
const ROLES = Object.keys(ROLE_TIER)

describe('registry', () => {
  it('has unique, well-formed ids, a real parent role and a known group', () => {
    const ids = AI_JOBS.map((j) => j.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ROLES.length).toBeGreaterThanOrEqual(9)
    for (const j of AI_JOBS) {
      expect(j.id, j.id).toMatch(/^[a-z]+\.[a-zA-Z]+$/)
      expect(JOB_GROUPS, j.id).toContain(j.group)
      expect(['role', 'fast', 'cheap'], j.id).toContain(j.base)
      if (j.speech) {
        expect(j.role, j.id).toBeNull()
        expect(['stt', 'tts']).toContain(j.speech)
        for (const p of j.providers) expect(['openai', 'grok', 'gemini']).toContain(p)
      } else expect(ROLES, j.id).toContain(j.role)
    }
    for (const g of JOB_GROUPS) expect(AI_JOBS.some((j) => j.group === g), g).toBe(true)
  })

  it('has a label and a hint in every locale, and every group a name', () => {
    for (const lang of LANGUAGES) {
      const missing = [
        ...AI_JOBS.flatMap((j) => [jobLabelKey(j.id), jobHintKey(j.id)]),
        ...JOB_GROUPS.map(jobGroupKey),
        'aiJobs_title', 'aiJobs_desc', 'aiJobs_search', 'aiJobs_resetAll', 'aiJobs_noMatch', 'aiJobs_setCount', 'aiJobs_setCountOne',
        'aiJob_uses', 'aiJob_usesBuiltIn', 'aiJob_inherit', 'aiJob_reset', 'aiJob_picked', 'aiJob_visionTip',
        ...ROLES.map((r) => `aiRole_${r}`),
      ].filter((k) => !lang.strings[k])
      expect(missing, lang.code).toEqual([])
    }
  })

  it('lists speech jobs only for their engines', () => {
    expect(jobsForProvider('anthropic').some((j) => j.speech)).toBe(false)
    expect(jobsForProvider('openai').filter((j) => j.speech).map((j) => j.id)).toEqual(['speech.stt', 'speech.tts'])
    expect(jobsForProvider('grok').filter((j) => j.speech).map((j) => j.id)).toEqual(['speech.stt']) // xAI TTS takes no model
  })
})

describe('resolution', () => {
  const roles = { study: 'mid-model', qcheck: 'mid-model', picture: 'pic-model', help: 'cheap-model' }
  const resolveRole = (r) => roles[r] || 'general-model'
  const resolveRoleFast = (r) => `fast:${r}`
  it('uses the job pick first, else exactly what the parent role gives', () => {
    expect(resolveJob('study.grade', { overrides: {}, resolveRole })).toBe('mid-model')
    expect(resolveJob('study.grade', { overrides: { [jobKey('study.grade')]: 'big-model' }, resolveRole })).toBe('big-model')
    // Another job's pick never leaks.
    expect(resolveJob('study.hint', { overrides: { [jobKey('study.grade')]: 'big-model' }, resolveRole })).toBe('mid-model')
    // A blank pick is no pick.
    expect(resolveJob('fight.taunt', { overrides: { [jobKey('fight.taunt')]: '  ' }, resolveRole })).toBe('cheap-model')
  })
  it('keeps the fast and cheap defaults of the Picture paths', () => {
    expect(resolveJob('picture.scan', { overrides: {}, resolveRole, resolveRoleFast })).toBe('fast:picture')
    expect(resolveJob('picture.wordList', { overrides: {}, resolveRole, resolveRoleFast, cheap: 'cheap-tier' })).toBe('cheap-tier')
    expect(resolveJob('picture.wordList', { overrides: { picture: 'pinned' }, resolveRole, resolveRoleFast, cheap: 'cheap-tier' })).toBe('pinned')
    expect(resolveJob('picture.wordList', { overrides: { picture: 'pinned', [jobKey('picture.wordList')]: 'own' }, resolveRole, cheap: 'c' })).toBe('own')
  })
  it('falls back to the caller role for an unknown job', () => {
    expect(resolveJob('nope.nothing', { resolveRole, fallbackRole: 'study' })).toBe('mid-model')
  })
  it('speech: the pick, else the engine model, Gemini STT on its cheap preset', () => {
    expect(speechJobModel('stt', 'openai', { builtIn: MODELS })).toBe(MODELS.stt.openai)
    expect(speechJobModel('tts', 'gemini', { builtIn: MODELS })).toBe(MODELS.tts.gemini)
    expect(speechJobModel('stt', 'gemini', { builtIn: MODELS, cheap: 'gemini-cheap' })).toBe('gemini-cheap')
    expect(speechJobModel('stt', 'openai', { builtIn: MODELS, overrides: { [jobKey('speech.stt')]: 'whisper-1' } })).toBe('whisper-1')
  })
  it('search matches label, hint, group and id', () => {
    const job = JOB_BY_ID['fight.taunt']
    expect(jobMatches(job, 'boss', { label: 'Boss taunts' })).toBe(true)
    expect(jobMatches(job, 'fight.taunt')).toBe(true)
    expect(jobMatches(job, 'flashcard', { label: 'Boss taunts' })).toBe(false)
  })
})

describe('storage', () => {
  it('a job pick rides aiModels like a role override: posted alone, merged, removed by __unset', () => {
    const before = { aiModels: { openai: { study: 'gpt-a' } } }
    const after = { aiModels: { openai: { study: 'gpt-a', [jobKey('fight.taunt')]: 'gpt-mini' } } }
    const d = diffConfig(flattenConfig(before), flattenConfig(after), after)
    expect(d.body).toEqual({ aiModels: { openai: { [jobKey('fight.taunt')]: 'gpt-mini' } } })
    const disk = { aiModels: { openai: { study: 'gpt-a', chat: 'other-computer' } } }
    const merged = mergeConfigPatch(disk, d.body)
    expect(merged.aiModels.openai).toEqual({ study: 'gpt-a', chat: 'other-computer', [jobKey('fight.taunt')]: 'gpt-mini' })
    const cleared = { aiModels: { openai: withoutJobOverrides(after.aiModels.openai) } }
    const d2 = diffConfig(flattenConfig(after), flattenConfig(cleared), cleared)
    expect(d2.body.__unset).toEqual([['aiModels', 'openai', jobKey('fight.taunt')]])
    expect(mergeConfigPatch(merged, d2.body).aiModels.openai).toEqual({ study: 'gpt-a', chat: 'other-computer' })
  })
  it('reads job picks apart from role picks', () => {
    expect(jobOverridesOf({ study: 'x', [jobKey('study.grade')]: 'y', [jobKey('study.hint')]: '' })).toEqual({ 'study.grade': 'y' })
  })
})

describe('heal tier', () => {
  it('a pinned job model heals at its parent role tier, never the strongest', () => {
    expect(roleOfOverrideKey(jobKey('fight.taunt'))).toBe('help')
    expect(pinnedTierFor([jobKey('fight.taunt')], ROLE_TIER)).toBe(ROLE_TIER.help)
    expect(pinnedTierFor([jobKey('legends.area')], ROLE_TIER)).toBe(ROLE_TIER.deck)
    expect(pinnedTierFor(['pose'], ROLE_TIER)).toBe(ROLE_TIER.pose)
    expect(pinnedTierFor([jobKey('speech.stt'), jobKey('mascot.pose')], ROLE_TIER)).toBe(ROLE_TIER.pose)
    expect(pinnedTierFor([jobKey('unknown.job')], ROLE_TIER)).toBeNull()
    expect(APP).toMatch(/pinnedTierFor\(pinnedRoles, ROLE_TIER\)/)
  })
})

// ─── Every AI call names its job ──────────────────────────────────────────────────────────────────────────────────
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name)
  if (e.isDirectory()) return walk(p)
  return /\.(jsx?|mjs)$/.test(e.name) && !/\.test\./.test(e.name) ? [p] : []
})
const FEATURE_FILES = walk(path.join(SRC, 'features'))

describe('every AI call passes a job', () => {
  it('App.jsx: each aiCall picks its model with resolveJobModel (the Model Advisor and the funnel itself excepted)', () => {
    const lines = APP.split('\n')
    const bad = []
    lines.forEach((line, i) => {
      if (!/\baiCall\(/.test(line) || /const aiCall = /.test(line)) return
      // The call's text: up to the next call or 25 lines.
      const chunk = []
      for (let k = i; k < Math.min(lines.length, i + 25); k++) { if (k > i && /\baiCall\(/.test(lines[k])) break; chunk.push(lines[k]) }
      const text = chunk.join('\n')
      if (/resolveJobModel\(|listModel|\badvisor\b/.test(text)) return
      bad.push(`${i + 1}: ${line.trim().slice(0, 90)}`)
    })
    expect(bad).toEqual([])
    // No call site picks a bare role any more (aiCall's own fallback and the feature ctx's role fallback excepted).
    const bare = [...APP.matchAll(/resolveModel(?:Fast)?\('(\w+)'\)/g)].map((m) => m[0])
    expect(bare).toEqual(["resolveModel('general')"])
  })
  it('features: every ctx.ai.call passes a job', () => {
    const bad = []
    for (const f of FEATURE_FILES) {
      fs.readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
        if (/\bai\.call\(/.test(line) && !/\bjob:/.test(line)) bad.push(`${path.relative(SRC, f)}:${i + 1}`)
      })
    }
    expect(bad).toEqual([])
  })
  it('every job id named in the source exists, and every job is used', () => {
    const files = [path.join(SRC, 'App.jsx'), ...FEATURE_FILES, path.join(SRC, 'speech', 'index.js')]
    const named = new Set()
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8')
      for (const m of src.matchAll(/resolveJobModel\('([^']+)'/g)) named.add(m[1])
      // *_JOB = '...', *_JOBS = { k: '...' }, JOB = { k: '...' } in feature files
      for (const m of src.matchAll(/\b[A-Z_]*JOBS?\s*=\s*(\{[^}]*\}|'[^']+')/g)) for (const q of m[1].matchAll(/'([a-z]+\.[a-zA-Z]+)'/g)) named.add(q[1])
    }
    named.add('speech.stt'); named.add('speech.tts') // read through ctx.speechModel(kind, engine)
    expect([...named].filter((id) => !JOB_BY_ID[id])).toEqual([])
    expect(AI_JOBS.map((j) => j.id).filter((id) => !named.has(id))).toEqual([])
  })
})

describe('chat model lists leave out speech, image and live models', () => {
  it('keeps chat models and drops the rest', () => {
    const ids = ['gemini-2.5-flash', 'gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-image', 'gemini-2.0-flash-live-001', 'gemini-live-2.5-flash-preview',
      'gemini-2.5-flash-native-audio-dialog', 'gemini-robotics-er-1.5-preview', 'gemini-2.5-computer-use-preview-10-2025', 'gemini-2.5-flash-lite',
      'gpt-4o-mini', 'gpt-4o-mini-tts', 'gpt-4o-transcribe', 'o4-mini', 'claude-opus-5', 'grok-4', 'grok-2-image-1212']
    expect(chatModelsOnly(ids)).toEqual(['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gpt-4o-mini', 'o4-mini', 'claude-opus-5', 'grok-4'])
  })
  it('is safe on junk', () => {
    expect(chatModelsOnly(null)).toEqual([])
    expect(isChatModelId('')).toBe(false)
    expect(isChatModelId(42)).toBe(false)
    expect(isChatModelId('olive-1')).toBe(true) // "live" only as its own word
  })
})
