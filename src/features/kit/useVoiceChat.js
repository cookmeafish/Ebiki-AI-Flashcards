// VOICE CHAT, live: whether Ebi talks out loud (the optional voice-chat feature), read through a ref so a reply that
// lands AFTER the learner switched it off is not spoken, and the line playing is cut when it is switched off.
// `speakingRef` holds the screen's current speak() handle; `keepSpeaking` (e.g. Ebi Call's own read-aloud toggle)
// lets that line finish.
import { useEffect, useRef } from 'react'

export function useVoiceChat(on, speakingRef, keepSpeaking = false) {
  const ref = useRef(on)
  ref.current = on
  useEffect(() => {
    if (!on && !keepSpeaking) speakingRef?.current?.stop?.()
  }, [on]) // eslint-disable-line react-hooks/exhaustive-deps
  return ref
}
