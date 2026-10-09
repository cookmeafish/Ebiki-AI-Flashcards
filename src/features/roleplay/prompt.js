// Roleplay prompts. ANY subject: a language learner practices the language in a real-life scene (ordering,
// a job interview); anyone else practices applying the subject in a situation where it matters (a help desk
// ticket for CompTIA, a band rehearsal for music theory, an ATC exchange for a pilot, a tense meeting for
// communication skills).
import { MAX_SCENARIOS, MAX_CARDS, MAX_TIPS, SCORE_MAX } from './scoring'

export const RP_ROLE = 'chat'           // the scene itself
export const RP_MAX_TOKENS = 600
export const RP_SETUP_ROLE = 'general'  // scenario ideas + the scorecard
// Jobs (Settings > AI & cost > Models per job): the scene, the scenario ideas/setup, the scorecard.
export const RP_JOBS = { scene: 'practice.roleplay', setup: 'practice.roleplaySetup', score: 'practice.roleplayScore' }
export const RP_SETUP_MAX_TOKENS = 1500
export const RP_SCORE_MAX_TOKENS = 2000
export const HISTORY_TURNS = 20

const subjectLine = (subject) => `Subject: ${subject.name}${subject.description ? ` (${subject.description})` : ''}.`
const SCENARIO_JSON = '{"title": "<short name>", "emoji": "<one emoji>", "setting": "<where and what is happening, told to the learner as you, one or two sentences>", "role": "<the OTHER person the learner deals with (the employee, the client, the examiner), never the part the learner plays>", "goal": "<what the learner must achieve, as you>"}'

const sceneKind = (subject) => (subject.isLanguage
  ? `everyday and useful situations where someone has to use ${subject.learnLang} (shops, travel, work, friends, problems to solve), from easy to challenging`
  : `realistic situations where someone has to APPLY ${subject.name} (a job task, a problem to diagnose, explaining it to someone, a decision under pressure), from easy to challenging. Never a language lesson`)

export function buildScenarioPrompt(subject, { level = '', knowledge = '', avoid = [] } = {}) {
  return {
    system: `You design short roleplay scenes for a learning app. Reply with JSON only: {"scenarios": [${SCENARIO_JSON}, ...]}. Write title, setting, role and goal in ${subject.userLang}. No dashes.`,
    user: [
      subjectLine(subject),
      `Suggest ${MAX_SCENARIOS} different ${sceneKind(subject)}.`,
      level ? `Learner level: ${level}` : '',
      avoid.length ? `Scenes and topics practiced recently (suggest different ones): ${avoid.join('; ')}` : '',
      knowledge ? `The learner's material (pick scenes that use it):\n${knowledge}` : '',
    ].filter(Boolean).join('\n'),
  }
}

// A photo or screenshot becomes a scene (a menu → ordering, an error dialog → a help desk call).
export function buildImageScenarioPrompt(subject, note = '') {
  return {
    system: `You turn a picture into ONE roleplay scene for a learning app. Reply with JSON only: ${SCENARIO_JSON}. Write it in ${subject.userLang}. No dashes.`,
    user: [
      subjectLine(subject),
      `Look at the picture and invent a scene built on what it shows, as one of these: ${sceneKind(subject)}.`,
      note ? `The learner adds: ${note}` : '',
    ].filter(Boolean).join('\n'),
  }
}

// A typed idea ("I return a broken phone", "my boss asks why the RAID failed") becomes a full scene.
export function buildCustomScenarioPrompt(subject, idea) {
  return {
    system: `You turn a learner's idea into ONE roleplay scene for a learning app. Reply with JSON only: ${SCENARIO_JSON}. Write it in ${subject.userLang}. No dashes.`,
    user: `${subjectLine(subject)}\nThe learner's idea: ${idea}\nKeep their idea; fill in who Ebi plays and a clear goal.`,
  }
}

export function buildSceneSystem(subject, scene, { slips = '', level = '', knowledge = '' } = {}) {
  const lang = subject.isLanguage
  return [
    `You are Ebi (a friendly red shrimp) acting in a roleplay with a learner. ${subjectLine(subject)}`,
    `SCENE: ${scene.setting}`,
    `YOU PLAY: ${scene.role}. The learner plays the other part. Stay in character the whole time and write only your own spoken line (no name label, no stage directions).`,
    `THE LEARNER'S GOAL: ${scene.goal || 'play the scene through'}`,
    lang
      ? `Speak only ${subject.learnLang}, naturally, at a level the learner can follow (short sentences; slow down if they struggle). ${subject.rules || ''}`
      : `Speak ${subject.userLang}. The scene tests whether the learner can apply ${subject.name}: react realistically to what they say, push back on vague or wrong answers the way the character would, and let good answers move the scene forward. Keep terms, names, code and formulas as they are.`,
    level ? `Learner level: ${level}` : '',
    knowledge ? `The learner's material (stay consistent with it):\n${knowledge}` : '',
    slips ? `Slips they tend to make (do not correct in character; they are reviewed at the end):\n${slips}` : '',
    'Rules: 1 to 3 short sentences per turn, always leave the learner something to respond to, add small realistic complications, never lecture or grade during the scene. If they are completely stuck, have the character rephrase more simply. When the goal is clearly reached or the scene has run its course, wrap up in character and add the tag <scene-end/> at the very end. No dashes. Never write a shrimp emoji.',
  ].filter(Boolean).join('\n')
}

