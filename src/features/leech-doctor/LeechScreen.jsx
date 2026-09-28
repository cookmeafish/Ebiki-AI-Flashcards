// Leech Doctor: cards you keep failing, why, a short mentoring lesson, and a proposed card fix you accept or
// skip (before/after shown; nothing is written without Apply). A card edited since the diagnosis is skipped.
import { useEffect, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { srs } from '../../cards'
import { useFeatureCtx } from '../registry'
import { ChunkyButton, Card, EbiSays, tCount } from '../ui'
import { findLeeches, parseDiagnoses, MAX_PATIENTS } from './leeches'
import { buildDoctorPrompt, DOCTOR_ROLE, DOCTOR_MAX_TOKENS } from './prompt'

const INFO_BATCH = 300        // cardsInfo per request
const NOTES_BATCH = 100
const DECK_FRONTS = 120       // other fronts shown to the model (to spot confusions)
const CAUSE_COLOR = { confusable: C.purple, unpinned: C.warning, thin: C.info, hook: C.success, wrong: C.danger }

async function inBatches(ids, size, fn) {
  const out = []
  for (let i = 0; i < ids.length; i += size) out.push(...((await fn(ids.slice(i, i + size))) || []))
  return out
}

function Side({ label, before, after }) {
  if (!after || after === before) return null
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkFaint }}>{label}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, whiteSpace: 'pre-wrap' }}>
        <div style={{ background: C.dangerTint, borderRadius: RADIUS.sm, padding: 8, textDecoration: 'line-through', color: C.inkDim }}>{before}</div>
        <div style={{ background: C.successTint, borderRadius: RADIUS.sm, padding: 8, color: C.ink }}>{after}</div>
      </div>
    </div>
  )
}

