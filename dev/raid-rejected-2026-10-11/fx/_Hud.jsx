// The raid ability's VISIBLE STATE in the arena, drawn from the module's hud(state, ctx) description (the item types
// are listed in abilities/_contract.js). Styled once here, themed from the tokens, so every boss's meter looks like
// part of the same game. Also the marks an ability puts on the health bar (barMarks).
//
// ANTICIPATION (design v2.1, 1.3): an item with `ready: true` (one step from its trigger: the last head, the jar one
// cube short) pulses (scale 1 > 1.06 and a glow, every 1.2 s); an item whose value changed since the last render
// BUMPS (scale 1 > 1.25 > 1 in 180 ms with a glow ring), keyed by its index + type. `calm` (focus mode, Still bosses,
// reduced motion) shows a ready item as a static ring and never bumps: a static change is not an animation.
import { useRef } from 'react'
import { C, FONT, RADIUS } from '../../../config/tokens'

export const HUD_MOTION = { bumpMs: 180, readyMs: 1200, fillMs: 200 }
const POP = 'cubic-bezier(.34,1.56,.64,1)'
const HUD_CSS = `
@keyframes lgHudBumpA { 0% { transform: scale(1) } 45% { transform: scale(1.25); box-shadow: 0 0 0 3px var(--lg-hud-glow) } 100% { transform: scale(1); box-shadow: 0 0 0 0 transparent } }
@keyframes lgHudBumpB { 0% { transform: scale(1) } 45% { transform: scale(1.25); box-shadow: 0 0 0 3px var(--lg-hud-glow) } 100% { transform: scale(1); box-shadow: 0 0 0 0 transparent } }
@keyframes lgHudReady { 0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 transparent } 50% { transform: scale(1.06); box-shadow: 0 0 8px 2px var(--lg-hud-glow) } }
`
// What a HUD item SHOWS (its values), to notice a change between renders.
export const hudSig = (it) => JSON.stringify([it.n, it.max, it.value, it.pos, it.cells, (it.items || []).map((x) => [x.icon, x.labelKey]), (it.bars || []).map((b) => [b.value, b.active]), it.key, it.vars])

const TONE = { purple: C.purple, danger: C.danger, warning: C.warning, success: C.success, info: C.info, brand: C.brand, ink: C.inkDim }
const tone = (x) => TONE[x] || C.purple

const label = (t, it) => (it.labelKey ? t(it.labelKey, it.vars || {}) : '')

function Pips({ it, size }) {
  const max = Math.max(0, Math.min(24, Number(it.max) || 0))
  const n = Math.max(0, Number(it.n) || 0)
  const col = tone(it.tone)
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {Array.from({ length: max }, (_, i) => {
        const on = i < n
        return it.icon
          ? <span key={i} style={{ fontSize: size, lineHeight: 1, filter: on ? 'none' : 'grayscale(1) opacity(.3)' }}>{on ? it.icon : (it.emptyIcon || it.icon)}</span>
          : <span key={i} style={{ width: size * 0.7, height: size * 0.7, borderRadius: '50%', background: on ? col : 'transparent', border: `2px solid ${col}`, opacity: on ? 1 : 0.45 }} />
      })}
    </span>
  )
}

function Gauge({ value, max, col, w = 70, h = 8 }) {
  const share = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0
  return (
    <span style={{ display: 'inline-block', width: w, height: h, borderRadius: RADIUS.pill, background: C.surfaceSunken, border: `1.5px solid color-mix(in srgb, ${col} 45%, transparent)`, overflow: 'hidden', verticalAlign: 'middle' }}>
      <span style={{ display: 'block', width: `${share * 100}%`, height: '100%', background: col, transition: `width ${HUD_MOTION.fillMs}ms ease-out` }} />
    </span>
  )
}