export function buildSceneTurn(messages, learnerName = 'Learner') {
  const recent = messages.slice(-HISTORY_TURNS)
  if (!recent.length) return 'The scene starts now. Open it in character with your first line.'
  return `Scene so far:\n${recent.map((m) => `${m.role === 'ebi' ? 'Ebi' : learnerName}: ${m.text}`).join('\n')}\n\nContinue in character with your next line.`
}

export const SCENE_END_RE = /<scene-end\s*\/?>/i
const SPEAKER_RE = /^\s*\**(?:Ebi|Assistant)\**\s*[:：]\s*/i // a model echoing the transcript's "Ebi:" label
// A model that keeps writing the transcript puts words in the learner's mouth ("Learner: Two coffees please"): the
// reply ends where a line in the learner's name starts.
const LEARNER_LINE_RE = /\n\s*\**(?:Learner|User)\**\s*[:：][\s\S]*$/i
export const splitSceneReply = (raw) => ({ text: String(raw || '').replace(SCENE_END_RE, '').replace(SPEAKER_RE, '').replace(LEARNER_LINE_RE, '').trim(), ended: SCENE_END_RE.test(String(raw || '')) })

export function buildScorecardPrompt(subject, scene, messages, axes) {
  const lang = subject.isLanguage
  const axisHelp = lang
    ? { accuracy: 'grammar and word choice were correct', complexity: 'range of structures beyond the basics', vocabulary: 'varied, precise, natural words' }
    : { correctness: 'what they said about the subject was right', reasoning: 'they worked the problem logically and asked the right questions', communication: 'clear, well organized, right for the listener' }
  return {
    system: `You coach a learner after a roleplay. Reply with JSON only: {"scores": {${axes.map((a) => `"${a}": 1-${SCORE_MAX}`).join(', ')}}, "overall": 1-${SCORE_MAX}, "goalMet": true|false, "summary": "<two sentences>", "strengths": ["..."], "tips": ["<concrete fix, quoting what they said and a better version>"], "mistakes": [{"said": "<the learner's exact words>", "better": "<the right or better version>", "why": "<one short reason>"}], "cards": [{"front": "...", "back": "..."}]}. Write summary, strengths, tips and card backs in ${subject.userLang}, speaking to the learner as "you". No dashes.`,
    user: [
      subjectLine(subject),
      `Scene: ${scene.setting} Ebi played: ${scene.role}. Goal: ${scene.goal}`,
      `Transcript:\n${messages.map((m) => `${m.role === 'ebi' ? 'Ebi' : 'Learner'}: ${m.text}`).join('\n')}`,
      `Score ONLY the learner's lines, 1 (weak) to ${SCORE_MAX} (excellent): ${axes.map((a) => `${a} = ${axisHelp[a]}`).join('; ')}.`,
      `Up to ${MAX_TIPS} strengths and ${MAX_TIPS} tips. Be honest and specific; never praise something they did not do.`,
      lang
        ? `mistakes: up to ${MAX_TIPS} real errors in the learner's ${subject.learnLang} (grammar, word choice, wrong form), each quoted exactly; "why" in ${subject.userLang}. None when there were none.`
        : `mistakes: up to ${MAX_TIPS} things the learner said about ${subject.name} that were wrong, each quoted exactly, with the accurate version; "why" in ${subject.userLang}. None when there were none.`,
      lang
        ? `cards: up to ${MAX_CARDS} flashcards for ${subject.learnLang} words or phrases the learner NEEDED in this scene (misused, missing, or a better way to say something). front = the ${subject.learnLang} word or phrase, back = meaning and a short example. Only real, correctly spelled ${subject.learnLang}.`
        : `cards: up to ${MAX_CARDS} flashcards for ideas of ${subject.name} the learner got wrong, missed or explained vaguely. front = a question or term, back = the accurate answer in two or three lines.`,
    ].join('\n'),
  }
}
