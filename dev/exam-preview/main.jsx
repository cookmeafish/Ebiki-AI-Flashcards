// Dev-only question bank preview: reads dev/careers/out/bank-preview/<course>.json (written by
// `node dev/careers/build-bank.mjs <course-id> --preview`) and shows every question with its key, why lines, the
// deciding detail marked, artifact key lines, review stamps and check results. Nothing here is part of the app.
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { C } from '../../src/config/tokens'

const params = new URLSearchParams(location.search)
document.documentElement.dataset.theme = params.get('light') ? 'light' : 'dark'
const DATA = '/dev/careers/out/bank-preview/'
const LETTERS = 'ABCDEFG'

// The text with every occurrence of `mark` bold and highlighted (the deciding detail).
function Marked({ text, mark }) {
  if (!mark || !text.includes(mark)) return text
  const parts = text.split(mark)
  return parts.flatMap((p, i) => (i ? [<mark key={i} data-detail style={{ background: C.warningTint, color: C.ink, fontWeight: 800, borderRadius: 3, padding: '0 2px' }}>{mark}</mark>, p] : [p]))
}

const chip = (text, color, key) => (
  <span key={key || text} style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, padding: '1px 7px', borderRadius: 999, border: `1px solid ${color}`, color, marginRight: 4, marginBottom: 4, whiteSpace: 'nowrap' }}>{text}</span>
)
const STAMP_COLOR = { ok: C.success, missing: C.inkDim, stale: C.danger }

function Question({ entry }) {
  const { q, front, findings, stamps } = entry
  const fails = findings.filter((f) => f.level === 'fail')
  const warns = findings.filter((f) => f.level === 'warn')
  const opts = Array.isArray(q.options) ? q.options : []
  return (
    <article data-qid={q.id} style={{ background: C.surface, border: `1px solid ${fails.length ? C.danger : C.border}`, borderRadius: 14, padding: 14, display: 'grid', gap: 10, minWidth: 0 }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 6 }}>
        <code style={{ fontSize: 12, color: C.inkDim, overflowWrap: 'anywhere' }}>{q.id}</code>
        <strong style={{ fontSize: 14 }}>{front}</strong>
        <span style={{ fontSize: 12, color: C.inkDim }}>{q.obj}</span>
      </header>
      <div>
        {chip(String(q.kind), C.info)}{chip(`level ${q.level}`, C.purple)}{chip(q.pick > 1 ? `select ${q.pick}` : 'pick 1', C.teal)}
        {q.word ? chip(q.word, C.warning) : null}
        {Object.entries(stamps || {}).map(([p, s]) => chip(`${p} ${s}`, STAMP_COLOR[s], p))}
      </div>
      {q.stem ? <p style={{ fontSize: 15, lineHeight: 1.5 }}><Marked text={q.stem} mark={q.detail} /></p> : null}
      {Array.isArray(q.bullets) && q.bullets.length ? <ul style={{ paddingLeft: 20, fontSize: 14, lineHeight: 1.5 }}>{q.bullets.map((b, i) => <li key={i}><Marked text={b} mark={q.detail} /></li>)}</ul> : null}
      {q.artifact ? (
        <div style={{ background: C.surfaceSunken, borderRadius: 8, padding: 10, fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13, display: 'grid', gap: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.inkDim, fontFamily: 'Nunito, sans-serif' }}>{q.artifact.type}</div>
          {(q.artifact.lines || []).map((l, i) => (
            <div key={i} style={{ overflowWrap: 'anywhere', borderLeft: `3px solid ${(q.artifact.mark || []).includes(i) ? C.warning : 'transparent'}`, paddingLeft: 6 }}>
              <Marked text={l} mark={q.detail} />{(q.artifact.mark || []).includes(i) ? <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 800, color: C.warning, fontFamily: 'Nunito, sans-serif' }}>key line</span> : null}
            </div>
          ))}
        </div>
      ) : null}
      <p style={{ fontSize: 15, fontWeight: 800 }}>{q.ask}</p>
      <ol style={{ listStyle: 'none', display: 'grid', gap: 6 }}>
        {opts.map((o, i) => (
          <li key={i} data-key={o.ok ? 'yes' : undefined} style={{ border: `1px solid ${o.ok ? C.success : C.border}`, background: o.ok ? C.successTint : 'transparent', borderRadius: 10, padding: '8px 10px', minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'baseline' }}>
              <strong style={{ color: o.ok ? C.success : C.inkDim }}>{LETTERS[i]}</strong>
              <span style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{o.t}</span>
              {o.ok ? chip('key', C.success) : null}{o.partly ? chip('partly true', C.warning) : null}{q.runner === i ? chip('runner-up', C.warning, 'runner') : null}
              {o.item ? <code style={{ fontSize: 11, color: C.inkFaint }}>{o.item}</code> : null}
            </div>
            <div style={{ fontSize: 13, color: C.inkDim, marginTop: 3, lineHeight: 1.45 }}>{o.why}</div>
          </li>
        ))}
      </ol>
      {q.runner !== null && q.runner !== undefined && opts[q.runner] ? <p style={{ fontSize: 13 }}><strong>Close: {LETTERS[q.runner]}, {opts[q.runner].t}.</strong> {q.edge}</p> : null}
      <p style={{ fontSize: 13, lineHeight: 1.45 }}><strong>Explain:</strong> {q.explain}</p>
      <p style={{ fontSize: 12, color: C.inkDim }}>Source: card {q.source?.card}, chapter "{q.source?.chapter}"</p>
      {findings.length ? (
        <ul data-findings style={{ listStyle: 'none', display: 'grid', gap: 4, fontSize: 13 }}>
          {[...fails, ...warns].map((f, i) => <li key={i} style={{ color: f.level === 'fail' ? C.danger : C.warning, overflowWrap: 'anywhere' }}><strong>{f.check}</strong> {f.level === 'warn' ? '(look in pass 3) ' : ''}{f.msg}</li>)}
        </ul>
      ) : <p data-clean style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>All code checks pass</p>}
    </article>
  )
}