function Track({ it, size }) {
  const max = Math.max(1, Math.min(12, Number(it.max) || 1))
  const pos = Math.max(0, Math.min(max, Number(it.pos) || 0))
  const col = tone(it.tone)
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      {Array.from({ length: max + 1 }, (_, i) => (
        <span key={i} style={{ display: 'inline-grid', placeItems: 'center', width: size, height: size, borderRadius: '50%', fontSize: size * 0.8,
          border: `2px solid color-mix(in srgb, ${col} ${i === pos ? 100 : 35}%, transparent)`, background: i === pos ? `color-mix(in srgb, ${col} 22%, transparent)` : 'transparent' }}>
          {i === pos ? (it.icon || '●') : ''}
        </span>
      ))}
    </span>
  )
}

// hex7: the centre cell plus six around it; row: a plain row. Cell values: 0 empty, 1 lit, 2 marked.
function Board({ it, size }) {
  const cells = Array.isArray(it.cells) ? it.cells.slice(0, 24) : []
  const col = tone(it.tone)
  const cell = (v, i) => (
    <span key={i} style={{ width: size, height: size, clipPath: 'polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0 50%)',
      background: v === 2 ? C.warning : v ? col : `color-mix(in srgb, ${col} 18%, ${C.surfaceSunken})` }} />
  )
  if (it.shape === 'hex7' && cells.length >= 7) {
    const [c, ...ring] = cells
    return (
      <span style={{ display: 'inline-grid', gridTemplateColumns: `repeat(3, ${size}px)`, gap: 1, alignItems: 'center', justifyItems: 'center' }}>
        {cell(ring[0], 'a')}{cell(ring[1], 'b')}{cell(ring[2], 'c')}
        {cell(ring[5], 'f')}{cell(c, 'x')}{cell(ring[3], 'd')}
        <span />{cell(ring[4], 'e')}<span />
      </span>
    )
  }
  return <span style={{ display: 'inline-flex', gap: 2 }}>{cells.map(cell)}</span>
}

function Item({ t, it, compact }) {
  const size = compact ? 11 : 14
  const col = tone(it.tone)
  const text = label(t, it)
  let body = null
  if (it.type === 'pips') body = <Pips it={it} size={size} />
  else if (it.type === 'gauge') body = <Gauge value={Number(it.value) || 0} max={Number(it.max) || 0} col={col} />
  else if (it.type === 'track') body = <Track it={it} size={size} />
  else if (it.type === 'board') body = <Board it={it} size={size} />
  else if (it.type === 'coins') body = <span style={{ fontWeight: 900, color: col }}>{it.icon || '🪙'} {Number(it.n) || 0}</span>
  else if (it.type === 'queue') {
    body = (
      <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
        {(it.items || []).slice(0, 5).map((x, i) => (
          <span key={i} style={{ fontSize: i === 0 ? size + 4 : size, opacity: i === 0 ? 1 : 0.55, padding: i === 0 ? '0 4px' : 0, borderRadius: RADIUS.sm,
            border: i === 0 ? `2px solid ${tone(x.tone || it.tone)}` : 'none', color: tone(x.tone || it.tone), fontWeight: 900 }}>
            {x.icon}{i === 0 && x.labelKey ? ` ${t(x.labelKey, x.vars || {})}` : ''}
          </span>
        ))}
      </span>
    )
  } else if (it.type === 'bars') {
    body = (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {(it.bars || []).slice(0, 4).map((b, i) => (
          <span key={i} style={{ display: 'inline-flex', gap: 3, alignItems: 'center', padding: '0 3px', borderRadius: RADIUS.sm, outline: b.active ? `2px solid ${tone(b.tone)}` : 'none' }}>
            {b.icon && <span style={{ fontSize: size }}>{b.icon}</span>}
            <Gauge value={Number(b.value) || 0} max={Number(b.max) || 0} col={tone(b.tone)} w={compact ? 36 : 48} h={compact ? 6 : 8} />
          </span>
        ))}
      </span>
    )
  } else if (it.type === 'chip') {
    return <span style={{ fontSize: 11.5, fontWeight: 800, color: col, border: `1.5px solid color-mix(in srgb, ${col} 45%, transparent)`, borderRadius: RADIUS.pill, padding: '1px 8px', whiteSpace: 'nowrap' }}>{it.icon ? `${it.icon} ` : ''}{it.key ? t(it.key, it.vars || {}) : ''}</span>
  } else return null
  return (
    <span role="img" aria-label={text || undefined} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 800, color: col, fontFamily: FONT.body }}>
      {body}
      {text && <span style={{ whiteSpace: 'nowrap' }}>{text}</span>}
    </span>
  )
}

