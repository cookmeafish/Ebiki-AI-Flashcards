// "Change my map": the learner (or Ebi's Help, through a legends_edit action) asks for a change, Ebi proposes
// the whole map, and the review shows each area as kept, changed, added or removed. Nothing is saved until
// Accept. Started and finished areas are never touched (see mergeEdit in ./map.js).
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { ChunkyButton, EbiSays } from '../ui'
import { proposeEdit, acceptEdit } from './generate'
import { editChanged } from './map'

const EXAMPLES = ['lg_editEx1', 'lg_editEx2', 'lg_editEx3']
const KIND = {
  kept: { icon: '·', color: 'var(--c-ink-faint)' },
  changed: { icon: '✎', color: 'var(--c-info)' },
  added: { icon: '+', color: 'var(--c-success)' },
  removed: { icon: '−', color: 'var(--c-danger)' },
}

export default function EditPanel({ ctx, modeId, initial = '', autoRun = false, onClose }) {
  const { t, ai } = ctx
  const [text, setText] = useState(initial)
  const [phase, setPhase] = useState('ask') // ask | thinking | review | saving
  const [proposal, setProposal] = useState(null)
  const [error, setError] = useState('')
  const seq = useRef(0)
  const alive = useRef(true)
  // Set on every mount (StrictMode mounts twice): a counter bumped on unmount dropped the auto-run's answer, since
  // the run is asked once, on the first mount.
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])

  const run = async (request = text) => {
    const req = request.trim()
    if (!req || !ai.hasKey) return
    const my = ++seq.current
    setPhase('thinking'); setError(''); setProposal(null)
    try {
      const p = await proposeEdit(ctx, modeId, req)
      if (my !== seq.current || !alive.current) return
      setProposal(p); setPhase('review')
    } catch (e) { if (my === seq.current && alive.current) { setError(String(e.message || e)); setPhase('ask') } }
  }
  const ran = useRef(false)
  useEffect(() => { if (autoRun && initial && !ran.current) { ran.current = true; run(initial) } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const accept = async () => {
    setPhase('saving'); setError('')
    try { await acceptEdit(ctx, modeId, proposal.map); onClose(true) } catch (e) { setError(String(e.message || e)); setPhase('review') }
  }

  const changes = proposal?.changes || []
  const anything = editChanged(changes)
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'grid', gap: 14 }}>
      <button onClick={() => onClose(false)} style={{ fontFamily: FONT.body, justifySelf: 'start', border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>← {t('lg_toMap')}</button>
      <EbiSays pose={poseFile('artist')}>{phase === 'review' ? (proposal?.note || t('lg_editReview')) : t('lg_editIntro')}</EbiSays>

      {(phase === 'ask' || phase === 'thinking') && (
        <>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder={t('lg_editPlaceholder')} disabled={phase === 'thinking'}
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', fontSize: 15, fontFamily: FONT.body, borderRadius: RADIUS.md, border: `2px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {EXAMPLES.map((k) => (
              <button key={k} onClick={() => setText(t(k))} disabled={phase === 'thinking'}
                style={{ fontFamily: FONT.body, padding: '5px 11px', borderRadius: RADIUS.pill, border: `1px solid ${C.border}`, background: C.surface, color: C.inkDim, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{t(k)}</button>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: C.inkDim }}>{t('lg_editSafe')}</div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <ChunkyButton onClick={() => run()} disabled={phase === 'thinking' || !text.trim() || !ai.hasKey} color={C.purple}>
              {phase === 'thinking' ? t('lg_editThinking') : t('lg_editAsk')}
            </ChunkyButton>
          </div>
        </>
      )}

      {(phase === 'review' || phase === 'saving') && proposal && (
        <>
          <div style={{ display: 'grid', gap: 6 }}>
            {changes.map((c) => (
              <div key={`${c.kind}:${c.id}`} style={{
                display: 'flex', gap: 10, alignItems: 'baseline', padding: '8px 12px', borderRadius: RADIUS.md,
                border: `2px solid ${c.kind === 'kept' ? C.border : KIND[c.kind].color}`, background: C.surface,
                textDecoration: c.kind === 'removed' ? 'line-through' : 'none', opacity: c.kind === 'kept' ? 0.75 : 1,
              }}>
                <span style={{ fontWeight: 900, color: KIND[c.kind].color, width: 14, textAlign: 'center' }}>{KIND[c.kind].icon}</span>
                <span style={{ flex: 1, fontWeight: 800, color: C.ink }}>
                  {c.kind === 'changed' && c.before && c.before !== c.title ? <><span style={{ color: C.inkFaint, textDecoration: 'line-through' }}>{c.before}</span> → {c.title}</> : c.title}
                </span>
                <span style={{ fontSize: 11.5, fontWeight: 800, color: KIND[c.kind].color, textTransform: 'uppercase' }}>{t(`lg_edit_${c.kind}`)}</span>
              </div>
            ))}
          </div>
          {!anything && <div style={{ fontSize: 13, color: C.inkDim }}>{t('lg_editNothing')}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => { setPhase('ask'); setProposal(null) }} disabled={phase === 'saving'}>{t('lg_editRefine')}</ChunkyButton>
            <ChunkyButton variant="ghost" color={C.danger} onClick={() => onClose(false)} disabled={phase === 'saving'}>{t('lg_editDeny')}</ChunkyButton>
            <ChunkyButton onClick={accept} disabled={phase === 'saving' || !anything} color={C.success}>{phase === 'saving' ? t('lg_saving') : t('lg_editAccept')}</ChunkyButton>
          </div>
        </>
      )}
      {error && <div style={{ color: C.danger, fontSize: 13 }}>{error}</div>}
    </div>
  )
}
