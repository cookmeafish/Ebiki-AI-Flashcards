// Settings > AI & cost > "Ebi's models": the model plan in plain words. The owner (2026-11-15): "make sure it's
// configurable in the AI settings and make it obvious what each one is for". One row per TASK (src/config/modelPlan.js)
// with what it is for, when it runs, EVERY model it really runs on (a task can mix: Help sits in "Talking with Ebi" on
// its own role), the level and what matters, an honest cost per use and a picker that works for every provider; a status
// line that judges what RUNS; one button to re-plan now; the last update's changes with Undo stay until undone.
// Design + judge: docs/plans/2026-11-15-model-plan-settings.md, docs/reviews/2026-11-15-model-plan-judge.md.
import { useEffect, useRef, useState } from 'react'
import { S } from '../styles/theme'
import { C } from '../config/tokens'
import { JOB_BY_ID, jobKey, jobOverride, resolveJob, chatModelsOnly, jobLabelKey } from '../config/aiJobs'
import { TASKS, ROLE_TIER, roleDefaults as planDefaults, taskModels, taskSignature, pickerModels, likelyTextOnly, levelOf, LEVEL_WORD, modelName, costPerUse, costWords, planStatus, planDiff } from '../config/modelPlan'
import { priceFor, costOf, validPrice } from '../utils/tokenUsage'
import { apiFetch } from '../platform'
import { useUsageTotals } from './TokenUsageMeter'
import { imeActive } from '../utils/keys'

const DAY_WINDOW = 7
const RESEARCH_MAX = 16 // App's REPLAN_RESEARCH_MAX
const UPDATE_CALL_TOKENS = [2000, 500] // one research or decision call, roughly

// The model a job runs on, resolved exactly as App.resolveJobModel does.
const jobResolver = ({ overrides, defaults, presetModel }) => (jobId) => resolveJob(jobId, {
  overrides,
  resolveRole: (r) => overrides[r] || defaults[r] || '',
  resolveRoleFast: (r) => overrides[r] || presetModel?.('normal') || defaults[r] || '',
  cheap: presetModel?.('cheap') || '',
})

// The learner's measured totals for a task on one model, and which model answered the task LAST.
function taskUsage(task, usage, key) {
  const out = { input: 0, output: 0, calls: 0 }
  for (const j of task.jobs) {
    const r = usage?.byJob?.[j]?.[key]
    if (r) { out.input += Number(r.input) || 0; out.output += Number(r.output) || 0; out.calls += Number(r.calls) || 0 }
  }
  return out
}
function lastAnswered(task, usage, provider) {
  let best = null
  for (const j of task.jobs) for (const [key, r] of Object.entries(usage?.byJob?.[j] || {})) {
    const [prov, ...rest] = key.split('|')
    if (prov === provider && Number(r?.last) > (best?.at || 0)) best = { model: rest.join('|'), at: Number(r.last) }
  }
  return best
}

function moneyWords(t, usd) {
  const w = costWords(usd)
  return w.kind === 'unknown' ? null
    : w.kind === 'free' ? t('mp_free')
    : w.kind === 'perCent' ? t('mp_perCent', { n: w.n })
    : w.kind === 'fraction' ? t('mp_centsFraction', { x: w.x })
    : w.n === 1 ? t('mp_oneCent') : t('mp_cents', { n: w.n })
}
function costLine(t, c) {
  const money = moneyWords(t, c.usd)
  if (!money) return null
  return c.source === 'measured' ? t('mp_costMeasured', { cost: money, n: c.calls }) : t('mp_costTypical', { cost: money })
}

// Cost a day at the learner's own pace: the last DAY_WINDOW days with any use, `unknown` when a used model has no price.
function dayCost(usage, prices) {
  const days = Object.keys(usage?.byDay || {}).sort().slice(-DAY_WINDOW)
  if (!days.length) return null
  let usd = 0
  for (const d of days) {
    for (const [key, r] of Object.entries(usage.byDay[d] || {})) {
      const [prov, ...rest] = key.split('|')
      const c = costOf(prov, rest.join('|'), r.input, r.output, prices)
      if (c == null) return { unknown: true }
      usd += c
    }
  }
  return { usd: usd / days.length, days: days.length }
}

