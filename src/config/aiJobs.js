// AI JOBS: every distinct thing Ebiki asks a model to do, so each one can run on its own model (Settings > AI & cost >
// "Models per job"). Pure and platform-neutral (tested in aiJobs.test.js).
//
// A job belongs to a parent ROLE (App.jsx ROLE_TIER / AI_ROLE_META). Until the user picks a model for the job, it
// runs exactly as its role does (the role override, the Model Advisor plan, the preset), so adding a job changes
// nothing for anyone. A job override is stored in the SAME per-provider map as role overrides
// (`aiModels[provider]['job:<id>']`), so config diffs, heals and the shared config treat it like a role override.
//
// Fields:
//   id      unique, '<area>.<job>' (letters only after the dot)
//   role    the parent role it inherits from (null for speech jobs: they are not chat models)
//   group   the Settings group it is listed under (JOB_GROUPS)
//   base    how the inherited default is chosen: 'role' (resolveModel), 'fast' (resolveModelFast: latency-sensitive
//           read/translate work keeps the fast normal preset), 'cheap' (the role override, else the cheap preset)
//   vision  the job sends images (a text-only pick fails it; Settings says so)
//   speech  'stt' | 'tts' for speech jobs; `providers` = the engines whose model can be chosen
//
// Adding a job: one entry here, `aiJob_<id with _>` + `aiJobHint_<id with _>` in all four locales, then pass it:
// App.jsx `resolveJobModel('<id>')`, a feature `ctx.ai.call(system, user, { job: '<id>' })`.

export const JOB_GROUPS = ['study', 'fights', 'legends', 'practice', 'chat', 'help', 'picture', 'deck', 'discover', 'modes', 'mascot', 'speech']

const j = (id, role, group, extra = {}) => ({ id, role, group, base: 'role', ...extra })

export const AI_JOBS = [
  // Study
  j('study.questions', 'study', 'study'),
  j('study.review', 'qcheck', 'study'),
  j('study.choices', 'study', 'study'),
  j('study.grade', 'study', 'study'),
  j('study.hint', 'study', 'study'),
  j('study.fix', 'study', 'study'),
  j('study.lookup', 'study', 'study'),
  j('study.usageTags', 'study', 'study'),
  j('study.glosses', 'study', 'study'),
  j('study.hooks', 'study', 'study'),
  j('study.learnIt', 'study', 'study'),
  j('study.pbq', 'study', 'study'),
  j('study.pbqCheck', 'study', 'study'),
  j('study.conjugation', 'study', 'study'),
  j('study.insights', 'study', 'study'),
  j('study.feedbackChat', 'study', 'study'),
  // Raids and fights (raids, bosses, Legendary)
  j('raid.questions', 'study', 'fights'),
  j('raid.check', 'qcheck', 'fights'),
  j('fight.grade', 'study', 'fights'),
  j('fight.explain', 'study', 'fights'),
  j('fight.recheck', 'study', 'fights'),
  j('fight.taunt', 'help', 'fights'),
  // Legends map
  j('legends.plan', 'general', 'legends'),
  j('legends.area', 'deck', 'legends'),
  j('legends.bossName', 'help', 'legends'),
  j('legends.quiz', 'study', 'legends'),
  j('legends.check', 'qcheck', 'legends'),
  j('legends.placement', 'study', 'legends'),
  j('legends.scene', 'study', 'legends'),
  j('legends.talk', 'chat', 'legends'),
  j('legends.hint', 'help', 'legends'),
  j('legends.talkScore', 'study', 'legends'),
  j('legends.edit', 'general', 'legends'),
  // Practice activities
  j('practice.grade', 'study', 'practice'),
  j('practice.learnIt', 'study', 'practice'),
  j('practice.mistakeGym', 'study', 'practice'),
  j('practice.listenSpeak', 'study', 'practice'),
  j('practice.scenes', 'study', 'practice'),
  j('practice.ebiCall', 'chat', 'practice'),
  j('practice.roleplay', 'chat', 'practice'),
  j('practice.roleplaySetup', 'general', 'practice', { vision: true }),
  j('practice.roleplayScore', 'general', 'practice'),
  j('learner.level', 'general', 'practice'),
  // Chat
  j('chat.reply', 'chat', 'chat', { vision: true }),
  j('chat.suggest', 'general', 'chat'),
  // Help
  j('help.reply', 'help', 'help'),
  // Picture
  j('picture.scan', 'picture', 'picture', { base: 'fast', vision: true }),
  j('picture.wordList', 'picture', 'picture', { base: 'cheap' }),
  j('picture.translate', 'picture', 'picture'),
  j('picture.enrich', 'picture', 'picture', { base: 'fast' }),
  j('picture.explain', 'picture', 'picture'),
  j('picture.wordStudy', 'picture', 'picture'),
  j('picture.conjugation', 'picture', 'picture'),
  j('picture.chat', 'picture', 'picture'),
  // Deck tools
  j('deck.generate', 'deck', 'deck'),
  j('deck.verify', 'deck', 'deck'),
  j('deck.refine', 'deck', 'deck'),
  j('deck.bulkEdit', 'deck', 'deck'),
  j('deck.bulkVerify', 'deck', 'deck'),
  j('deck.duplicates', 'deck', 'deck'),
  j('deck.ruleCard', 'deck', 'deck'),
  j('deck.leechDoctor', 'deck', 'deck'),
  // Discover
  j('discover.profile', 'discover', 'discover'),
  j('discover.suggest', 'discover', 'discover'),
  j('discover.verify', 'discover', 'discover'),
  j('discover.kinds', 'discover', 'discover'),
  // Modes and knowledge
  j('modes.create', 'general', 'modes'),
  j('modes.edit', 'general', 'modes'),
  j('modes.studio', 'chat', 'modes'),
  j('modes.knowledgePick', 'general', 'modes'),
  // Mascot
  j('mascot.pose', 'pose', 'mascot'),
  // Speech (not chat models: per engine provider; default = the engine's built-in model)
  j('speech.stt', null, 'speech', { speech: 'stt', providers: ['openai', 'grok', 'gemini'] }),
  j('speech.tts', null, 'speech', { speech: 'tts', providers: ['openai', 'gemini'] }),
]

