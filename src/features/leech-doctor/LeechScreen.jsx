// Leech Doctor: cards you keep failing, why, a short mentoring lesson, and a proposed card fix you accept or
// skip (before/after shown; nothing is written without Apply). A card edited since the diagnosis is skipped.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { srs, hasCapability } from '../../cards'
import { useFeatureCtx, useActivityBusy } from '../registry'
import { useHelpEntry } from '../kit/useHelp'
import { recordPractice } from '../kit'
import { EVENTS } from '../events'
import { ChunkyButton, Card, EbiSays, tCount } from '../ui'
import { findLeeches, parseDiagnoses, MAX_PATIENTS, cardTextOnly, soundTags, fixChangesCard, isTreated, mentorLabelKey } from './leeches'
import { readTreated, saveTreated, DOCTOR_FEATURE_ID } from './store'
import { buildDoctorPrompt, DOCTOR_ROLE, DOCTOR_MAX_TOKENS } from './prompt'
import { aiErrorText } from '../kit/aiError'

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
  const [state, setState] = useState('loading')  // loading | ready | error
  // Separate from `state`: an Anki reconnect reloads the patients (state loading, then ready) and showed Diagnose
  // again while the paid call was still running; a second click paid for it twice.
  const [diagnosing, setDiagnosing] = useState(false)
  const diagnosingRef = useRef(false)
  const [patients, setPatients] = useState([])   // [{ noteId, cardId, lapses, reps, front, back, fieldNames, mod, suspendedIds }]
  const [unsuspend, setUnsuspend] = useState({}) // noteId -> false when the learner unticked "bring it back into reviews"
  // The mode and context the patients were loaded in (writes are filed there), and the cards fixed this visit:
  // leaving with at least one counts as a finished practice session (PRACTICE_DONE, once).
  const visitRef = useRef({ ctx: null, modeId: null, treated: 0, reported: false })
  const [others, setOthers] = useState([])
  const [dx, setDx] = useState(new Map())
  const [open, setOpen] = useState({})           // noteId -> mentor shown
  const [done, setDone] = useState({})           // noteId -> 'applied' | 'skipped' | 'changed' | 'failed'
  const [error, setError] = useState('')
  const deck = ctx?.subject?.deck
  const deckRunRef = useRef(0)
  const applyingRef = useRef(new Set()) // notes whose fix is being written (a double click read the new mod as "changed")
  const prevDeckRef = useRef(undefined)
  useEffect(() => () => {
    const v = visitRef.current
    if (!v.treated || v.reported || !v.ctx) return
    v.reported = true
    // total 0: fixing cards is not a quiz score, so the learner level does not move; the game pays its practice XP.
    v.ctx.emit(EVENTS.PRACTICE_DONE, { source: DOCTOR_FEATURE_ID, mode: v.modeId, total: 0, correct: 0, treated: v.treated })
  }, [])

  useEffect(() => {
    if (!ctx) return
    let stop = false
    // Another deck (a mode or deck switch while open): the old deck's diagnoses and results never carry over.
    // Only a real deck change: an Anki reconnect (a dialog in Anki) re-runs this too and threw away paid diagnoses.
    if (prevDeckRef.current !== deck) {
      prevDeckRef.current = deck
      deckRunRef.current += 1
      setDx(new Map()); setDone({}); setOpen({})
    }
    setError(''); setState('loading')
    ;(async () => {
      if (!ctx.ankiConnected || !deck) { setState('error'); setError(ctx.t('doc_needAnki')); return }
      const modeId = ctx.subject?.modeId
      try {
        const cardIds = await srs.findCards({ deck })
        const infos = await inBatches(cardIds, INFO_BATCH, (b) => srs.cardsInfo(b))
        // Cards fixed here earlier rest until they lapse again after the fix (an unreadable list hides nothing).
        const treated = (await readTreated(ctx, modeId)).value
        const sick = findLeeches(infos).filter((p) => !isTreated(treated, p)).slice(0, MAX_PATIENTS)
        // Which of each patient's cards are suspended (Anki's leech action can suspend them); fail soft.
        const noteCards = new Map(sick.map((p) => [p.noteId, infos.filter((c) => c?.note === p.noteId).map((c) => c.cardId)]))
        const allIds = [...noteCards.values()].flat()
        const susp = new Set()
        if (hasCapability('suspend') && allIds.length) {
          try { const flags = await srs.suspendedCards(allIds); allIds.forEach((id, i) => { if (flags?.[i]) susp.add(id) }) } catch { /* shown as not suspended */ }
        }
        const notes = await inBatches(sick.map((p) => p.noteId), NOTES_BATCH, (b) => srs.notesInfo(b))
        const byId = new Map(notes.filter(Boolean).map((n) => [n.noteId, n]))
        const list = sick.map((p) => { const n = byId.get(p.noteId); if (!n) return null; const tx = ctx.cards.noteText(n); return { ...p, ...tx, front: cardTextOnly(tx.front), back: cardTextOnly(tx.back), mod: n.mod, suspendedIds: (noteCards.get(p.noteId) || []).filter((id) => susp.has(id)) } }).filter(Boolean)
        const fronts = [...new Set(infos.map((c) => cardTextOnly(ctx.cards.noteText(c).front)).filter(Boolean))].slice(0, DECK_FRONTS)
        if (stop) return
        visitRef.current = { ...visitRef.current, ctx, modeId }
        setPatients(list); setOthers(fronts); setState('ready')
      } catch (e) { if (!stop) { setState('error'); setError(aiErrorText(t, e)) } }
    })()
    return () => { stop = true }
  }, [deck, ctx?.ankiConnected]) // eslint-disable-line react-hooks/exhaustive-deps

  // What Ebi's Help knows: the cards the learner keeps forgetting, Ebi's diagnosis of each, and what was done.
  useHelpEntry(ctx, 'leech-doctor', state === 'loading' ? '' : [
    `Activity open: Leech Doctor (cards forgotten again and again). ${patients.length} patients in the deck "${deck || ''}".`,
    patients.slice(0, 10).map((p) => {
      const d = dx.get(String(p.noteId))
      return `- "${String(p.front || '').slice(0, 80)}" (${p.lapses} lapses)${d ? `: cause ${d.cause}${d.mentor ? `; Ebi's advice: ${d.mentor.slice(0, 200)}` : ''}${d.fix ? `; proposed fix: ${[d.fix.front && `front "${d.fix.front}"`, d.fix.back && `back "${String(d.fix.back).slice(0, 120)}"`].filter(Boolean).join(', ')}` : ''}` : ''}${done[p.noteId] ? ` [${done[p.noteId]}]` : ''}`
    }).join('\n'),
  ].filter(Boolean).join('\n'))
  // Back asks while a diagnosis runs or a proposed fix is still unapplied (an apply in flight has no status yet).
  useActivityBusy(diagnosing || patients.some((p) => dx.get(String(p.noteId))?.fix && !done[p.noteId]))
  if (!ctx) return null
  const { t, ai, subject } = ctx

  const diagnose = async () => {
    if (diagnosingRef.current) return
    diagnosingRef.current = true
    const run = deckRunRef.current
    const seen = patients // the cards as the doctor saw them: a fix is applied only over this version
    setDiagnosing(true); setError('')
    try {
      const { system, user } = buildDoctorPrompt(subject, seen, { others })
      const raw = await ai.call(system, user, { role: DOCTOR_ROLE, maxTokens: DOCTOR_MAX_TOKENS })
      const m = parseDiagnoses(ai.json(raw), seen)
      for (const [id, d] of m) {
        d.explanation = ai.clean(d.explanation); d.mentor = ai.clean(d.mentor); d.confusedWith = ai.clean(d.confusedWith || '')
        const p = seen.find((x) => String(x.noteId) === id)
        d.mod = p?.mod // a reconnect reloads the patients: an edit made in Anki meanwhile must still count as "changed"
        if (d.fix) {
          d.fix.front = ai.clean(d.fix.front); d.fix.back = ai.clean(d.fix.back)
          // A "fix" that changes nothing showed Apply and then said "applied" for a card left as it was.
          if (!fixChangesCard(d.fix, p)) d.fix = null
        }
      }
      if (run !== deckRunRef.current) return // the deck changed while the doctor was thinking
      if (!m.size) throw new Error(t('doc_noAnswer'))
      setDx(m)
    } catch (e) { if (run === deckRunRef.current) setError(aiErrorText(t, e)) } finally { diagnosingRef.current = false; setDiagnosing(false) }
  }

  // Apply a fix: re-read the note first; a card edited since the diagnosis is left alone.
  const apply = async (p) => {
    const d = dx.get(String(p.noteId))
    if (!d?.fix || applyingRef.current.has(p.noteId)) return
    applyingRef.current.add(p.noteId)
    try {
      const [fresh] = await srs.notesInfo([p.noteId])
      if (!fresh || fresh.mod !== (d.mod ?? p.mod)) { setDone((x) => ({ ...x, [p.noteId]: 'changed' })); return }
      // Built over the field's current html: images, audio and its credit stay; furigana/tables/links refuse the fix.
      const fields = {}
      const orig = (name) => fresh.fields?.[name]?.value || ''
      const put = (name, text, which) => { const html = ctx.cards.rewriteField(orig(name), text, which); if (html == null) return false; fields[name] = html; return true }
      if (d.fix.front && d.fix.front !== p.front && !put(p.fieldNames[0], d.fix.front, 'front')) { setDone((x) => ({ ...x, [p.noteId]: 'markup' })); return }
      if (d.fix.back && d.fix.back !== p.back && p.fieldNames[1] && !put(p.fieldNames[1], d.fix.back, 'back')) { setDone((x) => ({ ...x, [p.noteId]: 'markup' })); return }
      // Every recording must survive: the rewrite brings back only ONE lost [sound:] (a card with two lost the other).
      if (Object.entries(fields).some(([name, html]) => soundTags(orig(name)).some((x) => !html.includes(x)))) { setDone((x) => ({ ...x, [p.noteId]: 'audio' })); return }
      // Nothing writable (a back fix on a one-field note): "applied" would be a lie, and treating it hid the leech.
      if (!Object.keys(fields).length) { setDone((x) => ({ ...x, [p.noteId]: 'failed' })); return }
      await srs.updateNoteFields(p.noteId, fields)
      // Treated: not a patient again until it lapses after this fix. Filed under the mode it was loaded in.
      const v = visitRef.current
      saveTreated(v.ctx || ctx, v.modeId ?? subject.modeId, p.noteId, p.lapses)
      recordPractice(v.ctx || ctx, DOCTOR_FEATURE_ID, [{ kind: 'card', label: p.front }])
      v.treated += 1
      // A suspended leech goes back into reviews unless the learner unticked it.
      let result = 'applied'
      if (p.suspendedIds?.length && unsuspend[p.noteId] !== false) {
        try { await srs.unsuspendCards(p.suspendedIds); result = 'appliedBack' } catch { result = 'unsuspendFailed' }
      }
      srs.syncSoon()
      setDone((x) => ({ ...x, [p.noteId]: result }))
    } catch { setDone((x) => ({ ...x, [p.noteId]: 'failed' })) } finally { applyingRef.current.delete(p.noteId) }
  }

  const intro = state === 'loading' ? t('doc_loading') : state === 'error' ? error : !patients.length ? t('doc_healthy') : tCount(t, 'doc_intro', patients.length)
  return (
    <div>
      <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('doc_back')}</button>
      <EbiSays pose={poseFile('doctor')}>{intro}</EbiSays>
      {state !== 'loading' && state !== 'error' && patients.length > 0 && !dx.size && (
        <div style={{ margin: '18px 0' }}>
          <ChunkyButton onClick={diagnose} disabled={!ai.hasKey || diagnosing} color={C.purple}>{diagnosing ? t('doc_diagnosing') : t('doc_diagnose')}</ChunkyButton>
          {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginTop: 8 }}>{t('doc_needKey')}</div>}
        </div>
      )}
      {error && state !== 'error' && <div role="alert" style={{ color: C.danger, fontSize: 13, margin: '10px 0' }}>{error}</div>}
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
                        {open[p.noteId] ? '▾' : '▸'} 🎓 {t(mentorLabelKey(d.cause))}
                      </button>
                      {open[p.noteId] && <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55, marginTop: 6, background: C.purpleTint, borderRadius: RADIUS.sm, padding: 10, whiteSpace: 'pre-wrap' }}>{d.mentor}</div>}
                    </div>
                  )}
                  {d.fix && (
                    <>
                      <Side label={t('doc_front')} before={p.front} after={d.fix.front} />
                      <Side label={t('doc_backSide')} before={p.back} after={d.fix.back} />
                      {!status && p.suspendedIds?.length > 0 && (
                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, fontSize: 13, color: C.ink, cursor: 'pointer' }}>
                          <input type="checkbox" checked={unsuspend[p.noteId] !== false} onChange={(e) => setUnsuspend((x) => ({ ...x, [p.noteId]: e.target.checked }))} />
                          {t('doc_unsuspend')}
                        </label>
                      )}
                      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
                        {status ? (
                          <span style={{ fontSize: 13, fontWeight: 800, color: status === 'applied' || status === 'appliedBack' ? C.success : status === 'skipped' ? C.inkDim : status === 'unsuspendFailed' ? C.warning : C.danger }}>{t(`doc_status_${status}`)}</span>
                        ) : (
                          <>
                            <ChunkyButton onClick={() => apply(p)} color={C.success}>{t('doc_apply')}</ChunkyButton>
                            <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => { if (!applyingRef.current.has(p.noteId)) setDone((x) => ({ ...x, [p.noteId]: 'skipped' })) }}>{t('doc_skip')}</ChunkyButton>
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