const levelText = (t, tier) => (tier ? t('mp_level_' + LEVEL_WORD[tier]) : '')
// A model as a name; the ChatGPT plan's "auto" in the plan's own words.
const nameOf = (t, m) => (m === 'auto' ? t('cg_autoModel') : modelName(m) || m)
// A cost short enough for a picker option on a phone ("0.6¢"); '' when the price is not known.
const shortCost = (usd) => {
  const w = costWords(usd)
  return w.kind === 'perCent' ? '<0.1¢' : w.kind === 'fraction' ? `${w.x}¢` : w.kind === 'cents' ? `${w.n}¢` : w.kind === 'free' ? '0¢' : ''
}
// Read by screen readers, never shown (an aria-label on a plain span is not reliably read).
const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }

// The learner's own price for a model the app has no price for, right on the row (the Token usage list below only
// holds models already used, so a model not tried yet could never be priced).
function PriceForm({ t, provider, model, onSaved, onClose }) {
  const [inp, setInp] = useState('')
  const [out, setOut] = useState('')
  const [err, setErr] = useState('')
  const save = async () => {
    const price = [Number(inp), Number(out)]
    if (!validPrice(price) || inp === '' || out === '') { setErr(t('mp_priceInvalid')); return }
    try {
      const r = await apiFetch('/api/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setPrice: { provider, model, price } }) })
      if (!r.ok) throw new Error(String(r.status))
      onSaved(await r.json().catch(() => null)); onClose()
    } catch { setErr(t('usage_priceFailed')) }
  }
  const box = { ...S.keyInput, flex: '1 1 90px', minWidth: 0, fontSize: 12, padding: '6px 8px' }
  return (
    <div data-price-form="" style={{ marginTop: 6, padding: 8, border: `1px solid ${C.border}`, borderRadius: 8 }}>
      <div style={{ fontSize: 11, color: C.inkDim, marginBottom: 6, lineHeight: 1.45 }}>{t('usage_priceHint')} ({modelName(model) || model})</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <input autoFocus inputMode="decimal" value={inp} onChange={(e) => setInp(e.target.value.replace(',', '.'))} aria-label={t('usage_priceIn')} placeholder={t('usage_priceIn')} style={box} data-no-voice="" />
        <input inputMode="decimal" value={out} onChange={(e) => setOut(e.target.value.replace(',', '.'))} aria-label={t('usage_priceOut')} placeholder={t('usage_priceOut')} style={box} data-no-voice="" />
        <button onClick={save} style={{ ...S.ghostBtn, fontSize: 12, minHeight: 32, color: C.success }}>{t('usage_priceSave')}</button>
        <button onClick={onClose} aria-label={t('close')} style={{ ...S.ghostBtn, fontSize: 12, minHeight: 32, color: C.inkDim }}>×</button>
      </div>
      {err && <div style={{ fontSize: 11, color: C.danger, marginTop: 4 }}>{err}</div>}
    </div>
  )
}

function TaskRow({ t, task, provider, fixed, overrides, defaults, presetModel, provModels, textOnly, usage, setTaskModel, planDeciding, onPriceSaved }) {
  const [custom, setCustom] = useState(false)
  const [pricing, setPricing] = useState(false)
  const inputRef = useRef(null)
  useEffect(() => { if (custom) inputRef.current?.focus() }, [custom])
  const name = t('mp_task_' + task.id)
  const resolve = jobResolver({ overrides, defaults, presetModel })
  const groups = taskModels(task, resolve)
  const model = groups[0]?.model || ''
  const own = task.jobs.map((j) => jobOverride(overrides, j)).find(Boolean) || ''
  // A pick made under "Choose a model per feature" (a ROLE) reaches this task too: said so, never "Recommended".
  const rolePick = !own && task.jobs.some((j) => { const r = JOB_BY_ID[j]?.role; return r && typeof overrides[r] === 'string' && overrides[r].trim() })
  const withoutTask = Object.fromEntries(Object.entries(overrides).filter(([k]) => !task.jobs.some((j) => jobKey(j) === k)))
  const recommended = jobResolver({ overrides: withoutTask, defaults, presetModel })(task.jobs[0])
  const prices = usage?.prices
  const costFor = (m) => costPerUse({ usage: taskUsage(task, usage, `${provider}|${m}`), typical: task.typical, price: priceFor(provider, m, prices) })
  const tier = levelOf(model, { presetModel })
  const last = lastAnswered(task, usage, provider)
  // Photo tasks never list a model known to be text-only.
  const photos = task.vision || task.id === 'talk'
  const listed = pickerModels(provModels, [model, own, recommended].filter(Boolean))
    .filter((m) => !photos || m === own || m === model || !(textOnly.includes(m) || likelyTextOnly(m)))
  // Name, level and a short cost, so two models compare in place (kept short: a phone cuts a long option).
  const optLabel = (m) => {
    const lv = levelText(t, levelOf(m, { presetModel }))
    const c = fixed ? '' : shortCost(costFor(m).usd)
    return [nameOf(t, m), lv, c].filter(Boolean).join(' · ')
  }
  const deciding = planDeciding && !own && !rolePick
  const unlisted = own && chatModelsOnly(provModels).length && !provModels.includes(own)
  const cost = fixed ? t('mp_included') : costLine(t, costFor(model))
  return (
    <li data-task={task.id} style={{ listStyle: 'none', padding: '10px 0', borderTop: `1px solid ${C.border}`, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{name}</span>
        {(own || rolePick) && <span data-own="" style={{ fontSize: 10, fontWeight: 700, color: C.brandText, background: 'color-mix(in srgb, var(--c-brand) 10%, transparent)', borderRadius: 999, padding: '1px 8px' }}>{own ? t('mp_yourPick') : t('mp_rolePick')}</span>}
      </div>
      <div style={{ fontSize: 11, color: C.inkDim, marginTop: 2, lineHeight: 1.45 }}>{t('mp_when_' + task.id)}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '2px 10px', fontSize: 12, color: C.ink, marginTop: 6, minWidth: 0 }}>
        <span data-model={model} style={{ fontWeight: 700, wordBreak: 'break-word', minWidth: 0 }}>
          {deciding ? t('mp_choosing') : (nameOf(t, model) || '?')}
          {!deciding && model && nameOf(t, model) !== model && <span style={srOnly}> ({model})</span>}
        </span>
        {tier && <span style={{ fontSize: 10.5, fontWeight: 700, color: C.inkDim, border: `1px solid ${C.border}`, borderRadius: 999, padding: '0 7px' }}>{levelText(t, tier)}</span>}
      </div>
      {groups.slice(1).map((g) => (
        <div key={g.model} data-also="" style={{ fontSize: 11, color: C.inkDim, marginTop: 2, lineHeight: 1.45 }}>
          {t('mp_also', { model: nameOf(t, g.model), jobs: g.jobs.map((j) => t(jobLabelKey(j))).join(', ') })}
        </div>
      ))}
      <div style={{ fontSize: 11, color: C.inkDim, marginTop: 2, lineHeight: 1.45 }}>{t('mp_whyLine', { why: t('mp_why_' + task.id) })}</div>
      <div style={{ fontSize: 11, color: C.inkDim, marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <span>{cost || t('mp_priceUnknown')}</span>
        {!cost && !pricing && model && <button onClick={() => setPricing(true)} style={{ ...S.ghostBtn, fontSize: 11, padding: '2px 8px', minHeight: 28, color: C.inkDim }}>{t('mp_setPrice')}</button>}
      </div>
      {pricing && <PriceForm t={t} provider={provider} model={model} onSaved={onPriceSaved} onClose={() => setPricing(false)} />}
      {last && last.model && last.model !== model && !groups.some((g) => g.model === last.model) && (
        <div data-last-used="" style={{ fontSize: 11, color: C.warning, marginTop: 2 }}>{t('mp_lastUsed', { model: nameOf(t, last.model) })}</div>
      )}
      {rolePick && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 2 }}>{t('mp_rolePickHint')}</div>}
      {/* The picker takes the row's full width (beside ↺ a phone cut the chosen name off); ↺ wraps under it if needed. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, minWidth: 0, flexWrap: 'wrap' }}>
        {custom ? (
          <input ref={inputRef} defaultValue={own} spellCheck={false} aria-label={t('mp_pickFor', { task: name })} data-no-voice=""
            onBlur={(e) => { const v = e.target.value.replace(/\s+/g, ''); setCustom(false); if (v !== own) setTaskModel(task, v) }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !imeActive(e)) e.currentTarget.blur() }}
            placeholder={t('set_customModelIdPlaceholder')} style={{ ...S.keyInput, flex: '1 1 200px', minWidth: 0, fontSize: 12, padding: '7px 9px' }} />
        ) : (
          <select aria-label={t('mp_pickFor', { task: name })} value={own} onChange={(e) => { if (e.target.value === '__custom__') setCustom(true); else setTaskModel(task, e.target.value) }}
            style={{ ...S.select, flex: '1 1 200px', minWidth: 0, maxWidth: '100%', fontSize: 12, padding: '7px 9px' }}>
            {/* The model is named just above; with it here a phone cut the option off mid-name. */}
            <option value="">{rolePick ? t('mp_rolePickOption') : t('mp_recommended')}</option>
            {listed.map((m) => <option key={m} value={m}>{optLabel(m)}</option>)}
            <option value="__custom__">{t('mp_other')}</option>
          </select>
        )}
        {own && (
          <button onClick={() => setTaskModel(task, '')} aria-label={t('mp_resetFor', { task: name })} className="tip tip-r" data-tip={t('mp_reset')}
            style={{ ...S.ghostBtn, fontSize: 12, minHeight: 32, padding: '4px 10px', color: C.inkDim }}>↺</button>
        )}
      </div>
      {unlisted && <div style={{ fontSize: 11, color: C.warning, marginTop: 4 }}>{t('mp_notListed', { model: own })}</div>}
    </li>
  )
}

