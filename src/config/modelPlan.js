// THE MODEL PLAN IN PLAIN WORDS (Settings > AI & cost, "Ebi's models"). Pure and platform-neutral (modelPlan.test.js).
//
// The owner (2026-11-15): "make sure it's configurable in the AI settings and make it obvious what each one is for".
// About 60 AI jobs (aiJobs.js) are grouped into a few TASKS a learner understands ("Checking your answers"), each
// shown with the model it runs on now, its level, why, and an honest cost per use. Plan: docs/plans/2026-11-15-model-plan-settings.md.

import { AI_JOBS, chatModelsOnly } from './aiJobs'
import { parseModelId, compareModels, pickUpgrade, freshenPlanId } from './modelVersions'

// Every chat job sits in exactly ONE task (tested). Speech jobs stay in the advanced list (they are engine models).
// `typical` = the input and output tokens of one use, used only until the learner has 5 measured uses of the task.
export const TASKS = [
  { id: 'talk', role: 'chat', typical: [3000, 250], jobs: ['chat.reply', 'help.reply', 'modes.studio', 'practice.ebiCall', 'practice.roleplay', 'legends.talk', 'study.feedbackChat'] },
  { id: 'explain', role: 'study', typical: [1500, 300], jobs: ['study.learnIt', 'practice.learnIt', 'study.hooks', 'study.lookup', 'fight.explain', 'study.insights'] },
  { id: 'grade', role: 'study', typical: [1200, 150], jobs: ['study.grade', 'fight.grade', 'fight.recheck', 'practice.grade', 'legends.talkScore', 'practice.roleplayScore'] },
  { id: 'questions', role: 'study', typical: [2000, 400], jobs: ['study.questions', 'study.choices', 'study.hint', 'study.fix', 'study.pbq', 'study.conjugation', 'raid.questions', 'legends.quiz', 'legends.placement', 'legends.scene', 'practice.mistakeGym', 'practice.listenSpeak', 'practice.scenes'] },
  { id: 'review', role: 'qcheck', typical: [1500, 200], jobs: ['study.review', 'raid.check', 'legends.check', 'study.pbqCheck'] },
  { id: 'factcheck', role: 'qcheck', typical: [1500, 120], jobs: ['factcheck.reply'] },
  { id: 'cards', role: 'deck', typical: [2500, 900], jobs: ['deck.generate', 'deck.verify', 'deck.refine', 'deck.bulkEdit', 'deck.bulkVerify', 'deck.duplicates', 'deck.ruleCard', 'deck.leechDoctor', 'legends.area'] },
  { id: 'pictures', role: 'picture', typical: [2500, 800], vision: true, jobs: ['picture.scan', 'picture.wordList', 'picture.translate', 'picture.enrich', 'picture.explain', 'picture.wordStudy', 'picture.chat', 'picture.conjugation'] },
  { id: 'setup', role: 'general', typical: [3000, 1000], jobs: ['modes.create', 'modes.edit', 'modes.knowledgePick', 'legends.plan', 'legends.edit', 'learner.level', 'practice.roleplaySetup', 'chat.suggest', 'discover.profile', 'discover.suggest', 'discover.verify', 'discover.kinds'] },
  { id: 'helpers', role: 'pose', typical: [600, 40], jobs: ['mascot.pose', 'study.glosses', 'study.usageTags', 'fight.taunt', 'legends.bossName', 'legends.hint'] },
]
export const TASK_BY_ID = Object.fromEntries(TASKS.map((t) => [t.id, t]))
export const taskOfJob = (jobId) => TASKS.find((t) => t.jobs.includes(jobId)) || null
// Chat jobs not in any task (a new job added to aiJobs.js without a task): the test fails on them.
export const jobsWithoutTask = () => AI_JOBS.filter((j) => !j.speech && !taskOfJob(j.id)).map((j) => j.id)

