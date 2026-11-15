// VOICE MODE in Chat: talk with Ebi out loud, hands free. You speak, the REAL Chat answers (same prompt, learner
// context, cards and saving: ctx.chat.send), and Ebi's reply is spoken sentence by sentence. Speech goes through the
// app's speech engines (src/speech: cheapest usable, free browser and device voices as the fallback), so there is
// nothing new to set up. Plan, prices and the next phases (live speech-to-speech, on the computer):
// docs/plans/2026-11-14-voice-mode.md. Remove this folder and its line in ../index.js to drop it.
import { lazyComponent } from '../registry'
import { setVoicePanel } from './store'
import { VOICE_MODE_ID } from './featureId'

// The panel loads on demand (fetched in the background a while after start).
const VoiceMount = lazyComponent(() => import('./VoicePanel'), { prefetchMs: 10000 })

const openPanel = (ctx) => { ctx?.chat?.open?.(); setVoicePanel(true) }

export default {
  id: VOICE_MODE_ID,
  Mount: VoiceMount,
  chatComposerItems: [{ id: 'voice', order: 10, icon: '🎙️', labelKey: 'vm_open', onPick: openPanel }],
  chatMenuItems: [{ id: 'voice', order: 5, icon: '🎙️', labelKey: 'vm_open', onPick: openPanel }],
}