// The bump counters (pure): `memo` = { prev: { id: sig }, count: { id: n } } kept across renders; returns each item's
// count, grown by one for an item (index + type) whose values changed since the previous call.
export function trackBumps(memo, items) {
  return items.map((it, i) => {
    const id = `${i}-${it.type}`
    const sig = hudSig(it)
    if (memo.prev[id] !== undefined && memo.prev[id] !== sig) memo.count[id] = (memo.count[id] || 0) + 1
    memo.prev[id] = sig
    return memo.count[id] || 0
  })
}

// The row of HUD items under the health bar (nothing when the ability shows none).
export function AbilityHud({ t, items, compact = false, calm = false, children }) {
  const list = Array.isArray(items) ? items.filter(Boolean) : []
  // Bumps: a counter per item (index + type) that grows when the item's values change; its parity picks one of two
  // identical keyframes, so the animation restarts without remounting the item (a gauge keeps its fill transition).
  const memo = useRef({ prev: {}, count: {} })
  if (!list.length && !children) return null
  const bumps = trackBumps(memo.current, list)
  return (
    <div data-ability-hud="" style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 12, flexWrap: 'wrap', minWidth: 0 }}>
      <style>{HUD_CSS}</style>
      {list.map((it, i) => {
        const id = `${i}-${it.type}`
        const n = bumps[i]
        const col = tone(it.tone)
        const ready = !!it.ready
        return (
          <span key={id} data-hud-ready={ready ? '' : undefined} style={{ display: 'inline-flex', borderRadius: RADIUS.pill, '--lg-hud-glow': `color-mix(in srgb, ${col} 55%, transparent)`,
            ...(ready ? (calm ? { outline: `2px solid ${col}`, outlineOffset: 2 } : { animation: `lgHudReady ${HUD_MOTION.readyMs}ms ease-in-out infinite` }) : {}) }}>
            <span data-hud-bump={n || undefined} style={{ display: 'inline-flex', borderRadius: RADIUS.pill, animation: !calm && n ? `lgHudBump${n % 2 ? 'A' : 'B'} ${HUD_MOTION.bumpMs}ms ${POP}` : undefined }}>
              <Item t={t} it={it} compact={compact} />
            </span>
          </span>
        )
      })}
      {children}
    </div>
  )
}

// Marks on the health bar: `need` = the bar's max health; `at`/`to` are health LEFT (so `at: need` is the right end).
export function BarMarks({ marks, need }) {
  const list = Array.isArray(marks) ? marks.filter(Boolean) : []
  if (!list.length || !(need > 0)) return null
  const x = (hp) => `${Math.max(0, Math.min(1, hp / need)) * 100}%`
  return list.map((m, i) => {
    const col = tone(m.tone)
    if (m.type === 'ghost') {
      const a = Math.min(m.at, m.to)
      const b = Math.max(m.at, m.to)
      return <span key={i} aria-hidden="true" style={{ position: 'absolute', top: 0, bottom: 0, left: x(a), width: `calc(${x(b)} - ${x(a)})`, background: `repeating-linear-gradient(135deg, color-mix(in srgb, ${col} 55%, transparent) 0 4px, transparent 4px 8px)`, pointerEvents: 'none' }} />
    }
    return <span key={i} aria-hidden="true" style={{ position: 'absolute', top: -2, bottom: -2, left: x(m.at), width: 3, marginLeft: -1.5, background: col, boxShadow: `0 0 6px ${col}`, pointerEvents: 'none' }} />
  })
}