// Each role's tier under the Optimized preset (stakes x frequency; the table in CLAUDE.md "AI providers"). App reads it.
export const ROLE_TIER = { pose: 'cheap', help: 'cheap', discover: 'cheap', chat: 'normal', picture: 'normal', study: 'normal', qcheck: 'normal', general: 'normal', deck: 'max' }

// The models a task really runs on: its jobs grouped by the model each resolves to, the model with the most jobs
// first. `resolve(jobId)` = the app's resolution. A task can mix (Help runs on the help role inside "Talking with Ebi").
export function taskModels(task, resolve) {
  const by = new Map()
  for (const j of task.jobs) { const m = resolve(j) || ''; by.set(m, [...(by.get(m) || []), j]) }
  return [...by.entries()].map(([model, jobs]) => ({ model, jobs })).sort((a, b) => b.jobs.length - a.jobs.length || (a.jobs[0] === task.jobs[0] ? -1 : 1))
}

// What a task runs on as ONE comparable value: every model, most used first ("a + b"). "What changed" compares these, so
// a task whose second model moved is listed too.
export const taskSignature = (groups) => groups.map((g) => g.model).filter(Boolean).join(' + ')

// Picker options: chat models, one per visible NAME (a dated snapshot beside its alias read as the same model twice at
// two prices), prerelease builds left out; `keep` (the current and recommended models) always stays.
const PRERELEASE_ID = /(preview|experimental|nightly|alpha|beta|latest|-exp\b|\bexp-)/i
export function pickerModels(ids, keep = []) {
  const out = new Map()
  for (const id of chatModelsOnly(ids || [])) {
    if ((PRERELEASE_ID.test(id) || NOT_FOR_TASKS.test(id)) && !keep.includes(id)) continue
    const name = modelName(id)
    const cur = out.get(name)
    if (!cur || keep.includes(id) || (!keep.includes(cur) && id.length < cur.length)) out.set(name, id)
  }
  for (const k of keep) if (k && ![...out.values()].includes(k)) out.set(`${modelName(k)} ${k}`, k)
  return [...out.values()]
}

// Measured uses before a cost per use is "measured" instead of "typical".
export const MEASURED_MIN_USES = 5
// The automatic re-plan runs at most once a day.
export const AUTO_REPLAN_INTERVAL_MS = 24 * 60 * 60 * 1000

// The role defaults (moved from App.jsx ROLE_DEFAULTS): the tier presets, then a decided plan over them. A plan id is
// brought up to a newer preset of the same family (freshenPlanId); presets and plans are APP choices. A hand pick never
// passes through here (resolveRoleModel returns it first).
export function roleDefaults({ intel = 'normal', presetModel, plan, roleTier = {} }) {
  const tier = (t) => (presetModel ? presetModel(t) : '') || ''
  const normal = tier('normal')
  const base = {}
  if (intel === 'optimized') {
    for (const role of Object.keys(roleTier)) base[role] = tier(roleTier[role])
  } else {
    const m = tier(intel)
    for (const role of Object.keys(roleTier)) base[role] = role === 'pose' ? normal : m
  }
  if (plan && typeof plan === 'object') {
    const presetIds = ['cheap', 'normal', 'max'].map(tier).filter(Boolean)
    for (const role of Object.keys(base)) {
      const id = plan[role]
      if (typeof id === 'string' && id.trim()) base[role] = freshenPlanId(id, presetIds)
    }
  }
  return base
}

// The model a ROLE runs on: the owner's own pick EXACTLY as set (never freshened, never replanned), else the default.
export function resolveRoleModel(role, { overrides = {}, defaults = {} } = {}) {
  const own = overrides && typeof overrides[role] === 'string' && overrides[role].trim()
  return own || defaults[role] || ''
}

