import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { FONT } from '../config/tokens'
import { sessionUsage, subscribeUsage, summarize, rowsToShow, formatTokens, formatCost, flushUsageNow } from '../utils/tokenUsage'
import { apiFetch } from '../platform'

// The token and cost counter at the bottom right (Settings > AI & cost > "Show token and cost usage", off by
// default). The pill shows this window's session; the panel adds the all-time totals for this computer (kept by
// the server, so the overlay and a browser tab count too) and a per-model breakdown.
// Portaled to <html>, outside the body's zoom, and scaled with a transform (see Dropdown: a fixed element inside
// the zoomed body has a broken hit-test box).
// Its own host element under <html> (outside the body's zoom): React warns about rendering a <div> straight into <html>.
const usageHost = () => {
  let h = document.getElementById('ebiki-usage-host')
  if (!h) { h = document.createElement('div'); h.id = 'ebiki-usage-host'; document.documentElement.appendChild(h) }
  return h
}

export default function TokenUsageMeter({ t, getZoom, confirmDialog }) {
  const [, setTick] = useState(0)
  const [open, setOpen] = useState(false)
  const [total, setTotal] = useState(null)
  // The by-model row whose price is being typed: { key, provider, model, inp, out, error }.
  const [priceEdit, setPriceEdit] = useState(null)
  const lastFetchRef = useRef(0)
  const fetchTotal = async (force = false) => {
    if (!force && Date.now() - lastFetchRef.current < 4000) return
    lastFetchRef.current = Date.now()
    try {
      const r = await apiFetch('/api/usage')
      const d = r.ok ? await r.json() : null
      if (d && d.byModel) setTotal(d)
    } catch { /* keeps the last totals */ }
  }
  useEffect(() => subscribeUsage(() => { setTick((n) => n + 1); if (open) fetchTotal() }), [open])
  useEffect(() => { if (open) { flushUsageNow().finally(() => fetchTotal(true)) } }, [open])
  useEffect(() => { fetchTotal(true) }, []) // the pill prices this session with the user's own prices too
  const savePrice = async (provider, model, price) => {
    try {
      const r = await apiFetch('/api/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ setPrice: { provider, model, price } }) })
      if (!r.ok) throw new Error(String(r.status))
      setTotal(await r.json())
      setPriceEdit(null)
    } catch { setPriceEdit((p) => (p ? { ...p, error: true } : p)) }
  }
  useEffect(() => {
    if (!open) return
    // Esc closes only the TOP layer. A modal (Settings, whose backdrop covers this panel), an app dialog (the reset
    // confirm opens over this panel) or Ebi Studio on screen owns the key: when this listener was registered first,
    // it closed the panel hidden under Settings; registered after Settings', one Esc closed both.
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing || e.keyCode === 229) return
      if (document.querySelector('[data-app-dialog], [data-top-overlay], [aria-modal="true"]')) return
      e.preventDefault(); setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const prices = total && total.prices && typeof total.prices === 'object' ? total.prices : null
  const s = summarize(sessionUsage(), prices)
  const all = total ? summarize(total.byModel, prices) : null
  const z = (typeof getZoom === 'function' && getZoom()) || 1
  // The panel is scaled by z, so its height cap is in PRE-scale px: '60vh' grew to 120vh of real screen at zoom 2
  // and ran off the top. Capped to the window minus the pill below it (about 44 px before scaling).
  const panelMaxH = `min(60vh, calc((100vh - 24px) / ${z} - 44px))`
  // Same for the width: 300 px scaled by the zoom (405 real px at the default) ran off the left edge of a phone.
  const panelW = `min(300px, calc((100vw - 20px) / ${z}))`
  const costText = (sum) => (sum.cost > 0 || sum.unpricedTokens === 0 ? formatCost(sum.cost) : null)

  const block = (label, sum, extra) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-ink)', marginBottom: 2 }}>{label}{extra ? <span style={{ fontWeight: 500, color: 'var(--c-ink-dim)' }}> {extra}</span> : null}</div>
      {sum.calls === 0 ? <div style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>{t('usage_none')}</div> : (
        <>
          <div style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>{t('usage_tokensLine', { total: formatTokens(sum.tokens), input: formatTokens(sum.input), output: formatTokens(sum.output), calls: sum.calls })}</div>
          <div style={{ fontSize: 11, color: 'var(--c-success)', fontWeight: 700 }}>{costText(sum) ? t('usage_costLine', { cost: costText(sum) }) : t('usage_costUnknown')}</div>
          {sum.unpricedTokens > 0 && sum.cost > 0 && <div style={{ fontSize: 10, color: 'var(--c-warning)' }}>{t('usage_unpriced', { tokens: formatTokens(sum.unpricedTokens) })}</div>}
        </>
      )}
    </div>
  )

  return createPortal(
    <div style={{ position: 'fixed', right: 10, bottom: 10, zIndex: 900, transform: `scale(${z})`, transformOrigin: 'bottom right', fontFamily: FONT.body }}>
      {open && (
        <div role="dialog" data-usage-panel="" aria-label={t('usage_title')} style={{ width: panelW, maxHeight: panelMaxH, overflowY: 'auto', marginBottom: 6, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,.35)', padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-ink)' }}>{t('usage_title')}</div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('usage_close')} style={{ background: 'none', border: 'none', color: 'var(--c-ink-dim)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          {block(t('usage_session'), s)}
          {all && block(t('usage_total'), all, total.since ? t('usage_since', { date: new Date(total.since).toLocaleDateString() }) : '')}
          {all && all.rows.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--c-ink)', marginBottom: 4 }}>{t('usage_byModel')}</div>
              {rowsToShow(all.rows, 10).map((r) => {
                const key = `${r.provider}|${r.model}`
                const editing = priceEdit && priceEdit.key === key
                const own = prices && prices[key]
                const num = (v) => { const x = Number(String(v).replace(',', '.').trim()); return String(v).trim() !== '' && Number.isFinite(x) && x >= 0 && x < 10000 ? x : null }
                return (
                  <div key={key} style={{ padding: '2px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 10.5, color: 'var(--c-ink-dim)' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.model || r.provider}</span>
                      <span style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        {formatTokens(r.input + r.output)} · {r.cost === null ? t('usage_noPrice') : formatCost(r.cost)}{r.ownPrice ? ` (${t('usage_priceCustom')})` : ''}
                        <button type="button" className="ui-btn" onClick={() => setPriceEdit(editing ? null : { key, provider: r.provider, model: r.model, inp: own ? String(own[0]) : '', out: own ? String(own[1]) : '', error: false })}
                          aria-label={t('usage_setPrice')}
                          style={{ fontSize: 10, padding: '0 5px', borderRadius: 5, border: `1px solid ${r.cost === null ? 'var(--c-brand)' : 'var(--c-border)'}`, color: r.cost === null ? 'var(--c-brand)' : 'var(--c-ink-dim)', background: 'transparent', cursor: 'pointer' }}>
                          {r.cost === null ? t('usage_setPrice') : '✎'}
                        </button>
                      </span>
                    </div>
                    {editing && (() => {
                      const inp = num(priceEdit.inp), out = num(priceEdit.out)
                      const ok = inp !== null && out !== null
                      const field = { width: 64, fontSize: 11, padding: '2px 4px', borderRadius: 5, border: '1px solid var(--c-border)', background: 'var(--c-bg)', color: 'var(--c-ink)' }
                      return (
                        <div style={{ margin: '4px 0 6px', padding: 6, borderRadius: 6, background: 'var(--c-bg)', fontSize: 10.5, color: 'var(--c-ink-dim)' }}>
                          <div style={{ marginBottom: 4, lineHeight: 1.35 }}>{t('usage_priceHint')}</div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <label>{t('usage_priceIn')} <input type="text" inputMode="decimal" value={priceEdit.inp} onChange={(e) => setPriceEdit({ ...priceEdit, inp: e.target.value, error: false })} style={field} /></label>
                            <label>{t('usage_priceOut')} <input type="text" inputMode="decimal" value={priceEdit.out} onChange={(e) => setPriceEdit({ ...priceEdit, out: e.target.value, error: false })} style={field} /></label>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button type="button" className="ui-btn" disabled={!ok} onClick={() => savePrice(r.provider, r.model, [inp, out])}
                              style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 5, border: '1px solid var(--c-success)', color: 'var(--c-success)', background: 'transparent', cursor: ok ? 'pointer' : 'default', opacity: ok ? 1 : 0.5 }}>{t('usage_priceSave')}</button>
                            {own && <button type="button" className="ui-btn" onClick={() => savePrice(r.provider, r.model, null)}
                              style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 5, border: '1px solid var(--c-ink-dim)', color: 'var(--c-ink-dim)', background: 'transparent', cursor: 'pointer' }}>{t('usage_priceClear')}</button>}
                          </div>
                          {priceEdit.error && <div style={{ marginTop: 4, color: 'var(--c-danger)' }}>{t('usage_priceFailed')}</div>}
                        </div>
                      )
                    })()}
                  </div>
                )
              })}
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', lineHeight: 1.4, marginBottom: 8 }}>{t('usage_note')}</div>
          <button type="button" className="ui-btn" onClick={async () => {
            if (!(await confirmDialog(t('usage_resetConfirm')))) return
            try {
              await flushUsageNow()
              const r = await apiFetch('/api/usage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reset: true }) })
              if (r.ok) setTotal(await r.json())
            } catch { /* totals stay */ }
          }} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, border: '1px solid var(--c-danger)', color: 'var(--c-danger)', background: 'transparent', cursor: 'pointer' }}>{t('usage_reset')}</button>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="ui-btn" onClick={() => setOpen((o) => !o)} aria-label={t('usage_pillTitle')}
          style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, border: '1px solid var(--c-border)', background: 'var(--c-surface)', color: 'var(--c-ink-dim)', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.2)' }}>
          🪙 {formatTokens(s.tokens)} {t('usage_tokensShort')}{costText(s) ? ` · ${costText(s)}` : ''}
        </button>
      </div>
    </div>,
    usageHost(),
  )
}
