import { useState } from 'react'
import { iconFor } from '../pbq/engine'

// Interactive PBQ (performance-based question) — renders a compiled PBQ from src/pbq/engine.js.
// Two interaction styles, both always available: select-then-place (click a chip, then click where
// it belongs — keyboard/touch friendly) AND native drag-and-drop (chips drag between the pool and
// the target boxes; ordering rows drag to reorder). Drops are element-hit-tested by the browser,
// so the app's body zoom never skews them (no coordinate math). Grading happens in the parent
// (deterministic, engine.gradePbq); pass `review` ({ assign, perItem }) to show the graded,
// read-only state with the correct answers revealed.

const box = {
  border: '1px solid var(--c-border)', borderRadius: 10, padding: '8px 10px',
  background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
}
const chipBase = {
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999,
  fontSize: 12, fontWeight: 700, fontFamily: 'inherit', border: '1.5px solid var(--c-border)',
  background: 'var(--c-surface)', color: 'var(--c-ink)', cursor: 'pointer', maxWidth: '100%',
}

const Chip = ({ text, icon, selected, correct, onClick, dragProps }) => (
  <button onClick={onClick} disabled={!onClick && !dragProps} {...(dragProps || {})} style={{
    ...chipBase,
    cursor: dragProps ? 'grab' : onClick ? 'pointer' : 'default',
    borderColor: correct === true ? 'var(--c-success)' : correct === false ? 'var(--c-danger)' : selected ? 'var(--c-brand)' : 'var(--c-border)',
    background: correct === true ? 'rgba(24,169,87,.10)' : correct === false ? 'rgba(229,57,46,.08)' : selected ? 'rgba(223,37,64,.08)' : 'var(--c-surface)',
    color: correct === false ? 'var(--c-danger)' : 'var(--c-ink)',
    boxShadow: selected ? '0 0 0 3px rgba(223,37,64,.15)' : 'none',
  }}>
    {correct === true && <span style={{ color: 'var(--c-success)' }}>✓</span>}
    {correct === false && <span>✗</span>}
    {icon && <span style={{ fontSize: 14, lineHeight: 1 }}>{icon}</span>}
    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</span>
  </button>
)

const Expected = ({ text }) => (
  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-success)', whiteSpace: 'nowrap' }}>→ {text}</span>
)

