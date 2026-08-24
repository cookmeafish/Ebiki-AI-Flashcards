import { useState, useEffect } from 'react'
import { S } from '../styles/theme'
import { C, RADIUS } from '../config/tokens'

// ── How Ebiki opens on THIS computer ────────────────────────────────────────
// 'app' = the chrome-free Electron window, 'browser' = an ordinary browser tab. The preference is
// MACHINE-LOCAL (launchmode.json, gitignored) and read by scripts/launch.ps1 / launch.sh before the
// dev server exists, so it deliberately does NOT ride the config.json autosave: config.json lives
// inside the data folder, which may be a shared drive that another computer also uses, and the two
// computers are exactly the case where the answers should be allowed to differ.
//
// Shared by Settings > General and the onboarding wizard so the explanation of the tradeoff is
// written once. The tradeoff is real and worth stating plainly: the app window gives the whole
// screen to studying but makes looking something up alongside it awkward on a single monitor, which
// is precisely why the choice exists.

// The two option tiles. Presentational: the caller owns the value and the saving.
export function LaunchModeOptions({ t, mode, onPick, disabled, electronAvailable = true }) {
  const tile = (val, icon, label, desc) => {
    const active = mode === val
    // electron missing = the app window cannot be honored here, so it is not offered as a choice.
    const off = disabled || (val === 'app' && !electronAvailable)
    return (
      <div key={val} className={off ? undefined : 'click-dim'}
        onClick={off ? undefined : () => onPick(val)}
        style={{
          flex: '1 1 220px', maxWidth: 300, textAlign: 'left', padding: '13px 15px', borderRadius: RADIUS.md,
          border: `2px solid ${active ? C.brand : C.border}`, background: active ? C.brandTint : C.surface,
          cursor: off ? 'default' : 'pointer', opacity: off ? 0.5 : 1, transition: 'all .15s ease',
        }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: active ? C.brand : C.ink, display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 17 }}>{icon}</span>{label}
        </div>
        <div style={{ fontSize: 11.5, color: C.inkDim, lineHeight: 1.5, marginTop: 6, fontWeight: 400 }}>{desc}</div>
      </div>
    )
  }
  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
      {tile('app', '🖥️', t('lm_app'), t('lm_appDesc'))}
      {tile('browser', '🌐', t('lm_browser'), t('lm_browserDesc'))}
    </div>
  )
}

// Settings > General card. Self-contained: talks to /api/launchmode directly.
export function LaunchModeCard({ t, card, fieldLabel, hint }) {
  const [mode, setMode] = useState(null)
  const [electronAvailable, setElectronAvailable] = useState(true)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState(null)   // { kind: 'ok' | 'warn' | 'err', text }
  // A completed handoff, from THIS page's point of view. Needed because "does the choice match the
  // front end I am?" can never become true for the page that just handed over: a browser tab cannot
  // turn into the app window, so the Switch now button sat there offering a switch that had already
  // happened. The switch is done; only closing the tab is left.
  const [handedOver, setHandedOver] = useState(false)
  // This page IS one of the two front ends, so it knows which one without asking the server.
  const isAppWindow = typeof window !== 'undefined' && !!window.ebikiWindow

  useEffect(() => {
    fetch('/api/launchmode').then((r) => r.json()).then((d) => {
      setMode(d.mode); setElectronAvailable(d.electronAvailable !== false)
    }).catch(() => setMode('app'))
  }, [])

  const save = async (next, switchNow) => {
    setBusy(true); setNote(null)
    // Picking a tile is a fresh decision, so it un-does a previous hand-off and brings the button
    // back. That is also the way back if the window this page handed over to has since been closed.
    if (!switchNow) setHandedOver(false)
    setMode(next)
    try {
      const d = await (await fetch('/api/launchmode', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: next, switchNow: !!switchNow }),
      })).json()
      if (!switchNow) { setNote({ kind: 'ok', text: t('lm_saved') }); setBusy(false); return }
      if (!d.launched) { setNote({ kind: 'warn', text: t('lm_switchError') }); setBusy(false); return }
      // Wait for the NEW front end to report in before tearing this one down. Closing first would
      // look to the dev server's auto-exit like the last page had gone, and take the server with it.
      // No note here: the button itself already reads "Opening Ebiki the new way", and saying it
      // twice in two places just looked like something had gone wrong.
      const deadline = Date.now() + 90000
      const poll = async () => {
        if (Date.now() > deadline) { setNote({ kind: 'warn', text: t('lm_switchError') }); setBusy(false); return }
        let ready = false
        try { ready = (await (await fetch('/api/launchmode')).json()).handoffReady } catch { /* keep polling */ }
        if (!ready) return void setTimeout(poll, 1000)
        // An app window can close itself. A browser tab cannot (script may only close a tab it
        // opened), so it says so instead of failing silently.
        if (isAppWindow) window.ebikiWindow.close()
        else { setHandedOver(true); setNote({ kind: 'ok', text: t('lm_closeTab') }) }
        setBusy(false)
      }
      setTimeout(poll, 1000)
    } catch (e) {
      setNote({ kind: 'err', text: String(e.message || e) })
      setBusy(false)
    }
  }

  if (mode === null) return null
  // Offer the switch only when the choice differs from the front end actually on screen AND this
  // page has not already handed over.
  const canSwitchNow = !handedOver && mode !== (isAppWindow ? 'app' : 'browser')
  return (
    <div style={card}>
      {fieldLabel(t('lm_title'))}
      <div style={{ fontSize: 11, color: C.inkFaint, marginTop: -4, marginBottom: 10 }}>· {t('lm_thisComputer')}</div>
      <LaunchModeOptions t={t} mode={mode} onPick={(m) => save(m, false)} disabled={busy} electronAvailable={electronAvailable} />
      {canSwitchNow && electronAvailable && (
        <div style={{ marginTop: 10 }}>
          <button onClick={() => save(mode, true)} disabled={busy} className="btn-press"
            style={{ ...S.keyDone, fontSize: 12, opacity: busy ? 0.5 : 1, cursor: busy ? 'default' : 'pointer' }}>
            {busy ? t('lm_switching') + '…' : t('lm_switchNow')}
          </button>
        </div>
      )}
      {!electronAvailable && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 9, lineHeight: 1.5 }}>{t('lm_noElectron')}</div>}
      {note && (
        <div style={{ fontSize: 11, marginTop: 9, lineHeight: 1.5, color: note.kind === 'err' ? C.danger : note.kind === 'warn' ? C.warning : C.success }}>
          {note.kind === 'err' ? '⚠ ' : note.kind === 'warn' ? '⚠ ' : '✓ '}{note.text}
        </div>
      )}
      <div style={hint}>{t('lm_desc')}</div>
    </div>
  )
}
