// Tell Ebi's Help what this screen shows (ctx.help.set), and take it back when the screen closes. `text` = plain
// facts for the model; it must NEVER hold the answer of a question on screen. '' or null clears the entry.
// `where` (optional) = a few words naming what part of the screen is shown right now ("a raid TEST fight", "the
// bestiary, Raid bosses tab"); `depth` ranks it when several entries on one screen name one (the deepest wins: a raid
// inside Legends is depth 3, the bestiary 2, the Legends map 1). Help puts it next to the screen's name.
import { useEffect } from 'react'

export const HELP_TEXT_MAX = 4000

export function useHelpEntry(ctx, id, text, screen = 'practice', where = '', depth = 0) {
  const set = ctx?.help?.set
  useEffect(() => {
    if (!set) return
    try { set(id, text ? { text: String(text).slice(0, HELP_TEXT_MAX), screen, ...(where ? { where: String(where), depth: Number(depth) || 0 } : {}) } : null) } catch { /* Help is optional */ }
  }, [set, id, text, screen, where, depth])
  useEffect(() => () => { try { set?.(id, null) } catch { /* gone */ } }, [set, id])
}
