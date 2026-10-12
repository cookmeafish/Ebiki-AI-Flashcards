// THE VERSION PICKER (asset view only; the owner: pick, per raid boss, the past version he liked). Every distinct
// version of public/assets/legends/raids/<motif>.svg in git history, plus the rejected 2026-10-11 redesigns, lives in
// dev/raid-history/<motif>/<id>.svg with dev/raid-history/manifest.json, written by
// `node dev/legends-gallery/raid-history.mjs` (git show, never the working tree; gitignored: git already holds it).
// The asset view's Phase drawings panel steps through them; a real fight always uses raids/<motif>.svg.
// Put a version back for good: `node dev/legends-gallery/restore-version.mjs <motif> <id> [--dry-run]`.
// Pure: the generator, the restore script, the tests and the asset view share it.
export const RAID_HISTORY_DIR = 'dev/raid-history'
export const RAID_HISTORY_BASE = `/${RAID_HISTORY_DIR}`
export const RAID_HISTORY_MANIFEST = `${RAID_HISTORY_BASE}/manifest.json`
export const REJECTED_ID = 'rejected-2026-10-11'
export const REJECTED_DIR = '.scratch/restore-1011/now'
export const NOW_ID = 'now'

const ID_RE = /^(?:[0-9a-f]{7,40}|rejected-\d{4}-\d{2}-\d{2})$/
const MOTIF_RE = /^[a-z][a-z0-9]*$/
export const isVersionId = (id) => typeof id === 'string' && ID_RE.test(id)
export const historyUrl = (motif, id) => (MOTIF_RE.test(motif || '') && isVersionId(id) ? `${RAID_HISTORY_BASE}/${motif}/${id}.svg` : '')

// Commit subjects are git text: shown as they are, minus em dashes (no dashes in user-facing text).
const clean = (s) => String(s || '').replace(/\s*—\s*/g, ': ').slice(0, 200)
// A manifest read from disk, shaped: { motif: [{ id, date, subject, source }] }, newest first, bad entries dropped.
export function shapeHistory(raw) {
  const out = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [motif, list] of Object.entries(raw)) {
    if (!MOTIF_RE.test(motif) || !Array.isArray(list)) continue
    const seen = new Set()
    out[motif] = list.filter((v) => v && isVersionId(v.id) && !seen.has(v.id) && seen.add(v.id))
      .map((v) => ({ id: v.id, date: /^\d{4}-\d{2}-\d{2}$/.test(v.date) ? v.date : '', subject: clean(v.subject), source: v.source === 'rejected' ? 'rejected' : 'git' }))
  }
  return out
}
// The picker's list for one boss: the live file first, then its history newest first.
export const versionList = (history, motif) => [{ id: NOW_ID, date: '', subject: '', source: 'now' }, ...((history && history[motif]) || [])]

// The files that make one boss, repo-relative: its drawing and its fight files.
export const bossFiles = (motif) => ({
  svg: `public/assets/legends/raids/${motif}.svg`,
  fx: `src/features/legends/fx/${motif}.jsx`,
  impact: `src/features/legends/impact/bosses/${motif}.js`,
  parts: `src/features/legends/impact/bosses/${motif}.parts.jsx`,
})
// Shared files the restore script only REPORTS (other bosses live there too).
export const SHARED_FILES = ['src/features/legends/impact/body.js', 'src/features/legends/art.jsx']
// Where each file comes from for a version: { to, git: sha } or { to, file } (the rejected snapshot on disk).
export function restorePlan(motif, id) {
  const f = bossFiles(motif)
  if (id === REJECTED_ID) {
    return [
      { to: f.svg, file: `${REJECTED_DIR}/raids/${motif}.svg` },
      { to: f.fx, file: `${REJECTED_DIR}/fx/${motif}.jsx` },
      { to: f.impact, file: `${REJECTED_DIR}/bosses/${motif}.js` },
      { to: f.parts, file: `${REJECTED_DIR}/bosses/${motif}.parts.jsx` },
    ]
  }
  return [f.svg, f.fx, f.impact, f.parts].map((to) => ({ to, git: id }))
}
// The restore script's arguments: a boss and a version are both required; --dry-run writes nothing.
export function restoreArgs(argv) {
  const dryRun = argv.includes('--dry-run')
  const [motif = '', id = ''] = argv.filter((a) => !a.startsWith('--'))
  const usage = 'usage: node dev/legends-gallery/restore-version.mjs <motif> <version id> [--dry-run]'
  if (!motif || !id) return { error: usage }
  if (!MOTIF_RE.test(motif)) return { error: `not a boss name: "${motif}"` }
  if (!isVersionId(id)) return { error: `not a version id: "${id}" (a commit sha or ${REJECTED_ID})` }
  return { motif, id, dryRun, plan: restorePlan(motif, id) }
}

// A drawing the asset view may load: no script, embedded document, external reference or event handler.
// Painted 3D files may point at their own gradients (url(#id)) and nothing else.
export function unsafeSvg(svg) {
  if (!/<svg[\s>]/i.test(svg) || !/<\/svg>\s*$/.test(svg)) return 'incomplete'
  if (/<(script|foreignObject|iframe|object|embed|use|a|style)\b/i.test(svg)) return 'forbidden element'
  if (/\son\w+\s*=|javascript:|href\s*=/i.test(svg)) return 'handler or link'
  for (const m of svg.matchAll(/url\s*\(([^)]*)\)/gi)) if (!/^\s*['"]?#[\w-]+['"]?\s*$/.test(m[1])) return 'external url()'
  if (/<image\b/i.test(svg)) return 'image'
  return ''
}