// Basic / Standard / Best for a model: its preset tier when it is one, else the tier of the preset in its family,
// else the task's role tier. Words, never "cheap" (it read as low quality to a newcomer).
export const LEVEL_WORD = { cheap: 'basic', normal: 'standard', max: 'best' }
// A model's level: its preset tier, else the tier of a preset of the same family that it is at least as new as. Any
// other model has NO level (null): a guessed "Standard" put the most expensive model in a middle tier, and a loose
// family match called an old GPT 4 "Best" beside a newer max preset.
export function levelOf(modelId, { presetModel, fallbackTier = null } = {}) {
  const tiers = ['max', 'normal', 'cheap']
  const ids = Object.fromEntries(tiers.map((t) => [t, (presetModel && presetModel(t)) || '']))
  for (const t of tiers) if (ids[t] && ids[t] === modelId) return t
  const p = parseModelId(modelId)
  if (p) for (const t of tiers) { const q = parseModelId(ids[t]); if (q && q.family === p.family && compareModels(p, q) >= 0) return t }
  return fallbackTier
}

// Models known to take no images, or not meant for a conversation (coding agents, search, computer use): never offered
// for a task that sends photos (Pictures, Talking with Ebi). By name, for every provider; a provider's own list adds more.
const TEXT_ONLY_ID = /^gpt-3\.5|^gpt-4(-\d{4})?$|^gpt-4-32k|^o1-mini|^o3-mini|codex|search|computer-use|^grok-3-mini|^grok-code/i
export const likelyTextOnly = (id) => typeof id === 'string' && TEXT_ONLY_ID.test(id.replace(/^models\//, ''))
// Not a chat partner at all (offered for no task): coding agents and computer-use models.
// "-pro" models are the slow, costly research tier (Responses only): never offered for a task, kept when picked.
const NOT_FOR_TASKS = /codex|computer-use|^grok-code|-pro(-\d{4}-\d\d-\d\d)?$/i

// A model id as a NAME: "claude-haiku-5-5" → "Claude Haiku 5.5", "gpt-4o-mini" → "GPT 4o Mini",
// "gemini-3.8-flash" → "Gemini 3.8 Flash". Dates and the "models/" prefix go. The id stays in the tip.
const UPPER = new Set(['gpt', 'ai'])
export function modelName(id) {
  if (typeof id !== 'string' || !id.trim()) return ''
  if (id === 'auto') return id
  // Date pieces go: "20251001", an xAI "0709", an OpenAI "2024" "11" "20" (a two-digit version segment is not used by
  // any provider; versions are single digits or dotted).
  const segs = id.trim().replace(/^models\//, '').split('-').filter((s) => !/^(\d{8}|\d{4}|\d{2})$/.test(s))
  const out = []
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    if (/^\d+$/.test(s) && out.length && /^\d+(\.\d+)*$/.test(out[out.length - 1])) { out[out.length - 1] += '.' + s; continue }
    out.push(s)
  }
  return out.map((s) => (UPPER.has(s.toLowerCase()) ? s.toUpperCase() : /^[a-z]/.test(s) ? s[0].toUpperCase() + s.slice(1) : s)).join(' ')
}

// Cost of ONE use of a task. `usage` = the learner's measured totals for the task on this model ({ input, output,
// calls }), `price` = [input, output] USD per million or null. Never a guessed price.
export function costPerUse({ usage, typical = [0, 0], price }) {
  const calls = Number(usage?.calls) || 0
  const measured = calls >= MEASURED_MIN_USES
  const inTok = measured ? (Number(usage.input) || 0) / calls : typical[0]
  const outTok = measured ? (Number(usage.output) || 0) / calls : typical[1]
  const source = measured ? 'measured' : 'typical'
  if (!Array.isArray(price) || price.length !== 2) return { usd: null, source, calls, input: inTok, output: outTok }
  return { usd: inTok / 1e6 * price[0] + outTok / 1e6 * price[1], source, calls, input: inTok, output: outTok }
}

// Everyday money words. Under a tenth of a cent: "about 1 cent per 40 uses" (n at least 10, so rounding stays honest);
// a tenth of a cent to a cent: a decimal ("about 0.7 cents per use"; "1 cent per 2 uses" read 30% low); else whole cents.
export function costWords(usd) {
  if (usd == null || !Number.isFinite(usd)) return { kind: 'unknown' }
  if (usd <= 0) return { kind: 'free' }
  if (usd < 0.001) return { kind: 'perCent', n: Math.round(0.01 / usd) }
  if (usd < 0.0095) return { kind: 'fraction', x: (Math.round(usd * 1000) / 10).toFixed(1) }
  return { kind: 'cents', n: Math.round(usd * 100) }
}

// Chat models the plan never saw (the trigger for the automatic re-plan). A failed list is [] (never "new").
export function unseenChatModels(entry, liveIds) {
  const known = new Set(entry?.knownModels || [])
  return chatModelsOnly(liveIds || []).filter((id) => !known.has(id))
}

// The plan's state for the status line. `liveIds` null = the list could not be read.
//   never   : no plan for this provider and preset (the presets apply)
//   unknown : the list could not be read (never shown as "up to date")
//   newer     : a model newer than what the plan RUNS on is listed (what runs = the plan id lifted by freshenPlanId)
//   freshened : nothing newer, but the plan was made before the models it runs on (Ebi already moved it up; an Update
//               would re-choose per task with today's models)
//   current   : nothing newer known
// Judged on what RUNS: "newer models came out" beside rows already on the newest family told the user to update to
// what they had.
export function planStatus({ entry, liveIds, presetIds = [] }) {
  const plan = entry?.plan && typeof entry.plan === 'object' ? entry.plan : null
  const decidedAt = Number(entry?.decidedAt) || null
  if (!plan || !Object.keys(plan).length) return { state: 'never', decidedAt: null, newer: [] }
  const chat = Array.isArray(liveIds) ? chatModelsOnly(liveIds) : null
  const newer = []
  let lifted = false
  for (const id of new Set(Object.values(plan).filter((x) => typeof x === 'string'))) {
    const runs = freshenPlanId(id, presetIds)
    if (runs !== id) lifted = true
    const up = chat && pickUpgrade(runs, chat)
    if (up) newer.push({ from: runs, to: up })
  }
  if (newer.length) return { state: 'newer', decidedAt, newer }
  if (lifted) return { state: 'freshened', decidedAt, newer: [] }
  if (!chat) return { state: 'unknown', decidedAt, newer: [] }
  return { state: 'current', decidedAt, newer: [] }
}

// Should the background re-plan run now?
export function autoReplanDue({ now = Date.now(), lastAutoAt = 0, unseen = [], onboarded = true, overlay = false, fixedModels = false, frozen = false, hasKey = true } = {}) {
  if (!hasKey || !onboarded || overlay || fixedModels || frozen) return false
  if (!unseen.length) return false
  return !(lastAutoAt && now - lastAutoAt < AUTO_REPLAN_INTERVAL_MS)
}

// What changed between two { taskId: modelId } maps, in TASKS order. `kept` = tasks the owner picked by hand.
export function planDiff(before = {}, after = {}, kept = []) {
  const out = []
  for (const t of TASKS) {
    if (kept.includes(t.id)) continue
    const a = before[t.id] || '', b = after[t.id] || ''
    if (a !== b) out.push({ task: t.id, from: a, to: b })
  }
  return out
}

// Keep the newer of two plan entries (two computers on one shared folder): the one decided LATER wins.
export function newerPlanEntry(a, b) {
  const ta = Number(a?.decidedAt) || 0, tb = Number(b?.decidedAt) || 0
  return tb > ta ? b : a
}

// Sort helper: is model a strictly newer version of model b in the same family?
export const isNewerSameFamily = (a, b) => {
  const pa = parseModelId(a), pb = parseModelId(b)
  return !!(pa && pb && pa.family === pb.family && compareModels(pa, pb) > 0)
}
