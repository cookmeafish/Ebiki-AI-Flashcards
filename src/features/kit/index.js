// Shared quiz kit for features (not a feature itself: nothing to install or remove).

export { default as QuizRunner } from './QuizRunner'
export { default as TalkButton } from './TalkButton'
export { default as RuleCardButton } from './RuleCardButton'

// The optional "Voice chat" switch (defined by src/features/speech). Read here so features never import each other.
export const VOICE_CHAT_ID = 'voice-chat'
export const voiceChatOn = (ctx) => !!ctx?.registry?.isActive?.(VOICE_CHAT_ID)
export { judgeAnswer, judgeStrike } from './judge'
export { recordReviews } from './reviews'
export { pickCardItems } from './items'
export { readPracticeLog, recordPractice } from './practiceLogStore'
export { rankFresh, recentTopics, avoidLine } from './practiceLog'
export { buildScenePrompt, parseScene, voiceFor, SCENE_ROLE, SCENE_MAX_TOKENS } from './scene'
export { matchTyped, leaksAnswer, sanitizeQuestions, normalizeAnswer, missesFromResults } from './grade'
