import { useState, useEffect, useRef } from 'react'
import { S } from '../styles/theme'
import { C, RADIUS, SHADOW, FONT } from '../config/tokens'
import { LANGS, langFromName, isDistinctSpoken } from '../config/languages'
import { langInfo } from '../pronunciation/langcodes'
import { PROVIDERS, keyOfOtherProvider } from '../config/providers'
import { APP_LANGUAGES, langMeta } from '../i18n'
import { ADAPTIVE_STRUGGLE_LAPSES } from '../config/study'
import { LaunchModeCard } from './LaunchModeChoice'
import { apiFetch } from '../platform'

// ── Data folder (optional shared data directory) ──
// Self-contained: talks to /api/datadir directly. The data-folder pointer is
// machine-local server plumbing (it says where THIS computer's data lives), so
// it must not ride the config.json autosave — config.json itself lives inside
// the data folder. Applies live; no restart needed.
function DataFolderCard({ t, card, fieldLabel, hint, onChanged }) {
  const [info, setInfo] = useState(null)      // { dataDir, appRoot, isDefault, envOverride }
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)  // { ok: message } | { error: message }
  const [choice, setChoice] = useState(null)  // { dir, context, sourceOnly } — the merge/skip prompt
  const [confirmMerge, setConfirmMerge] = useState(false)  // "are you sure?" step before a merge
  const [backup, setBackup] = useState(null)   // { enabled, at, files, error }
  const [backingUp, setBackingUp] = useState(false)
  const refreshBackup = () => apiFetch('/api/sync-backup').then((r) => r.json()).then(setBackup).catch(() => {})
  useEffect(() => {
    apiFetch('/api/datadir').then((r) => r.json()).then((d) => {
      setInfo(d)
      // Show the active shared path in the field so what's saved is unmistakable
      // (the default app folder leaves the field empty with its placeholder).
      if (d && !d.isDefault && !d.envOverride) setInput(d.dataDir)
    }).catch(() => {})
    refreshBackup()
  }, [])
  const backupNow = async () => {
    setBackingUp(true)
    try { const r = await apiFetch('/api/sync-backup', { method: 'POST' }); setBackup(await r.json()) } catch {}
    finally { setBackingUp(false) }
  }
  // "3 min ago" style relative time from an ISO string (backup timestamps).
  const relTime = (iso) => {
    if (!iso) return null
    const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
    if (s < 60) return t('backupJustNow')
    const m = Math.round(s / 60)
    if (m < 60) return t('backupMinsAgo', { m })
    const h = Math.round(m / 60)
    return t('backupHrsAgo', { h })
  }
  // dir: target path ('' = back to app folder). merge: undefined asks the server,
  // true = add this computer's data, false = adopt the folder's data as-is.
  // A ref as well as `busy`: two quick clicks (or Enter then a click) both read busy=false from one
  // render and sent two folder switches at once, each moving and merging the same data on the server.
  const applyingRef = useRef(false)
  const apply = async (dir, merge) => {
    if (applyingRef.current) return
    applyingRef.current = true
    setBusy(true); setResult(null); setChoice(null); setConfirmMerge(false)
    let switched = false
    try {
      const body = { dataDir: dir }
      if (merge !== undefined) body.merge = merge
      const r = await apiFetch('/api/datadir', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await r.json()
      if (data.needsChoice) { setChoice({ dir, context: data.context, sourceOnly: data.sourceOnly }); return }
      // Known refusals by code (the server's text is English); anything else is framed in the app language.
      const ERR = { switching: 'dataFolderErrSwitching', insideData: 'dataFolderErrInside', envOverride: 'dataFolderErrEnv' }
      if (!data.ok) { setResult({ error: ERR[data.code] ? t(ERR[data.code]) : t('dataFolderErrOther', { msg: data.error || r.status }) }); return }
      if (data.unchanged) { setResult({ ok: t('dataFolderAlready') }); return }
      setInfo((i) => ({ ...i, dataDir: data.dataDir, isDefault: data.isDefault }))
      // Keep the field reflecting the now-current selection (empty for default).
      setInput(data.isDefault ? '' : data.dataDir)
      let parts
      if (data.restored) {
        parts = [t('dataFolderRestored')]
        if (data.merged) parts.push(t('dataFolderPulledNote', { count: data.merged }))
      } else {
        parts = [t('dataFolderSaved')]
        if (data.merged) parts.push(t('dataFolderMergedNote', { count: data.merged }))
        else if (merge === false) parts.push(t('dataFolderSkippedNote'))
      }
      if (data.keptBoth) parts.push(t('dataFolderKeptBothNote', { count: data.keptBoth }))
      if (data.copied?.length) parts.push(t('dataFolderCopied', { items: data.copied.join(', ') }))
      if (onChanged) parts.push(t('dataFolderReloading'))
      setResult({ ok: parts.join(' ') })
      // The page still holds the OLD folder's modes and settings; the host freezes its writers and
      // reloads so nothing from here is written into the new folder (see dataSwitchingRef in App).
      onChanged?.()
      // The page reloads in a moment: stay locked until then (a second switch started here was cut off by the
      // reload mid-request or mid-prompt).
      if (onChanged) switched = true
    } catch (e) { setResult({ error: t('dataFolderErrOther', { msg: String(e.message || e) }) }) }
    finally { if (!switched) { applyingRef.current = false; setBusy(false) } }
  }
  const canApply = !busy && input.trim()
  // Human-readable list of what this computer has that the target lacks.
  const summaryLines = (s) => {
    const names = (arr) => { const shown = arr.slice(0, 4).join(', '); return arr.length > 4 ? `${shown} +${arr.length - 4}` : shown }
    const out = []
    if (s.modes?.length) out.push(t('dataFolderMergeModes', { names: names(s.modes) }))
    if (s.chats) out.push(t('dataFolderMergeChats', { count: s.chats }))
    if (s.decks?.length) out.push(t('dataFolderMergeDecks', { names: names(s.decks) }))
    if (s.discover) out.push(t('dataFolderMergeDiscover', { count: s.discover }))
    if (s.features) out.push(t(s.features === 1 ? 'dataFolderMergeFeaturesOne' : 'dataFolderMergeFeatures', { count: s.features }))
    return out
  }
  return (
    <div style={card}>
      {fieldLabel(t('dataFolder'))}
      <div style={{ fontSize: 12, color: C.ink, fontWeight: 600, marginBottom: 8, overflowWrap: 'anywhere' }}>
        {info && !info.isDefault ? <>🔗 {info.dataDir}</> : <>📁 {t('dataFolderAppFolder')}</>}
      </div>
      {info?.envOverride ? (
        <div style={hint}>{t('dataFolderEnvNote')}</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing && canApply) apply(input.trim()) }}
              placeholder={t('dataFolderPlaceholder')} disabled={busy}
              style={{ ...S.keyInput, flex: 1, fontSize: 12 }} />
            <button onClick={() => canApply && apply(input.trim())} disabled={!canApply}
              style={{ ...S.getKeyLink, opacity: canApply ? 1 : 0.5, cursor: canApply ? 'pointer' : 'default' }}>
              {busy ? '…' : t('dataFolderApply')}
            </button>
          </div>
          {info && !info.isDefault && (
            <button onClick={() => apply('')} disabled={busy}
              style={{ ...S.ghostBtn, fontSize: 11, marginTop: 8, opacity: busy ? 0.5 : 1, cursor: busy ? 'default' : 'pointer' }}>
              ↩ {t('dataFolderReset')}
            </button>
          )}
          {choice && (
            <div style={{ marginTop: 10, border: `1px solid ${C.warningRing || C.border}`, borderRadius: RADIUS.md, padding: '12px 14px', background: C.warningTint || C.surfaceAlt }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, marginBottom: 6 }}>{t(choice.context === 'return' ? 'dataFolderReturnHeading' : 'dataFolderMergeHeading')}</div>
              <div style={{ fontSize: 11, color: C.inkDim, marginBottom: 8, lineHeight: 1.5 }}>{t(choice.context === 'return' ? 'dataFolderReturnBody' : 'dataFolderMergeBody')}</div>
              <ul style={{ margin: '0 0 10px 0', paddingLeft: 18, fontSize: 11, color: C.ink, lineHeight: 1.6 }}>
                {summaryLines(choice.sourceOnly).map((line, i) => <li key={i}>{line}</li>)}
              </ul>
              {confirmMerge ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 8, lineHeight: 1.5 }}>
                    {t(choice.context === 'return' ? 'dataFolderMergeConfirmReturn' : 'dataFolderMergeConfirmJoin')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => apply(choice.dir, true)} disabled={busy}
                      style={{ ...S.getKeyLink, fontSize: 11, opacity: busy ? 0.5 : 1 }}>{busy ? '…' : t('dataFolderMergeConfirmYes')}</button>
                    <button onClick={() => setConfirmMerge(false)} disabled={busy}
                      style={{ ...S.ghostBtn, fontSize: 11, color: C.inkDim, opacity: busy ? 0.5 : 1 }}>{t('cancel')}</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button onClick={() => setConfirmMerge(true)} disabled={busy}
                    style={{ ...S.getKeyLink, fontSize: 11, opacity: busy ? 0.5 : 1 }}>{t(choice.context === 'return' ? 'dataFolderReturnMergeBtn' : 'dataFolderMergeInBtn')}</button>
                  <button onClick={() => apply(choice.dir, false)} disabled={busy}
                    style={{ ...S.ghostBtn, fontSize: 11, opacity: busy ? 0.5 : 1 }}>{t(choice.context === 'return' ? 'dataFolderReturnSkipBtn' : 'dataFolderMergeSkipBtn')}</button>
                  <button onClick={() => { setChoice(null); setConfirmMerge(false) }} disabled={busy}
                    style={{ ...S.ghostBtn, fontSize: 11, color: C.inkDim, opacity: busy ? 0.5 : 1 }}>{t('cancel')}</button>
                </div>
              )}
            </div>
          )}
          {result?.ok && <div style={{ fontSize: 11, color: C.success, marginTop: 8, lineHeight: 1.5, overflowWrap: 'anywhere' }}>✓ {result.ok}</div>}
          {result?.error && <div style={{ fontSize: 11, color: C.danger, marginTop: 8, lineHeight: 1.5, overflowWrap: 'anywhere' }}>⚠ {result.error}</div>}
          {info && !info.isDefault && backup?.enabled && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: C.inkDim, lineHeight: 1.5 }}>
                {'💾'} {backup.at ? t('backupLast', { when: relTime(backup.at) }) : t('backupNone')}
              </span>
              {/* A failing or paused backup SAYS so: the line used to keep showing the last good time
                  (or "runs automatically"), and "Back up now" looked like it did nothing. */}
              {(backup.skipped === 'offline-pending' || backup.error) && (
                <span style={{ fontSize: 11, color: C.warning, lineHeight: 1.5, flexBasis: '100%' }}>
                  ⚠ {backup.skipped === 'offline-pending' ? t('backupPausedOffline') : (backup.skipped === 'unreachable' ? t('backupSourceUnreachable') : t('backupFailed', { e: backup.error }))}
                </span>
              )}
              <button onClick={backupNow} disabled={backingUp}
                style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 9px', marginLeft: 'auto', opacity: backingUp ? 0.5 : 1 }}>
                {backingUp ? '…' : t('backupNow')}
              </button>
            </div>
          )}
          <div style={hint}>{info && !info.isDefault ? t('dataFolderHintShared') : t('dataFolderHint')}</div>
        </>
      )}
    </div>
  )
}

