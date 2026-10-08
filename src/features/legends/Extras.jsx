// The small things that make an area feel like a place (all optional, none of them blocks the ladder):
//   📖 Story     the area's opening story (the learned language for a language mode, tappable), shown open until read
//   📚 Codex     every item of the area with its tier (new, bronze, silver, gold), one constellation per level
//   ⚡ Blitz     a quick timed recall of the area's GOLD items, graded locally (no AI): gold fades if it slips
//   🛂 Passport  the area's "I can..." lines, stamped once the area is cleared (and a map-wide passport)
//   🎁 Chest     a cleared area's treasure (a bonus phrase or fact), opened by answering one question
//   🗓 Journey   a heatmap of the days Legends was played (map header)
import { ctxErrorText } from '../kit/aiError'
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays, Modal, ProgressBar, tCount } from '../ui'
import { holdLegendsSecret } from './helpContext'
import { matchTyped } from '../kit/grade'
import { itemTier, areaCodex, patchArea, patchItem, CODEX_TIERS, JOURNEY_DAYS, journeyCells } from './map'
import { updateMap, LEGENDS_ID } from './store'
import { addItemsToDeck } from './deck'
import { imeActive } from '../../utils/keys'

export const TIER_LOOK = { new: { icon: '⚪', color: 'var(--c-ink-faint)' }, bronze: { icon: '🥉', color: 'color-mix(in srgb, var(--c-warning) 55%, var(--c-danger))' }, silver: { icon: '🥈', color: 'var(--c-ink-dim)' }, gold: { icon: '🥇', color: 'var(--c-warning)' } } // theme tokens: both themes
export const BLITZ = { minGold: 3, max: 8, seconds: 10 }
const JOURNEY_WEEKS = Math.ceil(JOURNEY_DAYS / 7)

// A recall prompt for an item: its meaning (first line of the back) → type the front. Rule items (the front is a
// question) and long fronts are not recall material.
export function recallOf(it) {
  const front = String(it?.front || '').trim()
  const cue = String(it?.back || '').split('\n')[0].trim()
  if (!front || !cue || it.kind === 'rule' || front.length > 40 || /\?$/.test(front)) return null
  const accepted = [...new Set(front.split('/').map((s) => s.replace(/\([^)]*\)/g, '').trim()).filter(Boolean))]
  return accepted.length ? { cue, accepted } : null
}

const zoomOf = (ctx) => (typeof ctx.getZoom === 'function' && ctx.getZoom()) || 1
const pill = (color) => ({ fontFamily: FONT.body, fontWeight: 900, fontSize: 12.5, color, background: 'transparent', border: `2px solid color-mix(in srgb, ${color} 45%, transparent)`, borderRadius: RADIUS.pill, padding: '3px 11px', cursor: 'pointer' })