export const JOB_BY_ID = Object.fromEntries(AI_JOBS.map((x) => [x.id, x]))
export const JOB_KEY_PREFIX = 'job:'
export const jobKey = (id) => JOB_KEY_PREFIX + id
export const isJobKey = (k) => typeof k === 'string' && k.startsWith(JOB_KEY_PREFIX)
const keyPart = (id) => String(id).replace(/\./g, '_')
export const jobLabelKey = (id) => `aiJob_${keyPart(id)}`
export const jobHintKey = (id) => `aiJobHint_${keyPart(id)}`
export const jobGroupKey = (group) => `aiJobGroup_${group}`

// The ROLE an override key belongs to: a role key is itself, a job key its parent role (null when unknown or speech).
export const roleOfOverrideKey = (k) => (isJobKey(k) ? JOB_BY_ID[k.slice(JOB_KEY_PREFIX.length)]?.role || null : k)

// Jobs shown for a provider: every chat-model job, plus speech jobs whose engine is this provider.
export const jobsForProvider = (prov) => AI_JOBS.filter((x) => !x.speech || (x.providers || []).includes(prov))

// The job's own override (a non-empty string), else ''.
export const jobOverride = (overrides, id) => {
  const v = overrides && overrides[jobKey(id)]
  return typeof v === 'string' && v.trim() ? v.trim() : ''
}

// The model a CHAT job runs on: its override, else what its parent role gives (by `base`). `resolveRole(role)` and
// `resolveRoleFast(role)` are App's resolveModel / resolveModelFast, `cheap` the provider's cheap preset.
// An unknown job id resolves `fallbackRole` (a caller's role), so a typo never breaks a call.
export function resolveJob(id, { overrides = {}, resolveRole, resolveRoleFast, cheap, fallbackRole = 'general' } = {}) {
  const job = JOB_BY_ID[id]
  if (!job || job.speech) return resolveRole(job?.role || fallbackRole)
  const own = jobOverride(overrides, id)
  if (own) return own
  if (job.base === 'fast') return (resolveRoleFast || resolveRole)(job.role)
  if (job.base === 'cheap') {
    const roleOwn = overrides && typeof overrides[job.role] === 'string' && overrides[job.role].trim()
    return roleOwn || cheap || (resolveRoleFast || resolveRole)(job.role)
  }
  return resolveRole(job.role)
}

// Speech: the engine's built-in model (`builtIn` = src/speech MODELS; Gemini STT = its cheap text preset).
export function speechJobModel(kind, engine, { overrides = {}, builtIn = {}, cheap = '' } = {}) {
  const own = jobOverride(overrides, `speech.${kind}`)
  if (own) return own
  return builtIn?.[kind]?.[engine] || (kind === 'stt' && engine === 'gemini' ? cheap : '') || ''
}

// Every job override set for a provider: { [jobId]: model }.
export const jobOverridesOf = (overrides) => Object.fromEntries(
  Object.entries(overrides || {}).filter(([k, v]) => isJobKey(k) && typeof v === 'string' && v.trim()).map(([k, v]) => [k.slice(JOB_KEY_PREFIX.length), v.trim()]),
)

// Drop every job override from one provider's map (role overrides stay).
export const withoutJobOverrides = (overrides) => Object.fromEntries(Object.entries(overrides || {}).filter(([k]) => !isJobKey(k)))

// Settings search: a job matches when its id, label, hint, group or parent role label contains every word typed.
export function jobMatches(job, query, text = {}) {
  const words = String(query || '').toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return true
  const hay = [job.id, job.role || '', job.group, text.label || '', text.hint || '', text.group || '', text.role || ''].join(' ').toLowerCase()
  return words.every((w) => hay.includes(w))
}

// The tier a PINNED model heals at (App.jsx healRetiredModel): the first override key holding the dead model that
// maps to a role with a tier. A job pick heals at its parent role's tier, never the strongest one.
export const pinnedTierFor = (keys, roleTier = {}) => (keys || []).map((k) => roleTier[roleOfOverrideKey(k)]).find(Boolean) || null