// ── Update card ──
// Self-contained: talks to /api/update directly. GET checks (local HEAD vs the
// remote branch head); POST runs git pull + npm install. Same code path as the
// desktop shortcut's launch-time check, exposed as a button in the GUI.
// An update REPORTED as failed while having actually applied is worse than a plain
// failure: the user is told to retry something already done. It happens because the
// update runs `npm install` inside the request, which rewrites package-lock.json and
// node_modules - enough to take the dev server down with the response still open. The
// connection dies, the browser says "Failed to fetch", and the checkout has already
// moved. So a dropped connection is NOT a verdict: wait for the server to come back
// and ask the repository what actually happened. The commit sha is the truth here,
// not the socket.
async function confirmUpdateApplied(beforeSha, ms = 45000) {
  const deadline = Date.now() + ms
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000))
    try {
      // ?local=1: only the checked-out commit matters here, and asking GitHub for it
      // can cost a 25s round trip on a bad connection - which is what made this look
      // frozen. This answers as fast as git can read HEAD.
      const d = await (await apiFetch('/api/update?local=1')).json()
      // ONE answer from the server settles it, whichever way it goes. This used to
      // return only when the sha had MOVED, so the common case where the service
      // came back and the update had NOT applied matched nothing and the loop kept
      // polling in silence for three minutes behind "Finishing up..." - a hang, and
      // for the one user most in need of a straight answer. The repository is the
      // truth: if it can be read at all, it has already answered.
      if (d?.current) return d
    } catch { /* the service is still down; that is what the deadline is for */ }
  }
  return null   // never came back: it cannot be asked, so the caller must offer a restart
}

function UpdatesCard({ t, card, fieldLabel, hint, serverDown }) {
  const [state, setState] = useState('idle')   // idle | checking | uptodate | available | updating | verifying | done | restarting | error | nogit | offline | down | branch | busy | remoteMissing | dirty
  const [info, setInfo] = useState(null)
  const [err, setErr] = useState(null)
  // React StrictMode runs mount effects TWICE in dev, and the retry below can double
  // that again: four `git ls-remote` calls for one opened pane, with the slowest
  // reply free to overwrite the newest. One in-flight check at a time, and a
  // sequence number so a late answer can never win over a newer one.
  const checking = useRef(false)
  const checkSeq = useRef(0)
  // attempt: a network-level failure here is NOT about GitHub - it means Ebiki's own
  // background service did not answer (it restarted after an update, or the launch is
  // still coming up). That deserves a retry rather than a dead end, and it deserves
  // wording a person can act on: the browser's own "Failed to fetch" was reaching the
  // screen, which names neither what failed nor what to do about it.
  const check = async (attempt = 0) => {
    if (attempt === 0) {
      if (checking.current) return
      checking.current = true
    }
    const seq = ++checkSeq.current
    setState('checking'); setErr(null)
    try {
      const d = await (await apiFetch('/api/update')).json()
      if (seq !== checkSeq.current) return
      setInfo(d)   // BEFORE the early returns: the version line is worth showing even when
                   // the check itself could not run, which is exactly when someone is asking
                   // "what version is this machine actually on?"
      if (!d.gitAvailable) { setState('nogit'); return }
      // Updated since this server started: it still runs the old code, so the restart stays on offer (this said "up to
      // date" and hid it on the next check or a reopen of Settings).
      if (d.restartPending) { setState('done'); return }
      // Updates come from master; a copy parked on another branch can never apply one,
      // so say which branch rather than offering an update that would fail.
      if (d.branch && !d.onMaster) { setState('branch'); return }
      if (!d.reachable) { setState('offline'); return }
      // Reachable, but the release branch is gone (renamed or removed upstream).
      // Saying "you're up to date" here would hide it indefinitely.
      if (d.remoteMissing) { setState('remoteMissing'); return }
      if (d.localCommits) { setState('localCommits'); return } // own commits on master: an update would be refused
      setState(d.updateAvailable ? 'available' : 'uptodate')
    } catch (e) {
      if (seq !== checkSeq.current) return
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1500))
        return await check(1)
      }
      setState('down')   // err stays null: the message is ours, not the browser's
    } finally {
      checking.current = false
    }
  }
  // Restarting belongs with the update that needs it. Two ways, because the service
  // an update just replaced is often gone: the server's own relauncher first (it
  // waits for the port properly), then Electron, which needs nothing running.
  const restartNow = async () => {
    setState('restarting')
    try {
      const d = await (await apiFetch('/api/update/restart', { method: 'POST' })).json()
      if (d.ok) { setTimeout(() => { try { window.ebikiWindow?.close() } catch { /* the relauncher is waiting */ } }, 600); return }
      // The server is ALIVE but cannot restart itself (macOS/Linux, a manual npm run dev): the window's
      // own relaunch only starts a new server when none answers, so it reopened on the OLD one and the
      // update never finished. Say how to finish it instead.
      setState('manual'); return
    } catch { /* the service is gone: that is exactly why the fallback exists */ }
    if (window.ebikiWindow?.restart) { window.ebikiWindow.restart(); return }
    setState('done')   // a browser tab cannot restart itself; the wording says so
  }
  const doUpdate = async () => {
    const beforeSha = info?.current || null
    setState('updating'); setErr(null)
    ++checkSeq.current   // a check still in flight must not land over this update's result
    try {
      const d = await (await apiFetch('/api/update', { method: 'POST' })).json()
      if (d.busy) { setState('busy'); return }
      if (d.dirty) { setState('dirty'); return }
      if (d.localCommits) { setState('localCommits'); return }
      if (d.wrongBranch) { setInfo((i) => ({ ...(i || {}), branch: d.wrongBranch, onMaster: false })); setState('branch'); return }
      // The code moved but npm install failed: a restart is exactly what finishes it (the launcher installs
      // the pending dependencies), and a Retry would only report "up to date".
      if (d.updated && !d.ok) { setState('done'); setErr(t('updatesDepsPending')); return }
      if (!d.ok) { setState('error'); setErr(t('updatesErrOther', { msg: d.error || '?' })); return }
      setState('done')
    } catch (e) {
      // A dropped connection here usually means the update WORKED and took the server
      // down with it (npm install replaced node_modules). Go and look instead of guessing.
      if (/failed to fetch|networkerror|load failed/i.test(String(e.message || e))) {
        setState('verifying')
        const d = await confirmUpdateApplied(beforeSha)
        if (d && beforeSha && d.current !== beforeSha) { setInfo(d); setState('done'); return }
        // Answered, nothing moved: report what is actually true now instead of
        // polling on behind "Finishing up..." for a deadline that cannot help.
        // The local answer never carries updateAvailable, so reading it said "up to date" for an
        // update that did NOT apply. Nothing moved and an update was being installed, so it is still
        // available; with no starting sha to compare, run a real check instead of guessing.
        if (d) { setInfo(d); if (!beforeSha) { check(); return } setState('available'); return }
        setState('down')
        return
      }
      setState('error')
      setErr(t('updatesErrOther', { msg: String(e.message || e) }))
    }
  }
  // Check as soon as this pane is opened. Someone who came looking for updates
  // should not have to press a button to be told there is one waiting - and the
  // whole failure this guards against is an update nobody was told about.
  useEffect(() => { check() }, [])   // eslint-disable-line react-hooks/exhaustive-deps
  // Arriving here BECAUSE the service died: show that immediately instead of
  // spending a check to rediscover it. The notice that sent them here says to fix
  // it in Settings, so the repair has to be visible the moment Settings opens.
  useEffect(() => { if (serverDown) setState('down') }, [serverDown])
  // A bare commit sha ("you are on version 0a84d36") is an identifier, not a
  // version: it does not say how old the copy is and two of them cannot be
  // compared by eye. Ebiki ships from master with no tags, so the release DATE is
  // the version - written the machine-independent way round (2026.08.28), which
  // sorts, reads the same in every locale, and is instantly comparable to "when
  // did you push that fix". The build number and sha go underneath in small type,
  // for when an exact answer is actually wanted.
  const versionLine = () => {
    if (state === 'checking' && !info) return null
    if (info?.current) {
      // Headline = the DECLARED version (package.json), the one a person can say out
      // loud. Detail = the DERIVED build identity, which nobody has to maintain and
      // which stays correct even when a bump is forgotten. Dates come from the
      // server already formatted from the commit's own timezone - deriving one here
      // with new Date() used the viewer's LOCAL clock, so the same commit read as a
      // different version depending on where you were sitting.
      const headline = info.appVersion || info.version || info.current
      const date = info.version || ''
      return (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-ink)' }}>{t('updatesVersion', { version: headline })}</div>
          <div style={{ ...hint, marginTop: 2, fontFamily: 'monospace', fontSize: 10.5 }}>
            {info.build
              ? t('updatesVersionBuild', { date, build: info.build, sha: info.current })
              : t('updatesVersionNoBuild', { date, sha: info.current })}
          </div>
        </div>
      )
    }
    if (state === 'nogit' || (info && !info.gitAvailable)) {
      return <div style={{ ...hint, marginTop: 0, marginBottom: 8 }}>{t('updatesVersionUnknown')}</div>
    }
    return null
  }
  // Also while an update is verified or restarting: a check landing then replaced the restart offer.
  const checkBlocked = ['checking', 'updating', 'verifying', 'restarting', 'done'].includes(state)
  return (
    <div style={card}>
      {fieldLabel(t('updatesTitle'))}
      {versionLine()}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Arrow, never onClick={check}: the click event would arrive as `attempt`, which skipped
            both the in-flight guard and the one retry. */}
        <button onClick={() => check()} disabled={checkBlocked}
          style={{ ...S.getKeyLink, fontSize: 12, opacity: checkBlocked ? 0.5 : 1 }}>
          {state === 'checking' ? t('updatesChecking') : t('updatesCheck')}
        </button>
        {state === 'available' && (
          <button onClick={doUpdate} className="btn-press" style={{ ...S.keyDone, fontSize: 12 }}>{t('updatesUpdateNow')}</button>
        )}
      </div>
      {state === 'uptodate' && <div style={{ fontSize: 11, color: C.success, marginTop: 8 }}>✓ {t('updatesUpToDate')}</div>}
      {state === 'available' && <div style={{ fontSize: 11, color: C.brand, marginTop: 8 }}>{t('updatesAvailable')}</div>}
      {state === 'updating' && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 8 }}>{t('updatesUpdating')}</div>}
      {state === 'verifying' && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 8 }}>{t('updatesVerifying')}</div>}
      {state === 'done' && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: C.success, fontWeight: 700, lineHeight: 1.5 }}>✓ {t('updateBannerNeedsRestart')}</div>
          {err && <div style={{ ...hint, marginTop: 4 }}>{err}</div>}
          {window.ebikiWindow
            ? <button className="btn-press" onClick={restartNow} style={{ ...S.keyDone, fontSize: 12, marginTop: 6 }}>{t('updateBannerRestart')}</button>
            : <div style={{ ...hint, marginTop: 4 }}>{t('updateBannerManual')}</div>}
        </div>
      )}
      {state === 'manual' && <div style={{ ...hint, marginTop: 8 }}>{t('updateBannerManual')}</div>}
      {state === 'restarting' && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 8 }}>{t('updateBannerRestarting')}</div>}
      {state === 'nogit' && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 8, lineHeight: 1.5 }}>{t('updatesNoGit')}</div>}
      {state === 'offline' && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 8 }}>{t('updatesOffline')}</div>}
      {state === 'branch' && <div style={{ fontSize: 11, color: C.warning, marginTop: 8, lineHeight: 1.5 }}>⚠ {t('updatesWrongBranch', { branch: info?.branch || '?' })}</div>}
      {state === 'busy' && <div style={{ fontSize: 11, color: C.inkDim, marginTop: 8 }}>{t('updatesBusy')}</div>}
      {state === 'remoteMissing' && <div style={{ fontSize: 11, color: C.warning, marginTop: 8, lineHeight: 1.5 }}>⚠ {t('updatesRemoteMissing')}</div>}
      {state === 'dirty' && <div style={{ fontSize: 11, color: C.warning, marginTop: 8, lineHeight: 1.5 }}>⚠ {t('updatesDirty')}</div>}
      {state === 'localCommits' && <div style={{ fontSize: 11, color: C.warning, marginTop: 8, lineHeight: 1.5 }}>⚠ {t('updatesLocalCommits')}</div>}
      {state === 'down' && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: C.warning, lineHeight: 1.5 }}>⚠ {t('updatesServerDown')}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Restarting is what actually fixes this, and it is the step an update
                ends on anyway - so offer it here rather than only re-checking. */}
            {window.ebikiWindow && <button className="btn-press" onClick={restartNow} style={{ ...S.keyDone, fontSize: 12 }}>{t('updateBannerRestart')}</button>}
            <button onClick={() => check()} style={{ ...S.getKeyLink, fontSize: 11 }}>{t('updatesRetry')}</button>
          </div>
        </div>
      )}
      {state === 'error' && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: C.danger, lineHeight: 1.5, overflowWrap: 'anywhere' }}>⚠ {err || t('updatesServerDown')}</div>
          <button onClick={() => check()} style={{ ...S.getKeyLink, fontSize: 11, marginTop: 6 }}>{t('updatesRetry')}</button>
        </div>
      )}
      <div style={hint}>{t('updatesHint')}</div>
    </div>
  )
}

