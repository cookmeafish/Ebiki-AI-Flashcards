// Legends generation steps (the AI calls behind the map), each saving through the store with the mode id pinned
// when it started. Portable: AI comes in through ctx.ai, storage through ./store.js. One run per task at a time
// (a remount or a double click must not pay twice).
import { learnerLevelLine } from '../kit/learnerStore'
import {
  createMap, parseMapPlan, parseAreaDetail, applyAreaDetail, needsDetail, appendAreas, needsMoreAreas, areaIndex,
  adaptiveSplit, parseMapEdit, mergeEdit, setBossName, weakItems, AREAS, LOOKAHEAD,
} from './map'
import {
  buildMapPrompt, buildAreaPrompt, buildQuizPrompt, buildMapEditPrompt, buildPlacementPrompt,
  parseQuestions, fitQuestionsToKind, itemIdFor, buildBossNamePrompt, parseBossName, buildQuizCheckPrompt, parseQuizCheck, ROLE, MAX_TOKENS, QUIZ_SIZE, QUIZ_PER_ITEM_MAX,
} from './prompt'
import { updateMap, peekMap, readStep, readStepAny, saveStep, stepSig } from './store'

export const KNOWLEDGE_CAP = { plan: 4000, area: 3000, quiz: 2500 }
const running = new Map() // task key -> promise

function once(key, fn) {
  if (running.has(key)) return running.get(key)
  const p = Promise.resolve().then(fn).finally(() => { if (running.get(key) === p) running.delete(key) })
  running.set(key, p)
  return p
}
export const isRunning = (prefix) => [...running.keys()].some((k) => k.startsWith(prefix))
// Start over: tasks still running for the old map are forgotten (a new map's plan got the old map's promise back).
export const forgetRunning = (suffix) => { for (const k of [...running.keys()]) if (k.endsWith(suffix)) running.delete(k) }

const call = async (ctx, { system, user }, role, maxTokens) => ctx.ai.call(system, user, { role, maxTokens })
const levelText = async (ctx) => learnerLevelLine(ctx)

// Plan the map's areas (first time, or more once the learner nears the end). Throws with a readable message.
export function planMap(ctx, modeId, { more = false } = {}) {
  return once(`plan:${modeId}`, async () => {
    const { subject, ai, t } = ctx
    const current = peekMap(modeId)
    const startedOn = current?.createdAt // the map this plan is FOR: a Start over meanwhile makes it another map
    const level = await levelText(ctx)
    const after = more ? (current?.areas || []).map((a) => a.title) : []
    const raw = await call(ctx, buildMapPrompt(subject, { start: current?.start, level, knowledge: subject.knowledge(KNOWLEDGE_CAP.plan), after }), ROLE.plan, MAX_TOKENS.plan)
    const plan = parseMapPlan(ai.json(raw), ai.clean)
    if (!plan) throw new Error(t('lg_errPlan'))
    let dropped = false
    const saved = await updateMap(modeId, (m) => {
      // Start over while this plan was being written: the map is gone (or a new one was started). A plan for the
      // old map never lands (it rebuilt a map with no questionnaire, or gave the new map the old one's next areas).
      if (!m || (startedOn != null && m.createdAt !== startedOn) || (more && !m.areas.length)) { dropped = true; return m }
      if (!m.areas.length) return createMap({ modeId, subject, start: m.start, plan }, m.createdAt)
      return more ? appendAreas(m, plan) : m
    })
    if (dropped) return saved
    if (!saved) throw new Error(t('lg_errSave'))
    return saved
  })
}

// Fill the next areas' items and steps (lazy: only LOOKAHEAD areas ahead of the learner are detailed).
// Write one area's lessons and steps (refused by applyAreaDetail for a started or already detailed area).
async function detailOne(ctx, modeId, areaId) {
  const { subject, ai, t } = ctx
  const map = peekMap(modeId)
  const i = map ? areaIndex(map, areaId) : -1
  if (i < 0) return
  const area = map.areas[i]
  const raw = await call(ctx, buildAreaPrompt(subject, area, {
    level: await levelText(ctx), knowledge: subject.knowledge(KNOWLEDGE_CAP.area),
    before: map.areas.slice(Math.max(0, i - 4), i).map((a) => a.title), later: map.areas.slice(i + 1, i + 4).map((a) => a.title),
  }), ROLE.area, MAX_TOKENS.area)
  const detail = parseAreaDetail(ai.json(raw), ai.clean, { areaId })
  if (!detail) throw new Error(t('lg_errArea', { area: area.title }))
  // Lands only on the area it was written for: "Change my map" can give the same id a new topic meanwhile.
  const sameTopic = (m) => { const a = m?.areas?.find((x) => x.id === areaId); return !!a && a.title === area.title && a.theme === area.theme }
  const saved = await updateMap(modeId, (m) => (m && sameTopic(m) ? applyAreaDetail(m, areaId, detail) : m))
  if (!saved) throw new Error(t('lg_errSave'))
}

