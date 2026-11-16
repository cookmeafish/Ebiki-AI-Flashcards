// A COURSE'S STUDY GUIDE in Settings > Knowledge: the chapters a course installed into this mode's knowledge base
// (src/server/courseKnowledge.js, files named `course-<id>-<chapter>.md`), shown as ONE group with readable chapter
// titles instead of raw file names. Each chapter can be switched off or deleted like any file; the whole guide has
// one switch, and "Restore" brings back deleted chapters and the newest version. The learner's own files are listed
// by the caller, untouched. Design: docs/plans/2026-11-15-security-plus-knowledge.md (item 20).
import { useEffect, useState } from 'react'
import { C, RADIUS } from '../config/tokens'
import { S } from '../styles/theme'
import { careerFor } from '../features/legends/career'

export const COURSE_FILE_RE = /^course-([a-z0-9][a-z0-9-]*?)-([A-Za-z0-9_.]+\.md)$/
// { courseId: [file, ...] } for the course files in a knowledge list; the rest are the learner's own.
export function splitCourseFiles(files) {
  const groups = {}; const own = []
  for (const f of files || []) {
    const m = String(f.name).match(COURSE_FILE_RE)
    // The id is the longest known course id the name starts with (ids contain dashes, so the regex alone can't tell).
    const id = m && knownCourse(f.name)
    if (id) (groups[id] ||= []).push({ ...f, chapter: f.name.slice(`course-${id}-`.length) })
    else own.push(f)
  }
  return { groups, own }
}
function knownCourse(name) {
  const rest = name.slice('course-'.length)
  const parts = rest.split('-')
  for (let i = parts.length - 1; i >= 1; i--) { const id = parts.slice(0, i).join('-'); if (careerFor(id)) return id }
  return ''
}

const sizeLabel = (n) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`)

export default function CourseGuideGroup({ t, course, files, busyFiles, onToggle, onDelete, onRestore }) {
  const [titles, setTitles] = useState({})
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let live = true
    const url = (careerFor(course)?.url || '').replace(/\.json$/, '/knowledge/manifest.json')
    if (!url) return undefined
    fetch(url, { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)).then((m) => {
      if (live && m?.files) setTitles(Object.fromEntries(m.files.map((f) => [f.file, f.title])))
    }).catch(() => {})
    return () => { live = false }
  }, [course])
  const name = careerFor(course)?.titleKey ? t(careerFor(course).titleKey) : course
  const on = files.filter((f) => !f.disabled)
  const total = files.reduce((n, f) => n + (f.size || 0), 0)
  const allOff = on.length === 0
  const anyBusy = busy || files.some((f) => busyFiles?.has?.(f.name))
  const setAll = async (disable) => {
    if (anyBusy) return
    setBusy(true)
    try { for (const f of files) if (!!f.disabled !== disable) await onToggle(f.name, disable) } finally { setBusy(false) }
  }
  const restore = async () => { if (anyBusy) return; setBusy(true); try { await onRestore(course) } finally { setBusy(false) } }
  const small = { ...S.ghostBtn, fontSize: 10, padding: '2px 7px', ...(anyBusy ? { opacity: 0.5, cursor: 'default' } : {}) }
  return (
    <details data-course-guide={course} style={{ border: `1px solid color-mix(in srgb, var(--c-info) 30%, transparent)`, background: `color-mix(in srgb, var(--c-info) 7%, ${C.surface})`, borderRadius: RADIUS.sm, padding: '8px 10px', fontSize: 12 }}>
      <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', listStyle: 'none' }}>
        <span aria-hidden="true">🎓</span>
        <span style={{ flex: '1 1 180px', minWidth: 0 }}>
          <span style={{ display: 'block', fontWeight: 800, color: allOff ? C.inkFaint : C.ink, overflowWrap: 'anywhere' }}>{t('kb_courseGuide', { course: name })}</span>
          <span style={{ display: 'block', color: C.inkDim, fontSize: 11, lineHeight: 1.4 }}>{t('kb_courseGuideInfo', { n: files.length, on: on.length, size: sizeLabel(total) })}</span>
        </span>
        <button type="button" disabled={anyBusy} onClick={(e) => { e.preventDefault(); setAll(!allOff) }} style={small}>{allOff ? t('kb_guideEnableAll') : t('kb_guideDisableAll')}</button>
        <button type="button" disabled={anyBusy} onClick={(e) => { e.preventDefault(); restore() }} className="tip" data-tip={t('kb_guideRestoreTip')} style={small}>{t('kb_guideRestore')}</button>
      </summary>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {files.map((f) => (
          <div key={`${f.name}|${f.disabled ? 1 : 0}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: f.disabled ? C.surfaceSunken : C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm }}>
            <span style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', color: f.disabled ? C.inkFaint : C.ink, textDecoration: f.disabled ? 'line-through' : 'none' }}>{titles[f.chapter] || f.chapter}</span>
            <span style={{ color: C.inkFaint, fontSize: 10, whiteSpace: 'nowrap' }}>{sizeLabel(f.size)}</span>
            <button type="button" onClick={() => onToggle(f.name, !f.disabled)} disabled={anyBusy} aria-label={`${f.disabled ? t('enable') : t('disable')}: ${titles[f.chapter] || f.chapter}`} style={small}>{f.disabled ? t('enable') : t('disable')}</button>
            <button type="button" onClick={() => onDelete(f, titles[f.chapter] || f.chapter)} disabled={anyBusy} aria-label={`${t('delete')}: ${titles[f.chapter] || f.chapter}`} style={{ ...small, color: C.danger, borderColor: 'color-mix(in srgb, var(--c-danger) 25%, transparent)' }}>{t('delete')}</button>
          </div>
        ))}
      </div>
    </details>
  )
}
