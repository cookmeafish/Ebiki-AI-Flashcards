// Settings > AI & cost > "Models per job": one model picker for every distinct AI job (src/config/aiJobs.js), per
// provider, grouped by feature. A job with no pick runs on what its parent role gives (shown as "Uses: ..."), so
// nothing changes until the user picks. Picks live in aiModels[provider]['job:<id>'] next to the role overrides.
import { useState } from 'react'
import { S } from '../styles/theme'
import { C } from '../config/tokens'
import {
  JOB_GROUPS, jobsForProvider, jobKey, jobOverride, jobOverridesOf, withoutJobOverrides, resolveJob, speechJobModel,
  jobLabelKey, jobHintKey, jobGroupKey, jobMatches, chatModelsOnly,
} from '../config/aiJobs'
import { MODELS as SPEECH_MODELS } from '../speech/engines'
import { imeActive } from '../utils/keys'

// Speech model ids by name. Not "audio" alone: Gemini's native-audio models are LIVE (streaming) models that the
// one-shot speech requests cannot use.
const SPEECH_ID_RE = { stt: /transcri|whisper|stt/i, tts: /tts/i }
// The models a speech job can pick from. Gemini transcribes with an ordinary chat model (audio in, text out), so its
// speech-to-text list is its chat list.
// `allModels` = the provider's UNFILTERED list (App's listAllModels): the chat list never holds OpenAI's speech models.
export const speechModels = (job, provider, provModels, allModels = []) => (job.speech === 'stt' && provider === 'gemini'
  ? chatModelsOnly(provModels)
  : [...new Set([...(allModels || []), ...(provModels || [])])].filter((m) => SPEECH_ID_RE[job.speech].test(m)))
const rowLabelStyle = { fontSize: 11, color: C.ink, fontWeight: 600, flex: '1 1 160px', minWidth: 0, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }
const usesStyle = { fontSize: 10, color: C.inkFaint, marginTop: 2, lineHeight: 1.4, wordBreak: 'break-word' }

// What the job runs on with no pick of its own, and where that comes from.
function inheritedFor(job, { provider, overrides, roleDefaults, presetModel }) {
  if (job.speech) {
    return { model: speechJobModel(job.speech, provider, { overrides: {}, builtIn: SPEECH_MODELS, cheap: presetModel?.('cheap') || '' }), builtIn: true }
  }
  const roleOf = (r) => overrides[r] || roleDefaults[r] || ''
  const model = resolveJob(job.id, {
    overrides: { ...overrides, [jobKey(job.id)]: '' },
    resolveRole: roleOf,
    resolveRoleFast: (r) => overrides[r] || presetModel?.('normal') || roleDefaults[r] || '',
    cheap: presetModel?.('cheap') || '',
  })
  return { model, builtIn: false }
}

function JobRow({ t, job, provider, overrides, provModels, allModels, roleDefaults, presetModel, planDeciding, custom, setCustom, setJob }) {
  const current = jobOverride(overrides, job.id)
  const inherited = inheritedFor(job, { provider, overrides, roleDefaults, presetModel })
  // A chat job lists chat models only (a TTS or image model picked here failed every call of the job).
  const listed = job.speech ? speechModels(job, provider, provModels, allModels) : chatModelsOnly(provModels)
  const opts = Array.from(new Set([...listed, inherited.model, current].filter(Boolean)))
  const label = t(jobLabelKey(job.id))
  const inheritedModel = (planDeciding && !job.speech && !overrides[job.role] ? t('set_choosing') : inherited.model) || '?'
  const uses = inherited.builtIn ? t('aiJob_usesBuiltIn', { model: inheritedModel }) : t('aiJob_uses', { role: t('aiRole_' + job.role), model: inheritedModel })
  const fallback = inherited.builtIn ? inheritedModel : `${t('aiRole_' + job.role)} · ${inheritedModel}`
  return (
    <div data-job-row={job.id} style={{ padding: '6px 0', borderTop: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={rowLabelStyle}>
          {label}
          <span className="tip" data-tip={t(jobHintKey(job.id))} style={{ color: C.inkFaint, fontWeight: 400, cursor: 'help' }}>ⓘ</span>
          {job.vision && <span className="tip" data-tip={t('aiJob_visionTip')} style={{ fontSize: 9.5, color: C.inkDim, fontWeight: 600, cursor: 'help' }}>📷</span>}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '2 1 200px', minWidth: 0 }}>
          {custom ? (
            // Committed on blur / Enter, like the role rows: a half typed id was used at once otherwise.
            <input key={`${provider}:${job.id}:${current}`} defaultValue={current} spellCheck={false} aria-label={label}
              onBlur={(e) => { const v = e.target.value.replace(/\s+/g, ''); if (v !== current) setJob(v) }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !imeActive(e)) e.currentTarget.blur() }}
              placeholder={t('set_customModelIdPlaceholder')} style={{ ...S.keyInput, flex: 1, minWidth: 0, fontSize: 11, padding: '6px 9px' }} />
          ) : (
            <select aria-label={label} value={current} onChange={(e) => { if (e.target.value === '__custom__') setCustom(true); else setJob(e.target.value) }}
              style={{ ...S.select, flex: 1, minWidth: 0, fontSize: 11, padding: '6px 9px' }}>
              <option value="">{t('aiJob_inherit')}</option>
              {opts.map((m) => <option key={m} value={m}>{m}</option>)}
              <option value="__custom__">✏️ {t('customModel')}</option>
            </select>
          )}
          {custom && (
            <button onClick={() => { setCustom(false); if (current && !listed.includes(current)) setJob('') }} aria-label={t('useList')} className="tip tip-r" data-tip={t('useList')}
              style={{ ...S.ghostBtn, fontSize: 9, padding: '3px 7px' }}>↩</button>
          )}
          {current && (
            <button onClick={() => { setCustom(false); setJob('') }} aria-label={t('aiJob_reset')} className="tip tip-r" data-tip={t('aiJob_reset')}
              style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 7px', color: C.inkDim }}>↺</button>
          )}
        </div>
      </div>
      <div style={usesStyle}>{current ? t('aiJob_picked', { default: fallback }) : uses}</div>
    </div>
  )
}