// The boss's name for an area detailed before bosses had names: made once, saved on the map. '' on any failure
// (the intro then says "the guardian of <area>").
export function ensureBossName(ctx, modeId, areaId) {
  return once(`bossname:${modeId}:${areaId}`, async () => {
    const area = peekMap(modeId)?.areas?.find((a) => a.id === areaId)
    if (!area) return ''
    if (area.bossName) return area.bossName
    try {
      const name = parseBossName(ctx.ai.json(await call(ctx, buildBossNamePrompt(ctx.subject, area), ROLE.bossName, MAX_TOKENS.bossName)), ctx.ai.clean)
      if (name) await updateMap(modeId, (m) => (m ? setBossName(m, areaId, name) : m))
      return name
    } catch { return '' }
  })
}

export function detailAreas(ctx, modeId) {
  return once(`detail:${modeId}`, async () => {
    for (let guard = 0; guard < LOOKAHEAD + 1; guard++) {
      const map = peekMap(modeId)
      const todo = map ? needsDetail(map) : []
      if (!todo.length) return map
      await detailOne(ctx, modeId, todo[0])
    }
    return peekMap(modeId)
  })
}

// Cheat mode: detail this area now, wherever it is on the map.
export function detailAreaNow(ctx, modeId, areaId) {
  return once(`detail-one:${modeId}:${areaId}`, () => detailOne(ctx, modeId, areaId))
}

// More areas once the learner reaches the last planned one.
export async function extendIfNeeded(ctx, modeId) {
  const map = peekMap(modeId)
  if (map && needsMoreAreas(map) && map.areas.length < AREAS.max * 2) await planMap(ctx, modeId, { more: true })
}

// Questions for a step (learn, practice, rule, boss), adapted to how well each item is known.
// A quiz with fewer on-topic questions than this (or two per item, if less) is asked again, more strictly.
const QUIZ_MIN_KEPT = 4
// Bump when the review pass changes: saved sets checked by an older one are reviewed again once.
export const QUIZ_CHECK_VERSION = 1
// A set the review cut below this share of its size is topped up once with new questions (a boss of 14 came back
// with 8 after the review, and nothing refilled it).
const QUIZ_TOPUP_BELOW = 0.85
// Each level's quiz also asks about this many items taught by EARLIER levels of the island (spaced review; the
// shakiest first), so an item is met again after its own level.
export const QUIZ_REVIEW_ITEMS = 4
// A fight (boss, Legendary) is written fresh on every attempt, never reused, and never repeats the last attempts'
// questions (kept as `history`, newest last, at most this many).
const FIGHT_HISTORY_MAX = 80
const FRESH_KINDS = new Set(['boss', 'legendary'])
const REVIEW_KINDS = new Set(['learn', 'rule'])

