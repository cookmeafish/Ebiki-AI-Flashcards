// The decisions behind Settings > Data & updates' update card, kept pure so every state is tested
// (UpdatesCard in SettingsModal.jsx only wires them to the screen).

// GET /api/update → which state the card shows. Order matters: a pending restart outranks everything
// (the server still runs the old code), another branch can never take an update, an unreachable remote
// says so, a missing master is never "up to date", and a copy with its own commits is never offered one.
export function checkStateFor(d) {
  if (!d || typeof d !== 'object') return 'down'
  if (!d.gitAvailable) return 'nogit'
  if (d.restartPending) return 'done'
  if (d.branch && !d.onMaster) return 'branch'
  if (!d.reachable) return 'offline'
  if (d.remoteMissing) return 'remoteMissing'
  if (d.localCommits) return 'localCommits'
  return d.updateAvailable ? 'available' : 'uptodate'
}

// POST /api/update answered → { state, err } where err is an i18n key (or null). updated without ok =
// the code moved but npm install failed: a restart finishes it (the launcher installs what is pending).
export function updateResultState(d) {
  if (!d || typeof d !== 'object') return { state: 'error', err: 'other' }
  if (d.busy) return { state: 'busy', err: null }
  if (d.dirty) return { state: 'dirty', err: null }
  if (d.localCommits) return { state: 'localCommits', err: null }
  if (d.wrongBranch) return { state: 'branch', err: null }
  if (d.updated && !d.ok) return { state: 'done', err: 'updatesDepsPending' }
  if (!d.ok) return { state: 'error', err: 'other' }
  return { state: 'done', err: null }
}

// After a dropped connection the repository is asked what happened (d = the ?local=1 answer, or null
// when the service never came back). ONE answer settles it: a moved sha = done; the same sha = the update
// did not apply, so it is still available; no starting sha to compare = run a real check.
export function verifyOutcome(beforeSha, d) {
  if (!d) return 'down'
  if (!beforeSha) return 'recheck'
  return d.current !== beforeSha ? 'done' : 'available'
}

// The restart button: only in the app window, and never when the server said it cannot restart itself
// (macOS/Linux, a manual npm run dev): the window's own relaunch then reopens the OLD server. Unknown
// (an older server, a local-only answer) keeps the button; a click still falls back to the right wording.
export function restartOffered({ electron, canRestart }) {
  return !!electron && canRestart !== false
}

// Poll ?local=1 until the server answers or the deadline passes. Each poll is bounded (a half-started
// server can hold a connection open forever, which kept "Finishing up..." on past the deadline).
export async function pollUntilAnswered({ fetchLocal, ms = 45000, every = 3000, perTry = 5000, wait, now = Date.now }) {
  const sleep = wait || ((n) => new Promise((r) => setTimeout(r, n)))
  const deadline = now() + ms
  while (now() < deadline) {
    await sleep(every)
    try {
      const d = await fetchLocal(Math.max(1, Math.min(perTry, deadline - now())))
      if (d?.current) return d
    } catch { /* still down: that is what the deadline is for */ }
  }
  return null
}