export default function ModelPlanCard({ t, card, hint, provider, providerConfig, apiKey, intelligence, aiModels, setAiModels, roleDefaults, presetModel, provModels = [], textOnlyIds = [], modelPlans, planDeciding, replanNow, undoReplan, refreshModels, modelsError, locale, factCheck, setFactCheck }) {
  const { total: usage, setTotal: setUsage } = useUsageTotals(true)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null) // the last Update's outcome WHEN it is not a saved change (a failure, nothing new)
  const overrides = aiModels?.[provider] || {}
  const preset = intelligence || 'normal'
  const entry = modelPlans?.[provider]?.[preset]
  const fixed = !!providerConfig.fixedModels
  const presetIds = ['cheap', 'normal', 'max'].map((x) => presetModel?.(x)).filter(Boolean)
  // A list that failed to load is "could not check", never judged on a list saved earlier.
  const listFailed = modelsError?.provider === provider
  const status = planStatus({ entry, liveIds: provModels.length && !listFailed ? provModels : null, presetIds })
  // What each task runs on, EVERY model ("a + b"): a task whose second model moved is listed as changed too.
  const nowMap = (defaults) => { const r = jobResolver({ overrides, defaults, presetModel }); return Object.fromEntries(TASKS.map((x) => [x.id, taskSignature(taskModels(x, r))])) }
  const names = (sig) => String(sig || '').split(' + ').map((m) => nameOf(t, m)).join(' + ')
  const ownTasks = TASKS.filter((x) => x.jobs.some((j) => jobOverride(overrides, j))).map((x) => x.id)
  // The last update's changes stay on screen (with Undo) until undone: the toast of an automatic update points here.
  const changes = entry?.previous?.plan
    ? planDiff(nowMap(planDefaults({ intel: preset, presetModel, plan: entry.previous.plan, roleTier: ROLE_TIER })), nowMap(roleDefaults), ownTasks)
    : []
  const date = (ms) => { try { return new Date(ms).toLocaleDateString(locale || undefined, { day: 'numeric', month: 'short', year: 'numeric' }) } catch { return '' } }

  // Another provider's outcome never shows on this one; the list is read fresh (a saved one hid the newest models).
  useEffect(() => { setResult(null); if (apiKey && !fixed) refreshModels?.(provider) }, [provider]) // eslint-disable-line react-hooks/exhaustive-deps

  const update = async () => {
    if (busy) return
    setBusy(true); setResult(null)
    try {
      const r = await replanNow?.(provider)
      if (r?.ok && r.reason === 'saved' && !r.changed) setResult({ reason: 'nochange' })
      else if (!r?.ok) setResult({ reason: r?.reason || 'decideFailed' })
    } finally { setBusy(false) }
  }
  const setTaskModel = (task, v) => setAiModels((prev) => {
    const cur = { ...(prev[provider] || {}) }
    for (const j of task.jobs) { if (v) cur[jobKey(j)] = v; else delete cur[jobKey(j)] }
    return { ...prev, [provider]: cur }
  })

  // What an Update costs: up to RESEARCH_MAX research calls + 2 decisions on the strongest model, from known prices only.
  const calls = Math.min(RESEARCH_MAX, chatModelsOnly(provModels).length || RESEARCH_MAX) + 2
  const maxPrice = priceFor(provider, presetModel?.('max') || '', usage?.prices)
  // A TOTAL, in dollars ("about $0.16 in all"; per-use words here read "about about 16 cents per use").
  const estimateUsd = maxPrice ? calls * (UPDATE_CALL_TOKENS[0] / 1e6 * maxPrice[0] + UPDATE_CALL_TOKENS[1] / 1e6 * maxPrice[1]) : null
  const estimate = estimateUsd == null ? null : `$${Math.max(0.01, estimateUsd).toFixed(2)}` // "about $0.01 in all" at the least
  const hasJobUsage = Object.keys(usage?.byJob || {}).length > 0
  const day = !fixed && dayCost(usage, usage?.prices)
  const statusLine = fixed ? t('mp_statusPlan')
    : status.state === 'never' ? t('mp_statusNever', { provider: providerConfig.label })
    : t('mp_status', { provider: providerConfig.label, date: date(status.decidedAt) })
  const fcTask = TASKS.find((x) => x.id === 'factcheck')
  const fcModel = taskModels(fcTask, jobResolver({ overrides, defaults: roleDefaults, presetModel }))[0]?.model || ''
  const fcCost = fixed ? t('mp_included') : (costLine(t, costPerUse({ usage: taskUsage(fcTask, usage, `${provider}|${fcModel}`), typical: fcTask.typical, price: priceFor(provider, fcModel, usage?.prices) })) || t('mp_priceUnknownShort'))
  return (
    <section data-model-plan="" aria-labelledby="mp-title" style={card}>
      <h3 id="mp-title" style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.ink }}>{t('mp_title')}</h3>
      <p style={{ fontSize: 12, color: C.ink, margin: '6px 0 0', lineHeight: 1.5 }}>{statusLine}</p>
      {!fixed && status.state !== 'never' && (
        <p data-plan-state={status.state} role="status" style={{ fontSize: 11.5, margin: '4px 0 0', lineHeight: 1.5, color: status.state === 'newer' ? C.info : C.inkDim, fontWeight: status.state === 'newer' ? 700 : 400 }}>
          {listFailed ? t('mp_state_unknown') : t('mp_state_' + status.state)}
        </p>
      )}
      {!fixed && (day ? (
        <p style={{ fontSize: 11, color: C.inkDim, margin: '4px 0 0', lineHeight: 1.5 }}>
          {day.unknown ? t('mp_dayCostUnknown') : t(day.days === 1 ? 'mp_dayCostToday' : 'mp_dayCost', { cost: day.usd < 0.01 ? t('mp_underCent') : `$${day.usd.toFixed(2)}`, n: day.days })}
        </p>
      ) : !hasJobUsage && <p style={{ fontSize: 11, color: C.inkDim, margin: '4px 0 0', lineHeight: 1.5 }}>{t('mp_noUsageYet')}</p>)}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <button onClick={update} disabled={busy || planDeciding || fixed || !apiKey} className="btn-press"
          style={{ ...S.captureBtn, borderRadius: 8, fontSize: 12, padding: '8px 14px', minHeight: 36, ...((busy || planDeciding || fixed || !apiKey) ? { opacity: 0.5, cursor: 'default' } : {}) }}>
          {busy || planDeciding ? t('mp_updating') : t('mp_update')}
        </button>
      </div>
      <div style={{ ...hint, marginTop: 6 }}>
        {fixed ? t('mp_updatePlanDisabled') : !apiKey ? t('mp_updateNoKey')
          : estimate ? t('mp_updateHint', { provider: providerConfig.label, n: calls, cost: estimate }) : t('mp_updateHintNoPrice', { provider: providerConfig.label, n: calls })}
      </div>
      <div role="status" aria-live="polite" data-plan-result="" style={{ fontSize: 12, color: C.ink, marginTop: (result || changes.length) ? 8 : 0, lineHeight: 1.5 }}>
        {result?.reason === 'nochange' && <div>{t('mp_noChange')}</div>}
        {result?.reason === 'undone' && <div style={{ color: C.inkDim }}>{t('mp_undone')}</div>}
        {result && result.reason !== 'nochange' && result.reason !== 'undone' && <div style={{ color: C.warning }}>{t('mp_fail_' + result.reason, { provider: providerConfig.label })}</div>}
        {changes.length > 0 && (
          <div data-plan-changes="" style={{ padding: '8px 10px', borderRadius: 8, background: 'color-mix(in srgb, var(--c-info) 7%, transparent)', border: '1px solid color-mix(in srgb, var(--c-info) 25%, transparent)' }}>
            <div style={{ fontWeight: 700 }}>{t('mp_lastUpdate', { date: date(entry.decidedAt) })}</div>
            <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>
              {changes.map((c) => <li key={c.task}>{t('mp_changeRow', { task: t('mp_task_' + c.task), from: names(c.from), to: names(c.to) })}</li>)}
            </ul>
            {ownTasks.length > 0 && <div style={{ color: C.inkDim }}>{t('mp_kept', { tasks: ownTasks.map((x) => t('mp_task_' + x)).join(', ') })}</div>}
            <button onClick={() => { undoReplan?.(provider); setResult({ reason: 'undone' }) }} disabled={busy} style={{ ...S.ghostBtn, fontSize: 12, minHeight: 32, marginTop: 6, color: C.inkDim }}>{t('mp_undo')}</button>
          </div>
        )}
      </div>
      {setFactCheck && (
        <div data-fact-check-setting="" style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!factCheck} onChange={(e) => setFactCheck(e.target.checked)} aria-describedby="mp-fc-desc"
              style={{ width: 18, height: 18, marginTop: 1, accentColor: C.brand, cursor: 'pointer', flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: C.ink, fontWeight: 700, lineHeight: 1.45, minWidth: 0, overflowWrap: 'anywhere' }}>{t('mp_fcToggle')}</span>
          </label>
          <div id="mp-fc-desc" style={{ ...hint, marginTop: 4, marginLeft: 28 }}>{factCheck ? t('mp_fcOn', { cost: fcCost }) : t('mp_fcOff')}</div>
        </div>
      )}
      <ul style={{ margin: '10px 0 0', padding: 0 }}>
        {TASKS.map((task) => (
          <TaskRow key={task.id} t={t} task={task} provider={provider} fixed={fixed} overrides={overrides} defaults={roleDefaults}
            presetModel={presetModel} provModels={provModels} textOnly={textOnlyIds} usage={usage} setTaskModel={setTaskModel} planDeciding={planDeciding}
            onPriceSaved={(next) => { if (next?.byModel) setUsage(next) }} />
        ))}
      </ul>
      <div style={{ ...hint, marginTop: 8 }}>{t('mp_advancedHint')}</div>
    </section>
  )
}
