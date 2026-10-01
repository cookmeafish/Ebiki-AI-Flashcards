// Tell Ebi's Help what this screen shows (ctx.help.set), and take it back when the screen closes. `text` = plain
// facts for the model; it must NEVER hold the answer of a question on screen. '' or null clears the entry.
import { useEffect } from 'react'

export const HELP_TEXT_MAX = 4000

export function useHelpEntry(ctx, id, text, screen = 'practice') {
  const set = ctx?.help?.set
  useEffect(() => {
    if (!set) return
    try { set(id, text ? { text: String(text).slice(0, HELP_TEXT_MAX), screen } : null) } catch { /* Help is optional */ }
  }, [set, id, text, screen])
  useEffect(() => () => { try { set?.(id, null) } catch { /* gone */ } }, [set, id])
}