// ── Story ──────────────────────────────────────────────────────────────────────────────────────────────────────
function StoryCard({ ctx, modeId, area }) {
  const { t } = ctx
  const [open, setOpen] = useState(!area.storySeen)
  if (!area.story?.length) return null
  const sid = `lg-story-${area.id}`
  const seen = () => { setOpen(false); if (!area.storySeen) updateMap(modeId, (m) => (m ? patchArea(m, area.id, { storySeen: true }) : m)) }
  if (!open) return <button type="button" onClick={() => setOpen(true)} style={pill(C.info)}>📖 {t('lg_story')}</button>
  return (
    <div style={{ width: '100%', padding: '10px 12px', borderRadius: RADIUS.md, background: `color-mix(in srgb, ${C.info} 8%, ${C.surface})`, border: `2px solid color-mix(in srgb, ${C.info} 35%, transparent)` }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.info, marginBottom: 4 }}>📖 {t('lg_story')}</div>
      {area.story.map((line, i) => (
        <div key={i} style={{ fontSize: 14.5, lineHeight: 1.5, color: C.ink }}>
          {ctx.words && ctx.subject.isLanguage ? ctx.words.tappable(line, `${sid}-${i}`) : line}
          {ctx.words && ctx.subject.isLanguage && ctx.words.popup(`${sid}-${i}`)}
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
        <button type="button" onClick={seen} style={pill(C.info)}>{area.storySeen ? t('lg_storyHide') : t('lg_storyGotIt')}</button>
      </div>
    </div>
  )
}

// ── Codex: tiers, constellations, blitz ────────────────────────────────────────────────────────────────────────
// One constellation per level: its items as stars on a small arc, lit by tier, joined once every star is silver+.
function Constellation({ items, title }) {
  const W = 150, H = 64
  const pts = items.map((_, i) => {
    const a = Math.PI * (0.15 + 0.7 * (items.length > 1 ? i / (items.length - 1) : 0.5))
    return { x: W / 2 - Math.cos(a) * (W / 2 - 18), y: H - 12 - Math.sin(a) * (H - 26) }
  })
  const lit = items.every((it) => ['silver', 'gold'].includes(itemTier(it)))
  const size = { new: 3, bronze: 4, silver: 5, gold: 6.5 }
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 2 }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" style={{ background: 'color-mix(in srgb, var(--c-purple) 12%, var(--c-surface-sunken))', borderRadius: 10 }}>
        {pts.slice(1).map((p, i) => <line key={i} x1={pts[i].x} y1={pts[i].y} x2={p.x} y2={p.y} stroke={lit ? 'var(--c-warning)' : 'var(--c-border-strong)'} strokeWidth={lit ? 1.6 : 1} strokeDasharray={lit ? undefined : '3 3'} />)}
        {pts.map((p, i) => { const tier = itemTier(items[i]); return <circle key={i} cx={p.x} cy={p.y} r={size[tier]} fill={TIER_LOOK[tier].color} stroke="var(--c-surface)" strokeWidth={tier === 'gold' ? 1.4 : 0.6} /> })}
      </svg>
      <div style={{ fontSize: 11, fontWeight: 800, color: lit ? C.warning : C.inkDim, maxWidth: W, textAlign: 'center', lineHeight: 1.2 }}>{lit ? '✨ ' : ''}{title}</div>
    </div>
  )
}