function App() {
  const [courses, setCourses] = useState(null)
  const [course, setCourse] = useState(params.get('course') || '')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [only, setOnly] = useState(params.get('only') === 'problems')
  useEffect(() => {
    fetch(`${DATA}index.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((d) => { setCourses(d.courses || []); setCourse((c) => c || d.courses?.[0] || '') })
      .catch(() => setError('No preview yet. Run: node dev/careers/build-bank.mjs <course-id> --preview'))
  }, [])
  useEffect(() => {
    if (!course) return
    setData(null)
    fetch(`${DATA}${encodeURIComponent(course)}.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`)))).then(setData).catch(() => setError(`No preview for ${course}`))
  }, [course])
  const shown = useMemo(() => (data?.questions || []).filter((e) => !only || e.findings.length), [data, only])
  const stats = useMemo(() => {
    const qs = data?.questions || []
    return { all: qs.length, fail: qs.filter((e) => e.findings.some((f) => f.level === 'fail')).length, warn: qs.filter((e) => e.findings.some((f) => f.level === 'warn')).length,
      stamped: qs.filter((e) => Object.values(e.stamps || {}).every((s) => s === 'ok')).length }
  }, [data])
  return (
    <>
      <style>{PALETTE_CSS}{'body { background: var(--c-bg); color: var(--c-ink); }'}</style>
      <main style={{ maxWidth: 900, margin: '0 auto', padding: 16, display: 'grid', gap: 14 }}>
        <h1 style={{ fontFamily: "'Baloo 2', sans-serif", fontSize: 26 }}>Question bank preview</h1>
        {error ? <p style={{ color: C.danger }}>{error}</p> : null}
        {courses ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', fontSize: 14 }}>
            <label>Course <select value={course} onChange={(e) => setCourse(e.target.value)}>{courses.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Only questions with findings</label>
          </div>
        ) : null}
        {data ? <p data-stats style={{ fontSize: 14, color: C.inkDim }}>{stats.all} questions · {stats.fail} failing a check · {stats.warn} with a warning · {stats.stamped} stamped by every pass</p> : null}
        {shown.map((e) => <Question key={e.q.id} entry={e} />)}
      </main>
    </>
  )
}

createRoot(document.getElementById('root')).render(<App />)