// Unified Settings modal. Left sidebar = categories grouped by scope (APP vs MODE);
// right pane = the selected category. All state/handlers come from App via `p`.
//
// SCOPE (verified against the persistence layer):
//   APP (global config.json): General (theme, app language, translation), AI Models
//   MODE (activeMode → modes/<name>): Study, Cards & Anki, Knowledge, Overlay, Manage Modes
// A number box that keeps what is being TYPED. Writing parseInt(v) || default on every keystroke
// meant clearing the box put the default straight back, so typing "5" over "3" produced 35 (35
// questions per card, or 34 parallel generations at session start). Commits only a valid value in
// range; on blur an invalid entry snaps back to the saved one.
// commitOnBlur: commit when the box is left (or Enter), not per keystroke. For values that take effect AT
// ONCE: typing "15" into the auto-sync minutes committed 1 first, and a live session synced and locked
// its cards before the 5 was typed.
function ClampedNumber({ value, min, max, onCommit, style, commitOnBlur = false }) {
  const [text, setText] = useState(String(value))
  useEffect(() => { setText(String(value)) }, [value])
  const valid = (v) => { const n = Number(v); return v !== '' && Number.isInteger(n) && n >= min && n <= max ? n : null }
  // commitOnBlur: closing Settings (or switching panes) while the box still has focus unmounts it with NO
  // blur, so a typed value was silently dropped. A pending valid value is committed on unmount too.
  const pendingRef = useRef(null)
  pendingRef.current = { text, value, onCommit, valid }
  useEffect(() => () => {
    if (!commitOnBlur) return
    const { text: tx, value: v, onCommit: commit, valid: ok } = pendingRef.current
    const n = ok(tx)
    if (n !== null && n !== v) commit(n)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input type="number" min={min} max={max} step={1} value={text} style={style}
      onChange={(e) => {
        setText(e.target.value)
        const n = valid(e.target.value)
        if (!commitOnBlur && n !== null) onCommit(n)
      }}
      onKeyDown={commitOnBlur ? (e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) e.currentTarget.blur() } : undefined}
      onBlur={() => {
        const n = commitOnBlur ? valid(text) : null
        if (n !== null && n !== value) onCommit(n)
        else setText(String(value))
      }} />
  )
}

