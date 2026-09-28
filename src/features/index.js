// THE LIST OF INSTALLED FEATURES. Each is a self-contained folder; to remove one, delete its line here and
// its folder (plus its line in ./server.js if it has a server part). Order = default slot order ties.
import { createRegistry } from './registry'
import game from './game'
import voice from './voice'
import { speechFeature, voiceChatFeature } from './speech'
import practice from './practice'
import mistakeGym from './mistake-gym'
import leechDoctor from './leech-doctor'
import ebiCall from './ebi-call'
import roleplay from './roleplay'
import listenSpeak from './listen-speak'
import scenes from './scenes'

export const registry = createRegistry([
  game,
  voice,
  speechFeature,
  voiceChatFeature,
  practice,
  mistakeGym,
  leechDoctor,
  ebiCall,
  roleplay,
  listenSpeak,
  scenes,
])

export { EVENTS } from './events'
export { SLOT, FeatureContext, requestIntent, FeatureSlot, useFeatureCtx } from './registry'
export { default as OptionalFeaturesCard } from './OptionalFeaturesCard'