function Blitz({ ctx, modeId, area, onDone }) {
  useEffect(() => { holdLegendsSecret(true); return () => holdLegendsSecret(false) }, []) // answers are live: none to Help
  const { t } = ctx
  const pool = useRef(area.items.filter((it) => itemTier(it) === 'gold' && recallOf(it)).sort(() => Math.random() - 0.5).slice(0, BLITZ.max)).current
  const [i, setI] = useState(0)
  const [text, setText] = useState('')
  const [left, setLeft] = useState(BLITZ.seconds)
  const [shown, setShown] = useState(null) // { ok, answer } after each item
  const results = useRef([])
  const inputRef = useRef(null)
  const it = pool[i]
  const r = it ? recallOf(it) : null
  useEffect(() => { inputRef.current?.focus() }, [i])
  useEffect(() => {
    if (shown || !it) return
    if (left <= 0) { answer(true); return }
    const id = setTimeout(() => setLeft((s) => s - 1), 1000)
    return () => clearTimeout(id)
    // Keyed on the countdown itself: with no list, every keystroke re-rendered, cleared the pending tick and restarted
    // a full second, so the timer never ran while the learner typed.
  }, [i, shown, left]) // eslint-disable-line react-hooks/exhaustive-deps
  // Claimed with refs, not state: a double Enter read `shown` as still empty and pushed the answer twice, and a double
  // click on the last Continue saved the counts and paid the XP twice.
  const answeredFor = useRef(-1)
  const finishing = useRef(false)
  const answer = (timeout = false) => {
    if (shown || !r || answeredFor.current === i) return
    answeredFor.current = i
    const ok = !timeout && !!matchTyped(text, r.accepted)
    results.current.push({ id: it.id, ok })
    setShown({ ok, answer: r.accepted[0] })
  }
  const next = async () => {
    if (i + 1 < pool.length) { setI(i + 1); setText(''); setLeft(BLITZ.seconds); setShown(null); return }
    if (finishing.current) return
    finishing.current = true
    const res = results.current
    // Every answer counts toward the item's record: a slipped gold item fades to silver on its own.
    const saved = await updateMap(modeId, (m) => res.reduce((mm, x) => {
      const cur = mm?.areas?.find((a) => a.id === area.id)?.items?.find((y) => y.id === x.id)
      return cur ? patchItem(mm, area.id, x.id, { seen: (cur.seen || 0) + 1, right: (cur.right || 0) + (x.ok ? 1 : 0) }) : mm
    }, m))
    // XP only once the tallies saved (updateMap answers undefined on a failed read or write), like every other step.
    if (saved !== undefined) ctx.emit(EVENTS.PRACTICE_DONE, { source: `${LEGENDS_ID}-blitz`, mode: modeId, total: res.length, correct: res.filter((x) => x.ok).length })
    onDone(res)
  }
  if (!it) return <EbiSays pose={poseFile('confused')}>{t('lg_blitzNone', { n: BLITZ.minGold })}</EbiSays>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.warning }}>⚡ {t('lg_blitz')}</span>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, fontWeight: 800, color: C.inkDim }}>{i + 1} / {pool.length}</span>
      </div>
      <ProgressBar value={shown ? 0 : left} max={BLITZ.seconds} color={left <= 3 ? C.danger : C.warning} label={t('lg_blitz')} />
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 20, color: C.ink }}>{r.cue}</div>
      {/* readOnly, not disabled, once answered: a disabled box never gets the Enter that continues. Enter on an empty
          box waits like the disabled Check (it recorded a miss on the gold item, fading it). */}
      <input ref={inputRef} value={text} readOnly={!!shown} onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !imeActive(e)) { e.preventDefault(); if (shown) next(); else if (text.trim()) answer() } }}
        placeholder={t('kit_typePlaceholder')} style={{ padding: '10px 12px', fontSize: 16, fontFamily: FONT.body, borderRadius: RADIUS.md, border: `2px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
      {shown && <div style={{ fontWeight: 900, color: shown.ok ? C.success : C.danger }}>{shown.ok ? `✓ ${t('kit_correct')}` : `✗ ${t('kit_answerWas', { a: shown.answer })}`}</div>}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {shown ? <ChunkyButton color={shown.ok ? C.success : C.warning} onClick={next}>{t('kit_continue')}</ChunkyButton>
          : <ChunkyButton color={C.success} disabled={!text.trim()} onClick={() => answer()}>{t('kit_check')}</ChunkyButton>}
      </div>
    </div>
  )
}

function CodexModal({ ctx, modeId, area, onClose }) {
  const { t } = ctx
  const [blitz, setBlitz] = useState(null) // null | 'run' | results
  const codex = areaCodex(area)
  const byId = new Map(area.items.map((it) => [it.id, it]))
  const levels = (area.nodes || []).filter((n) => ['learn', 'rule', 'scene', 'practice'].includes(n.kind)).map((n) => ({ n, items: (n.itemIds || []).map((id) => byId.get(id)).filter(Boolean) })).filter((l) => l.items.length)
  const goldRecall = area.items.filter((it) => itemTier(it) === 'gold' && recallOf(it)).length
  const unadded = area.items.filter((it) => !it.cardNoteId)
  const [addingAll, setAddingAll] = useState(false)
  const addingAllRef = useRef(false)
  // Anki closed or no deck for the mode: nothing can be added (the button stayed live and failed on the click).
  const canAdd = !!ctx.subject.modeDeck && ctx.ankiConnected !== false
  return (
    <Modal open onClose={onClose} width={720} zoom={zoomOf(ctx)}>
      {blitz === 'run' ? <Blitz ctx={ctx} modeId={modeId} area={area} onDone={(res) => setBlitz(res)} /> : (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.ink }}>📔 {t('lg_codex')}: {area.title}</span>
            <button type="button" onClick={onClose} aria-label={t('lg_back')} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', fontSize: 20, color: C.inkFaint, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13.5, fontWeight: 800 }}>
            {CODEX_TIERS.map((k) => <span key={k} style={{ color: TIER_LOOK[k].color }}>{TIER_LOOK[k].icon} {t(`lg_tier_${k}`)} {codex[k]}</span>)}
            {codex.complete && <span style={{ color: C.warning }}>🏆 {t('lg_codexComplete')}</span>}
          </div>
          <div style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.45 }}>{t('lg_codexHow')}</div>
          {Array.isArray(blitz) && <div style={{ fontWeight: 900, color: blitz.filter((x) => x.ok).length * 2 >= blitz.length ? C.success : C.warning }}>⚡ {t('lg_blitzDone', { c: blitz.filter((x) => x.ok).length, n: blitz.length })}</div>}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <ChunkyButton color={C.warning} disabled={goldRecall < BLITZ.minGold} onClick={() => setBlitz('run')}>⚡ {t('lg_blitzStart', { n: Math.min(BLITZ.max, goldRecall) })}</ChunkyButton>
            {goldRecall < BLITZ.minGold && <span style={{ fontSize: 12.5, color: C.inkDim }}>{t('lg_blitzNone', { n: BLITZ.minGold })}</span>}
            {unadded.length > 0 && <ChunkyButton variant="ghost" color={C.success} disabled={addingAll || !canAdd} onClick={async () => { if (addingAllRef.current) return; addingAllRef.current = true; setAddingAll(true); try { const r = await addItemsToDeck(ctx, modeId, area.id, unadded); const msg = r.added ? t('lg_codexAdded', { n: r.added }) : r.failed ? (r.message || t('lg_noDeck')) : ''; if (msg) ctx.notify?.(msg) } finally { addingAllRef.current = false; setAddingAll(false) } }}>＋ {t('lg_codexAddAll', { n: unadded.length })}</ChunkyButton>}
            {unadded.length > 0 && !canAdd && <span style={{ fontSize: 12.5, color: C.warning }}>{t('lg_noDeck')}</span>}
          </div>
          {levels.length > 0 && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {levels.map(({ n, items }) => <Constellation key={n.id} items={items} title={n.title || t(`lg_kind_${n.kind}`)} />)}
            </div>
          )}
          <div style={{ display: 'grid', gap: 6 }}>
            {area.items.map((it) => {
              const tier = itemTier(it)
              return (
                <div key={it.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span role="img" aria-label={t(`lg_tier_${tier}`)} title={t(`lg_tier_${tier}`)} style={{ fontSize: 16 }}>{TIER_LOOK[tier].icon}</span>
                  <span style={{ fontWeight: 900, color: C.ink, minWidth: 120, overflowWrap: 'anywhere' }}>{it.front}</span>
                  <span style={{ flex: 1, fontSize: 13, color: C.inkDim, overflowWrap: 'anywhere' }}>{String(it.back || '').split('\n')[0]}</span>
                  <span style={{ fontSize: 11.5, color: C.inkFaint, whiteSpace: 'nowrap' }}>{it.seen ? `${it.right || 0}/${it.seen}` : ''}{it.cardNoteId ? ' · 🃏' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ── Chest ──────────────────────────────────────────────────────────────────────────────────────────────────────
function ChestModal({ ctx, modeId, area, onClose }) {
  useEffect(() => { holdLegendsSecret(true); return () => holdLegendsSecret(false) }, [])
  const { t } = ctx
  const pick = useRef((() => { const list = area.items.map((it) => ({ it, r: recallOf(it) })).filter((x) => x.r); return list[Math.floor(Math.random() * list.length)] || null })()).current
  const [text, setText] = useState('')
  const [state, setState] = useState(area.chestOpened || !pick ? 'open' : 'ask') // ask | wrong | open
  const [adding, setAdding] = useState(false)
  // Added this session: stays retired even when the map save failed (cards allow duplicates; it was added twice).
  const addedRef = useRef(false)
  const [addedNow, setAddedNow] = useState(false)
  const open = () => { setState('open'); if (!area.chestOpened) updateMap(modeId, (m) => (m ? patchArea(m, area.id, { chestOpened: true }) : m)) }
  // Nothing to recall (rule items, long fronts): it opens straight away, and is recorded as opened (the map kept 🔒🎁).
  useEffect(() => { if (!pick && !area.chestOpened) updateMap(modeId, (m) => (m ? patchArea(m, area.id, { chestOpened: true }) : m)) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Enter on an empty box is not an answer (Check is disabled then; Enter said "wrong" before anything was typed).
  const check = () => { if (!text.trim()) return; if (pick && matchTyped(text, pick.r.accepted)) open(); else setState('wrong') }
  const add = async () => {
    if (addedRef.current || adding) return
    setAdding(true)
    try {
      await ctx.cards.addNew(ctx.subject.modeDeck, ctx.cards.frontHtml(area.bonus.front), ctx.cards.backHtml(area.bonus.back), ['ebiki', 'legends', 'lg-bonus'])
      addedRef.current = true
      setAddedNow(true)
      await updateMap(modeId, (m) => (m ? patchArea(m, area.id, (a) => ({ bonus: { ...a.bonus, added: true } })) : m))
      ctx.notify?.(t('lg_chestAdded'))
    } catch (e) { ctx.notify?.(ctxErrorText(ctx, e)) } finally { setAdding(false) }
  }
  return (
    <Modal open onClose={onClose} width={520} zoom={zoomOf(ctx)}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.warning }}>🎁 {t('lg_chest')}</div>
        {state !== 'open' ? (
          <>
            <EbiSays pose={poseFile('happy')}>{t('lg_chestAsk')}</EbiSays>
            <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 19, color: C.ink }}>{pick.r.cue}</div>
            <input autoFocus value={text} onChange={(e) => { setText(e.target.value); if (state === 'wrong') setState('ask') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !imeActive(e)) { e.preventDefault(); check() } }}
              placeholder={t('kit_typePlaceholder')} style={{ padding: '10px 12px', fontSize: 16, fontFamily: FONT.body, borderRadius: RADIUS.md, border: `2px solid ${state === 'wrong' ? C.danger : C.border}`, background: C.surfaceAlt, color: C.ink }} />
            {state === 'wrong' && <div style={{ color: C.danger, fontWeight: 800 }}>{t('lg_chestWrong')}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <ChunkyButton variant="ghost" color={C.inkDim} onClick={onClose}>{t('lg_back')}</ChunkyButton>
              <ChunkyButton color={C.warning} disabled={!text.trim()} onClick={check}>🔑 {t('lg_chestOpen')}</ChunkyButton>
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 44, textAlign: 'center' }}>✨🎁✨</div>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.ink, textAlign: 'center' }}>{area.bonus.front}</div>
            <div style={{ fontSize: 14.5, color: C.inkDim, lineHeight: 1.5, whiteSpace: 'pre-wrap', textAlign: 'center' }}>{area.bonus.back}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              {area.bonus.added || addedNow ? <span style={{ fontWeight: 900, color: C.success }}>✓ {t('lg_chestInDeck')}</span>
                : <ChunkyButton color={C.success} disabled={adding || !ctx.subject.modeDeck || ctx.ankiConnected === false} onClick={add}>＋ {t('lg_chestAdd')}</ChunkyButton>}
              <ChunkyButton variant="ghost" color={C.inkDim} onClick={onClose}>{t('lg_back')}</ChunkyButton>
            </div>
            {!(area.bonus.added || addedNow) && (!ctx.subject.modeDeck || ctx.ankiConnected === false) && <div style={{ fontSize: 12.5, color: C.inkDim, textAlign: 'center' }}>{t('lg_noDeck')}</div>}
          </>
        )}
      </div>
    </Modal>
  )
}

// ── Passport ───────────────────────────────────────────────────────────────────────────────────────────────────
export function PassportModal({ ctx, map, onClose }) {
  const { t } = ctx
  const areas = map.areas.filter((a) => a.canDo?.length)
  return (
    <Modal open onClose={onClose} width={620} zoom={zoomOf(ctx)}>
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 22, color: C.ink }}>🛂 {t('lg_passport')}</span>
          <button type="button" onClick={onClose} aria-label={t('lg_back')} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', fontSize: 20, color: C.inkFaint, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: C.inkDim }}>{t('lg_passportHow')}</div>
        {!areas.length && <div style={{ color: C.inkDim }}>{t('lg_passportEmpty')}</div>}
        {areas.map((a) => {
          const stamped = a.status === 'done'
          return (
            <div key={a.id} style={{ padding: '10px 12px', borderRadius: RADIUS.md, border: `2px ${stamped ? 'solid' : 'dashed'} ${stamped ? C.success : C.border}`, position: 'relative' }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 16, color: stamped ? C.ink : C.inkDim, paddingRight: stamped ? 104 : 0 }}>{a.title}</div>
              {a.canDo.map((line, i) => <div key={i} style={{ fontSize: 13.5, color: stamped ? C.ink : C.inkFaint, lineHeight: 1.5 }}>{stamped ? '✅' : '▫️'} {line}</div>)}
              {stamped && <span aria-hidden="true" style={{ position: 'absolute', right: 10, top: 8, transform: 'rotate(-12deg)', border: `3px solid ${C.success}`, color: C.success, borderRadius: 8, padding: '2px 8px', fontFamily: FONT.display, fontWeight: 900, fontSize: 13, letterSpacing: '.1em', opacity: 0.85 }}>{t('lg_stamped')}</span>}
            </div>
          )
        })}
      </div>
    </Modal>
  )
}

// ── Journey heatmap (map header) ───────────────────────────────────────────────────────────────────────────────
export function Journey({ t, days = {} }) {
  const cells = journeyCells(new Date(), days, JOURNEY_WEEKS)
  const played = cells.filter((c) => c.n > 0).length
  const shadeFor = (n) => (!n ? 'var(--c-surface-sunken)' : n < 2 ? 'color-mix(in srgb, var(--c-success) 40%, var(--c-surface))' : n < 4 ? 'color-mix(in srgb, var(--c-success) 70%, var(--c-surface))' : 'var(--c-success)')
  return (
    <div className="tip" data-tip={tCount(t, 'lg_journeyTip', played)} style={{ display: 'grid', gridTemplateRows: 'repeat(7, 7px)', gridAutoFlow: 'column', gap: 2 }} role="img" aria-label={tCount(t, 'lg_journeyTip', played)}>
      {cells.map((c) => <span key={c.key} style={{ width: 7, height: 7, borderRadius: 2, background: shadeFor(c.n), opacity: c.future ? 0.35 : 1 }} />)}
    </div>
  )
}

// ── The row under an area's title ──────────────────────────────────────────────────────────────────────────────
export function AreaExtras({ ctx, modeId, area }) {
  const { t } = ctx
  const [modal, setModal] = useState('') // codex | chest
  if (area.status === 'locked' || !area.detailed) return null
  const codex = areaCodex(area)
  const done = area.status === 'done'
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
      <StoryCard ctx={ctx} modeId={modeId} area={area} />
      <button type="button" onClick={() => setModal('codex')} style={pill(C.purple)}>📔 {t('lg_codex')} {codex.gold}/{codex.total}{codex.complete ? ' 🏆' : ''}</button>
      {done && area.bonus && <button type="button" onClick={() => setModal('chest')} style={pill(C.warning)}>{area.chestOpened ? '🎁' : '🔒🎁'} {t('lg_chest')}</button>}
      {done && area.canDo?.length > 0 && <span style={{ fontSize: 12, fontWeight: 900, color: C.success }}>🛂 {t('lg_stamped')}</span>}
      {modal === 'codex' && <CodexModal ctx={ctx} modeId={modeId} area={area} onClose={() => setModal('')} />}
      {modal === 'chest' && <ChestModal ctx={ctx} modeId={modeId} area={area} onClose={() => setModal('')} />}
    </div>
  )
}