export default function SettingsModal(p) {
  const {
    t, category, setCategory, onClose, onDataFolderChanged, confirmDialog, alertDialog, knowledgeBusyFiles, learnLangDefault,
    // General (global)
    appTheme, setAppTheme, appLanguage, setAppLanguage,
    language, setLanguage, targetLang, setTargetLang, onRunSetup,
    // AI Models (global)
    provider, setProvider, apiKeys, apiKey, setCurrentKey, validateKey, providerConfig,
    AI_ROLE_META, ROLE_DEFAULTS, aiModels, setAiModels, availableModels, presetModel,
    refreshModels, checkNewModels, modelsLoading, modelsError, intelligence, setIntelligence,
    planDeciding, runConnectionTest, modelProbe,
    serverDown,
    studyAutoSync, setStudyAutoSync, studyAutoSyncMinutes, setStudyAutoSyncMinutes, renderFeatureSettings,
    questionReuse, setQuestionReuse, clearSavedQuestions, getActiveModeId, getActiveMode,
    showTokenUsage, setShowTokenUsage,
    // Modes
    modes, activeModeId, setActiveModeId, saveModes, editingModeName, setEditingModeName,
    renameMode, modeEditInput, setModeEditInput, createMode, modeCreating, addDefaultMode, deleteMode,
    openModeStudio,
    // Mode config
    activeMode, updateActiveMode, defaultStudyRules, defaultGeneralStudyRules,
    ankiConnected, refreshAnkiConnection, ankiDecks, ankiDeck, setAnkiDeck, ankiFormat,
    proposeModeEdit, acceptModeEdit, denyModeEdit, modeEditProposal, modeEditBusy, diffWords,
    // Knowledge
    knowledgeFiles, knowledgeDragging, setKnowledgeDragging, handleKnowledgeDrop,
    handleKnowledgeFileInput, toggleKnowledgeFile, deleteKnowledgeFile, knowledgeStatus, knowledgeBusy,
    // Pronunciation audio (global)
    pronunciationCfg, setPronunciationCfg,
  } = p
  // One text state backs three unrelated boxes (Study Ask AI, Cards Ask AI, Create mode). Carried
  // across panes, a study tweak landed in Create mode, where "Design in depth with Ebi" auto-sends it
  // as a paid mode-design request. Each pane starts empty.
  useEffect(() => { setModeEditInput('') }, [category]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLanguage = (activeMode?.type || 'general') === 'language'
  // Per-role "type a custom model" toggles (emergency: provider list empty / future models).
  const [customRoles, setCustomRoles] = useState({}) // keyed "<provider>:<role>": one provider's toggle showed on another's row
  const [qPrefInput, setQPrefInput] = useState('') // Settings → Study: add a question-style preference
  const [clearDeck, setClearDeck] = useState('') // Settings → AI & cost: deck whose saved questions to clear
  // Live key-check status shown under the key field: { state: 'checking'|'valid'|'invalid'|'unknown' }.
  const [keyCheck, setKeyCheck] = useState(null)
  const [keyTouched, setKeyTouched] = useState(false) // did the user edit/paste the key THIS session
  const keyCheckSeq = useRef(0) // guards against a stale validation resolving after a newer paste
  const backdropDownRef = useRef(false) // see the backdrop's onClick
  const keyTypeTimerRef = useRef(null) // debounced check of a TYPED key (see checkKey)
  // A verdict belongs to ONE provider's key: switching the provider tab showed "Key works" under a key
  // that was never checked (or an empty field). A check still running for the old provider is dropped.
  useEffect(() => { setKeyCheck(null); setKeyTouched(false); keyCheckSeq.current++; clearTimeout(keyTypeTimerRef.current) }, [provider])
  useEffect(() => () => clearTimeout(keyTypeTimerRef.current), [])
  // Set the key AND live-validate it (used by Paste and any explicit set). Offline prefix check first,
  // then a real 1-token ping so the user is told whether the key actually works.
  const setAndValidateKey = async (raw) => {
    // A typing check still waiting would fire after this and throw the paste's verdict away.
    clearTimeout(keyTypeTimerRef.current)
    const key = (raw || '').replace(/\s+/g, '') // a key wrapped across lines (email, PDF) held a newline and corrupted .env
    setKeyTouched(true)
    setCurrentKey(key)
    await checkKey(key)
  }
  // The check alone. TYPING is checked too (debounced, like onboarding): a stray keystroke in the masked field
  // saved a broken key, the hint still said "stored", and it then replaced the shared copy on every computer.
  const checkKey = async (key) => {
    const seq = ++keyCheckSeq.current
    if (!key) { setKeyCheck(null); return }
    if ((providerConfig.keyPrefix && !key.startsWith(providerConfig.keyPrefix)) || keyOfOtherProvider(providerConfig, key)) { setKeyCheck({ state: 'invalid' }); return }
    if (!validateKey) { setKeyCheck(null); return }
    setKeyCheck({ state: 'checking' })
    let r = null
    try { r = await validateKey(provider, key) } catch { r = null }
    if (seq !== keyCheckSeq.current) return // a newer key was entered; ignore this result
    setKeyCheck(r === true ? { state: 'valid' } : r === false ? { state: 'invalid' } : r === 'noCredit' ? { state: 'noCredit' } : { state: 'unknown' })
  }

  // Esc closes the modal
  useEffect(() => {
    // Not an Esc something inside already handled (the confirm dialog, an open dropdown): cancelling a
    // delete with Esc used to close the whole Settings modal too.
    // Nor while a window opened ON TOP of Settings is up (Ebi Studio, a dialog): its Esc is its own, and this
    // listener, registered first, ran first and closed Settings underneath.
    // An Esc that only cancels an IME composition (Chinese/Japanese typing) is not a close: it lost the typed text.
    const onKey = (e) => { if (e.key === 'Escape' && !e.isComposing && e.keyCode !== 229 && !e.defaultPrevented && !document.querySelector('[data-top-overlay], [data-app-dialog]')) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Each pane has ONE job. App settings apply everywhere; mode settings follow the mode switcher, so
  // "Learning modes" (which picks what the others configure) comes first in that group.
  const NAV = [
    { group: t('settingsApp'), items: [
      { id: 'general', label: t('setGeneral'), icon: '⚙' },
      { id: 'models', label: t('setAICost'), icon: '🧠' },
      { id: 'anki', label: t('setAnkiAudio'), icon: '🔊' },
      { id: 'data', label: t('setDataUpdates'), icon: '💾' },
    ] },
    { group: t('settingsMode'), items: [
      { id: 'modes', label: t('setModes'), icon: '🌐' },
      { id: 'study', label: t('setStudy'), icon: '📚' },
      { id: 'cards', label: t('setCards'), icon: '🗂' },
      { id: 'knowledge', label: t('setKnowledge'), icon: '📎' },
    ] },
  ]
  // Pane ids from before the regroup (callers and saved state may still use them).
  const PANE_ALIAS = { audio: 'anki', overlay: 'cards' }
  const currentPane = PANE_ALIAS[category] || category

  const sectionTitle = (txt) => (
    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: FONT.display, color: C.ink, marginBottom: 14 }}>{txt}</div>
  )
  const fieldLabel = (txt) => <div style={{ fontSize: 11, fontWeight: 700, color: C.inkDim, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{txt}</div>
  // A card's heading when the card groups several fields (Study: Session / Languages / Feedback).
  const cardTitle = (txt) => <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 10 }}>{txt}</div>
  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '14px 16px', marginBottom: 12, boxShadow: SHADOW.sm }
  const hint = { fontSize: 11, color: C.inkFaint, marginTop: 6, lineHeight: 1.5 }

  // ── Mode context bar (shown atop per-mode categories) ──
  const modeBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: C.inkDim, fontWeight: 700 }}>{t('configuring')}</span>
      <select value={activeModeId} onChange={(e) => { const id = parseInt(e.target.value); if (p.switchMode) p.switchMode(id); else { setActiveModeId(id); saveModes(modes, id, { changedIds: [] }) } }}
        style={{ ...S.select, color: C.brand, borderColor: C.brandRing, background: C.brandTint }}>
        {modes.map((m) => <option key={m.id} value={m.id}>{m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {m.name}</option>)}
      </select>
      {editingModeName === activeModeId ? (
        <input autoFocus defaultValue={activeMode.name}
          onBlur={(e) => { if (e.target.dataset.cancel !== '1') renameMode(activeModeId, e.target.value || activeMode.name) }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.nativeEvent?.isComposing) { e.currentTarget.dataset.cancel = '1'; renameMode(activeModeId, e.target.value || activeMode.name) } // the unmount blur must not rename again
            // Esc cancels: marked first, so a blur fired as the box unmounts can't save the typed name.
            else if (e.key === 'Escape' && !e.nativeEvent?.isComposing && e.keyCode !== 229) { e.preventDefault(); e.currentTarget.dataset.cancel = '1'; setEditingModeName(null) }
          }}
          style={{ ...S.keyInput, width: 140, fontSize: 12, padding: '4px 8px' }} />
      ) : (
        <button type="button" onClick={() => setEditingModeName(activeModeId)} style={{ cursor: 'pointer', color: C.inkFaint, fontSize: 11, background: 'none', border: 'none', padding: 0, fontFamily: 'inherit' }}>{t('rename')}</button>
      )}
    </div>
  )

  // ── "Ask AI" box with a review step (propose → before/after → accept/deny/modify) ──
  const askAi = (scope, placeholder) => {
    const proposal = modeEditProposal && modeEditProposal.scope === scope ? modeEditProposal : null
    const toStr = (v) => (v && typeof v === 'object') ? Object.entries(v).filter(([, e]) => e).map(([k]) => k).join(', ') : String(v ?? '')
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={modeEditInput} onChange={(e) => setModeEditInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing && modeEditInput.trim() && !modeEditBusy) { proposeModeEdit(modeEditInput.trim(), scope); } }}
            placeholder={placeholder} style={{ ...S.keyInput, flex: 1, fontSize: 12 }} disabled={modeEditBusy} />
          <button onClick={() => { if (modeEditInput.trim()) proposeModeEdit(modeEditInput.trim(), scope) }}
            disabled={modeEditBusy || !modeEditInput.trim()} style={{ ...S.getKeyLink, opacity: (modeEditBusy || !modeEditInput.trim()) ? 0.5 : 1, cursor: (modeEditBusy || !modeEditInput.trim()) ? 'default' : 'pointer' }}>
            {modeEditBusy ? '…' : t('askAi')}
          </button>
        </div>
        {proposal && (
          <div style={{ marginTop: 10, border: `1px solid ${C.brandRing}`, borderRadius: RADIUS.md, padding: '12px 14px', background: C.brandTint2 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.brand, marginBottom: 8, letterSpacing: '.03em' }}>{t('ebiSuggests')}</div>
            {proposal.changes.map((ch) => (
              <div key={ch.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.inkDim, marginBottom: 3, textTransform: 'uppercase' }}>{ch.label}</div>
                <div style={{ fontSize: 12, lineHeight: 1.55, background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm, padding: '8px 10px', maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {diffWords(toStr(ch.before), toStr(ch.after)).map((tk, i) => (
                    <span key={i} style={{
                      background: tk.type === 'add' ? C.successTint : tk.type === 'del' ? C.dangerTint : 'transparent',
                      color: tk.type === 'add' ? C.success : tk.type === 'del' ? C.danger : C.ink,
                      textDecoration: tk.type === 'del' ? 'line-through' : 'none',
                    }}>{tk.text}</span>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { if (acceptModeEdit()) setModeEditInput('') }} style={{ ...S.keyDone, fontSize: 12, padding: '7px 16px' }}>✓ {t('accept')}</button>
              <button onClick={denyModeEdit} style={{ ...S.ghostBtn, fontSize: 12, padding: '7px 14px', color: C.danger, borderColor: 'rgba(229,57,46,.3)' }}>✗ {t('deny')}</button>
              <span style={{ fontSize: 11, color: C.inkFaint, marginLeft: 4 }}>{t('orModify')}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Panes ──
  const General = (
    <div>
      {sectionTitle(t('setGeneral'))}
      <div style={card}>
        {fieldLabel(t('appearance'))}
        <div style={{ display: 'flex', gap: 4, background: C.surfaceAlt, borderRadius: RADIUS.pill, padding: 3, width: 'fit-content' }}>
          {[['light', '☀️ ' + t('themeLight')], ['dark', '🌙 ' + t('themeDark')]].map(([val, label]) => (
            <button key={val} onClick={() => setAppTheme(val)} className={appTheme === val ? 'ui-tab-current' : undefined} style={{
              border: 'none', cursor: appTheme === val ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: RADIUS.pill,
              // NOTE: no `boxShadow: 'none'` on the unselected side — an inline shadow (even
              // 'none') beats the global hover-darken rule, which is inset-shadow based.
              background: appTheme === val ? C.surface : 'transparent', color: appTheme === val ? C.brand : C.inkDim, ...(appTheme === val ? { boxShadow: SHADOW.sm } : {}),
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={card}>
        {fieldLabel(t('appLanguage'))}
        <select value={appLanguage} onChange={(e) => setAppLanguage(e.target.value)} style={{ ...S.select, width: '100%' }}>
          {APP_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <div style={hint}>{t('appLanguageHint')}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('translation'))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.inkDim }}>{t('source')}</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ ...S.select, flex: 1, minWidth: 130 }}>
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <span style={{ color: C.brand, fontWeight: 700 }}>→</span>
          <span style={{ fontSize: 12, color: C.inkDim }}>{t('target')}</span>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={{ ...S.select, flex: 1, minWidth: 130 }}>
            {LANGS.filter((l) => l.code !== 'auto').map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div style={hint}>{t('translationHint')}</div>
      </div>
      <LaunchModeCard t={t} card={card} fieldLabel={fieldLabel} hint={hint} />
      {/* Cards contributed by features (src/features, settingsCards with section 'general'). */}
      {renderFeatureSettings?.('general', { card, fieldLabel, hint })}
      {onRunSetup && (
        <button onClick={onRunSetup} style={{ ...S.ghostBtn, fontSize: 12 }}>↻ {t('runSetupAgain')}</button>
      )}
    </div>
  )

  const provModels = availableModels[provider] || []
  // Any per-feature override = the "Custom" preset. The per-feature list opens by itself then, so the
  // choices that made it Custom are on screen.
  // Real roles only ('' = back on the default): an older build's retired 'question' key showed "Custom" as the
  // active preset while every role ran the preset's models.
  const hasModelOverrides = !!aiModels[provider] && AI_ROLE_META.some(({ role }) => aiModels[provider][role])
  const reuse = questionReuse || { enabled: false, maxPerCard: 10 }
  // "Clear saved questions" deck: the user's pick, else the mode's deck, else the first one.
  const clearDeckValue = ankiDecks.includes(clearDeck) ? clearDeck : (ankiDecks.includes(ankiDeck) ? ankiDeck : (ankiDecks[0] || ''))
  const AIModels = (
    <div>
      {sectionTitle(t('setAICost'))}
      <div style={card}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {Object.entries(PROVIDERS).map(([key, pr]) => (
            <button key={key} onClick={() => setProvider(key)} className={provider === key ? 'ui-tab-current' : undefined} style={{
              ...S.ghostBtn, fontSize: 12, padding: '5px 12px',
              color: provider === key ? pr.color : C.inkDim,
              borderColor: provider === key ? `${pr.color}66` : C.border,
              background: provider === key ? `${pr.color}14` : C.surface,
              cursor: provider === key ? 'default' : 'pointer',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: apiKeys[key] ? C.success : C.inkFaint, display: 'inline-block', marginRight: 6 }} />
              {pr.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Visible while the user is typing THIS session so they can verify it; concealed once it
              validates, or when it is a pre-existing saved key the user has not touched yet.
              Paste (Ctrl+V or right-click) is captured via onPaste and auto-validated — this reads the
              pasted text straight off the event, so it needs NO clipboard permission popup (unlike a
              JS "Paste" button, which must call navigator.clipboard.readText() and forces one). */}
          <input type={(apiKey && (keyCheck?.state === 'valid' || !keyTouched)) ? 'password' : 'text'}
            value={apiKey}
            onPaste={(e) => { const txt = (e.clipboardData?.getData('text') || '').replace(/\s+/g, ''); if (txt) { e.preventDefault(); setAndValidateKey(txt) } }}
            onChange={(e) => {
              // Keys hold no whitespace: a trailing space (autofill, drag and drop) passed the trimmed check, but
              // was stored and sent as is, and one provider's key rides in the URL ("API key not valid").
              const v = e.target.value.replace(/\s+/g, '')
              setKeyTouched(true); setKeyCheck(null); setCurrentKey(v)
              keyCheckSeq.current++ // an older check still running must not report on this text
              clearTimeout(keyTypeTimerRef.current)
              keyTypeTimerRef.current = setTimeout(() => { checkKey(v.trim()) }, 700)
            }}
            placeholder={providerConfig.placeholder} spellCheck={false} autoComplete="off" data-no-voice="" style={{ ...S.keyInput, flex: 1 }} />
          <a href={providerConfig.url} target="_blank" rel="noopener noreferrer" style={S.getKeyLink}>{t('getKey')}</a>
        </div>
        {/* Live key check: prefix warning first, then the ping result (checking / valid / rejected). */}
        {apiKey && keyOfOtherProvider(providerConfig, apiKey)
          ? <div style={{ ...hint, color: 'var(--c-warning)' }}>{t('keyOtherProviderWarn', { provider: keyOfOtherProvider(providerConfig, apiKey).label, current: providerConfig.label })}</div>
          : apiKey && providerConfig.keyPrefix && !apiKey.startsWith(providerConfig.keyPrefix)
          ? <div style={{ ...hint, color: 'var(--c-warning)' }}>{t('keyPrefixWarn', { prefix: providerConfig.keyPrefix })}</div>
          : keyCheck?.state === 'checking' ? <div style={{ ...hint, color: 'var(--c-ink-dim)' }}>{t('keyChecking')}</div>
          : keyCheck?.state === 'valid' ? <div style={{ ...hint, color: 'var(--c-success)', fontWeight: 700 }}>{t('keyValid')}</div>
          : keyCheck?.state === 'invalid' ? <div style={{ ...hint, color: 'var(--c-danger)', fontWeight: 700 }}>{t('keyInvalid')}</div>
          : keyCheck?.state === 'noCredit' ? <div style={{ ...hint, color: 'var(--c-warning)' }}>{t('keyNoCredit')}</div>
          : keyCheck?.state === 'unknown' ? <div style={{ ...hint, color: 'var(--c-warning)' }}>{t('keyCheckUnknown')}</div>
          : <div style={hint}>{apiKey ? t('keysStored') : t('keyPasteHint')}</div>}
      </div>

      {/* Intelligence preset: one switch that sets every feature's default model tier. */}
      <div style={card}>
        {cardTitle(t('set_intelPreset'))}
        <div style={{ fontSize: 11, color: C.inkDim, marginBottom: 10 }}>{t('set_intelPresetDesc')}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
          {(() => {
            // "Custom" auto-selects whenever the user has ANY per-feature override below. Clicking one
            // of the three presets clears those overrides and reverts to that predetermined config, so
            // it's obvious you've deviated and easy to get back.
            const activeKey = hasModelOverrides ? 'custom' : (intelligence || 'normal')
            return [
              { key: 'optimized', title: t('set_intelOptimized'), desc: t('set_intelOptimizedDesc') },
              { key: 'normal', title: t('set_intelNormal'), desc: t('set_intelNormalDesc', { model: presetModel?.('normal') || providerConfig.presets?.normal || providerConfig.questionModel }) },
              { key: 'max', title: t('set_intelMax'), desc: t('set_intelMaxDesc', { model: presetModel?.('max') || providerConfig.presets?.max || providerConfig.questionModel }) },
              { key: 'custom', title: t('set_intelCustom'), desc: t('set_intelCustomDesc') },
            ].map((opt) => {
              const active = activeKey === opt.key
              const onPick = () => {
                if (opt.key === 'custom') return // custom is entered by editing a per-feature dropdown below
                setAiModels((prev) => { const n = { ...prev }; delete n[provider]; return n }) // revert to predetermined
                setIntelligence(opt.key)
              }
              return (
                <button key={opt.key} onClick={onPick} className={active ? 'ui-tab-current' : undefined} aria-disabled={opt.key === 'custom' || undefined}
                  style={{ flex: 1, minWidth: 150, textAlign: 'left', cursor: (active || opt.key === 'custom') ? 'default' : 'pointer', fontFamily: 'inherit', padding: '8px 10px', borderRadius: 7,
                    border: `1px solid ${active ? C.brandRing : 'var(--c-border)'}`,
                    background: active ? 'rgba(223,37,64,.10)' : 'transparent' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: active ? C.brand : C.ink }}>{active ? '● ' : '○ '}{opt.title}</div>
                  <div style={{ fontSize: 9.5, color: C.inkDim, marginTop: 2 }}>{opt.desc}</div>
                </button>
              )
            })
          })()}
        </div>
        {planDeciding && <div style={{ fontSize: 10, color: C.brand, marginTop: 8 }}>{t('set_deciding')}</div>}
      </div>

      {/* Token and cost counter: OFF unless the user turns it on here. */}
      <div style={card}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!showTokenUsage} onChange={(e) => setShowTokenUsage?.(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.brand, cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>{t('usage_setting')}</span>
        </label>
        <div style={{ fontSize: 11, color: C.inkDim, marginTop: 6, lineHeight: 1.5 }}>{t('usage_settingDesc')}</div>
      </div>

      {/* Question reuse: OFF unless the user turns it on here (or ticks it in onboarding). */}
      <div style={card}>
        {cardTitle(t('reuse_title'))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!reuse.enabled} onChange={(e) => setQuestionReuse?.((prev) => ({ ...(prev || reuse), enabled: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: C.brand, cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>{t('reuse_toggle')}</span>
        </label>
        {reuse.enabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: C.inkDim }}>{t('reuse_keep')}</span>
            <ClampedNumber min={1} max={50} value={reuse.maxPerCard} onCommit={(n) => setQuestionReuse?.((prev) => ({ ...(prev || reuse), maxPerCard: n }))} commitOnBlur
              style={{ ...S.keyInput, flex: 'none', minWidth: 0, width: 70, fontSize: 12, padding: '6px 8px', textAlign: 'center' }} />
            <span style={{ fontSize: 12, color: C.inkDim }}>{t(reuse.maxPerCard === 1 ? 'reuse_perCardOne' : 'reuse_perCard')}</span>
          </div>
        )}
        <div style={hint}>{reuse.enabled ? t('reuse_hintOn', { n: reuse.maxPerCard }) : t('reuse_hintOff')}</div>
        {/* Saved questions live with each card's DECK: clearing is per deck (its subdecks included). */}
        {clearSavedQuestions && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: C.inkDim }}>{t('deck')}:</span>
              <select value={clearDeckValue} onChange={(e) => setClearDeck(e.target.value)} disabled={!ankiDecks.length}
                style={{ ...S.select, minWidth: 160, opacity: ankiDecks.length ? 1 : 0.5 }}>
                {!ankiDecks.length && <option value="">{t('notConnected')}</option>}
                {ankiDecks.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <button onClick={() => clearSavedQuestions(clearDeckValue)} disabled={!clearDeckValue}
                style={{ ...S.ghostBtn, fontSize: 11, color: C.danger, borderColor: 'rgba(229,57,46,.3)', opacity: clearDeckValue ? 1 : 0.5, cursor: clearDeckValue ? 'pointer' : 'default' }}>{t('reuse_clear')}</button>
            </div>
            <div style={{ ...hint, marginTop: 6 }}>{t('reuse_clearHint')}</div>
          </div>
        )}
      </div>

      {/* Per-feature models (advanced). */}
      {/* Opens itself when an override exists, but only on mount: bound to it, the section snapped shut
          under the pointer when the last override was reset. */}
      <details key={provider} ref={(el) => { if (el && !el.dataset.init) { el.dataset.init = '1'; if (hasModelOverrides) el.open = true } }} style={card}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 800, color: C.ink, listStyle: 'revert' }}>
          {t('set_modelsPerFeature')} <span style={{ fontWeight: 600, color: C.inkDim, fontSize: 12 }}>({providerConfig.label})</span>
        </summary>
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <button onClick={() => (checkNewModels || refreshModels)(provider)} disabled={modelsLoading || !apiKey} title={t('checkNewModelsHint')}
                style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 9px', color: C.brand, borderColor: C.brandRing, opacity: (modelsLoading || !apiKey) ? 0.5 : 1 }}>
                {modelsLoading ? t('checkingModels') : `↻ ${t('checkNewModels')}`}
              </button>
              {runConnectionTest && (
                <button onClick={() => runConnectionTest(provider)} disabled={(modelProbe?.loading && modelProbe.provider === provider) || !apiKey} className="tip" data-tip={t('set_testConnectionsHint')}
                  style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 9px', color: C.inkDim, opacity: ((modelProbe?.loading && modelProbe.provider === provider) || !apiKey) ? 0.5 : 1 }}>
                  {modelProbe?.loading && modelProbe.provider === provider ? t('set_testing') : t('set_testConnections')}
                </button>
              )}
              {aiModels[provider] && Object.values(aiModels[provider]).some(Boolean) && (
                <button onClick={() => setAiModels((prev) => { const n = { ...prev }; delete n[provider]; return n })} style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px' }}>{t('resetToDefaults')}</button>
              )}
            </div>
          </div>
          {modelsError?.provider === provider && <div style={{ fontSize: 10, color: C.danger, marginBottom: 6 }}>{modelsError.msg}</div>}
          {modelProbe && !modelProbe.loading && modelProbe.provider === provider && (
            modelProbe.connectionError
              ? <div style={{ fontSize: 10, color: C.danger, marginBottom: 6 }}>{t('set_connError')}</div>
              : <div style={{ fontSize: 10, color: C.inkDim, marginBottom: 6 }}>
                  {t('set_probeResult', { ok: modelProbe.working?.length || 0, down: modelProbe.down?.length || 0 })}
                  {modelProbe.down?.length ? `: ${modelProbe.down.join(', ')}` : ''}
                  {modelProbe.unknown?.length ? ` · ${t('set_probeUnknown', { n: modelProbe.unknown.length })}` : ''}
                </div>
          )}

          {AI_ROLE_META.map(({ role }) => {
            const def = ROLE_DEFAULTS(providerConfig, intelligence)[role]
            const current = aiModels[provider]?.[role] || ''
            const opts = Array.from(new Set([...(provModels.length ? provModels : []), def, current].filter(Boolean)))
            const isCustom = customRoles[`${provider}:${role}`]
            const setRole = (v) => setAiModels((prev) => ({ ...prev, [provider]: { ...(prev[provider] || {}), [role]: v } }))
            return (
              <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.inkDim, width: 70, flexShrink: 0, fontWeight: 600 }}>{t('aiRole_' + role)}</span>
                {isCustom ? (
                  // Committed on blur / Enter: every keystroke was saved and USED at once ("gpt-5" half typed),
                  // and a background call's retired-model heal then rewrote the box while typing.
                  <input key={`${provider}:${role}:${current}`} defaultValue={current} spellCheck={false}
                    onBlur={(e) => { const v = e.target.value.replace(/\s+/g, ''); if (v !== current) setRole(v) }}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) e.currentTarget.blur() }}
                    placeholder={t('set_customModelIdPlaceholder')} style={{ ...S.keyInput, flex: 1, fontSize: 11, padding: '6px 9px' }} />
                ) : (
                  <select value={current} onChange={(e) => { if (e.target.value === '__custom__') { setCustomRoles((c) => ({ ...c, [`${provider}:${role}`]: true })) } else setRole(e.target.value) }}
                    style={{ ...S.select, flex: 1, fontSize: 11, padding: '6px 9px' }}>
                    <option value="">{t('providerDefault')} ({planDeciding && !current ? t('set_choosing') : def})</option>
                    {opts.map((m) => <option key={m} value={m}>{m}</option>)}
                    <option value="__custom__">✏️ {t('customModel')}</option>
                  </select>
                )}
                {isCustom && (
                  <button onClick={() => { setCustomRoles((c) => ({ ...c, [`${provider}:${role}`]: false })); if (current && !(provModels || []).includes(current)) setRole('') }} style={{ ...S.ghostBtn, fontSize: 9, padding: '3px 7px' }} title={t('useList')}>↩</button>
                )}
              </div>
            )
          })}
          <div style={hint}>
            {provModels.length ? t('aiModelsHintDropdown') : t('aiModelsHint')}<br />
            {t('customModelHelp')} <a href={providerConfig.modelsUrl || providerConfig.url} target="_blank" rel="noopener noreferrer" style={{ color: C.brand }}>{providerConfig.label} ↗</a>
          </div>
        </div>
      </details>
    </div>
  )

  // Unset "Ebi speaks" defaults: language modes → the learned language (immersion); general
  // modes → the APP language (mirrors interactionLangName, so the picker never shows a phantom).
  // Option labels, not prompt names: 'Chinese' matched no option, so the picker showed the first one.
  const appLangLabel = langMeta(appLanguage).pickerName
  // What the question generator uses when a language mode has no saved studyLanguage (App's
  // learnLangName(): the mode name, e.g. "Spanish (LatAm)"), mapped onto this list. Defaulting to
  // 'English' here showed "Learning: English" while every question came out in Spanish.
  // Also other names ("Mandarin Chinese", "Inglés", Studio's free text): see langFromName.
  // A language outside the list (Swedish, Hebrew...) is shown as itself: shown as "English", the picker hid the
  // mode's real language, and "correcting" it switched the mode to English.
  const langOption = (name) => (isDistinctSpoken(name) ? String(name).trim() : langFromName(name)?.label) || String(name || '').trim() || 'English' // Cantonese stays Cantonese
  const learnedLabel = langOption(activeMode.studyRules?.studyLanguage || learnLangDefault)

  const studyRulesBase = activeMode.studyRules || (isLanguage ? defaultStudyRules : defaultGeneralStudyRules)
  const setStudyRule = (patch) => updateActiveMode({ studyRules: { ...studyRulesBase, ...patch } })
  const qPrefs = Array.isArray(activeMode.studyRules?.questionPreferences) ? activeMode.studyRules.questionPreferences : []
  const addQPref = () => {
    const v = qPrefInput.trim()
    if (!v) return
    if (qPrefs.includes(v)) { setQPrefInput(''); return }
    // Full: say so (the oldest rule used to vanish without a word). The text stays in the box.
    if (qPrefs.length >= 12) { alertDialog(t('qPrefsFull')); return }
    setStudyRule({ questionPreferences: [...qPrefs, v] })
    setQPrefInput('')
  }
  const toggleRow = (checked, onChange, label) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.ink, cursor: 'pointer', fontWeight: 600 }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 15, height: 15, accentColor: C.brand, cursor: 'pointer' }} />
      {label}
    </label>
  )
  const langSelect = (value, onChange, extraFirst) => (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{ ...S.select, width: '100%' }}>
      {value && !LANGS.some((l) => l.label === value) && <option value={value}>{value}</option>}
      {extraFirst}
      {LANGS.filter((l) => l.code !== 'auto').map((l) => <option key={l.code} value={l.label}>{l.label}</option>)}
    </select>
  )
  const fieldGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14 }

  const Study = (
    <div>
      {sectionTitle(t('setStudy'))}{modeBar}
      <div style={card}>
        {cardTitle(t('set_studySession'))}
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div>
            {fieldLabel(t('questionsPerCard'))}
            <ClampedNumber min={1} max={10} value={activeMode.studyRules?.questionsPerCard || 3}
              onCommit={(n) => updateActiveMode({ studyRules: { ...studyRulesBase, questionsPerCard: n } })}
              style={{ ...S.keyInput, flex: 'none', minWidth: 0, width: 70 }} />
          </div>
          <div>
            {fieldLabel(t('cardsAtOnce'))}
            <ClampedNumber min={1} max={10} value={activeMode.studyRules?.cardsAtOnce || 3}
              onCommit={(n) => updateActiveMode({ studyRules: { ...studyRulesBase, cardsAtOnce: n } })}
              style={{ ...S.keyInput, flex: 'none', minWidth: 0, width: 70 }} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          {fieldLabel(<>{t('questionDepth')} <span className="tip" data-tip={t('questionDepthDesc')} style={{ textTransform: 'none', color: C.inkFaint }}>ⓘ</span></>)}
          <select value={activeMode.studyRules?.questionDepth === 'thorough' ? 'thorough' : 'adaptive'}
            onChange={(e) => updateActiveMode({ studyRules: { ...studyRulesBase, questionDepth: e.target.value } })}
            style={{ ...S.select, maxWidth: 360, width: '100%' }}>
            <option value="adaptive">{t('questionDepthAdaptive')}</option>
            <option value="thorough">{t('questionDepthThorough')}</option>
          </select>
        </div>
        <div style={{ marginTop: 12 }}>
          {toggleRow(activeMode.studyRules?.adaptive === true, (v) => updateActiveMode({ studyRules: { ...studyRulesBase, adaptive: v } }), t('studyAdaptive'))}
          <div style={{ ...hint, marginTop: 3, marginLeft: 23 }}>{t('studyAdaptiveDesc', { n: ADAPTIVE_STRUGGLE_LAPSES })}</div>
        </div>
      </div>

      <div style={card}>
        {cardTitle(t('set_studyLanguages'))}
        <div style={fieldGrid}>
          {isLanguage && (
            <div>
              {fieldLabel(t('studyLearning'))}
              {langSelect(learnedLabel, (v) => updateActiveMode({ studyRules: { ...studyRulesBase, studyLanguage: v } }))}
            </div>
          )}
          <div>
            {fieldLabel(t('quizIn'))}
            {/* '' = follow the learned language (general modes: the app language). It could not be chosen again once
                a language was picked, so the mode stayed on that language after the learned one changed. */}
            {langSelect(activeMode.studyRules?.quizLanguage ? langOption(activeMode.studyRules.quizLanguage) : '', (v) => setStudyRule({ quizLanguage: v }), <option value="">{t('set_quizDefault', { lang: isLanguage ? learnedLabel : appLangLabel })}</option>)}
          </div>
          <div>
            {fieldLabel(t('set_hookLang'))}
            {langSelect(activeMode.studyRules?.hookLanguage || '', (v) => setStudyRule({ hookLanguage: v }), <option value="">{t('set_hookLangDefault')}</option>)}
            <div style={{ fontSize: 10, color: C.inkFaint, marginTop: 3 }}>{t('set_hookLangDesc')}</div>
          </div>
          {isLanguage && (
            <div>
              {fieldLabel(t('set_dialect'))}
              <input type="text" value={activeMode.studyRules?.dialect || ''} placeholder={t('set_dialectPlaceholder')}
                onChange={(e) => updateActiveMode({ studyRules: { ...studyRulesBase, dialect: e.target.value } })}
                style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box' }} />
              <div style={{ fontSize: 10, color: C.inkFaint, marginTop: 3 }}>{t('set_dialectDesc')}</div>
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 12, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 8, rowGap: 3, lineHeight: 1.4 }}>
          {isLanguage ? (<>
            <span style={{ color: C.inkDim, fontWeight: 700 }}>{t('studyLearning')}</span><span>{t('studyLearningDesc')}</span>
            <span style={{ color: C.inkDim, fontWeight: 700 }}>{t('quizIn')}</span><span>{t('studyEbiSpeaksDesc')}</span>
          </>) : (
            <span style={{ gridColumn: '1 / -1' }}>{t('studyEbiOnlyDesc')}</span>
          )}
        </div>
      </div>

      {isLanguage && (
        <div style={card}>
          {cardTitle(t('set_studyFeedback'))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {toggleRow(!!activeMode.studyRules?.grammarFeedback, (v) => updateActiveMode({ studyRules: { ...studyRulesBase, grammarFeedback: v } }), t('grammarFeedback'))}
            <div>
              {toggleRow(!!activeMode.studyRules?.wordHints, (v) => updateActiveMode({ studyRules: { ...studyRulesBase, wordHints: v } }), t('studyWordHints'))}
              <div style={{ ...hint, marginTop: 3, marginLeft: 23 }}>{t('studyWordHintsDesc')}</div>
            </div>
          </div>
        </div>
      )}

      {/* How Ebi asks: question-style preferences (taught from the study feedback chat or added here; each
          is injected into question generation for THIS mode), plus the Ask AI box and Ebi Studio. */}
      <div style={card}>
        {cardTitle(t('set_studyHowAsk'))}
        {fieldLabel(t('qPrefsTitle'))}
        <div style={{ fontSize: 11, color: C.inkFaint, margin: '2px 0 6px', lineHeight: 1.5 }}>{t('qPrefsDesc')}</div>
        {qPrefs.map((pref, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ flex: 1, fontSize: 12, color: C.inkDim, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.22)', borderRadius: 6, padding: '5px 9px', lineHeight: 1.5 }}>{pref}</span>
            <button onClick={async () => { const id = activeModeId; if (!(await confirmDialog(t('qPrefsRemoveConfirm', { rule: pref })))) return; if (getActiveModeId && getActiveModeId() !== id) return /* another mode became active during the confirm (a create finished): this mode's rules would overwrite it */; const live = getActiveMode?.()?.studyRules /* rules and dialect saved while the dialog was open (Fix question, a chat action) stay */; updateActiveMode({ studyRules: { ...studyRulesBase, ...(live || {}), questionPreferences: (live?.questionPreferences || qPrefs).filter((x) => x !== pref) } }) }}
              aria-label={t('qPrefsRemove')} className="tip" data-tip={t('qPrefsRemove')}
              style={{ ...S.ghostBtn, fontSize: 10, padding: '4px 9px', color: C.danger, flexShrink: 0 }}>✕</button>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
          <input value={qPrefInput} onChange={(e) => setQPrefInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing && qPrefInput.trim()) addQPref() }}
            placeholder={t('qPrefsPlaceholder')} style={{ ...S.keyInput, flex: 1, fontSize: 12 }} />
          <button onClick={addQPref} disabled={!qPrefInput.trim()}
            style={{ ...S.ghostBtn, fontSize: 11, padding: '5px 12px', opacity: qPrefInput.trim() ? 1 : 0.5 }}>{t('qPrefsAdd')}</button>
        </div>
        {askAi('study', t('askAiStudyPlaceholder'))}
        {openModeStudio && activeMode && (
          <button onClick={() => openModeStudio({ kind: 'edit', focus: 'study', modeId: activeModeId })}
            style={{ ...S.getKeyLink, fontSize: 12, marginTop: 10, color: C.purple, borderColor: 'rgba(124,77,239,.35)' }}>
            {'✨'} {t('studioStudyEntry')}
          </button>
        )}
      </div>

      {/* The raw instructions. Rarely touched, so collapsed. */}
      <details style={card}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 800, color: C.ink, listStyle: 'revert' }}>{t('set_studyAdvanced')}</summary>
        <div style={{ ...hint, marginTop: 6, marginBottom: 10 }}>{t('set_studyAdvancedDesc')}</div>
        {fieldLabel(t('questionPrompt'))}
        <textarea value={activeMode.studyRules?.questionPrompt ?? (isLanguage ? defaultStudyRules : defaultGeneralStudyRules).questionPrompt}
          placeholder={(isLanguage ? defaultStudyRules : defaultGeneralStudyRules).questionPrompt}
          onChange={(e) => updateActiveMode({ studyRules: { ...studyRulesBase, questionPrompt: e.target.value } })}
          style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', minHeight: 110, resize: 'vertical' }} />
        {/* How a card is rated is fixed in the app (evaluateCardAnswers): the editable text here was never read,
            so a changed rule silently did nothing. Shown as what it really is. */}
        <div style={{ marginTop: 10 }}>{fieldLabel(t('ratingRules'))}
          <div style={{ ...hint, lineHeight: 1.6 }}>{t('set_ratingFixed')}</div>
          <div style={{ ...hint, lineHeight: 1.6 }}>{t('set_ratingOneQ')}</div>
        </div>
      </details>
    </div>
  )

  const Cards = (
    <div>
      {sectionTitle(t('setCards'))}{modeBar}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ankiConnected ? C.success : ankiConnected === false ? C.warning : C.inkFaint }} />
          <span style={{ fontSize: 12, color: C.inkDim }}>{ankiConnected ? t('connected') : ankiConnected === false ? t('notConnected') : t('checkingAnki')}</span>
          {ankiConnected && ankiDecks.length > 0 && (<>
            <span style={{ fontSize: 12, color: C.inkDim, marginLeft: 4 }}>{t('deck')}:</span>
            <select value={ankiDecks.includes(ankiDeck) ? ankiDeck : ''} onChange={(e) => setAnkiDeck(e.target.value)} style={{ ...S.select, minWidth: 140 }}>
              {/* No saved deck (or it was deleted): without this the first deck LOOKED chosen, and picking it
                  fired no change, so nothing was saved and the fallback followed whichever deck sorted first. */}
              {!ankiDecks.includes(ankiDeck) && <option value="" disabled>{t('deck_selectDeck')}</option>}
              {ankiDecks.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </>)}
          <button onClick={refreshAnkiConnection} style={{ ...S.getKeyLink, fontSize: 11, marginLeft: 'auto' }}>{ankiConnected === null ? t('checkingAnki') : t('refresh')}</button>
        </div>
        <div style={hint}>{t('ankiAddonNote')}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('cardFormat'))}
        {askAi('cards', t('aiEditPlaceholder'))}
        {openModeStudio && activeMode && (
          <button onClick={() => openModeStudio({ kind: 'edit', focus: 'cards', modeId: activeModeId })}
            style={{ ...S.getKeyLink, fontSize: 12, marginTop: 10, color: C.purple, borderColor: 'rgba(124,77,239,.35)' }}>
            {'✨'} {t('studioDeckEntry')}
          </button>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0 10px' }}>
          {Object.entries(ankiFormat.fields || {}).map(([field, enabled]) => (
            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: enabled ? C.ink : C.inkDim, cursor: 'pointer' }}>
              <input type="checkbox" checked={enabled} onChange={() => updateActiveMode({ fields: { ...ankiFormat.fields, [field]: !enabled } })} /> {field}
            </label>
          ))}
        </div>
        {fieldLabel(t('frontTemplate'))}
        <input value={ankiFormat.frontTemplate || ''} onChange={(e) => updateActiveMode({ frontTemplate: e.target.value })} style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', fontSize: 12, marginBottom: 8 }} />
        {fieldLabel(t('backTemplate'))}
        <textarea value={ankiFormat.backTemplate || ''} onChange={(e) => updateActiveMode({ backTemplate: e.target.value })} style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', fontSize: 12, minHeight: 70, resize: 'vertical' }} />
        <div style={hint}>{t('set_placeholders')} {'{word} {term} {partOfSpeech} {pronunciation} {translation} {synonyms} {definition} {example}'}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('tagRules'))}
        <textarea value={activeMode.tagRules || ''} onChange={(e) => updateActiveMode({ tagRules: e.target.value })}
          placeholder={t('tagRulesPlaceholder')} style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', fontSize: 12, minHeight: 80, resize: 'vertical' }} />
      </div>
    </div>
  )

  const Knowledge = (
    <div>
      {sectionTitle(t('setKnowledge'))}{modeBar}
      <div style={card}>
        <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 10 }}>{t('knowledgeIntro')}</div>
        {/* Big-KB status: warn when it's giant with no navigable TOC (Ebi can only see the first
            slice); reassure when a TOC was found (Ebi navigates it section by section). */}
        {knowledgeStatus?.big && !knowledgeStatus?.hasToc && (
          <div style={{ padding: '8px 12px', marginBottom: 10, borderRadius: RADIUS.sm, background: 'rgba(232,147,12,.12)', border: '1px solid rgba(232,147,12,.35)', color: C.ink, fontSize: 11, lineHeight: 1.5 }}>
            ⚠️ {t('knowledgeBigNoToc').replace('{kb}', Math.round(knowledgeStatus.chars / 1024).toLocaleString())}
          </div>
        )}
        {knowledgeStatus?.big && knowledgeStatus?.hasToc && (
          <div style={{ padding: '8px 12px', marginBottom: 10, borderRadius: RADIUS.sm, background: C.successTint, border: '1px solid rgba(24,169,87,.25)', color: C.inkDim, fontSize: 11, lineHeight: 1.5 }}>
            📖 {t('knowledgeBigToc').replace('{kb}', Math.round(knowledgeStatus.chars / 1024).toLocaleString()).replace('{n}', String(knowledgeStatus.outlineCount))}
          </div>
        )}
        <div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setKnowledgeDragging(true) }} onDragLeave={() => setKnowledgeDragging(false)} onDrop={handleKnowledgeDrop}
          onClick={() => document.getElementById('knowledge-file-input').click()}
          style={{ padding: 18, borderRadius: RADIUS.md, textAlign: 'center', cursor: 'pointer', border: `2px dashed ${knowledgeDragging ? C.brand : C.border}`, background: knowledgeDragging ? C.brandTint2 : C.surfaceSunken, color: C.inkDim, fontSize: 12 }}>
          {knowledgeBusy ? `⏳ ${knowledgeBusy}` : knowledgeDragging ? t('dropHere') : t('dropZone')}
          <input id="knowledge-file-input" type="file" accept=".txt,.md,.pdf" multiple onChange={handleKnowledgeFileInput} style={{ display: 'none' }} />
        </div>
        {knowledgeFiles.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
            {knowledgeFiles.map((f) => (
              <div key={`${f.name}|${f.disabled ? 1 : 0}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: f.disabled ? C.surfaceSunken : C.successTint, border: `1px solid ${f.disabled ? C.border : 'rgba(24,169,87,.2)'}`, borderRadius: RADIUS.sm, fontSize: 12 }}>
                <span style={{ flex: 1, color: f.disabled ? C.inkFaint : C.ink, textDecoration: f.disabled ? 'line-through' : 'none' }}>{f.name}</span>
                <span style={{ color: C.inkFaint, fontSize: 10 }}>{(f.size / 1024).toFixed(1)}KB</span>
                <button onClick={() => toggleKnowledgeFile(f.name, !f.disabled)} disabled={knowledgeBusyFiles?.has?.(f.name)}
                  style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 7px', ...(knowledgeBusyFiles?.has?.(f.name) ? { opacity: 0.5, cursor: 'default' } : {}) }}>{f.disabled ? t('enable') : t('disable')}</button>
                <button onClick={async () => { const id = activeModeId; if (!(await confirmDialog(t('deck_deleteConfirm', { front: f.name })))) return; if (getActiveModeId && getActiveModeId() !== id) return /* the file belongs to the mode that was active when asked */; deleteKnowledgeFile(f.name, !!f.disabled) }} disabled={knowledgeBusyFiles?.has?.(f.name)} style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 7px', color: C.danger, borderColor: 'rgba(229,57,46,.25)', ...(knowledgeBusyFiles?.has?.(f.name) ? { opacity: 0.5, cursor: 'default' } : {}) }}>{t('delete')}</button>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 8 }}>{t('noFiles')}</div>}
      </div>
    </div>
  )

  // ── Audio (pronunciation) — GLOBAL ──
  const pron = pronunciationCfg || { defaultRegions: {}, editions: {}, ttsUrl: '', ttsVoices: {}, embedInAnki: true }
  const setPron = (patch) => setPronunciationCfg((prev) => ({ ...prev, ...patch }))
  // One row per language CODE: "Chinese (Simplified)" and "(Traditional)" are both zh, one setting, and two rows
  // edited each other. Labelled with the base name.
  const audioLangs = LANGS.filter((l) => l.code !== 'auto').map((l) => ({ label: l.label.replace(/\s*\(.*\)$/, ''), iso1: langInfo(l.label)?.iso1 }))
    .filter((l, i, all) => l.iso1 && all.findIndex((x) => x.iso1 === l.iso1) === i)
  const AnkiAudio = (
    <div>
      {sectionTitle(t('setAnkiAudio'))}
      <div style={card}>
        {fieldLabel(t('set_ankiAutoSync'))}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!studyAutoSync} onChange={(e) => setStudyAutoSync(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.brand, cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>{t('set_autoSyncLabel')}</span>
        </label>
        {studyAutoSync && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 12, color: C.inkDim }}>{t('set_graceWindow')}</span>
            {/* ClampedNumber: clamping every keystroke turned a cleared box into 1, so typing "10" saved 110. */}
            <ClampedNumber min={1} max={120} value={studyAutoSyncMinutes} onCommit={setStudyAutoSyncMinutes} commitOnBlur
              style={{ ...S.keyInput, flex: 'none', minWidth: 0, width: 70, fontSize: 12, padding: '6px 8px', textAlign: 'center' }} />
            <span style={{ fontSize: 12, color: C.inkDim }}>{t('set_minutes')}</span>
          </div>
        )}
        <div style={hint}>
          {studyAutoSync
            ? t(studyAutoSyncMinutes === 1 ? 'set_autoSyncHintOne' : 'set_autoSyncHint', { n: studyAutoSyncMinutes })
            : t('set_autoSyncOff')}
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, fontFamily: FONT.display, color: C.ink, margin: '20px 0 4px' }}>{t('setAudio')}</div>
      <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 10, lineHeight: 1.5 }}>{t('audioIntro')}</div>
      <div style={card}>
        {fieldLabel(t('audioRegions'))}
        <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 10, lineHeight: 1.5 }}>{t('audioRegionsDesc')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px' }}>
          {audioLangs.map((l) => (
            <div key={l.iso1 + l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 12, color: C.ink }}>{l.label}</span>
              <input value={pron.defaultRegions?.[l.iso1] || ''} placeholder={t('audioRegionAny')} maxLength={2}
                onChange={(e) => setPron({ defaultRegions: { ...pron.defaultRegions, [l.iso1]: e.target.value.toLowerCase().replace(/[^a-z]/g, '') } })}
                style={{ ...S.keyInput, flex: 'none', minWidth: 0, width: 52, fontSize: 12, padding: '4px 8px', textAlign: 'center' }} />
            </div>
          ))}
        </div>
        <div style={hint}>{t('audioRegionsHint')}</div>
      </div>
      <div style={card}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.ink, fontWeight: 700 }}>
          <input type="checkbox" checked={pron.embedInAnki !== false} onChange={(e) => setPron({ embedInAnki: e.target.checked })} />
          {t('audioEmbed')}
        </label>
        <div style={hint}>{t('audioEmbedDesc')}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('audioTtsUrl'))}
        <input value={pron.ttsUrl || ''} onChange={(e) => setPron({ ttsUrl: e.target.value })}
          placeholder="http://localhost:8880" style={{ ...S.keyInput, width: '100%', fontSize: 12 }} />
        <div style={hint}>{t('audioTtsUrlDesc')}</div>
      </div>
    </div>
  )

  const DataUpdates = (
    <div>
      {sectionTitle(t('setDataUpdates'))}
      <DataFolderCard t={t} card={card} fieldLabel={fieldLabel} hint={hint} onChanged={onDataFolderChanged} />
      <UpdatesCard t={t} card={card} fieldLabel={fieldLabel} hint={hint} serverDown={serverDown} />
    </div>
  )

  const Modes = (
    <div>
      {sectionTitle(t('setModes'))}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {modes.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Rename in place: clicking the active chip set editingModeName, but only the per-mode panes'
                  bar rendered the box, so nothing happened here and a rename box popped up on the next pane. */}
              {editingModeName === m.id && m.id === activeModeId ? (
                <input autoFocus defaultValue={m.name}
                  onBlur={(e) => { if (e.target.dataset.cancel !== '1') renameMode(m.id, e.target.value || m.name) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent?.isComposing) { e.currentTarget.dataset.cancel = '1'; renameMode(m.id, e.target.value || m.name) } // see the mode bar
                    else if (e.key === 'Escape' && !e.nativeEvent?.isComposing && e.keyCode !== 229) { e.preventDefault(); e.currentTarget.dataset.cancel = '1'; setEditingModeName(null) } // see the mode bar
                  }}
                  style={{ ...S.keyInput, width: 160, fontSize: 12, padding: '4px 8px' }} />
              ) : (
              <button onClick={() => { if (m.id === activeModeId) setEditingModeName(m.id); else if (p.switchMode) p.switchMode(m.id); else { setActiveModeId(m.id); saveModes(modes, m.id, { changedIds: [] }) } }}
                title={`${m.description || m.name}`}
                style={{ padding: '5px 12px', borderRadius: RADIUS.pill, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                  background: m.id === activeModeId ? C.brandTint : C.surfaceAlt, color: m.id === activeModeId ? C.brand : C.inkDim,
                  border: m.id === activeModeId ? `1px solid ${C.brandRing}` : `1px solid ${C.border}`, fontWeight: m.id === activeModeId ? 700 : 500 }}>
                {m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {m.name}
              </button>
              )}
              {modes.length > 1 && (
                <button type="button" aria-label={t('modeDelete', { name: m.name })} onClick={async () => { if (await confirmDialog(t('modeDeleteConfirm', { name: m.name }))) deleteMode(m.id) }} style={{ cursor: 'pointer', color: C.inkFaint, fontSize: 14, padding: '0 2px', background: 'none', border: 'none', fontFamily: 'inherit' }}>&times;</button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={modeEditInput} onChange={(e) => setModeEditInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing && modeEditInput.trim()) { const text = modeEditInput.trim(); createMode(text).then((ok) => { if (ok) setModeEditInput((cur) => (cur.trim() === text ? '' : cur)) }) } }}
            placeholder={t('createModePlaceholder')} style={{ ...S.keyInput, flex: 1 }} disabled={modeCreating} />
          <button onClick={() => { if (modeEditInput.trim()) { const text = modeEditInput.trim(); createMode(text).then((ok) => { if (ok) setModeEditInput((cur) => (cur.trim() === text ? '' : cur)) }) } }}
            disabled={modeCreating || !modeEditInput.trim()} style={{ ...S.keyDone, opacity: modeCreating || !modeEditInput.trim() ? 0.5 : 1 }}>{modeCreating ? t('creating') : t('create')}</button>
        </div>
        {openModeStudio && (
          // Whatever is already typed in the box above rides into the studio as the
          // opening brief, so the two controls are one flow and not two dead ends.
          <button onClick={() => openModeStudio({ kind: 'create', focus: 'all', seed: modeEditInput.trim() })}
            style={{ ...S.getKeyLink, fontSize: 12, marginTop: 10, width: '100%', color: C.purple, borderColor: 'rgba(124,77,239,.35)' }}>
            {'✨'} {t('studioCreateEntry')}
          </button>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <button onClick={addDefaultMode} style={{ ...S.ghostBtn, fontSize: 11, color: C.success, borderColor: 'rgba(24,169,87,.3)' }}>+ {t('defaultMode')}</button>
          {openModeStudio && activeMode && (
            <button onClick={() => openModeStudio({ kind: 'edit', focus: 'all', modeId: activeModeId })}
              style={{ ...S.ghostBtn, fontSize: 11, color: C.purple, borderColor: 'rgba(124,77,239,.35)' }}>
              {'✨'} {t('studioEditEntry', { name: activeMode.name })}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  const panes = { general: General, models: AIModels, anki: AnkiAudio, data: DataUpdates, study: Study, cards: Cards, knowledge: Knowledge, modes: Modes }

  return (
    // The body has CSS zoom:1.35, which also scales this fixed backdrop — so 100vw/100vh
    // render at 135% and its flex-centering lands off-screen (modal pushed right + clipped).
    // Cancel the zoom on the backdrop so it overlays exactly one visual viewport, and divide
    // the modal's viewport caps by 1.35 so it fits on small laptop screens. (Same /1.35
    // convention as the app root in App.jsx.)
    // Closes only on a click that STARTED on the backdrop: selecting text in a field and releasing over the
    // backdrop is a click there too, and it closed Settings mid-edit.
    <div style={{ ...S.backdrop, width: 'calc(100vw / 1.35)', height: 'calc(100vh / 1.35)' }}
      onMouseDown={(e) => { backdropDownRef.current = e.target === e.currentTarget }}
      onClick={(e) => { if (backdropDownRef.current && e.target === e.currentTarget) onClose(); backdropDownRef.current = false }}>
      <div onClick={(e) => e.stopPropagation()} className="settings-modal" style={{
        display: 'flex', width: 'min(900px, calc(94vw / 1.35))', height: 'min(640px, calc(86vh / 1.35))',
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg,
        boxShadow: SHADOW.xl, overflow: 'hidden', animation: 'pop .18s cubic-bezier(.34,1.56,.64,1)', cursor: 'default',
      }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, background: C.surfaceSunken, borderRight: `1px solid ${C.border}`, padding: '14px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: FONT.display, color: C.ink, padding: '2px 8px 12px' }}>⚙ {t('settingsTitle')}</div>
          {NAV.map((grp) => (
            <div key={grp.group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, padding: '4px 8px' }}>{grp.group}</div>
              {grp.items.map((it) => (
                <button key={it.id} onClick={() => setCategory(it.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: RADIUS.sm, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: currentPane === it.id ? 700 : 600, marginBottom: 2,
                  background: currentPane === it.id ? C.brandTint : 'transparent',
                  color: currentPane === it.id ? C.brand : C.inkDim,
                }}>
                  <span style={{ width: 16, textAlign: 'center' }}>{it.icon}</span>{it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 14px 0' }}>
            <button onClick={onClose} style={{ ...S.ghostBtn, fontSize: 12, padding: '4px 12px' }}>{t('close')}</button>
          </div>
          {/* key: a new pane starts at the top, not at the previous pane's scroll position. */}
          <div key={currentPane} style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 24px' }}>
            {panes[currentPane] || General}
          </div>
        </div>
      </div>
    </div>
  )
}
