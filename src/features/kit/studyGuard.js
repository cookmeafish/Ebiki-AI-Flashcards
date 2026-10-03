// Is a study session in the way of driving Anki's reviewer (raids, Ebi Call)? Pure and platform-neutral: it only
// asks the app (`ctx.study.status`, which first ends a session abandoned for 8 hours, its ratings sent). A session
// still holding ratings that have not reached Anki keeps blocking: the feature and the session would otherwise answer
// the same due card twice. Tests: studyGuard.test.js.

// null = free to go; else { unsynced } (how many of the session's ratings still have to reach Anki).
export async function studyBlock(ctx) {
  let st = null
  try { st = ctx?.study?.status ? await ctx.study.status() : null } catch { st = null }
  if (!st) return ctx?.studyActive ? { unsynced: 0 } : null
  return st.active ? { unsynced: Math.max(0, Number(st.unsynced) || 0) } : null
}

// The sentence for a block (i18n keys, see locales: call_studyActive, call_studyUnsynced / call_studyUnsyncedOne).
export function studyBlockText(t, block) {
  if (!block) return ''
  const n = block.unsynced
  return n > 0 ? (n === 1 ? t('call_studyUnsyncedOne', { n }) : t('call_studyUnsynced', { n })) : t('call_studyActive')
}