export default function LeechScreen({ onExit }) {
  const ctx = useFeatureCtx()
  const [state, setState] = useState('loading')  // loading | ready | diagnosing | error
  const [patients, setPatients] = useState([])   // [{ noteId, cardId, lapses, reps, front, back, fieldNames, mod }]
  const [others, setOthers] = useState([])
  const [dx, setDx] = useState(new Map())
  const [open, setOpen] = useState({})           // noteId -> mentor shown
  const [done, setDone] = useState({})           // noteId -> 'applied' | 'skipped' | 'changed' | 'failed'
  const [error, setError] = useState('')
  const deck = ctx?.subject?.deck

  useEffect(() => {
    if (!ctx) return
    let stop = false
    ;(async () => {
      if (!ctx.ankiConnected || !deck) { setState('error'); setError(ctx.t('doc_needAnki')); return }
      try {
        const cardIds = await srs.findCards({ deck })
        const infos = await inBatches(cardIds, INFO_BATCH, (b) => srs.cardsInfo(b))
        const sick = findLeeches(infos).slice(0, MAX_PATIENTS)
        const notes = await inBatches(sick.map((p) => p.noteId), NOTES_BATCH, (b) => srs.notesInfo(b))
        const byId = new Map(notes.filter(Boolean).map((n) => [n.noteId, n]))
        const list = sick.map((p) => { const n = byId.get(p.noteId); return n ? { ...p, ...ctx.cards.noteText(n), mod: n.mod } : null }).filter(Boolean)
        const fronts = [...new Set(infos.map((c) => ctx.cards.noteText(c).front).filter(Boolean))].slice(0, DECK_FRONTS)
        if (stop) return
        setPatients(list); setOthers(fronts); setState('ready')
      } catch (e) { if (!stop) { setState('error'); setError(String(e.message || e)) } }
    })()
    return () => { stop = true }
  }, [deck, ctx?.ankiConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ctx) return null
  const { t, ai, subject } = ctx

  const diagnose = async () => {
    setState('diagnosing'); setError('')
    try {
      const { system, user } = buildDoctorPrompt(subject, patients, { others })
      const raw = await ai.call(system, user, { role: DOCTOR_ROLE, maxTokens: DOCTOR_MAX_TOKENS })
      const m = parseDiagnoses(ai.json(raw), patients)
      for (const d of m.values()) { d.explanation = ai.clean(d.explanation); d.mentor = ai.clean(d.mentor); if (d.fix) { d.fix.front = ai.clean(d.fix.front); d.fix.back = ai.clean(d.fix.back) } }
      if (!m.size) throw new Error(t('doc_noAnswer'))
      setDx(m); setState('ready')
    } catch (e) { setError(String(e.message || e)); setState('ready') }
  }

  // Apply a fix: re-read the note first; a card edited since the diagnosis is left alone.
  const apply = async (p) => {
    const d = dx.get(String(p.noteId))
    if (!d?.fix) return
    try {
      const [fresh] = await srs.notesInfo([p.noteId])
      if (!fresh || fresh.mod !== p.mod) { setDone((x) => ({ ...x, [p.noteId]: 'changed' })); return }
      const fields = {}
      if (d.fix.front && d.fix.front !== p.front) fields[p.fieldNames[0]] = ctx.cards.frontHtml(d.fix.front)
      if (d.fix.back && d.fix.back !== p.back && p.fieldNames[1]) fields[p.fieldNames[1]] = ctx.cards.backHtml(d.fix.back)
      if (Object.keys(fields).length) { await srs.updateNoteFields(p.noteId, fields); srs.syncSoon() }
      setDone((x) => ({ ...x, [p.noteId]: 'applied' }))
    } catch { setDone((x) => ({ ...x, [p.noteId]: 'failed' })) }
  }

  const intro = state === 'loading' ? t('doc_loading') : state === 'error' ? error : !patients.length ? t('doc_healthy') : tCount(t, 'doc_intro', patients.length)
  return (
    <div>
      <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('doc_back')}</button>
      <EbiSays pose={poseFile('doctor')}>{intro}</EbiSays>
      {state !== 'loading' && state !== 'error' && patients.length > 0 && !dx.size && (
        <div style={{ margin: '18px 0' }}>
          <ChunkyButton onClick={diagnose} disabled={!ai.hasKey || state === 'diagnosing'} color={C.purple}>{state === 'diagnosing' ? t('doc_diagnosing') : t('doc_diagnose')}</ChunkyButton>
          {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginTop: 8 }}>{t('doc_needKey')}</div>}
        </div>
      )}
      {error && state !== 'error' && <div style={{ color: C.danger, fontSize: 13, margin: '10px 0' }}>{error}</div>}
      <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        {patients.map((p) => {
          const d = dx.get(String(p.noteId))
          const status = done[p.noteId]
          return (
            <Card key={p.noteId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'baseline' }}>
                <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 16, color: C.ink }}>{p.front}</div>
                <div style={{ fontSize: 12, color: C.danger, fontWeight: 800, whiteSpace: 'nowrap' }}>{tCount(t, 'doc_lapses', p.lapses)}</div>
              </div>
              {d && (
                <>
                  <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ background: CAUSE_COLOR[d.cause], color: C.white, borderRadius: RADIUS.pill, padding: '2px 10px', fontSize: 11.5, fontWeight: 800 }}>{t(`doc_cause_${d.cause}`)}</span>
                    {d.confusedWith && <span style={{ fontSize: 13, color: C.purple, fontWeight: 700 }}>{t('doc_vs', { x: d.confusedWith })}</span>}
                  </div>
                  <div style={{ fontSize: 13.5, color: C.ink, marginTop: 8, lineHeight: 1.5 }}>{d.explanation}</div>
                  {d.mentor && (
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => setOpen((o) => ({ ...o, [p.noteId]: !o[p.noteId] }))} style={{ border: 'none', background: 'transparent', color: C.purple, fontWeight: 800, cursor: 'pointer', padding: 0, fontSize: 13 }}>
                        {open[p.noteId] ? '▾' : '▸'} 🎓 {t('doc_mentor')}
                      </button>
                      {open[p.noteId] && <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginTop: 6, background: C.purpleTint, borderRadius: RADIUS.sm, padding: 10, whiteSpace: 'pre-wrap' }}>{d.mentor}</div>}
                    </div>
                  )}
                  {d.fix && (
                    <>
                      <Side label={t('doc_front')} before={p.front} after={d.fix.front} />
                      <Side label={t('doc_backSide')} before={p.back} after={d.fix.back} />
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                        {status ? (
                          <span style={{ fontSize: 13, fontWeight: 800, color: status === 'applied' ? C.success : status === 'skipped' ? C.inkDim : C.danger }}>{t(`doc_status_${status}`)}</span>
                        ) : (
                          <>
                            <ChunkyButton onClick={() => apply(p)} color={C.success}>{t('doc_apply')}</ChunkyButton>
                            <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => setDone((x) => ({ ...x, [p.noteId]: 'skipped' }))}>{t('doc_skip')}</ChunkyButton>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