// Questions are made ONCE per step and saved (./store.js saveStep): a later visit or a retry asks the same set again,
// reshuffled. A new set is written knowing every question the area's other steps already asked, so Learn and
// Practice never repeat each other.
export const QUIZ_AVOID_MAX = 40
const normQ = (s) => String(s || '').toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const shuffled = (list) => { const a = [...list]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
// A saved set asked again: new question order, new choice order (the right answer follows its text).
export function reshuffleQuiz(qs) {
  return shuffled(qs).map((q) => {
    if (q.kind !== 'choice' || !Array.isArray(q.choices)) return q
    const order = shuffled(q.choices.map((_, i) => i))
    return { ...q, choices: order.map((i) => q.choices[i]), answerIdx: order.indexOf(q.answerIdx) }
  })
}
// Two sets for the same step as one, the first's questions first, a question already there (same words) never twice.
export function mergeQuestionSets(a, b) {
  const seen = new Set()
  const out = []
  for (const q of [...(a || []), ...(b || [])]) {
    const k = normQ(q?.prompt)
    if (!k || seen.has(k)) continue
    seen.add(k); out.push(q)
  }
  return out
}
const askedIn = (data) => (Array.isArray(data?.questions) ? data.questions : []).map((q) => q?.prompt || q?.question || '').filter(Boolean)

export function makeQuiz(ctx, modeId, area, node, opts = {}) {
  return once(`quiz:${modeId}:${area.id}:${node.id}`, () => makeQuizNow(ctx, modeId, area, node, opts))
}
async function makeQuizNow(ctx, modeId, area, node, { misses = [] } = {}) {
  // A boss that beat the learner comes back with those items (area.nemesis, set by a lost fight).
  const nemesis = node.kind === 'boss' ? (area.nemesis?.itemIds || []).map((id) => area.items.find((it) => it.id === id)?.front).filter(Boolean) : []
  const { subject, ai, t } = ctx
  const weak = node.kind === 'weak'
  const stepItems = weak ? weakItems(area) : node.itemIds.map((id) => area.items.find((it) => it.id === id)).filter(Boolean)
  const sig = stepSig(stepItems)
  const fresh = FRESH_KINDS.has(node.kind)
  const saved = await readStep(modeId, area.id, node.id, fresh ? null : sig)
  const byId = new Map(area.items.map((it) => [it.id, it]))
  const boss = fresh
  const split = boss ? { choice: [], typed: node.itemIds.map((id) => byId.get(id)).filter(Boolean) } : adaptiveSplit(area, stepItems.map((it) => it.id))
  // Spaced review: items earlier levels of this island taught (shakiest first).
  const at = (area.nodes || []).findIndex((n) => n.id === node.id)
  const earlierIds = new Set((area.nodes || []).slice(0, Math.max(0, at)).filter((n) => REVIEW_KINDS.has(n.kind) || n.kind === 'scene' || n.kind === 'practice').flatMap((n) => n.itemIds || []))
  const reviewItems = REVIEW_KINDS.has(node.kind) ? weakItems({ items: area.items.filter((it) => earlierIds.has(it.id) && !stepItems.includes(it)) }, QUIZ_REVIEW_ITEMS) : []
  const taught = [...split.choice, ...split.typed, ...reviewItems]
  const enough = (n) => n >= Math.min(QUIZ_MIN_KEPT, taught.length * 2)
  // The second look: questions with two defensible answers, or about things the step never taught, go.
  // `null` = the review did not run (fail-soft: the caller keeps what it has).
  const review = async (qs) => {
    try {
      const bad = parseQuizCheck(ctx.ai.json(await call(ctx, buildQuizCheckPrompt(subject, taught, qs), ROLE.quizCheck, MAX_TOKENS.quizCheck)), qs.length)
      if (!bad) return null
      return qs.filter((_, i) => !bad.has(i))
    } catch { return null }
  }
  // A set saved before the review existed (it asked "the most natural answer in Texas" on a step that never
  // taught Texas) is reviewed once: what survives is kept, and the gaps are refilled below like a new set's.
  let kept = null
  if (!fresh && saved.value?.questions?.length) {
    const clean = saved.value.questions
    if (saved.value.checked === QUIZ_CHECK_VERSION && enough(clean.length)) return reshuffleQuiz(clean)
    kept = await review(clean)
    if (!kept) { if (enough(clean.length)) return reshuffleQuiz(clean) } else if (!enough(kept.length)) kept = null
  }
  const others = await Promise.all((area.nodes || []).filter((n) => n.id !== node.id).map((n) => readStepAny(modeId, area.id, n.id).catch(() => null)))
  const history = fresh ? (await readStepAny(modeId, area.id, node.id).catch(() => null))?.history || [] : []
  const avoid = [...new Set([...others.flatMap(askedIn), ...history])].slice(-QUIZ_AVOID_MAX)
  const seen = new Set(avoid.map(normQ))
  const opts = {
    choiceItems: split.choice, typedItems: split.typed, reviewItems, count: QUIZ_SIZE[node.kind] || QUIZ_SIZE.practice,
    level: await levelText(ctx), knowledge: subject.knowledge(KNOWLEDGE_CAP.quiz), misses, avoid, nemesis,
  }
  const lang = subject.isLanguage ? subject.learnLangIso : ''
  // Only questions about a taught item stay (their "target" names it), and none the area already asked;
  // too few left = one stricter retry. `reviewed` turns false when any review did not run (failed, cut off): the
  // set is then saved WITHOUT the checked stamp, so its next visit reviews it (stamped, it was never looked at).
  let reviewed = true
  const ask = async (strict, more = {}) => {
    const raw = await call(ctx, buildQuizPrompt(subject, area, node, { ...opts, ...more, strict }), ROLE.quiz, MAX_TOKENS.quiz)
    const qs = fitQuestionsToKind(parseQuestions(ai.json(raw), ai.clean, { speakLang: lang, dual: boss }), node.kind).filter((q) => itemIdFor(q, taught) && !seen.has(normQ(q.prompt)))
    if (!qs.length) return qs // nothing to review (never a paid call on an empty list)
    const checked = await review(qs)
    if (!checked) reviewed = false
    return checked || qs
  }
  for (const q of kept || []) seen.add(normQ(q.prompt))
  let qs = kept || await ask(false)
  // The stricter retry ADDS to what the first ask kept (it replaced them: 3 good questions and a retry of 1 failed the step).
  if (!enough(qs.length)) qs = mergeQuestionSets(qs, await ask(true))
  // Refill what the review (or the filters) took out: new questions for the missing places, never repeats.
  const target = Math.max(2, Math.min(opts.count, taught.length * QUIZ_PER_ITEM_MAX))
  if (qs.length && qs.length < target * QUIZ_TOPUP_BELOW) {
    for (const q of qs) seen.add(normQ(q.prompt))
    const more = await ask(false, { count: target - qs.length, avoid: [...avoid, ...qs.map((q) => q.prompt)].slice(-QUIZ_AVOID_MAX) }).catch(() => [])
    const fresh = []
    for (const q of more) { const k = normQ(q.prompt); if (!seen.has(k)) { seen.add(k); fresh.push(q) } }
    qs = [...qs, ...fresh].slice(0, target)
  }
  if (qs.length < 2) throw new Error(t('lg_errQuiz'))
  if (saved.ok) {
    // A fight keeps only what it asked (so the next attempt is new); every other step keeps its set.
    if (fresh) await saveStep(modeId, area.id, node.id, 'fight', 'quiz', { history: [...history, ...qs.map((q) => q.prompt)].slice(-FIGHT_HISTORY_MAX) })
    else await saveStep(modeId, area.id, node.id, sig, 'quiz', { questions: qs, ...(reviewed ? { checked: QUIZ_CHECK_VERSION } : {}) })
  }
  return kept ? reshuffleQuiz(qs) : qs
}

// A scene step's story and questions, made once and saved like a quiz. `make` builds a new one.
export function sceneFor(modeId, area, node, make) {
  return once(`scene:${modeId}:${area.id}:${node.id}`, async () => {
    const stepItems = node.itemIds.map((id) => area.items.find((it) => it.id === id)).filter(Boolean)
    const sig = stepSig(stepItems)
    const saved = await readStep(modeId, area.id, node.id, sig)
    if (saved.value?.questions?.length) return { ...saved.value, questions: reshuffleQuiz(saved.value.questions) }
    const scene = await make()
    if (scene && saved.ok) await saveStep(modeId, area.id, node.id, sig, 'scene', scene)
    return scene
  })
}

// One batch of placement questions at a tier.
export async function makePlacementBatch(ctx, tier, n, avoid) {
  const { subject, ai, t } = ctx
  const raw = await call(ctx, buildPlacementPrompt(subject, tier, n, { avoid, knowledge: subject.knowledge(KNOWLEDGE_CAP.quiz) }), ROLE.placement, MAX_TOKENS.placement)
  // The prompt asks for no repeats; a model that repeats one anyway (same words) does not get it asked twice.
  const asked = new Set((avoid || []).map(normQ))
  const qs = parseQuestions(ai.json(raw), ai.clean).filter((q) => { const k = normQ(q.prompt); if (!k || asked.has(k)) return false; asked.add(k); return true }).slice(0, n)
  if (!qs.length) throw new Error(t('lg_errQuiz'))
  return qs
}

// Ebi's proposal for a change to the map: { map (the merged preview), changes, note }. Nothing is saved here.
export async function proposeEdit(ctx, modeId, request) {
  const { subject, ai, t } = ctx
  const map = peekMap(modeId)
  if (!map) throw new Error(t('lg_errSave'))
  const raw = await call(ctx, buildMapEditPrompt(subject, map, request), ROLE.edit, MAX_TOKENS.edit)
  const proposal = parseMapEdit(ai.json(raw), ai.clean)
  if (!proposal) throw new Error(t('lg_errEdit'))
  const { map: merged, changes } = mergeEdit(map, proposal)
  return { map: merged, changes, note: proposal.note, base: map.updatedAt, baseIds: (map.areas || []).map((a) => a.id) }
}

// Apply an accepted proposal: re-merged over the LIVE map (a step finished while the learner was reading the
// preview may have frozen another area, which the merge then keeps as it is).
// `baseIds`: the areas the preview was built from. An area that arrived AFTER it (the background planner, another
// computer) was never shown as "removed", so it is kept, not dropped by the merge.
export async function acceptEdit(ctx, modeId, proposalMap, baseIds = null) {
  const saved = await updateMap(modeId, (m) => {
    if (!m) return m
    const seen = Array.isArray(baseIds) ? new Set(baseIds) : null
    const later = seen ? (m.areas || []).filter((a) => a && !seen.has(a.id) && !proposalMap.areas.some((p) => p.id === a.id)) : []
    const again = mergeEdit(m, { areas: [...proposalMap.areas, ...later].map((a) => ({ id: a.id, title: a.title, theme: a.theme, motif: a.motif, palette: a.palette })) })
    return again.map
  })
  if (!saved) throw new Error(ctx.t('lg_errSave'))
  return saved
}
