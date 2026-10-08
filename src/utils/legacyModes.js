// The one-time migration from the legacy ankiformat.json into modes (App's startup load, after a SUCCESSFUL empty
// modes read). Pure: App posts what this returns.
//
// The load's id repair never ran on these, so they are repaired here: only real objects, unique NUMBER ids (a string
// "2" never matched the numeric ids the switchers compare with; a duplicate turned a switch into a rename). The active
// id names one of the migrated modes: the screen used to show the legacy active mode while the save recorded the first.
export function shapeLegacyModes(legacy, defaultMode = {}) {
  if (!legacy || typeof legacy !== 'object') return null
  let list = null
  let active = null
  if (Array.isArray(legacy.modes)) {
    list = legacy.modes
    active = legacy.activeModeId
  } else if (Array.isArray(legacy.profiles)) {
    list = legacy.profiles.map((p) => (p && typeof p === 'object'
      ? { ...p, type: 'language', description: '', tagRules: defaultMode.tagRules }
      : p))
    active = legacy.activeProfileId
  } else if (legacy.fields) {
    list = [{ ...defaultMode, ...legacy, id: 1, name: 'Language Learning', type: 'language' }]
  }
  if (!list) return null
  const objects = list.filter((m) => m && typeof m === 'object' && !Array.isArray(m))
  const seen = new Set()
  let next = Math.max(0, ...objects.map((m) => Number(m.id)).filter(Number.isFinite))
  const modes = objects.map((m) => {
    const id = Number(m.id)
    const fixed = Number.isFinite(id) && m.id !== '' && m.id !== null && !seen.has(id) ? id : ++next
    seen.add(fixed)
    return fixed === m.id ? m : { ...m, id: fixed }
  })
  if (!modes.length) return null
  const wanted = Number(active)
  const activeId = active != null && modes.some((m) => m.id === wanted) ? wanted : modes[0].id
  return { modes, activeId }
}
