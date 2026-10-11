// BEFORE copies of the raid bosses redrawn in the 2026-10-11 wave (the owner: "make sure that these changes are
// reversible and i want a before and after button"). Each listed boss has its drawing as it was at RAID_BEFORE_COMMIT
// in public/assets/legends/raids-before/<motif>.svg (taken from git, never the working tree). Only the asset view's
// BEFORE / NOW toggle shows them; a real fight always uses raids/<motif>.svg. Pure: the restore script reads it too.
// To revert a boss for good: `node dev/legends-gallery/restore-before.mjs <motif>` (see RAID_BEFORE_FILES).
export const RAID_BEFORE_COMMIT = 'd4a2791'
export const RAID_BEFORE_DIR = 'raids-before'
export const RAID_BEFORE = ['banshee', 'cerberus', 'chimera', 'chronos', 'gorgon', 'horseman', 'hydra', 'inferno', 'kaleido',
  'kitsune', 'ophanim', 'ratking', 'showman', 'titan']
export const hasRaidBefore = (motif) => RAID_BEFORE.includes(motif)
export const raidBeforeUrl = (motif) => (hasRaidBefore(motif) ? `/assets/legends/${RAID_BEFORE_DIR}/${motif}.svg` : '')

// The files that make one boss: its drawing and its fight files (fx, impact style, impact parts). Repo-relative.
export const RAID_BEFORE_FILES = (motif) => [
  `public/assets/legends/raids/${motif}.svg`,
  `src/features/legends/fx/${motif}.jsx`,
  `src/features/legends/impact/bosses/${motif}.js`,
  `src/features/legends/impact/bosses/${motif}.parts.jsx`,
]
// Shared files that also changed in the wave; the restore script only REPORTS them (other bosses live there too).
export const RAID_BEFORE_SHARED = ['src/features/legends/impact/body.js', 'src/features/legends/art.jsx']

// Parses the restore script's arguments: a known motif is required; --dry-run writes nothing.
export function restoreArgs(argv) {
  const dryRun = argv.includes('--dry-run')
  const motif = argv.find((a) => !a.startsWith('--')) || ''
  if (!motif) return { error: 'usage: node dev/legends-gallery/restore-before.mjs <motif> [--dry-run]' }
  if (!hasRaidBefore(motif)) return { error: `no BEFORE for "${motif}". Known: ${RAID_BEFORE.join(', ')}` }
  return { motif, dryRun, files: RAID_BEFORE_FILES(motif) }
}
