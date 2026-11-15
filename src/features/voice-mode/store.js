// Whether Chat's voice panel is open (one per app). Plain data + listeners, no DOM (portable).
let open = false
const subs = new Set()
export const voicePanelOpen = () => open
export function setVoicePanel(v) { open = !!v; subs.forEach((f) => f()) }
export function onVoicePanel(f) { subs.add(f); return () => subs.delete(f) }