export default function PbqQuestion({ pbq, t, onSubmit, review = null }) {
  const isMatching = pbq.kind === 'matching'
  const pool = isMatching ? pbq.left : pbq.items
  const [assign, setAssign] = useState(() => new Array(pool.length).fill(null))
  const [seq, setSeq] = useState(() => pool.map((_, i) => i)) // ordering: item indices in display order
  const [selected, setSelected] = useState(null)
  const [dragIdx, setDragIdx] = useState(null)    // pool item index being dragged (matching/categorize)
  const [dragOverT, setDragOverT] = useState(null) // target idx (or 'pool') currently hovered by a drag
  const [dragRow, setDragRow] = useState(null)     // ordering: display position of the row being dragged

  const liveAssign = review ? review.assign : assign
  const per = review ? review.perItem : null
  const done = !!review

  // ---- ordering ---------------------------------------------------------
  if (pbq.kind === 'ordering') {
    // In review, show the user's submitted sequence (assign[i] = position of item i)
    const shownSeq = done
      ? pool.map((_, i) => i).sort((a, b) => (liveAssign?.[a] ?? 0) - (liveAssign?.[b] ?? 0))
      : seq
    const move = (pos, dir) => {
      const to = pos + dir
      if (to < 0 || to >= shownSeq.length) return
      const next = [...shownSeq]; [next[pos], next[to]] = [next[to], next[pos]]
      setSeq(next)
    }
    return (
      <div>
        <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginBottom: 8 }}>{t('pbqOrderHint')}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {shownSeq.map((itemIdx, pos) => {
            const p = per?.[itemIdx]
            return (
              <div key={itemIdx}
                draggable={!done}
                onDragStart={!done ? (e) => { e.dataTransfer.setData('text/plain', pool[itemIdx]); e.dataTransfer.effectAllowed = 'move'; setDragRow(pos) } : undefined}
                onDragEnd={!done ? () => setDragRow(null) : undefined}
                onDragOver={!done ? (e) => {
                  // live-reorder: sliding over another row moves the dragged row there
                  if (dragRow === null || dragRow === pos) return
                  e.preventDefault()
                  const next = [...seq]
                  const [moved] = next.splice(dragRow, 1)
                  next.splice(pos, 0, moved)
                  setSeq(next)
                  setDragRow(pos)
                } : undefined}
                style={{
                  ...box, display: 'flex', alignItems: 'center', gap: 10,
                  borderColor: p ? (p.correct ? 'var(--c-success)' : 'var(--c-danger)') : 'var(--c-border)',
                  cursor: done ? 'default' : 'grab',
                  opacity: dragRow === pos ? 0.6 : 1,
                }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-brand)', width: 22, flexShrink: 0 }}>{pos + 1}.</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--c-ink)', flex: 1, minWidth: 0 }}>
                  {iconFor(pbq, pool[itemIdx]) && <span style={{ fontSize: 14, marginRight: 6 }}>{iconFor(pbq, pool[itemIdx])}</span>}
                  {pool[itemIdx]}
                </span>
                {p && !p.correct && <Expected text={p.expectedText} />}
                {!done && (
                  <span style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => move(pos, -1)} disabled={pos === 0} style={{ ...chipBase, padding: '3px 9px', opacity: pos === 0 ? 0.35 : 1 }}>▲</button>
                    <button onClick={() => move(pos, +1)} disabled={pos === shownSeq.length - 1} style={{ ...chipBase, padding: '3px 9px', opacity: pos === shownSeq.length - 1 ? 0.35 : 1 }}>▼</button>
                  </span>
                )}
              </div>
            )
          })}
        </div>
        {!done && (
          <button className="btn-press" onClick={() => {
            const a = new Array(pool.length).fill(null)
            seq.forEach((itemIdx, pos) => { a[itemIdx] = pos })
            onSubmit(a)
          }} style={{
            marginTop: 12, padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'var(--c-brand)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
          }}>{t('pbqSubmit')}</button>
        )}
      </div>
    )
  }

  // ---- matching + categorize (select-then-place AND drag-and-drop) ------
  const targets = isMatching ? pbq.right : pbq.categories
  const unplaced = pool.map((_, i) => i).filter(i => liveAssign[i] === null || liveAssign[i] === undefined)
  const allPlaced = unplaced.length === 0

  const placeItem = (ii, ti) => {
    if (done) return
    setAssign(prev => prev.map((v, i) => (i === ii ? ti : v)))
    setSelected(sel => (sel === ii ? null : sel))
  }
  const unplaceItem = (ii, reselect = false) => {
    if (done) return
    setAssign(prev => prev.map((v, i) => (i === ii ? null : v)))
    setSelected(reselect ? ii : null)
  }

  const chipDragProps = (ii) => done ? undefined : {
    draggable: true,
    onDragStart: (e) => { e.dataTransfer.setData('text/plain', pool[ii]); e.dataTransfer.effectAllowed = 'move'; setDragIdx(ii) },
    onDragEnd: () => { setDragIdx(null); setDragOverT(null) },
  }
  const dropZoneProps = (zone, onDropItem) => done ? {} : {
    onDragOver: (e) => {
      if (dragIdx === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragOverT !== zone) setDragOverT(zone)
    },
    onDragLeave: () => setDragOverT(cur => (cur === zone ? null : cur)),
    onDrop: (e) => {
      if (dragIdx === null) return
      e.preventDefault()
      onDropItem(dragIdx)
      setDragIdx(null)
      setDragOverT(null)
    },
  }

  return (
    <div>
      {!done && (
        <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginBottom: 8 }}>{t('pbqSelectHint')}</div>
      )}
      {/* pool of unplaced chips — also a drop zone to take a placed item back */}
      {!done && (
        <div {...dropZoneProps('pool', (ii) => unplaceItem(ii))} style={{
          display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10, minHeight: 34, padding: '6px 8px',
          border: `1px dashed ${dragOverT === 'pool' ? 'var(--c-brand)' : 'var(--c-border)'}`, borderRadius: 10,
          background: dragOverT === 'pool' ? 'rgba(223,37,64,.05)' : 'transparent',
        }}>
          {unplaced.length === 0
            ? <span style={{ fontSize: 11, color: 'var(--c-ink-faint)', alignSelf: 'center' }}>✓</span>
            : unplaced.map(ii => (
              <Chip key={ii} text={pool[ii]} icon={iconFor(pbq, pool[ii])} selected={selected === ii} dragProps={chipDragProps(ii)}
                onClick={() => setSelected(selected === ii ? null : ii)} />
            ))}
        </div>
      )}
      {/* targets */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {targets.map((tg, ti) => {
          const placedHere = pool.map((_, i) => i).filter(i => liveAssign[i] === ti)
          const droppable = !done && (dragIdx !== null || selected !== null)
          return (
            <div key={ti} onClick={() => { if (!done && selected !== null) placeItem(selected, ti) }}
              {...dropZoneProps(ti, (ii) => placeItem(ii, ti))} style={{
              ...box,
              cursor: !done && selected !== null ? 'pointer' : 'default',
              borderColor: dragOverT === ti ? 'var(--c-brand)' : droppable ? 'var(--c-brand)' : 'var(--c-border)',
              borderStyle: droppable && dragOverT !== ti ? 'dashed' : 'solid',
              background: dragOverT === ti ? 'rgba(223,37,64,.06)' : box.background,
              boxShadow: dragOverT === ti ? '0 0 0 3px rgba(223,37,64,.12)' : 'none',
            }}>
              <div style={{ fontSize: isMatching ? 12 : 12.5, fontWeight: isMatching ? 500 : 800, color: isMatching ? 'var(--c-ink)' : 'var(--c-brand)', marginBottom: placedHere.length || !done ? 6 : 0, lineHeight: 1.5 }}>
                {!isMatching && iconFor(pbq, tg) && <span style={{ fontSize: 14, marginRight: 6 }}>{iconFor(pbq, tg)}</span>}
                {tg}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                {placedHere.map(ii => {
                  const p = per?.[ii]
                  return (
                    <span key={ii} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
                      <Chip text={pool[ii]} icon={iconFor(pbq, pool[ii])} correct={p ? p.correct : undefined} dragProps={chipDragProps(ii)}
                        onClick={!done ? (e) => { e.stopPropagation(); unplaceItem(ii, true) } : undefined} />
                      {p && !p.correct && <Expected text={p.expectedText} />}
                    </span>
                  )
                })}
                {placedHere.length === 0 && !done && (
                  <span style={{ fontSize: 10, color: 'var(--c-ink-faint)' }}>…</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {!done && (
        <button className="btn-press" onClick={() => onSubmit([...assign])} disabled={!allPlaced} style={{
          marginTop: 12, padding: '9px 22px', borderRadius: 8, border: 'none',
          cursor: allPlaced ? 'pointer' : 'default', opacity: allPlaced ? 1 : 0.45,
          background: 'var(--c-brand)', color: '#fff', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        }}>{t('pbqSubmit')}</button>
      )}
    </div>
  )
}