export default function JobModelSettings({ t, provider, providerConfig, aiModels, setAiModels, provModels = [], allModels = [], roleDefaults = {}, presetModel, planDeciding, card, hint }) {
  const [query, setQuery] = useState('')
  const [customJobs, setCustomJobs] = useState({}) // "<provider>:<job>" → typing a model id
  const overrides = aiModels?.[provider] || {}
  const picked = jobOverridesOf(overrides)
  const pickedCount = Object.keys(picked).length
  const jobs = jobsForProvider(provider)
  const setJob = (id) => (v) => setAiModels((prev) => {
    const cur = { ...(prev[provider] || {}) }
    // An emptied pick is REMOVED (not stored as ''), so "Custom" and the shared config see no override.
    if (v) cur[jobKey(id)] = v; else delete cur[jobKey(id)]
    return { ...prev, [provider]: cur }
  })
  const resetAll = () => {
    setAiModels((prev) => ({ ...prev, [provider]: withoutJobOverrides(prev[provider]) }))
    setCustomJobs((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !k.startsWith(`${provider}:`))))
  }
  const textFor = (job) => ({ label: t(jobLabelKey(job.id)), hint: t(jobHintKey(job.id)), group: t(jobGroupKey(job.group)), role: job.role ? t('aiRole_' + job.role) : '' })
  const searching = !!query.trim()
  const rowProps = (job) => ({
    t, job, provider, overrides, provModels, allModels, roleDefaults, presetModel, planDeciding,
    custom: !!customJobs[`${provider}:${job.id}`],
    setCustom: (on) => setCustomJobs((c) => ({ ...c, [`${provider}:${job.id}`]: on })),
    setJob: setJob(job.id),
  })
  const groups = JOB_GROUPS.map((g) => ({ g, list: jobs.filter((x) => x.group === g && jobMatches(x, query, textFor(x))) })).filter((x) => x.list.length)
  return (
    <details key={provider} data-job-models="" ref={(el) => { if (el && !el.dataset.init) { el.dataset.init = '1'; if (pickedCount) el.open = true } }} style={card}>
      <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 800, color: C.ink, listStyle: 'revert' }}>
        {t('aiJobs_title')} <span style={{ fontWeight: 600, color: C.inkDim, fontSize: 12 }}>({providerConfig.label}{pickedCount ? ` · ${t(pickedCount === 1 ? 'aiJobs_setCountOne' : 'aiJobs_setCount', { n: pickedCount })}` : ''})</span>
      </summary>
      <div style={{ marginTop: 10 }}>
        <div style={{ ...hint, marginTop: 0, marginBottom: 8 }}>{t('aiJobs_desc')}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('aiJobs_search')} aria-label={t('aiJobs_search')} spellCheck={false} data-no-voice=""
            style={{ ...S.keyInput, flex: '1 1 180px', minWidth: 0, fontSize: 11, padding: '6px 9px' }} />
          {pickedCount > 0 && (
            <button onClick={resetAll} style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 9px', color: C.danger, borderColor: 'color-mix(in srgb, var(--c-danger) 30%, transparent)' }}>{t('aiJobs_resetAll')}</button>
          )}
        </div>
        {!groups.length && <div style={hint}>{t('aiJobs_noMatch')}</div>}
        {groups.map(({ g, list }) => {
          const setHere = list.filter((x) => picked[x.id]).length
          const title = (
            <>
              {t(jobGroupKey(g))} <span style={{ fontWeight: 600, color: C.inkDim, fontSize: 11 }}>({list.length}{setHere ? ` · ${t(setHere === 1 ? 'aiJobs_setCountOne' : 'aiJobs_setCount', { n: setHere })}` : ''})</span>
            </>
          )
          // While searching every match is shown flat (a closed group hid the hit); otherwise each group folds.
          return searching ? (
            <div key={g} data-job-group={g} style={{ marginTop: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 2 }}>{title}</div>
              {list.map((job) => <JobRow key={job.id} {...rowProps(job)} />)}
            </div>
          ) : (
            <details key={g} data-job-group={g} ref={(el) => { if (el && !el.dataset.init) { el.dataset.init = '1'; if (setHere) el.open = true } }} style={{ marginTop: 6 }}>
              <summary style={{ cursor: 'pointer', fontSize: 12, fontWeight: 800, color: C.ink, listStyle: 'revert', padding: '4px 0' }}>{title}</summary>
              <div style={{ paddingLeft: 4 }}>{list.map((job) => <JobRow key={job.id} {...rowProps(job)} />)}</div>
            </details>
          )
        })}
      </div>
    </details>
  )
}
