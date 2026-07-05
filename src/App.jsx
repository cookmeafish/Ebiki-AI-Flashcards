import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import Tesseract from 'tesseract.js'
import { TRANSLATE_PROMPT, VISION_OCR_PROMPT, WORDLIST_TRANSLATE_PROMPT, WORD_ENRICH_PROMPT, LANGUAGE_CARD_PROMPT, GENERIC_CARD_PROMPT, POS_COLORS, CATEGORY_COLORS } from './config/prompts'
import { dataUrlToImagePart, downscaleDataUrl, estimateImageNoise } from './utils/image'
import { PROVIDERS } from './config/providers'
import { LANGS } from './config/languages'
import { makeT, APP_LANGUAGES } from './i18n'
import { pickShrimp, shrimpUrl, DEFAULT_SHRIMP, IDLE_SHRIMP, POSE_NAMES, poseFile } from './config/shrimp'
import { C, RADIUS, SHADOW, FONT } from './config/tokens'
import FormattedText from './components/FormattedText'
import Pronunciation from './components/Pronunciation'
import { langInfo } from './pronunciation/langcodes'
import HelpChat from './components/HelpChat'
import Markdown from './components/Markdown'
import DiscoverPanel from './components/DiscoverPanel'
import SettingsModal from './components/SettingsModal'
import OnboardingWizard from './components/OnboardingWizard'
import Dropdown from './components/Dropdown'
import { S } from './styles/theme'
import { ocrLog, ocrLogTable, ocrLogFlush } from './utils/logger'
import { ankiPing, ankiGetDecks, ankiCreateDeck, ankiAddNote, ankiCanAddNote, ankiCopyNote, ankiChangeDeck, ankiForgetCards, ankiFindCards, ankiCardsInfo, ankiAnswerCards, ankiSetDueDate, ankiInsertReviews, ankiGuiDeckReview, ankiGuiCurrentCard, ankiGuiShowAnswer, ankiGuiAnswerCard, ankiGuiDeckBrowser, ankiGetDeckStats, ankiFindNotes, ankiNotesInfo, ankiUpdateNote, ankiDeleteNotes, ankiSync, ankiStoreMediaFile, ankiGetNumCardsReviewedToday, ankiGetNumCardsReviewedByDay, ankiGetTodayReviewStats } from './utils/anki'
import { readBlob, writeBlob, DEFAULT_LEDGER } from './discover/storage'
import { buildProfilePrompt, buildSuggestionPrompt, buildVerifyPrompt } from './discover/prompts'
import PbqQuestion from './components/PbqQuestion'
import { compilePbq, checkCitations, studentView, parseSolverAnswer, gradePbq, compareToKey, PBQ_GEN_SYSTEM, PBQ_SOLVER_SYSTEM, PBQ_JUDGE_SYSTEM, buildGeneratorPrompt as buildPbqGeneratorPrompt, buildSolverPrompt as buildPbqSolverPrompt, buildJudgePrompt as buildPbqJudgePrompt } from './pbq/engine'

// App-language code → English name, for prompting the AI to reply in the user's language.
const APP_LANG_NAME = { en: 'English', es: 'Spanish', zh: 'Chinese', ja: 'Japanese' }

// Max characters of a mode's knowledge base injected into AI prompts (~15k tokens ≈ 20+ pages —
// comfortably within every supported provider's context window). The knowledge base flows into
// study question generation, answer grading, chat, help, card generation and Discover, so the
// whole app shares the same reference material.
const KNOWLEDGE_CAP = 60000

// Short human name for a model id — used in UI labels like "Explain further (Opus)" so buttons
// reflect the model the user actually configured (Settings → AI models), never a hardcoded name.
const MODEL_NICKS = [
  ['opus', 'Opus'], ['sonnet', 'Sonnet'], ['haiku', 'Haiku'], ['fable', 'Fable'],
  ['gemini-2.5-pro', 'Gemini Pro'], ['gemini', 'Gemini'], ['grok', 'Grok'],
  ['gpt-4.1', 'GPT-4.1'], ['gpt-4o', 'GPT-4o'], ['gpt', 'GPT'],
]
const modelNick = (id = '') => {
  const m = String(id).toLowerCase()
  const hit = MODEL_NICKS.find(([k]) => m.includes(k))
  return hit ? hit[1] : (id || 'AI')
}

// Color-coded study feedback categories (used for all modes — language and general).
const FEEDBACK_CATS = {
  praise:      { color: 'var(--c-success)', icon: '✓', label: 'What you got right' },
  correction:  { color: 'var(--c-danger)', icon: '✗', label: 'Incorrect / factual error' },
  grammar:     { color: 'var(--c-warning)', icon: '✎', label: 'Grammar, spelling & accents' },
  terminology: { color: 'var(--c-purple)', icon: '◆', label: 'Word choice / correct term' },
  detail:      { color: 'var(--c-teal)', icon: '+', label: 'Missing or incomplete detail' },
  tip:         { color: 'var(--c-brand)', icon: '➜', label: 'Tip to improve' },
}
const FEEDBACK_CAT_ORDER = ['praise', 'correction', 'grammar', 'terminology', 'detail', 'tip']


// ─── Image Preprocessing for OCR ────────────────────────────────────────────
// Creates a high-contrast grayscale version optimized for Tesseract
async function preprocessForOCR(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const ctx = c.getContext('2d')
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, c.width, c.height)
      const d = imageData.data
      const pixelCount = d.length / 4

      // Step 1: Convert to grayscale
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
        d[i] = d[i + 1] = d[i + 2] = gray
      }

      // Step 2: Detect brightness
      let totalBrightness = 0
      for (let i = 0; i < d.length; i += 4) totalBrightness += d[i]
      const avgBrightness = totalBrightness / pixelCount
      const isDark = avgBrightness < 128

      // Step 3: Moderate contrast enhancement (1.8x — 2.5 was crushing details)
      const factor = 1.8
      for (let i = 0; i < d.length; i += 4) {
        const val = (d[i] - 128) * factor + 128
        d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, val))
      }

      // Step 4: If dark background, invert (Tesseract prefers dark text on white)
      if (isDark) {
        for (let i = 0; i < d.length; i += 4) {
          d[i] = d[i + 1] = d[i + 2] = 255 - d[i]
        }
      }

      ctx.putImageData(imageData, 0, 0)
      resolve(c.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

// Salvage every complete top-level {...} object from a (possibly truncated) string,
// respecting quoted strings/escapes. Lets us recover most rows even when an array was
// cut off mid-object (e.g. a long vision response that hit the token limit).
function salvageJsonObjects(str) {
  const out = []
  let depth = 0, start = -1, inStr = false, esc = false
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    if (inStr) {
      if (esc) esc = false
      else if (ch === '\\') esc = true
      else if (ch === '"') inStr = false
      continue
    }
    if (ch === '"') { inStr = true; continue }
    if (ch === '{') { if (depth === 0) start = i; depth++ }
    else if (ch === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        try { out.push(JSON.parse(str.slice(start, i + 1))) } catch { /* skip bad row */ }
        start = -1
      }
    }
  }
  return out
}

// ─── Robust JSON extraction from an AI response ──────────────────────────────
// Strips markdown fences/preamble, isolates the outermost array/object, repairs common
// LLM JSON glitches, and as a last resort salvages whatever complete objects it can
// (so a truncated array still yields most of its rows). Returns parsed value or null.
function parseAiJson(text) {
  if (!text) return null
  let cleaned = String(text).replace(/```(?:json)?\s*/gi, '').replace(/```\s*/g, '')
  const jsonStart = cleaned.search(/[[{]/)
  if (jsonStart > 0) cleaned = cleaned.slice(jsonStart)
  const wasArray = cleaned[0] === '['
  let trimmed = cleaned
  const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'))
  if (lastBracket > 0) trimmed = cleaned.slice(0, lastBracket + 1)
  trimmed = trimmed.trim()
  // 1) Straight parse.
  try { return JSON.parse(trimmed) } catch { /* fall through */ }
  // 2) Light repair (bare keys, single quotes, trailing commas).
  try {
    let r = trimmed
    r = r.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":')
    r = r.replace(/'/g, '"')
    r = r.replace(/,\s*([}\]])/g, '$1')
    return JSON.parse(r)
  } catch { /* fall through */ }
  // 3) Salvage complete objects (handles truncation). For an array, return the rows.
  const objs = salvageJsonObjects(cleaned)
  if (objs.length) return wasArray ? objs : objs[0]
  return null
}

export default function App() {
  // ─── State ───────────────────────────────────────────────────────────────────
  const isOverlay = new URLSearchParams(window.location.search).has('overlay')

  // Make body transparent for overlay mode so clip-path/transparent bg works
  useEffect(() => {
    if (!isOverlay) return
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
  }, [isOverlay])

  // Default UI zoom: the app uses fixed pixel sizes, which render small on typical
  // Windows displays. Scale the whole UI up so 100% browser zoom looks comfortable.
  // NOT applied in overlay mode — that must stay 1:1 with screen pixels so OCR
  // bounding boxes line up with the captured image.
  useEffect(() => {
    document.body.style.zoom = isOverlay ? '' : '1.35'
    return () => { document.body.style.zoom = '' }
  }, [isOverlay])

  // ESC hides overlay — Electron handles the actual window hiding via global shortcut
  // This just resets the web app state so it's ready for the next capture
  useEffect(() => {
    if (!isOverlay) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    window.addEventListener('keydown', handleEsc, true)
    return () => window.removeEventListener('keydown', handleEsc, true)
  }, [isOverlay])
  const [activeTab, setActiveTab] = useState(null) // 'chat' | 'study' | 'deck' | 'picture' | 'stats' — null until config loads
  const [chatSidePanel, setChatSidePanel] = useState(false) // split-screen chat alongside another tab
  const [provider, setProvider] = useState('anthropic')
  const [configLoaded, setConfigLoaded] = useState(false)
  const [apiKeys, setApiKeys] = useState({})
  const [keysLoaded, setKeysLoaded] = useState(false)
  // Per-provider, per-role model overrides: { [provider]: { general, question, help } }.
  // Empty role falls back to the provider's built-in default (see resolveModel).
  const [aiModels, setAiModels] = useState({})
  // Global intelligence preset: 'normal' (balanced, ~Sonnet) | 'max' (most capable, ~Opus, slower/pricier).
  // Every feature defaults to this provider's preset model unless a per-feature override is set.
  const [intelligence, setIntelligence] = useState('normal')
  // Auto-sync study ratings to Anki N min after each card is graded (then lock it). When off, ratings
  // only sync via the manual "Sync now" button or on Finish/Exit. Global settings (config.json).
  const [studyAutoSync, setStudyAutoSync] = useState(true)
  const [studyAutoSyncMinutes, setStudyAutoSyncMinutes] = useState(5)
  // Pronunciation audio (GLOBAL, config.json): per-language default regions ("es"→"mx"),
  // Wiktionary edition-priority overrides, opt-in local TTS url + voice map, Anki embed toggle.
  const [pronunciationCfg, setPronunciationCfg] = useState({ defaultRegions: {}, editions: {}, ttsUrl: '', ttsVoices: {}, embedInAnki: true })
  // Transient toast shown when a retired model is auto-replaced.
  const [modelHealNotice, setModelHealNotice] = useState(null)
  // Persistent toast shown when an AI request fails (out of credits, rate-limited, bad key…).
  const [aiErrorNotice, setAiErrorNotice] = useState(null)
  // App UI language ('en' | 'es' | 'zh' | 'ja' | ...). Translates chrome, not flashcards.
  const [appLanguage, setAppLanguage] = useState('en')
  const t = makeT(appLanguage)
  // Color theme: 'light' (Ocean Light) | 'dark'. Applied via <html data-theme> so CSS
  // variables flip. Initialized from the pre-paint script in index.html to avoid flash.
  const [appTheme, setAppTheme] = useState(() => {
    try { return document.documentElement.getAttribute('data-theme') || localStorage.getItem('ebiki-theme') || 'light' } catch { return 'light' }
  })
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-theme', appTheme)
      localStorage.setItem('ebiki-theme', appTheme)
    } catch {}
  }, [appTheme])
  // Ebi (the shrimp mascot) pose for the bottom-left button. Updated the instant any AI
  // exchange fires (study question shown, chat/feedback message sent, picture word, etc.)
  // so Ebi always matches what's happening. Ebi's Help chat overrides this with its own.
  // Two independent mascots: the Help button (only changes when you talk to Ebi's Help) and
  // the study companion (changes with the current study question).
  const [helpMascot, setHelpMascot] = useState(IDLE_SHRIMP)
  const [studyMascot, setStudyMascot] = useState(IDLE_SHRIMP)
  const [askEbiSignal, setAskEbiSignal] = useState(0) // bump to open Ebi's Help (study "Ask Ebi")
  const [onboarded, setOnboarded] = useState(false) // first-run onboarding completed?
  // Strip study-question boilerplate ("¿Cómo se dice '…'?", "How do you say …") so pose
  // selection keys on the actual concept, not the scaffolding (which caused false matches).
  const meaningfulPoseText = (text) => String(text || '')
    .replace(/¿?\s*c[óo]mo se (dice|escribe)[^'":]*/gi, '')
    .replace(/how (do you say|would you say)[^'"?:]*/gi, '')
    .replace(/translate[^'":]*:/gi, '')
    .trim() || String(text || '')
  // System prompt for the dedicated, configurable "Mascot" model (cheap/fast). It reads the
  // generated response/question and returns the single best Ebi pose name.
  const POSE_SYS = `You pick a mascot pose for Ebi, a cute red shrimp, based on a piece of text. Reply with ONLY one pose name from this exact list and nothing else: ${POSE_NAMES.join(', ')}. Choose the one whose theme best fits the meaning of the text. If none clearly fit, reply "default".`
  // choosePose: pick Ebi's pose for some text. Sets the mascot EXACTLY ONCE so there is a
  // single change per AI output (no keyword→AI flicker). With a key, it waits for the Mascot
  // model and sets once; Ebi keeps its previous pose until then. Without a key (or on error),
  // it sets the keyword fallback once. Non-blocking; silent on error; returns the filename.
  // `setter` (optional) receives the chosen file, so callers target a specific mascot
  // (e.g. the study companion vs. the Help button) — they stay independent. Returns the file.
  const choosePose = async (text, setter) => {
    const clean = String(text || '').trim()
    if (!clean) return DEFAULT_SHRIMP
    const fallback = () => pickShrimp(meaningfulPoseText(clean))
    const prov = aiStateRef.current.provider
    const key = aiStateRef.current.apiKeys[prov]
    if (!key) { const f = fallback(); setter?.(f); return f }
    try {
      const out = await aiCall(key, POSE_SYS, clean.slice(0, 800), resolveModel('pose'), { silent: true })
      const name = String(out || '').trim().toLowerCase().replace(/[^a-z]/g, '')
      const f = poseFile(name) || fallback()
      setter?.(f)
      return f
    } catch { const f = fallback(); setter?.(f); return f }
  }
  // Available model ids fetched from each provider's API: { [provider]: [ids] }.
  const [availableModels, setAvailableModels] = useState({})
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelsError, setModelsError] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsCategory, setSettingsCategory] = useState('general')
  const [screenshot, setScreenshot] = useState(null)
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 })
  const [ocrWords, setOcrWords] = useState([])
  // Reading-order line groups for the picture reading panel: [{ line, idxs:[ocrWords index] }]
  const [ocrLines, setOcrLines] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState(null)
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [pinnedIdx, setPinnedIdx] = useState(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const [pinnedTooltipPos, setPinnedTooltipPos] = useState(() => {
    try { const s = localStorage.getItem('screenlens-tooltip-pos'); return s ? JSON.parse(s) : null } catch { return null }
  })
  const tooltipDragRef = useRef(null)
  const [explanation, setExplanation] = useState(null)
  const [explaining, setExplaining] = useState(false)
  const [deepExplanation, setDeepExplanation] = useState(null)
  const [deepExplaining, setDeepExplaining] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([]) // [{ role, text }]
  const [chatLoading, setChatLoading] = useState(false)
  const [wordStudy, setWordStudy] = useState(null)
  const [wordStudyLoading, setWordStudyLoading] = useState(false)
  const [conjugation, setConjugation] = useState(null)
  const [conjugationLoading, setConjugationLoading] = useState(false)
  const [stage, setStage] = useState('idle') // idle | captured | ocr | translating | done
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [showHighlights, setShowHighlights] = useState(true)
  const [language, setLanguage] = useState('auto')
  const [targetLang, setTargetLang] = useState('eng')
  const [overlayRunning, setOverlayRunning] = useState(false)
  // Persisted user preference: launch the screen overlay on startup. Defaults ON.
  const [overlayEnabled, setOverlayEnabled] = useState(true)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selRect, setSelRect] = useState(null) // { x1, y1, x2, y2 } in viewport coords
  const [selectionOffset, setSelectionOffset] = useState(null) // { x, y } in full-image pixels
  const [selectionViewport, setSelectionViewport] = useState(null) // { x, y, w, h } in viewport px
  const [selectionCrop, setSelectionCrop] = useState(null) // { dataUrl, w, h } for transparent mode
  const [areaSelectBounds, setAreaSelectBounds] = useState(null) // original small window bounds to restore on dismiss
  const selStartRef = useRef(null)
  const [ankiConnected, setAnkiConnected] = useState(null)
  // Live review stats from Anki for the Stats tab. Hydrated from localStorage on mount so the
  // numbers show instantly (and don't flash to zero) on a page refresh, then re-fetched from Anki.
  const [ankiStats, setAnkiStats] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ebiki-anki-stats') || 'null') } catch { return null }
  })
  const [ankiDecks, setAnkiDecks] = useState([])
  const [ankiCard, setAnkiCard] = useState(null)
  const [ankiSynced, setAnkiSynced] = useState({})
  const [ankiSyncing, setAnkiSyncing] = useState(false)
  const [ankiError, setAnkiError] = useState(null)
  const [ankiGenerating, setAnkiGenerating] = useState(false)
  const [ankiEditing, setAnkiEditing] = useState(false)
  const [ankiEditFront, setAnkiEditFront] = useState('')
  const [ankiEditBack, setAnkiEditBack] = useState('')
  const [ankiRefineInput, setAnkiRefineInput] = useState('')
  const [ankiRefining, setAnkiRefining] = useState(false)
  const defaultStudyRules = {
    questionsPerCard: 3,
    cardsAtOnce: 3,
    studyLanguage: 'English',  // the LEARNED language (answer language); also drives card generation
    quizLanguage: '',          // "Ebi speaks" — language Ebi phrases questions/feedback in. '' = same as learned
    wordHints: false,          // show each non-tested word's translation above it (ruby-style)
    grammarFeedback: false,
    questionPrompt: 'You are quizzing a language learner on a flashcard.\n\nGenerate clear, specific questions that test whether the student truly knows this word/phrase. Mix question types:\n- Meaning and translation questions\n- Usage in context (give a scenario, ask them to fill in the word)\n- Synonyms, antonyms, or related words\n- Grammar questions (part of speech, conjugation, gender)\n\nRULES:\n- Questions must be precise and have ONE clear correct answer based on the card content\n- Never ask "what is the primary purpose" or "what is the main reason" — these are ambiguous\n- Never ask questions where multiple answers from the card could be valid\n- Each question must stand on its own — do not reference other questions\n- If the card has a list of points, ask about specific items, not "what is the primary one"',
    ratingRules: 'All correct = Easy, 1 wrong = AI judges Good or Hard based on answer quality, 2 wrong = Hard, All wrong = Again',
  }
  const defaultGeneralStudyRules = {
    questionsPerCard: 3,
    cardsAtOnce: 3,
    studyLanguage: 'English',
    quizLanguage: '',          // "Ebi speaks" — for general modes this is the whole interaction language
    wordHints: false,
    grammarFeedback: false,
    questionPrompt: 'You are quizzing a student on a flashcard for their studies.\n\nGenerate clear, specific questions that test understanding of this concept. Mix question types:\n- Definition and explanation questions\n- Real-world application or scenario questions\n- Compare/contrast with related concepts\n- Why it matters or when you would use it\n\nRULES:\n- Questions must be precise and have ONE clear correct answer based on the card content\n- Never ask "what is the primary purpose" or "what is the main reason" — these are ambiguous\n- Never ask questions where multiple answers from the card could be valid\n- Each question must stand on its own — do not reference other questions\n- If the card has a list of points, ask about specific items, not "what is the primary one"\n- Questions should be answerable in 1-2 sentences',
    ratingRules: 'All correct = Easy, 1 wrong = AI judges Good or Hard based on answer quality, 2 wrong = Hard, All wrong = Again',
  }
  const defaultMode = {
    id: 1, name: 'Language Learning', type: 'language', description: '', ankiDeck: '', translateMode: 'all', areaSelectTransparent: true,
    fields: { pronunciation: true, translation: true, synonyms: true, definition: true, example: true },
    frontTemplate: '{word} ({partOfSpeech})',
    backTemplate: 'Pronunciación: {pronunciation}\nTraducción: {translation}\nSinónimos: {synonyms}\nDefinición: {definition}\nEjemplo: {example}',
    tagRules: 'Always include:\n- part of speech (e.g. verb, noun, adjective)\n- source language (e.g. spanish, french)\n- "screenlens"\n\nAlso include when relevant:\n- verb tense (e.g. present, past, subjunctive)\n- difficulty (e.g. common, intermediate, advanced)\n- topic (e.g. food, emotion, travel, nature)',
    studyRules: defaultStudyRules,
  }
  const [modes, setModes] = useState([defaultMode])
  const [activeModeId, setActiveModeId] = useState(1)
  const [editingModeName, setEditingModeName] = useState(null)
  const [modeCreating, setModeCreating] = useState(false)
  const [modeEditInput, setModeEditInput] = useState('')
  const [modeEditProposal, setModeEditProposal] = useState(null) // { scope, changes:[{key,label,before,after}] }
  const [modeEditBusy, setModeEditBusy] = useState(false)

  const [studyActive, setStudyActive] = useState(false)
  const [studyAllCards, setStudyAllCards] = useState([])     // all cards to study
  const [studyBatchIdx, setStudyBatchIdx] = useState(0)      // which batch we're on
  // Per-card tracking: { cardId, front, back, questions: [], answers: [], results: [], done: false }
  const [studyCardState, setStudyCardState] = useState([])
  // Queue of { cardIdx, questionIdx } to ask, interleaved
  const [studyQueue, setStudyQueue] = useState([])
  const [studyQueueIdx, setStudyQueueIdx] = useState(0)
  const [studyPhase, setStudyPhase] = useState('pick')       // 'pick' | 'question' | 'batchFeedback' | 'summary'
  const [studyMode, setStudyMode] = useState('flashcards')   // 'flashcards' | 'conjugations'
  // Practice mode — 'typed' (classic recall) | 'choices' (multiple-choice, laid-back). Preference
  // survives across sessions (localStorage); the per-session flags live on each card state (mc/noSync).
  const [studyAnswerStyle, setStudyAnswerStyle] = useState(() => { try { return localStorage.getItem('ebiki-study-style') === 'choices' ? 'choices' : 'typed' } catch { return 'typed' } })
  // Whether a multiple-choice session records its reviews in Anki (OFF by default — relaxed practice).
  const [studyPracticeSync, setStudyPracticeSync] = useState(() => { try { return localStorage.getItem('ebiki-study-practice-sync') === '1' } catch { return false } })
  // Frozen snapshot of the question just answered by a choice click, so the right/wrong colors can
  // show briefly while the real state has already advanced underneath (no async state races).
  const [studyChoiceFlash, setStudyChoiceFlash] = useState(null)
  // Graded PBQ awaiting the user's "Continue" — like the choice flash, the session state has
  // already advanced underneath; this only keeps the reviewed exercise on screen.
  const [studyPbqReview, setStudyPbqReview] = useState(null)
  // Typed-answer feedback flash: { question, answer, kind: 'correct' | 'check' }. 'correct' =
  // locally verified against acceptedAnswers (green ✓, no AI); 'check' = recorded but only the
  // AI grader can judge it (amber ⏳ — explanation questions, general modes, hint-exhausted).
  const [studyTypedFlash, setStudyTypedFlash] = useState(null)
  // Bumped when a wrong answer keeps the question on screen (hint retry) — drives the ✗ shake.
  const [studyInputShake, setStudyInputShake] = useState(0)
  // "Fix this question" — complain about the LIVE question before answering; it regenerates in
  // place and the distilled preference is saved to the mode (same channel as the feedback chat).
  const [studyFixQ, setStudyFixQ] = useState(null) // null | { input, loading, error? }
  const [studyConjugationWords, setStudyConjugationWords] = useState([]) // word pool for conjugation mode
  const [studyConjugationLanguage, setStudyConjugationLanguage] = useState('English') // language detected from deck content
  const [studyDeck, setStudyDeck] = useState('')
  const [studyInput, setStudyInput] = useState('')
  const [studyLoading, setStudyLoading] = useState(false)
  const [studyStats, setStudyStats] = useState({ easy: 0, good: 0, hard: 0, again: 0 })
  const [studyDeckStats, setStudyDeckStats] = useState({ new_count: 0, learn_count: 0, review_count: 0 })
  const [studyKnowledge, setStudyKnowledge] = useState(null)
  const [studyKnowledgeCount, setStudyKnowledgeCount] = useState(0)
  const [knowledgeFiles, setKnowledgeFiles] = useState([])
  const [knowledgeDragging, setKnowledgeDragging] = useState(false)
  // The active mode's knowledge base content, kept loaded so EVERY feature (chat, help, card
  // generation, grading, Discover) can inject it as context — not just study question generation.
  // `outline` = server-extracted headings/TOC, used to navigate knowledge bases too big to inline.
  const [modeKnowledge, setModeKnowledge] = useState({ content: '', fileCount: 0, outline: [] })
  const [knowledgeBusy, setKnowledgeBusy] = useState(null) // status text while extracting a PDF

  // Deck browser
  const [deckBrowserActive, setDeckBrowserActive] = useState(false)
  const [deckBrowserAddPanel, setDeckBrowserAddPanel] = useState(false)
  const [deckBrowserAddName, setDeckBrowserAddName] = useState('')
  const [deckBrowserAddPurpose, setDeckBrowserAddPurpose] = useState('')
  const [deckBrowserAddLoading, setDeckBrowserAddLoading] = useState(false)
  const [deckBrowserDeck, setDeckBrowserDeck] = useState(() => { try { return localStorage.getItem('ebiki-deck') || '' } catch { return '' } })
  const [deckBrowserNotes, setDeckBrowserNotes] = useState([])
  const [deckBrowserLoading, setDeckBrowserLoading] = useState(false)
  const [deckBrowserEditing, setDeckBrowserEditing] = useState(null) // noteId being edited
  const [deckBrowserEditFields, setDeckBrowserEditFields] = useState({})
  // Copy/move a card to another deck (e.g. a dedicated PBQ deck): noteId with the panel open,
  // the chosen target deck, and a transient status ('working' | 'copied' | 'moved' | 'error').
  const [deckBrowserCopying, setDeckBrowserCopying] = useState(null)
  const [deckBrowserCopyTarget, setDeckBrowserCopyTarget] = useState('')
  const [deckBrowserCopyStatus, setDeckBrowserCopyStatus] = useState(null)
  const [deckBrowserExpanded, setDeckBrowserExpanded] = useState(null) // noteId expanded to full view
  const [deckBrowserSearch, setDeckBrowserSearch] = useState('')
  const [deckBrowserSort, setDeckBrowserSort] = useState('created-desc')
  const [deckBrowserRefineInput, setDeckBrowserRefineInput] = useState('')
  const [deckBrowserRefining, setDeckBrowserRefining] = useState(false)
  const [deckBrowserSaveStatus, setDeckBrowserSaveStatus] = useState(null) // null | 'saving' | 'saved' | 'error'
  // Add card (manual / AI-assisted)
  const [deckAddOpen, setDeckAddOpen] = useState(false)
  const [deckAddTerm, setDeckAddTerm] = useState('')
  const [deckAddFront, setDeckAddFront] = useState('')
  const [deckAddBack, setDeckAddBack] = useState('')
  const [deckAddTags, setDeckAddTags] = useState('')
  const [deckAddGenerating, setDeckAddGenerating] = useState(false)
  const [deckAddSaving, setDeckAddSaving] = useState(false)
  const [deckAddError, setDeckAddError] = useState(null)
  // Quick-Add: paste many words → generate formatted cards → review tray → sync approved.
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [quickAddInput, setQuickAddInput] = useState('')
  const [quickAddLoading, setQuickAddLoading] = useState(false)
  const [quickAddError, setQuickAddError] = useState(null)
  const [quickAddCards, setQuickAddCards] = useState([]) // [{ front, back, tags, correction, accepted, synced, syncing, dup }]
  const [deckAnalyzeLoading, setDeckAnalyzeLoading] = useState(false)
  const [deckAnalyzeRecs, setDeckAnalyzeRecs] = useState([]) // [{ noteId, reason, currentFields, recommendedFields, refineInput, refining, accepted }]
  const [deckAnalyzeCommitting, setDeckAnalyzeCommitting] = useState(false)
  const [deckAnalyzeError, setDeckAnalyzeError] = useState(null)
  const [deckAnalyzeEmpty, setDeckAnalyzeEmpty] = useState(false) // true when analyze completed with 0 recommendations
  const [deckAnalyzeSkipped, setDeckAnalyzeSkipped] = useState(0) // recs dropped because AI's noteId/front disagreed
  // Duplicate scan / merge
  const [deckDupLoading, setDeckDupLoading] = useState(false)
  const [deckDupGroups, setDeckDupGroups] = useState([]) // [{ noteIds, reason, cards:[{noteId,fields}], mergedFields, accepted }]
  const [deckDupCommitting, setDeckDupCommitting] = useState(false)
  const [deckDupError, setDeckDupError] = useState(null)
  const [deckDupEmpty, setDeckDupEmpty] = useState(false)
  const [deckDupExpanded, setDeckDupExpanded] = useState({}) // noteId -> bool (show full card)
  const [deckDupIgnore, setDeckDupIgnore] = useState([]) // ["minId-maxId", ...] pairs never to suggest
  // Discover Mode (adaptive new-card discovery)
  const [discoverProfile, setDiscoverProfile] = useState(null)
  const [discoverProfileLoading, setDiscoverProfileLoading] = useState(false)
  const [discoverLedger, setDiscoverLedger] = useState(DEFAULT_LEDGER)
  const [discoverSuggestion, setDiscoverSuggestion] = useState(null)
  const [discoverSuggestionLoading, setDiscoverSuggestionLoading] = useState(false)
  const [discoverError, setDiscoverError] = useState(null)
  const [discoverStatus, setDiscoverStatus] = useState(null) // null | 'thinking' | 'searching' | 'verifying'
  const [discoverSources, setDiscoverSources] = useState(null)
  const [discoverWebVerify, setDiscoverWebVerify] = useState(true)
  const [discoverCard, setDiscoverCard] = useState(null) // { front, back, tags } preview when making a card
  const [discoverCardLoading, setDiscoverCardLoading] = useState(false)
  const [discoverCardSaving, setDiscoverCardSaving] = useState(false)
  const [discoverStarted, setDiscoverStarted] = useState(false) // false = setup screen, true = suggestion loop
  const [discoverConfig, setDiscoverConfig] = useState({ itemType: 'both', focus: '', difficulty: 'stretch' }) // itemType per mode kind; difficulty: easier|level|stretch
  const [discoverDeck, setDiscoverDeck] = useState('') // '' = the mode's own deck; switchable in the panel
  const discoverInitRef = useRef(false)
  const discoverDeckTermsRef = useRef([]) // existing card fronts, to avoid re-suggesting them
  const [studyWrappingUp, setStudyWrappingUp] = useState(false)
  const [studyDeleteConfirm, setStudyDeleteConfirm] = useState(null) // cardIdx being confirmed for deletion
  const [studyFeedbackChat, setStudyFeedbackChat] = useState({}) // { [cardIdx]: { messages, input, loading } }
  const [studyCurrentHint, setStudyCurrentHint] = useState(null) // hint text for current question
  const [studyHintLevel, setStudyHintLevel] = useState(0) // 0=none, 1=hint1 shown, 2=hint2 shown
  const [studyMeaningHint, setStudyMeaningHint] = useState(null)
  const [studyMeaningHintLoading, setStudyMeaningHintLoading] = useState(false)
  // Tap-a-word-in-the-question contextual lookup (language study): { word, meaning, loading }
  const [studyWordLookup, setStudyWordLookup] = useState(null)
  // Brief "correct spelling" toast when an answer is accepted despite a missing accent / typo
  const [studySpellingNote, setStudySpellingNote] = useState(null) // { correct } | null
  const studySpellingNoteTimer = useRef(null)
  const [studyLegendOpen, setStudyLegendOpen] = useState(false)
  const [studyAnswerHistory, setStudyAnswerHistory] = useState([]) // [{cardIdx, questionIdx}] for undo
  const [studyInsights, setStudyInsights] = useState(null)
  const [studyInsightsLoading, setStudyInsightsLoading] = useState(false)
  const [studySyncNotification, setStudySyncNotification] = useState(false)
  const [studySyncError, setStudySyncError] = useState(null)
  const [studyShowGraded, setStudyShowGraded] = useState(false) // collapse the graded-cards list under one toggle
  const [studyGradedView, setStudyGradedView] = useState({}) // per-card view: { [cardIdx]: 'feedback' | 'mnemonic' } (absent = collapsed; the two are mutually exclusive)
  const [studySyncing, setStudySyncing] = useState(false)        // a manual/auto sync is in flight
  const [studyNow, setStudyNow] = useState(Date.now())           // 1s ticker for the auto-sync countdown

  // ─── Chat Tab State ───────────────────────────────────────────────────────
  const [chatTabMsgs, setChatTabMsgs] = useState([]) // [{ role, content, cards? }]
  const [chatTabInput, setChatTabInput] = useState('')
  const [chatTabLoading, setChatTabLoading] = useState(false)
  const [chatTabAttachedDeck, setChatTabAttachedDeck] = useState(null) // { name, cards, progress }
  const [chatTabAttachLoading, setChatTabAttachLoading] = useState(false)
  const [chatTabSessions, setChatTabSessions] = useState([])
  const [chatTabSessionId, setChatTabSessionId] = useState(null)
  const [chatTabEditingTitle, setChatTabEditingTitle] = useState(null)
  const [chatTabWebSearch, setChatTabWebSearch] = useState(false)
  // Chat composer "+" menu (learning-focused options) + an optional attached image for the next message.
  const [chatPlusOpen, setChatPlusOpen] = useState(false)
  const [chatTabImage, setChatTabImage] = useState(null) // dataUrl
  const chatImageInputRef = useRef(null)
  const [chatTabStatus, setChatTabStatus] = useState(null) // null | 'searching' | 'thinking' | 'search-done' | 'search-empty' | 'search-failed'
  const chatTabScrollRef = useRef(null)
  const chatTabInputRef = useRef(null)
  const chatSpacerRef = useRef(null) // bottom spacer so the latest turn can scroll to the top

  // Claude-style scroll: pin the latest USER message near the top of the viewport (with a
  // one-viewport spacer below) so the user mostly sees the most recent exchange and scrolls up
  // for history — instead of stacking everything and showing Ebi repeated down the page.
  // Size the bottom spacer so the latest turn can pin to the top with EXACTLY no over-scroll past it
  // (maxScroll === the pin target). Uses offsetTop (layout px, relative to the position:relative
  // container) — zoom-free and exact. Must be re-run after the reply fully renders (see effect below).
  const CHAT_PAD = 12
  const sizeChatSpacer = () => {
    const c = chatTabScrollRef.current, sp = chatSpacerRef.current
    if (!c || !sp) return
    const users = c.querySelectorAll('[data-role="user"]')
    const last = users[users.length - 1]
    if (!last) { sp.style.height = '0px'; return }
    // Size the spacer so maxScroll === the pin target (latest user msg, PAD from the top), independent
    // of container padding. Measure the base height NON-destructively (scrollHeight − current spacer)
    // so we never collapse it to 0 mid-scroll, which would clamp the position and kill the auto-scroll.
    const base = c.scrollHeight - sp.offsetHeight
    const target = Math.max(0, last.offsetTop - CHAT_PAD)
    sp.style.height = Math.max(0, target + c.clientHeight - base) + 'px'
  }
  const scrollChatToLatestTurn = () => {
    const c = chatTabScrollRef.current
    if (!c) return
    sizeChatSpacer()
    const users = c.querySelectorAll('[data-role="user"]')
    const last = users[users.length - 1]
    if (last) c.scrollTo({ top: Math.max(0, last.offsetTop - CHAT_PAD), behavior: 'smooth' })
    else c.scrollTo({ top: c.scrollHeight, behavior: 'smooth' })
  }
  // Re-size the spacer AFTER the reply fully renders (double rAF) so the early measurement can't
  // leave it too tall (which let you scroll into empty space past the last message).
  useEffect(() => {
    if (activeTab !== 'chat') return
    const id = requestAnimationFrame(() => requestAnimationFrame(sizeChatSpacer))
    return () => cancelAnimationFrame(id)
  }, [chatTabMsgs, chatTabLoading, activeTab])
  // Keep it correct on window/container resize too.
  useEffect(() => {
    const c = chatTabScrollRef.current
    if (!c || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => sizeChatSpacer())
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  // Load chat sessions from disk on mount, and restore the last-open session (persisted in
  // localStorage) so refreshing inside a chat keeps that chat instead of resetting to New Chat.
  useEffect(() => {
    fetch('/api/chats').then(r => r.json()).then(async sessions => {
      setChatTabSessions(sessions)
      try {
        const savedId = localStorage.getItem('ebiki-chat-session')
        const match = savedId && sessions.find(s => String(s.id) === String(savedId))
        if (match) {
          const data = await fetch(`/api/chat-load?id=${encodeURIComponent(match.id)}`).then(r => r.json())
          setChatTabMsgs((data.messages || []).map(m => ({ ...m, content: m.content || m.text })))
          setChatTabSessionId(match.id)
        }
      } catch {}
    }).catch(() => {})
  }, [])

  // Persist the open chat session id across refreshes.
  useEffect(() => {
    try {
      if (chatTabSessionId) localStorage.setItem('ebiki-chat-session', String(chatTabSessionId))
      else localStorage.removeItem('ebiki-chat-session')
    } catch {}
  }, [chatTabSessionId])

  // Persist the selected Deck-browser deck across refreshes.
  useEffect(() => {
    try {
      if (deckBrowserDeck) localStorage.setItem('ebiki-deck', deckBrowserDeck)
      else localStorage.removeItem('ebiki-deck')
    } catch {}
  }, [deckBrowserDeck])

  const activeMode = modes.find((m) => m.id === activeModeId) || modes[0] || defaultMode
  const ankiFormat = activeMode
  const ankiDeck = activeMode.ankiDeck || ''
  const setAnkiDeck = (deck) => {
    const updated = modes.map((m) => m.id === activeModeId ? { ...m, ankiDeck: deck } : m)
    setModes(updated)
    // Save immediately
    fetch('/api/modes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modes: updated, activeModeId }),
    }).catch(() => {})
  }

  const fileInputRef = useRef(null)
  const containerRef = useRef(null)
  const cancelRef = useRef(false)

  const apiKey = apiKeys[provider] || ''
  const providerConfig = PROVIDERS[provider]

  // ─── Configurable AI models + self-healing on retired models ───────────────
  // Each provider exposes three roles. `general` = the everyday/cheap model
  // (translations, explanations, chat, card edits); `question` = the stronger
  // model for generating study/conjugation questions and assessments; `help` =
  // Ebi's Help assistant. Resolve to the user's override, else the
  // provider default baked into providers.js.
  // These helpers are called from memoized callbacks that don't list aiModels as
  // a dependency, so read the live values from a ref rather than a stale closure.
  const aiStateRef = useRef({})
  aiStateRef.current = { provider, aiModels, apiKeys, intelligence }
  // Per-feature model roles. Each app area can run its own model (and provider).
  // Defaults: cheap/fast model for high-volume areas, stronger model where quality matters.
  // Every feature defaults to the provider's selected intelligence preset (Normal/Max), so the
  // whole app is one consistent tier. Exception: `pose` is a tiny classifier that fires on EVERY
  // message — it always uses the cheaper Normal preset so Max mode doesn't blow up cost/latency.
  const ROLE_DEFAULTS = (pc, intel = 'normal') => {
    const m = pc.presets?.[intel] || pc.questionModel || pc.model
    const normal = pc.presets?.normal || pc.questionModel || pc.model
    return { general: m, picture: m, deck: m, study: m, discover: m, chat: m, help: m, pose: normal }
  }
  // UI metadata for the AI Settings panel — order + labels + hints.
  const AI_ROLE_META = [
    { role: 'picture', label: 'Picture', hint: 'OCR translation, word explanations, tooltip lookups' },
    { role: 'deck', label: 'Deck', hint: 'Anki card generation, editing, analysis, deduplication' },
    { role: 'study', label: 'Study', hint: 'quiz/conjugation questions, answer grading, hints, insights, feedback' },
    { role: 'discover', label: 'Discover', hint: 'learner profiling, new-item suggestions, fact-checking' },
    { role: 'chat', label: 'Chat', hint: 'the chat tab assistant' },
    { role: 'help', label: 'Help', hint: "Ebi's Help assistant" },
    { role: 'pose', label: 'Mascot', hint: "picks Ebi's pose from context — defaults to a stronger model for a better fit; set a cheaper one to save cost" },
    { role: 'general', label: 'General', hint: 'fallback + AI mode/config generation' },
  ]
  const resolveModel = (role, prov = aiStateRef.current.provider) => {
    const pc = PROVIDERS[prov]
    const overrides = aiStateRef.current.aiModels[prov]
    return (overrides && overrides[role]) || ROLE_DEFAULTS(pc, aiStateRef.current.intelligence)[role]
  }
  // Like resolveModel, but for latency-sensitive roles: unless the user EXPLICITLY overrode the
  // role in Settings → AI models, prefer the provider's fast "normal" preset even on Max
  // intelligence (same rationale as the pose role). Used for the picture scan + word enrichment,
  // which are read/translate work the normal preset does as well as Max, several times faster.
  const resolveModelFast = (role, prov = aiStateRef.current.provider) => {
    const pc = PROVIDERS[prov]
    const overrides = aiStateRef.current.aiModels[prov]
    return (overrides && overrides[role]) || pc?.presets?.normal || ROLE_DEFAULTS(pc, aiStateRef.current.intelligence)[role]
  }

  // Ask the provider for its current model list (used by the "Check for new models"
  // button and an auto-fetch when the AI Settings panel opens). Stores per provider.
  const refreshModels = async (prov = provider) => {
    const pc = PROVIDERS[prov]
    const key = apiKeys[prov]
    if (!pc?.listModels || !key) return
    setModelsLoading(true)
    setModelsError(null)
    try {
      const ids = await pc.listModels(key)
      if (Array.isArray(ids) && ids.length) {
        setAvailableModels((prev) => ({ ...prev, [prov]: ids }))
      } else {
        setModelsError('No models returned.')
      }
    } catch (e) {
      setModelsError(e?.message || 'Failed to fetch models.')
    } finally {
      setModelsLoading(false)
    }
  }

  // Auto-fetch the model list when the settings panel opens and we don't have one yet.
  useEffect(() => {
    if (settingsOpen && settingsCategory === 'models' && apiKeys[provider] && !availableModels[provider]) refreshModels(provider)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, settingsCategory, provider, keysLoaded])
  // Load knowledge-base files when that settings category opens.
  useEffect(() => {
    if (settingsOpen && settingsCategory === 'knowledge') loadKnowledgeFiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, settingsCategory, activeModeId])

  // Ask the provider which models exist now and pick a sensible current one for
  // the role. Anthropic returns models newest-first; we prefer the role's tier.
  const discoverCurrentModel = async (role, prov = aiStateRef.current.provider) => {
    // Pick a currently-available model for the role's tier (general = cheap/fast, otherwise strong),
    // so a stale/unavailable default id self-heals — for EVERY provider, not just Anthropic.
    const strong = role !== 'general'
    // Per-provider family preference, ordered best→worst, for the strong vs cheap tier.
    const PREF = {
      anthropic: strong ? ['sonnet', 'opus', 'haiku'] : ['haiku', 'sonnet', 'opus'],
      openai:    strong ? ['gpt-4o', 'gpt-4.1', 'gpt-4-turbo', 'gpt-4', 'gpt-4o-mini'] : ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4o'],
      gemini:    strong ? ['2.5-pro', '1.5-pro', 'pro', '2.5-flash', '2.0-flash', 'flash'] : ['2.0-flash', '2.5-flash', 'flash', 'pro'],
      grok:      strong ? ['grok-4', 'grok-3', 'grok-2-vision', 'grok-2'] : ['grok-3-mini', 'grok-4-mini', 'grok-3', 'grok-4'],
    }
    const pickFrom = (ids) => {
      if (!ids || !ids.length) return null
      for (const fam of (PREF[prov] || [])) { const hit = ids.find((id) => id.toLowerCase().includes(fam.toLowerCase())); if (hit) return hit }
      return ids[0] || null
    }
    try {
      const key = aiStateRef.current.apiKeys[prov] || ''
      if (prov === 'anthropic') {
        const resp = await fetch('https://api.anthropic.com/v1/models?limit=100', {
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        })
        if (!resp.ok) return null
        const data = await resp.json()
        return pickFrom((data.data || []).map((m) => m.id))
      }
      // openai / gemini / grok — reuse the provider's own listModels().
      const pc = PROVIDERS[prov]
      if (pc?.listModels && key) return pickFrom(await pc.listModels(key))
    } catch { /* fall through */ }
    return null
  }

  // True when an error looks like "this model id no longer exists".
  const isRetiredModelError = (msg = '') => /\b404\b|not[_ ]?found|model.*(not found|does not exist|unavailable|retired|deprecated)/i.test(msg)

  // Turn a raw AI/provider error into a clear, user-facing explanation (or null if it
  // isn't a recognizable provider error — e.g. a JSON parse issue in the caller).
  const describeAiError = (msg = '') => {
    const m = String(msg).toLowerCase()
    if (/insufficient|credit|quota|billing|exceeded|payment|balance|out of/.test(m)) return 'Your AI provider is out of credits/quota. Add credits, or switch provider/model in AI Settings.'
    if (/\b429\b|rate.?limit|too many requests|overloaded/.test(m)) return 'The AI provider is rate-limiting requests. Wait a moment and try again.'
    if (/\b401\b|\b403\b|invalid.*api.*key|invalid x-api-key|unauthor|authentication|permission/.test(m)) return 'Your AI API key was rejected. Check the key in AI Settings.'
    if (/\b5\d\d\b|network|failed to fetch|timeout|econn|fetch failed/.test(m)) return 'Could not reach the AI provider. Check your connection and try again.'
    if (/^api \d+/.test(m)) return `AI request failed (${msg}).`
    return null
  }
  // Surface a provider error as a toast. Returns true if it was a recognizable AI error.
  const reportAiError = (e) => {
    const d = describeAiError(e?.message || e || '')
    if (d) { setAiErrorNotice(d); return true }
    return false
  }

  // On a retired-model error, find a current model, persist it as the role's
  // override, toast the user, and return it so the caller can retry.
  const healRetiredModel = async (errMsg, failedModel, role) => {
    if (!isRetiredModelError(errMsg)) return null
    const prov = aiStateRef.current.provider
    const replacement = await discoverCurrentModel(role)
    if (!replacement || replacement === failedModel) return null
    setAiModels((prev) => ({ ...prev, [prov]: { ...(prev[prov] || {}), [role]: replacement } }))
    setModelHealNotice(`${role} model "${failedModel}" was unavailable — switched to "${replacement}".`)
    return replacement
  }

  // Wrapper around providerConfig.call that injects the configured model and
  // self-heals retired models. modelOverride (when given) is the question-tier
  // model; otherwise the general model is used.
  const aiCall = async (key, systemPrompt, userContent, modelOverride, opts = {}) => {
    const prov = aiStateRef.current.provider
    const role = modelOverride ? 'question' : 'general'
    const model = modelOverride || resolveModel('general')
    // opts.images: optional array of { mediaType, base64 } sent as vision content blocks.
    // opts.maxTokens: optional output token budget (vision/long JSON needs more than the default).
    const images = opts.images
    const maxTokens = opts.maxTokens
    try {
      const out = await PROVIDERS[prov].call(key, systemPrompt, userContent, model, images, maxTokens)
      setAiErrorNotice((prev) => prev ? null : prev) // clear a stale error toast on success
      return out
    } catch (e) {
      const healed = await healRetiredModel(e?.message || '', model, role)
      if (healed) {
        try { return await PROVIDERS[prov].call(key, systemPrompt, userContent, healed, images, maxTokens) }
        catch (e2) { if (!opts.silent) reportAiError(e2); throw e2 }
      }
      // Surface out-of-credits / rate-limit / bad-key errors so failures aren't silent.
      // `silent` callers (e.g. the secondary mascot-pose call) never raise a toast.
      if (!opts.silent) reportAiError(e)
      throw e
    }
  }

  // Auto-dismiss the model-heal toast after a few seconds.
  useEffect(() => {
    if (!modelHealNotice) return
    const t = setTimeout(() => setModelHealNotice(null), 7000)
    return () => clearTimeout(t)
  }, [modelHealNotice])

  // ─── Load Keys & Config from file on mount ─────────────────────────────────
  useEffect(() => {
    Promise.all([
      fetch('/api/keys').then((r) => r.json()).catch(() => ({})),
      fetch('/api/config').then((r) => r.json()).catch(() => ({})),
      fetch('/api/modes').then((r) => r.json()).catch(() => null),
      fetch('/api/ankiformat').then((r) => r.json()).catch(() => null),
    ]).then(([keys, config, modesData, legacyFormat]) => {
      // Load modes from /api/modes (per-file storage)
      if (modesData && modesData.modes && modesData.modes.length > 0) {
        setModes(modesData.modes)
        if (modesData.activeModeId) setActiveModeId(modesData.activeModeId)
      } else if (legacyFormat) {
        // Migrate from legacy ankiformat.json
        let migrated = null
        if (legacyFormat.modes) {
          migrated = legacyFormat.modes
          if (legacyFormat.activeModeId) setActiveModeId(legacyFormat.activeModeId)
        } else if (legacyFormat.profiles) {
          migrated = legacyFormat.profiles.map((p) => ({
            ...p, type: 'language', description: '', tagRules: defaultMode.tagRules,
          }))
          if (legacyFormat.activeProfileId) setActiveModeId(legacyFormat.activeProfileId)
        } else if (legacyFormat.fields) {
          migrated = [{ ...defaultMode, ...legacyFormat, id: 1, name: 'Language Learning', type: 'language' }]
        }
        if (migrated) {
          setModes(migrated)
          // Save to new format
          fetch('/api/modes', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modes: migrated, activeModeId: migrated[0]?.id || 1 }),
          }).catch(() => {})
          console.log('[Mode] migrated from legacy ankiformat.json')
        }
      }
      setApiKeys(keys)
      if (config.provider) setProvider(config.provider)
      if (config.aiModels) setAiModels(config.aiModels)
      if (config.availableModels) setAvailableModels(config.availableModels)
      if (config.appLanguage) setAppLanguage(config.appLanguage)
      if (config.appTheme) setAppTheme(config.appTheme)
      if (config.language) setLanguage(config.language)
      if (config.targetLang) setTargetLang(config.targetLang)
      if (config.showHighlights !== undefined) setShowHighlights(config.showHighlights)
      if (config.intelligence) setIntelligence(config.intelligence)
      if (typeof config.studyAutoSync === 'boolean') setStudyAutoSync(config.studyAutoSync)
      if (Number.isFinite(config.studyAutoSyncMinutes)) setStudyAutoSyncMinutes(config.studyAutoSyncMinutes)
      if (config.overlayEnabled !== undefined) setOverlayEnabled(config.overlayEnabled)
      if (config.pronunciation) setPronunciationCfg((prev) => ({ ...prev, ...config.pronunciation }))
      if (config.onboarded) setOnboarded(true)
      setActiveTab(config.activeTab || 'picture')
      // ankiDeck is now per-mode (stored in mode config)
      setKeysLoaded(true)
      setConfigLoaded(true)
    })
    // Check overlay status immediately and poll
    const checkOverlay = () => fetch('/api/launch-overlay').then(r => r.json()).then(d => setOverlayRunning(d.running)).catch(() => {})
    checkOverlay()
    const overlayPoll = setInterval(checkOverlay, 3000)

    // Overlay mode: load screenshot from Electron capture
    const loadOverlayScreenshot = (onLoaded) => {
      const url = window.__overlayScreenshot
      if (!url) return
      fetch(url).then(r => r.blob()).then(blob => {
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target.result
          const img = new Image()
          img.onload = () => {
            setImgDims({ w: img.naturalWidth, h: img.naturalHeight })
            setScreenshot(dataUrl)
            setStage('captured')
            setOcrWords([])
            setError(null)
            // Reveal page now that new screenshot is rendered
            document.body.style.opacity = '1'
            onLoaded(dataUrl)
          }
          img.src = dataUrl
        }
        reader.readAsDataURL(blob)
      }).catch(err => console.error('[Overlay] Failed to load screenshot:', err))
    }

    // Full-screen capture (Alt+Q)
    const handleOverlayCapture = () => {
      console.log('[Overlay] Full capture')
      window.__selectionMode = false
      setSelectionMode(false)
      setSelectionOffset(null)
      setSelectionViewport(null)
      setSelectionCrop(null)
      loadOverlayScreenshot((dataUrl) => {
        setTimeout(() => { window.__autoAnalyze = dataUrl }, 100)
      })
    }
    window.addEventListener('overlay-capture', handleOverlayCapture)

    // Area-select: selector window already captured, we receive the rect + screenshot
    const handleAreaCaptured = async () => {
      const rect = window.__areaSelectRect
      const url = window.__overlayScreenshot
      if (!rect || !url) return
      window.__areaSelectRect = null
      console.log('[Overlay] Area captured:', rect)

      try {
        const resp = await fetch(url)
        const blob = await resp.blob()
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target.result)
          reader.readAsDataURL(blob)
        })
        const img = await new Promise((resolve) => {
          const i = new window.Image()
          i.onload = () => resolve(i)
          i.src = dataUrl
        })

        // Use screen dimensions (not window.innerWidth which is now the small window)
        const scaleX = img.naturalWidth / rect.screenW
        const scaleY = img.naturalHeight / rect.screenH
        const cx = Math.round(rect.x * scaleX)
        const cy = Math.round(rect.y * scaleY)
        const cw = Math.round(rect.w * scaleX)
        const ch = Math.round(rect.h * scaleY)

        const canvas = document.createElement('canvas')
        canvas.width = cw
        canvas.height = ch
        canvas.getContext('2d').drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch)
        const croppedDataUrl = canvas.toDataURL('image/png')

        const pad = rect.pad || 6
        // Window is sized to selection — render crop at (0,0) with padding
        setImgDims({ w: cw, h: ch })
        setScreenshot(croppedDataUrl)
        setSelectionOffset(null) // no offset needed — crop IS the image
        setSelectionViewport(null) // no viewport positioning — window IS the selection
        setSelectionCrop(null) // not using the separate crop rendering path
        setStage('captured')
        setOcrWords([])
        setError(null)
        setSelectionMode(false)
        window.__selectionMode = false
        // Save the small window bounds so we can restore after tooltip dismiss
        setAreaSelectBounds({ x: window.screenX, y: window.screenY, width: window.innerWidth, height: window.innerHeight })
        document.body.style.opacity = '1'
        setTimeout(() => { window.__autoAnalyze = croppedDataUrl }, 100)
      } catch (err) {
        console.error('[Overlay] Area capture failed:', err)
        document.body.style.opacity = '1'
      }
    }
    window.addEventListener('overlay-area-captured', handleAreaCaptured)

    // Overlay reset: clear old screenshot before new capture to prevent flash
    const handleOverlayReset = () => {
      setScreenshot(null)
      setStage('idle')
      setOcrWords([])
      window.__selectionMode = false
      setSelectionMode(false)
      setSelRect(null)
      setSelectionOffset(null)
      setSelectionViewport(null)
      setSelectionCrop(null)
      setAreaSelectBounds(null)
    }
    window.addEventListener('overlay-reset', handleOverlayReset)

    // Check AnkiConnect on mount
    console.log('[Anki] checking connection on mount...')
    ankiPing().then((ok) => {
      setAnkiConnected(ok)
      console.log('[Anki] mount check:', ok ? 'connected' : 'not connected')
      if (ok) ankiGetDecks().then((decks) => {
        setAnkiDecks(decks)
        console.log('[Anki] available decks:', decks)
        // If active mode has no deck or deck doesn't exist, default to first available
        setModes((prev) => {
          const updated = prev.map((m) => {
            if (!m.ankiDeck || (decks.length > 0 && !decks.includes(m.ankiDeck))) {
              return { ...m, ankiDeck: decks[0] || '' }
            }
            return m
          })
          return updated
        })
      }).catch(() => {})
    })
  }, [])

  // ─── Save Keys to .env on change ──────────────────────────────────────────
  useEffect(() => {
    if (!keysLoaded) return
    fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiKeys),
    }).catch(() => {})
  }, [apiKeys, keysLoaded])

  // ─── Save Config on change ────────────────────────────────────────────────
  useEffect(() => {
    if (!configLoaded) return
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, aiModels, availableModels, appLanguage, appTheme, language, targetLang, showHighlights, intelligence, studyAutoSync, studyAutoSyncMinutes, overlayEnabled, pronunciation: pronunciationCfg, onboarded, ...(activeTab ? { activeTab } : {}) }),
    }).catch(() => {})
  }, [provider, aiModels, availableModels, appLanguage, appTheme, language, targetLang, showHighlights, intelligence, studyAutoSync, studyAutoSyncMinutes, overlayEnabled, pronunciationCfg, onboarded, activeTab, configLoaded])

  // Auto-launch the overlay once on startup when the persisted preference is ON (default).
  const overlayAutoLaunchedRef = useRef(false)
  useEffect(() => {
    if (isOverlay || !configLoaded || overlayAutoLaunchedRef.current) return
    if (overlayEnabled && !overlayRunning) {
      overlayAutoLaunchedRef.current = true
      fetch('/api/launch-overlay', { method: 'POST' })
        .then((r) => r.json())
        .then((d) => { if (!d.error) setOverlayRunning(true) })
        .catch(() => {})
    }
  }, [configLoaded, overlayEnabled, overlayRunning, isOverlay])

  const setCurrentKey = (key) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }))
    if (key) setError(null)
  }

  // Gently nudge a returning (already-onboarded) user to add a key — ONCE on load, and never
  // during onboarding. Don't re-fire on provider switches, so picking/configuring a provider that
  // has no key yet doesn't yank the user into Settings.
  const keyPromptedRef = useRef(false)
  useEffect(() => {
    if (!keysLoaded || !onboarded || keyPromptedRef.current) return
    if (!apiKeys[provider]) { keyPromptedRef.current = true; setSettingsCategory('models'); setSettingsOpen(true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keysLoaded, onboarded])

  // ─── Load Image Helper ──────────────────────────────────────────────────────
  const loadImageFromDataUrl = useCallback((dataUrl) => {
    const img = new Image()
    img.onload = () => {
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight })
      setScreenshot(dataUrl)
      setStage('captured')
      setOcrWords([])
      setExpanded(false)
      setError(null)
    }
    img.src = dataUrl
  }, [])

  const loadImageFromFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => loadImageFromDataUrl(e.target.result)
    reader.readAsDataURL(file)
  }, [loadImageFromDataUrl])

  // Read an image directly from the clipboard (for the "Ctrl+V Paste" button — do it for the user).
  const pasteImageFromClipboard = useCallback(async () => {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith('image/'))
        if (type) {
          const blob = await item.getType(type)
          loadImageFromFile(new File([blob], 'pasted.png', { type }))
          return
        }
      }
      setError('No image found in your clipboard. Copy an image first, then click paste.')
    } catch {
      setError('Couldn’t read the clipboard (permission needed). Press Ctrl+V instead.')
    }
  }, [loadImageFromFile])

  // ─── Screen Capture ─────────────────────────────────────────────────────────
  const captureScreen = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
      })

      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()

      // Wait for a solid frame
      await new Promise((r) => setTimeout(r, 150))

      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d').drawImage(video, 0, 0)

      // Stop all tracks immediately
      stream.getTracks().forEach((t) => t.stop())
      video.remove()

      const dataUrl = canvas.toDataURL('image/png')
      loadImageFromDataUrl(dataUrl)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Screen capture failed: ' + err.message)
      }
    }
  }, [loadImageFromDataUrl])

  // ─── Area Selection (Ctrl+Shift+A) ──────────────────────────────────────────
  const selRectRef = useRef(null)
  const screenshotRef = useRef(screenshot)
  screenshotRef.current = screenshot

  const handleSelectionDown = useCallback((e) => {
    e.preventDefault()
    const rect = { x1: e.clientX, y1: e.clientY, x2: e.clientX, y2: e.clientY }
    selStartRef.current = { x: e.clientX, y: e.clientY }
    selRectRef.current = rect
    setSelRect(rect)
  }, [])

  const handleSelectionMove = useCallback((e) => {
    if (!selStartRef.current) return
    e.preventDefault()
    const updated = { ...selRectRef.current, x2: e.clientX, y2: e.clientY }
    selRectRef.current = updated
    setSelRect(updated)
  }, [])

  const handleSelectionUp = useCallback(async () => {
    if (!selStartRef.current) return
    selStartRef.current = null
    const r = selRectRef.current
    if (!r) return
    const x = Math.min(r.x1, r.x2)
    const y = Math.min(r.y1, r.y2)
    const w = Math.abs(r.x2 - r.x1)
    const h = Math.abs(r.y2 - r.y1)
    if (w < 10 || h < 10) return // too small, ignore

    // Hide drawing UI immediately
    window.__selectionMode = false
    setSelectionMode(false)
    setSelRect(null)
    selRectRef.current = null

    // Hide overlay so we capture the actual screen, not the overlay
    document.body.style.opacity = '0'
    await new Promise(resolve => setTimeout(resolve, 50))

    // Capture screenshot now via Electron IPC (or via fetch for non-Electron)
    let screenshotUrl
    if (window.overlayAPI?.captureScreenshot) {
      screenshotUrl = await window.overlayAPI.captureScreenshot()
    }
    if (!screenshotUrl) { document.body.style.opacity = '1'; return }

    // Load the full screenshot, crop to selection, show only the crop
    try {
      const resp = await fetch(screenshotUrl)
      const blob = await resp.blob()
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.readAsDataURL(blob)
      })
      const img = await new Promise((resolve) => {
        const i = new window.Image()
        i.onload = () => resolve(i)
        i.src = dataUrl
      })

      const scaleX = img.naturalWidth / window.innerWidth
      const scaleY = img.naturalHeight / window.innerHeight
      const cx = Math.round(x * scaleX)
      const cy = Math.round(y * scaleY)
      const cw = Math.round(w * scaleX)
      const ch = Math.round(h * scaleY)

      const canvas = document.createElement('canvas')
      canvas.width = cw
      canvas.height = ch
      canvas.getContext('2d').drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch)
      const croppedDataUrl = canvas.toDataURL('image/png')

      // Store full screenshot for non-transparent mode fallback
      setImgDims({ w: img.naturalWidth, h: img.naturalHeight })
      setScreenshot(dataUrl)
      setSelectionOffset({ x: cx, y: cy })
      setSelectionViewport({ x, y, w, h })
      setSelectionCrop({ dataUrl: croppedDataUrl, w: cw, h: ch })
      setStage('captured')
      setOcrWords([])
      setError(null)
      document.body.style.opacity = '1'
      // Auto-analyze the cropped region
      setTimeout(() => { window.__autoAnalyze = croppedDataUrl }, 100)
    } catch (err) {
      console.error('[Overlay] Area-select capture failed:', err)
      document.body.style.opacity = '1'
    }
  }, [])

  // ─── Analysis Pipeline ──────────────────────────────────────────────────────
  const analyzeImageTesseract = useCallback(async (dataUrl) => {
    if (!dataUrl) return
    setHoveredIdx(null); setPinnedIdx(null) // clear any stale pin from the previous scan
    if (!apiKey) {
      setSettingsCategory('models'); setSettingsOpen(true)
      setError(`Set your ${providerConfig.label} API key first.`)
      return
    }

    cancelRef.current = false
    setLoading(true)
    setStage('ocr')
    setError(null)
    setOcrWords([])

    try {
      // ── Stage 1: Tesseract OCR ──────────────────────────────────────────────
      setProgress('Initializing OCR engine…')

      // Get real image dimensions (don't rely on imgDims state which can be stale)
      const dimImg = new Image()
      await new Promise((resolve) => { dimImg.onload = resolve; dimImg.src = dataUrl })
      const realW = dimImg.naturalWidth, realH = dimImg.naturalHeight

      // Downscale for OCR only if extremely wide (4K+) — keep detail for better detection
      let ocrInput = dataUrl
      if (realW > 3000) {
        const scale = 2560 / realW
        const c = document.createElement('canvas')
        c.width = 2560
        c.height = Math.round(realH * scale)
        const ctx = c.getContext('2d')
        const img = new Image()
        await new Promise((resolve) => { img.onload = resolve; img.src = dataUrl })
        ctx.drawImage(img, 0, 0, c.width, c.height)
        ocrInput = c.toDataURL('image/png')
      }

      // Dual-pass OCR with cancel support
      setProgress('Preprocessing…')
      const preprocessed = await preprocessForOCR(ocrInput)
      if (cancelRef.current) return

      const ocrLang = language === 'auto' ? 'eng+spa+fra+deu+por+ita' : language

      // Helper to merge non-overlapping words
      const mergeWords = (existing, newWords) => {
        for (const w2 of newWords) {
          const overlaps = existing.some((w1) => {
            const ox = Math.max(0, Math.min(w1.bbox.x1, w2.bbox.x1) - Math.max(w1.bbox.x0, w2.bbox.x0))
            const oy = Math.max(0, Math.min(w1.bbox.y1, w2.bbox.y1) - Math.max(w1.bbox.y0, w2.bbox.y0))
            const area2 = (w2.bbox.x1 - w2.bbox.x0) * (w2.bbox.y1 - w2.bbox.y0)
            return area2 > 0 && (ox * oy) / area2 > 0.3
          })
          if (!overlaps) existing.push(w2)
        }
      }

      // Pass 1: Preprocessed (high contrast)
      setProgress('OCR pass 1…')
      const r1 = await Tesseract.recognize(preprocessed, ocrLang, {
        logger: (m) => { if (m.status === 'recognizing text') setProgress(`OCR 1: ${Math.round((m.progress || 0) * 100)}%`) },
      })
      if (cancelRef.current) return

      // Pass 2: Original image
      setProgress('OCR pass 2…')
      const r2 = await Tesseract.recognize(ocrInput, ocrLang, {
        logger: (m) => { if (m.status === 'recognizing text') setProgress(`OCR 2: ${Math.round((m.progress || 0) * 100)}%`) },
      })
      if (cancelRef.current) return

      // Merge all passes
      const merged = [...(r1.data.words || [])]
      mergeWords(merged, r2.data.words || [])

      ocrLog(`OCR pass 1: ${(r1.data.words||[]).length}, pass 2: ${(r2.data.words||[]).length}, merged: ${merged.length}`)

      // Scale bounding boxes back to original resolution if we downscaled
      const bboxScale = realW > 3000 ? realW / 2560 : 1

      // ── Log: Raw Tesseract output ──
      const allTessWords = merged
      ocrLog(`Image: ${realW}x${realH}, bboxScale=${bboxScale.toFixed(2)}`)
      ocrLog(`Tesseract returned ${allTessWords.length} raw words`)
      ocrLogTable('Raw Tesseract words', allTessWords.map((w) => ({
        text: w.text.trim(),
        conf: Math.round(w.confidence),
        x0: w.bbox.x0, y0: w.bbox.y0, x1: w.bbox.x1, y1: w.bbox.y1,
        w: w.bbox.x1 - w.bbox.x0, h: w.bbox.y1 - w.bbox.y0,
      })))

      const rawWords = allTessWords
        .filter((w) => {
          const t = w.text.trim()
          if (t.length === 0) return false
          if (!/[a-zA-ZÀ-ÿ]/.test(t)) return false
          // Clean text first (strip leading/trailing non-letters) — use cleaned length for thresholds
          const cleaned = t.replace(/^[^a-zA-ZÀ-ÿ]+|[^a-zA-ZÀ-ÿ]+$/g, '') || t
          const letterCount = (cleaned.match(/[a-zA-ZÀ-ÿ]/g) || []).length
          if (letterCount < 2) {
            if (letterCount === 1 && w.confidence >= 85) return true
            return false
          }
          const minConf = cleaned.length <= 2 ? 65 : cleaned.length <= 3 ? 45 : 35
          if (w.confidence < minConf) {
            ocrLog(`[FILTERED conf] "${cleaned}" conf=${Math.round(w.confidence)} < ${minConf}`)
            return false
          }
          const bw = w.bbox.x1 - w.bbox.x0, bh = w.bbox.y1 - w.bbox.y0
          if (bw > 0 && bh > 0 && (bw / bh > 15 || bh / bw > 5)) {
            ocrLog(`[FILTERED shape] "${cleaned}" aspect=${(bw/bh).toFixed(1)} (${bw}x${bh})`)
            return false
          }
          if (bw < 10 || bh < 10) {
            ocrLog(`[FILTERED tiny] "${cleaned}" (${bw}x${bh})`)
            return false
          }
          // Reject oversized bboxes (UI banners, not individual words)
          const scaledBw = bw * bboxScale, scaledBh = bh * bboxScale
          if (scaledBw * scaledBh > realW * realH * 0.05) {
            ocrLog(`[FILTERED huge] "${cleaned}" covers ${((scaledBw*scaledBh)/(realW*realH)*100).toFixed(1)}% of image`)
            return false
          }
          if (scaledBw > realW * 0.4) {
            ocrLog(`[FILTERED wide] "${cleaned}" width=${Math.round(scaledBw)} > 40% of image`)
            return false
          }
          return true
        })
        .map((w) => ({
          text: w.text.trim().replace(/^[^a-zA-ZÀ-ÿ]+|[^a-zA-ZÀ-ÿ]+$/g, '') || w.text.trim(),
          bbox: {
            x0: Math.round(w.bbox.x0 * bboxScale),
            y0: Math.round(w.bbox.y0 * bboxScale),
            x1: Math.round(w.bbox.x1 * bboxScale),
            y1: Math.round(w.bbox.y1 * bboxScale),
          },
          confidence: w.confidence,
        }))

      ocrLogTable(`After filtering: ${rawWords.length} words`, rawWords.map((w) => ({ text: w.text, conf: Math.round(w.confidence), ...w.bbox })))

      // Deduplicate overlapping bounding boxes (Tesseract can detect the same
      // text region multiple times). Keep the higher-confidence read.
      const deduped = []
      for (const w of rawWords) {
        const area = (w.bbox.x1 - w.bbox.x0) * (w.bbox.y1 - w.bbox.y0)
        let dominated = false
        for (let k = deduped.length - 1; k >= 0; k--) {
          const d = deduped[k]
          const ix0 = Math.max(w.bbox.x0, d.bbox.x0)
          const iy0 = Math.max(w.bbox.y0, d.bbox.y0)
          const ix1 = Math.min(w.bbox.x1, d.bbox.x1)
          const iy1 = Math.min(w.bbox.y1, d.bbox.y1)
          if (ix0 >= ix1 || iy0 >= iy1) continue
          const inter = (ix1 - ix0) * (iy1 - iy0)
          const dArea = (d.bbox.x1 - d.bbox.x0) * (d.bbox.y1 - d.bbox.y0)
          // Use IoU (intersection-over-union) so large bad bboxes don't eat valid words
          const iou = inter / (area + dArea - inter)
          if (iou > 0.4) {
            if (w.confidence > d.confidence) {
              ocrLog(`[DEDUP] "${d.text}" (${Math.round(d.confidence)}%) replaced by "${w.text}" (${Math.round(w.confidence)}%) IoU=${(iou*100).toFixed(0)}%`)
              deduped.splice(k, 1)
            } else {
              ocrLog(`[DEDUP] "${w.text}" (${Math.round(w.confidence)}%) dropped, kept "${d.text}" (${Math.round(d.confidence)}%) IoU=${(iou*100).toFixed(0)}%`)
              dominated = true
              break
            }
          }
        }
        if (!dominated) deduped.push(w)
      }

      // Sort in reading order (top-to-bottom, left-to-right) so the AI receives
      // consecutive fragments as consecutive indices for "m" merge detection
      deduped.sort((a, b) => {
        const avgH = ((a.bbox.y1 - a.bbox.y0) + (b.bbox.y1 - b.bbox.y0)) / 2
        if (Math.abs(a.bbox.y0 - b.bbox.y0) < avgH * 0.5) return a.bbox.x0 - b.bbox.x0
        return a.bbox.y0 - b.bbox.y0
      })

      ocrLogTable(`After dedup + sort: ${deduped.length} words (final)`, deduped.map((w) => ({ text: w.text, conf: Math.round(w.confidence), ...w.bbox })))

      const finalWords = deduped

      if (finalWords.length === 0) {
        setError('No readable text found. Try a different language or a clearer screenshot.')
        setStage('captured')
        setLoading(false)
        return
      }

      // ── Stage 2: AI Translation ────────────────────────────────────────────
      if (cancelRef.current) return

      // In "click" mode, skip batch translation — words get translated on click
      if (activeMode.translateMode === 'click') {
        const mapped = finalWords.map((w, idx) => ({
          ...w, _untranslated: true, translation: '', synonyms: [], category: 'foreign',
          partOfSpeech: '', pronunciation: '', isEnglish: false, _globalIdx: idx,
        }))
        setOcrWords(mapped)
        setStage('done')
        setLoading(false)
        ocrLog(`Click-to-translate mode: ${mapped.length} words ready, skipping batch translation`)
        ocrLogFlush()
        return
      }

      setStage('translating')
      setProgress(`Found ${finalWords.length} words. Translating…`)

      const wordTexts = finalWords.map((w) => w.text)
      const fullContext = wordTexts.join(' ')
      const chunkSize = 80
      const allTranslations = {} // globalIndex → { t, s, e }

      for (let i = 0; i < wordTexts.length; i += chunkSize) {
        const chunk = wordTexts.slice(i, i + chunkSize)
        const chunkEnd = Math.min(i + chunkSize, wordTexts.length)
        setProgress(`Translating ${i + 1}–${chunkEnd} of ${wordTexts.length}…`)

        // Build array of {i, w} objects with global indices
        const indexedWords = chunk.map((word, j) => ({ i: i + j, w: word }))

        const fromLabel = language === 'auto' ? 'Auto-detect' : (LANGS.find((l) => l.code === language)?.label || 'Unknown')
        const toLabel = LANGS.find((l) => l.code === targetLang)?.label || 'English'
        const payload = JSON.stringify({ words: indexedWords, from: fromLabel, to: toLabel, context: fullContext })
        const text = await aiCall(apiKey, TRANSLATE_PROMPT, payload, resolveModel('picture'))
        if (!text) throw new Error('Empty translation response')

        ocrLog(`Chunk ${i}: sent ${indexedWords.length} words`)
        ocrLog(`AI returned: ${text.slice(0, 300)}`)

        // Extract JSON from response — handle markdown wrapping, preamble, etc.
        let cleaned = text
        // Strip markdown code fences
        cleaned = cleaned.replace(/```(?:json)?\s*/g, '').replace(/```\s*/g, '')
        // Try to find the JSON array/object in the response
        const jsonStart = cleaned.indexOf('[') !== -1 ? cleaned.indexOf('[') : cleaned.indexOf('{')
        if (jsonStart > 0) cleaned = cleaned.slice(jsonStart)
        const lastBracket = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'))
        if (lastBracket > 0) cleaned = cleaned.slice(0, lastBracket + 1)
        cleaned = cleaned.trim()

        let parsed
        try {
          parsed = JSON.parse(cleaned)
        } catch {
          let r = cleaned
          // Fix unquoted or single-quoted property names
          r = r.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
          r = r.replace(/'/g, '"')
          r = r.replace(/,\s*([}\]])/g, '$1')
          if ((r.match(/"/g) || []).length % 2 !== 0) r += '"'
          r = r.replace(/,\s*$/, '')
          let ob = (r.match(/\[/g) || []).length - (r.match(/\]/g) || []).length
          let oc = (r.match(/\{/g) || []).length - (r.match(/\}/g) || []).length
          for (; ob > 0; ob--) r += ']'
          for (; oc > 0; oc--) r += '}'
          try {
            parsed = JSON.parse(r)
          } catch (e2) {
            ocrLog(`[ERROR] JSON repair failed: ${e2.message}\nRaw: ${text.slice(0, 500)}`)
            // Last resort: skip this chunk, words will be retried via lazy translate
            continue
          }
        }

        // Flatten to array of items (handles both array and object responses)
        let items = []
        if (Array.isArray(parsed)) {
          items = parsed
        } else if (parsed && typeof parsed === 'object') {
          items = Object.values(parsed)
        }

        // Match each item to its word using the embedded "i" index
        // Build a lookup of original words for fallback matching by "w"
        const wordLookup = {}
        indexedWords.forEach((iw) => {
          if (!wordLookup[iw.w]) wordLookup[iw.w] = []
          wordLookup[iw.w].push(iw.i)
        })
        const usedByW = new Set()

        for (const item of items) {
          if (!item || typeof item !== 'object') continue

          // Primary match: by "i" field
          if (item.i !== undefined && item.i !== null) {
            const idx = Number(item.i)
            if (!isNaN(idx) && idx >= i && idx < chunkEnd) {
              allTranslations[String(idx)] = item
              continue
            }
          }

          // Fallback match: by "w" field (original word)
          if (item.w && wordLookup[item.w]) {
            const candidates = wordLookup[item.w].filter((ci) => !usedByW.has(ci) && !allTranslations[String(ci)])
            if (candidates.length > 0) {
              const idx = candidates[0]
              usedByW.add(idx)
              allTranslations[String(idx)] = item
            }
          }
        }
      }

      // ── AI-driven fragment merge ─────────────────────────────────────────
      // The AI detects OCR fragments via "m" field (e.g. "Sob"+"reguardia" → "Sobreguardia")
      // Only merge if words are spatially adjacent (same row, close horizontally)
      const mergedAway = new Set() // indices to hide (absorbed into another word)
      for (const [, item] of Object.entries(allTranslations)) {
        if (item.m && Array.isArray(item.m) && item.m.length > 1) {
          const indices = item.m.filter((idx) => idx >= 0 && idx < finalWords.length)
          if (indices.length < 2) continue
          indices.sort((a, b) => a - b)
          // Verify spatial adjacency — all words must be on the same row and close together
          let spatiallyValid = true
          for (let k = 1; k < indices.length; k++) {
            const prev = finalWords[indices[k - 1]].bbox
            const curr = finalWords[indices[k]].bbox
            const avgH = ((prev.y1 - prev.y0) + (curr.y1 - curr.y0)) / 2
            const sameRow = Math.abs(prev.y0 - curr.y0) < avgH * 0.6
            const gap = curr.x0 - prev.x1
            const closeEnough = gap < avgH * 2 // within 2x char height
            if (!sameRow || !closeEnough) {
              ocrLog(`[AI MERGE REJECTED] "${finalWords[indices[k-1]].text}" + "${finalWords[indices[k]].text}" not spatially adjacent (sameRow=${sameRow}, gap=${gap})`)
              spatiallyValid = false
              break
            }
          }
          if (!spatiallyValid) continue
          const first = indices[0]
          const mergedText = indices.map((idx) => finalWords[idx].text).join('')
          const mergedBbox = {
            x0: Math.min(...indices.map((idx) => finalWords[idx].bbox.x0)),
            y0: Math.min(...indices.map((idx) => finalWords[idx].bbox.y0)),
            x1: Math.max(...indices.map((idx) => finalWords[idx].bbox.x1)),
            y1: Math.max(...indices.map((idx) => finalWords[idx].bbox.y1)),
          }
          ocrLog(`[AI MERGE] ${indices.map((i) => `"${finalWords[i].text}"`).join(' + ')} → "${mergedText}" (translation: "${item.t}")`)
          finalWords[first] = { ...finalWords[first], text: mergedText, bbox: mergedBbox }
          for (let k = 1; k < indices.length; k++) {
            mergedAway.add(indices[k])
          }
        }
      }
      if (mergedAway.size > 0) {
        ocrLog(`Merged away ${mergedAway.size} fragment(s): indices ${[...mergedAway].join(', ')}`)
      }

      // ── Quick gap check: fill any missing indices ──────────────────────────
      const missing = []
      for (let i = 0; i < finalWords.length; i++) {
        if (!allTranslations[String(i)]) {
          allTranslations[String(i)] = { t: 'Loading…', s: [], e: false, _untranslated: true }
          missing.push(i)
        }
      }
      if (missing.length > 0) {
        ocrLog(`${missing.length} words had no translation, will translate on hover: ${missing.map((i) => finalWords[i].text).join(', ')}`)
      }

      // ── Merge OCR + Translation (matched by index) ─────────────────────────
      // Skip fragments that were merged into another word by the AI
      const translatedWords = finalWords
        .map((w, i) => {
          if (mergedAway.has(i)) return null // absorbed into another word
          const t = allTranslations[String(i)]
          const category = t.c || (t.e === true ? 'target' : 'foreign')
          const partOfSpeech = t.p || 'other'
          return {
            text: w.text,
            bbox: w.bbox,
            confidence: w.confidence,
            translation: t.t || w.text,
            synonyms: t.s || [],
            category,
            partOfSpeech,
            pronunciation: t.r || '',
            isEnglish: category === 'target',
            _untranslated: t._untranslated || false,
          }
        })
        .filter(Boolean)

      ocrLog(`Pipeline complete: ${translatedWords.length} words`)
      ocrLogFlush() // Write logs to logs/ directory

      setOcrWords(translatedWords)
      setStage('done')

      // Auto-retry any missed words in background
      if (missing.length > 0) {
        missing.forEach((idx) => lazyTranslate(idx))
      }
    } catch (err) {
      ocrLog(`[ERROR] ${err.message}`)
      ocrLogFlush()
      console.error(err)
      setError('Analysis failed: ' + err.message)
      setStage('captured')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [apiKey, language, targetLang, providerConfig])

  // Single-pass Tesseract used ONLY to localize words (pixel-accurate boxes) so we can snap
  // the vision model's accurate text onto them. Returns [{ text, bbox, confidence }].
  const getTesseractBoxes = useCallback(async (dataUrl) => {
    try {
      const dimImg = new Image()
      await new Promise((resolve, reject) => { dimImg.onload = resolve; dimImg.onerror = reject; dimImg.src = dataUrl })
      const realW = dimImg.naturalWidth, realH = dimImg.naturalHeight
      let ocrInput = dataUrl
      if (realW > 3000) {
        const scale = 2560 / realW
        const c = document.createElement('canvas')
        c.width = 2560; c.height = Math.round(realH * scale)
        const img = new Image()
        await new Promise((resolve) => { img.onload = resolve; img.src = dataUrl })
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
        ocrInput = c.toDataURL('image/png')
      }
      const bboxScale = realW > 3000 ? realW / 2560 : 1
      const ocrLang = language === 'auto' ? 'eng+spa+fra+deu+por+ita' : language
      const preprocessed = await preprocessForOCR(ocrInput)
      const r = await Tesseract.recognize(preprocessed, ocrLang, {})
      return (r.data.words || [])
        .map((w) => ({
          text: (w.text || '').trim(),
          confidence: w.confidence,
          bbox: {
            x0: Math.round(w.bbox.x0 * bboxScale), y0: Math.round(w.bbox.y0 * bboxScale),
            x1: Math.round(w.bbox.x1 * bboxScale), y1: Math.round(w.bbox.y1 * bboxScale),
          },
        }))
        .filter((w) => w.text && w.confidence > 30 && (w.bbox.x1 - w.bbox.x0) > 4 && (w.bbox.y1 - w.bbox.y0) > 4)
    } catch {
      return []
    }
  }, [language])

  // ── Vision pipeline: the model reads the image directly (accurate on busy/stylized
  // game screens, in-context, one call). Tesseract localizes the boxes. ────────────────
  const analyzeImageVision = useCallback(async (dataUrl) => {
    cancelRef.current = false
    setLoading(true)
    setStage('ocr')
    setError(null)
    setOcrWords([])
    setOcrLines([])
    // A pin/hover from the PREVIOUS scan must not survive into the new word list — the stale
    // index would land on an arbitrary new word and auto-open its popup without any click.
    setHoveredIdx(null); setPinnedIdx(null)
    enrichWordRef.current.clear() // word indices are reused across scans
    try {
      setProgress('Reading image…')
      // Real dimensions of the image we'll map boxes against.
      const dimImg = new Image()
      await new Promise((resolve) => { dimImg.onload = resolve; dimImg.src = dataUrl })
      const realW = dimImg.naturalWidth, realH = dimImg.naturalHeight
      if (cancelRef.current) return

      // Localize words with Tesseract IN PARALLEL with the vision read — the model's own
      // boxes are imprecise, so we snap its accurate text onto Tesseract's accurate boxes.
      const tessPromise = getTesseractBoxes(dataUrl)

      // The active LANGUAGE mode drives the translation direction: "from" = the language being
      // LEARNED (the mode's studyLanguage), "to" = the user's own language (app language). The
      // global translation pair (Settings → General) is only the fallback for non-language modes.
      const isLangMode = activeMode?.type === 'language'
      const fromLabel = isLangMode
        ? learnLangName()
        : (language === 'auto' ? 'Auto-detect' : (LANGS.find((l) => l.code === language)?.label || 'Unknown'))
      const toLabel = isLangMode
        ? userLangName()
        : (LANGS.find((l) => l.code === targetLang)?.label || 'English')

      // ── Adaptive routing by VISUAL noise ────────────────────────────────────────────
      // A visually CLEAN screenshot (flat UI, plain background) is Tesseract's sweet spot —
      // the model never needs to see the image: translate Tesseract's word list with a cheap
      // TEXT-only call. A visually BUSY image (game scene, photo, noisy background) keeps the
      // full vision read, which is exactly what it's for. Guardrail: if Tesseract reads too
      // little / too unconfidently off a "clean" image (stylized fonts), fall through to vision.
      const noise = await estimateImageNoise(dataUrl)
      if (cancelRef.current) return
      if (noise < 0.06) {
        try {
          setProgress('Reading text…')
          const tess = (await tessPromise) || []
          if (cancelRef.current) return
          const good = tess.filter((w) => w.confidence >= 70)
          const avgConf = good.length ? good.reduce((s, w) => s + w.confidence, 0) / good.length : 0
          ocrLog(`Image noise ${noise.toFixed(3)} → clean; Tesseract ${good.length} confident words @ ${Math.round(avgConf)}%`)
          if (good.length >= 3 && avgConf >= 80) {
            // Geometric reading-order lines (the vision model gives these semantically; here we
            // infer them from boxes: new line when the vertical center jumps ~70% of word height).
            const sorted = good.slice().sort((a, b) => (a.bbox.y0 - b.bbox.y0) || (a.bbox.x0 - b.bbox.x0))
            let lineNo = 0, prev = null
            for (const w of sorted) {
              const cy = (w.bbox.y0 + w.bbox.y1) / 2, hgt = w.bbox.y1 - w.bbox.y0
              if (prev && Math.abs(cy - prev.cy) > Math.max(hgt, prev.hgt) * 0.7) lineNo++
              w._line = lineNo
              prev = { cy, hgt }
            }
            setProgress('Translating…')
            const listPayload = JSON.stringify({
              words: sorted.map((w, i) => ({ i, w: w.text })),
              from: fromLabel, to: toLabel,
              context: sorted.map((w) => w.text).join(' '),
            })
            // Text-only word-list translation is cheap-tier work (no image involved); an
            // explicit picture-role override in Settings still wins.
            const listModel = (aiStateRef.current.aiModels[aiStateRef.current.provider] || {}).picture
              || PROVIDERS[aiStateRef.current.provider]?.model || resolveModelFast('picture')
            const listText = await aiCall(apiKey, WORDLIST_TRANSLATE_PROMPT, listPayload, listModel, { maxTokens: 8000 })
            if (cancelRef.current) return
            const listParsed = parseAiJson(listText)
            if (Array.isArray(listParsed)) {
              const byIdx = new Map(listParsed.filter((t) => t && typeof t === 'object').map((t) => [Number(t.i), t]))
              const out = []
              sorted.forEach((w, i) => {
                const t = byIdx.get(i)
                if (!t || t.c === 'skip') return
                out.push({
                  text: w.text, bbox: w.bbox, confidence: w.confidence,
                  translation: t.t || w.text, synonyms: [],
                  category: t.c || 'foreign', partOfSpeech: t.p || 'other',
                  pronunciation: '', isEnglish: t.c === 'target', _untranslated: false,
                  sense: '', alts: [], _needsEnrich: true,
                  line: w._line, _globalIdx: out.length, _snapped: true,
                })
              })
              if (out.length) {
                const lineMap = new Map()
                out.forEach((w, i) => {
                  if (!lineMap.has(w.line)) lineMap.set(w.line, [])
                  lineMap.get(w.line).push(i)
                })
                const lines = [...lineMap.entries()]
                  .sort((a, b) => a[0] - b[0])
                  .map(([line, idxs]) => ({ line, idxs: idxs.sort((x, y) => out[x].bbox.x0 - out[y].bbox.x0) }))
                ocrLog(`Clean fast path complete: ${out.length} words, ${lines.length} lines (no vision call)`)
                ocrLogFlush()
                setOcrWords(out)
                setOcrLines(lines)
                setStage('done')
                return
              }
            }
            ocrLog('Clean fast path produced nothing usable — falling through to vision')
          }
        } catch (err) {
          if (cancelRef.current) return
          ocrLog(`Clean fast path failed (${err.message}) — falling through to vision`)
        }
      } else {
        ocrLog(`Image noise ${noise.toFixed(3)} → busy; full vision read`)
      }

      setProgress('Reading image…')
      // Downscale before upload (faster/cheaper, within vision limits) — boxes stay normalized.
      const sendUrl = await downscaleDataUrl(dataUrl, 1500)
      const imagePart = dataUrlToImagePart(sendUrl)
      if (cancelRef.current) return

      const payload = JSON.stringify({ from: fromLabel, to: toLabel, context: '' })

      const text = await aiCall(apiKey, VISION_OCR_PROMPT, payload, resolveModelFast('picture'), { images: [imagePart], maxTokens: 8000 })
      if (cancelRef.current) return
      ocrLog(`Vision returned (${String(text).length} chars): ${String(text).slice(0, 1200)}`)

      const parsed = parseAiJson(text)
      if (!Array.isArray(parsed)) {
        ocrLog('[Vision] could not parse JSON — falling back to Tesseract')
        ocrLogFlush()
        return analyzeImageTesseract(dataUrl)
      }

      const clamp01 = (n) => Math.max(0, Math.min(1, Number(n) || 0))
      const words = parsed
        .filter((it) => it && typeof it === 'object' && String(it.w || '').trim())
        .map((it, idx) => {
          const box = Array.isArray(it.box) ? it.box : [0, 0, 0, 0]
          const x0 = clamp01(box[0]), y0 = clamp01(box[1]), x1 = clamp01(box[2]), y1 = clamp01(box[3])
          const category = it.c || (it.e === true ? 'target' : 'foreign')
          return {
            text: String(it.w).trim(),
            bbox: {
              x0: Math.round(Math.min(x0, x1) * realW),
              y0: Math.round(Math.min(y0, y1) * realH),
              x1: Math.round(Math.max(x0, x1) * realW),
              y1: Math.round(Math.max(y0, y1) * realH),
            },
            confidence: 100,
            translation: it.t || String(it.w).trim(),
            synonyms: Array.isArray(it.s) ? it.s : [],
            category,
            partOfSpeech: it.p || 'other',
            pronunciation: it.r || '',
            isEnglish: category === 'target',
            _untranslated: false,
            sense: it.sense || '',
            alts: Array.isArray(it.alts) ? it.alts.filter(Boolean).map(String).slice(0, 3) : [],
            // Model omitted the rich fields (text-dense scan, SPEED RULE) — fetch on demand.
            _needsEnrich: !it.sense && !it.r,
            line: Number.isFinite(Number(it.line)) ? Number(it.line) : idx,
            _globalIdx: idx,
          }
        })

      if (words.length === 0) {
        setError('No readable text found in this image. Try a clearer screenshot.')
        setStage('captured')
        setLoading(false)
        return
      }

      // ── Snap vision words onto Tesseract's accurate boxes (by matching text) ──────────
      // The vision model's boxes are imprecise; Tesseract gives pixel-accurate localization.
      // Matched words get the precise box (_snapped); unmatched words keep no image box
      // (they still appear in the reading panel) so we never draw a misplaced overlay.
      const tessWords = (await tessPromise) || []
      // NFD decomposes accents into combining marks; [^a-z0-9] then strips marks + punctuation.
      const norm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '')
      const tess = tessWords.map((tw) => ({
        n: norm(tw.text), bbox: tw.bbox, confidence: tw.confidence, used: false,
        cx: (tw.bbox.x0 + tw.bbox.x1) / 2, cy: (tw.bbox.y0 + tw.bbox.y1) / 2,
      })).filter((tw) => tw.n)
      let snappedCount = 0
      words.forEach((w) => {
        const wn = norm(w.text)
        if (!wn) { w._approxBox = true; return }
        const wcx = (w.bbox.x0 + w.bbox.x1) / 2, wcy = (w.bbox.y0 + w.bbox.y1) / 2
        let best = null, bestD = Infinity
        for (const tw of tess) {
          if (tw.used || tw.n !== wn) continue
          const d = (tw.cx - wcx) ** 2 + (tw.cy - wcy) ** 2
          if (d < bestD) { bestD = d; best = tw }
        }
        if (best) { best.used = true; w.bbox = best.bbox; w.confidence = best.confidence; w._snapped = true; snappedCount++ }
        else { w._approxBox = true }
      })
      ocrLog(`Snapped ${snappedCount}/${words.length} vision words onto Tesseract boxes (${tess.length} tess words)`)

      // Group into reading-order lines for the reading panel.
      const lineMap = new Map()
      words.forEach((w, i) => {
        const ln = Number.isFinite(w.line) ? w.line : 9999
        if (!lineMap.has(ln)) lineMap.set(ln, [])
        lineMap.get(ln).push(i)
      })
      const lines = [...lineMap.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([line, idxs]) => ({ line, idxs: idxs.sort((x, y) => words[x].bbox.x0 - words[y].bbox.x0) }))

      ocrLog(`Vision pipeline complete: ${words.length} words, ${lines.length} lines`)
      ocrLogFlush()
      setOcrWords(words)
      setOcrLines(lines)
      setStage('done')
    } catch (err) {
      ocrLog(`[Vision ERROR] ${err.message} — falling back to Tesseract`)
      ocrLogFlush()
      console.error(err)
      if (cancelRef.current) return
      return analyzeImageTesseract(dataUrl)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [apiKey, language, targetLang, activeMode, appLanguage, analyzeImageTesseract])

  // Dispatcher: vision when a key is set (primary), otherwise prompt for one.
  const analyzeImage = useCallback(async (dataUrl) => {
    if (!dataUrl) return
    if (!apiKey) {
      setSettingsCategory('models'); setSettingsOpen(true)
      setError(`Set your ${providerConfig.label} API key first.`)
      return
    }
    return analyzeImageVision(dataUrl)
  }, [apiKey, providerConfig, analyzeImageVision])

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Alt+Q → Screen capture
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        captureScreen()
      }
      // Escape → Dismiss pin first, then close expanded view
      if (e.key === 'Escape') {
        if (loading) {
          // Cancel ongoing analysis
          cancelRef.current = true
          setLoading(false)
          setStage(screenshot ? 'captured' : 'idle')
          setProgress('')
        } else if (pinnedIdx !== null) {
          dismissPin()
        } else if (expanded) {
          setExpanded(false)
          setHoveredIdx(null)
        } else if (activeTab === 'picture' && stage !== 'idle') {
          // Exit the picture analysis (same as the ✕ / New button)
          reset()
        } else {
          setHoveredIdx(null)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [captureScreen, activeTab, stage, expanded, pinnedIdx, loading, screenshot])

  // Leaving the Picture tab should drop any picture focus (pinned/hovered word, expanded
  // view, open tooltip) so switching to Chat/Study fully focuses the new tab.
  useEffect(() => {
    if (activeTab !== 'picture') {
      setHoveredIdx(null)
      setPinnedIdx(null)
      setExpanded(false)
    }
  }, [activeTab])

  // ─── Paste Handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          // On the Chat tab, paste an image straight into the composer (even from the input).
          if (activeTab === 'chat') {
            e.preventDefault()
            const r = new FileReader()
            r.onload = (ev) => setChatTabImage(ev.target.result)
            r.readAsDataURL(file)
            return
          }
          // Elsewhere → Picture tab, but don't hijack paste while typing in an input.
          if (e.target.tagName === 'INPUT') return
          e.preventDefault()
          loadImageFromFile(file)
          return
        }
      }
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [loadImageFromFile, activeTab])

  // ─── Save study stats to history when session reaches summary ────────────
  useEffect(() => {
    if (studyPhase !== 'summary' || !studyDeck) return
    const totalCards = studyStats.easy + studyStats.good + studyStats.hard + studyStats.again
    if (totalCards === 0) return
    const totalQuestions = studyCardState.reduce((s, cs) => s + (cs.results?.length || 0), 0)
    const correctQuestions = studyCardState.reduce((s, cs) => s + (cs.results?.filter(r => r.correct).length || 0), 0)
    const entry = {
      date: new Date().toISOString().split('T')[0],
      deck: studyDeck,
      mode: activeMode.name,
      cardsStudied: totalCards,
      accuracy: totalQuestions > 0 ? Math.round(correctQuestions / totalQuestions * 100) : 0,
      correct: correctQuestions,
      totalQuestions,
      ratings: { ...studyStats },
    }
    try {
      const history = JSON.parse(localStorage.getItem('screenlens-study-history') || '[]')
      history.unshift(entry)
      localStorage.setItem('screenlens-study-history', JSON.stringify(history.slice(0, 500)))
      console.log('[Stats] saved session:', entry)
    } catch {}
  }, [studyPhase, studyStats, studyCardState, studyDeck])

  // ─── Pull LIVE review stats from Anki when the Stats tab is open ──────────
  // The headline numbers (cards today, 14-day chart, streak) come straight from Anki's
  // review log so they always match Anki. Accuracy here is a pass-rate (% of today's
  // reviewed cards that weren't answered "Again"). Falls back to local history if offline.
  useEffect(() => {
    if (activeTab !== 'stats') return
    let cancelled = false
    ;(async () => {
      const connected = await ankiPing()
      if (cancelled) return
      setAnkiConnected(connected)
      // Keep the last-known (hydrated) numbers visible if Anki is momentarily unreachable —
      // don't wipe to zero on a transient failure.
      if (!connected) return
      try {
        const [today, byDayRaw, todayReviews] = await Promise.all([
          ankiGetNumCardsReviewedToday().catch(() => 0),
          ankiGetNumCardsReviewedByDay().catch(() => []),
          ankiGetTodayReviewStats().catch(() => ({ reviews: 0, passed: 0 })),
        ])
        if (cancelled) return
        const byDay = {}
        ;(byDayRaw || []).forEach((row) => { if (Array.isArray(row)) byDay[row[0]] = row[1] })
        const accuracy = todayReviews.reviews > 0 ? Math.round(todayReviews.passed / todayReviews.reviews * 100) : 0
        const stats = { today: today || 0, byDay, accuracy }
        setAnkiStats(stats)
        try { localStorage.setItem('ebiki-anki-stats', JSON.stringify(stats)) } catch {}
      } catch { /* keep last-known numbers */ }
    })()
    return () => { cancelled = true }
  }, [activeTab])

  // ─── Overlay auto-analyze ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOverlay) return
    const interval = setInterval(() => {
      if (window.__autoAnalyze && stage === 'captured' && !window.__selectionMode) {
        const dataUrl = window.__autoAnalyze
        window.__autoAnalyze = null
        analyzeImage(dataUrl)
      }
    }, 200)
    return () => clearInterval(interval)
  })

  // ─── Drag & Drop ───────────────────────────────────────────────────────────
  const knowledgeOpen = settingsOpen && settingsCategory === 'knowledge'
  const handleDragOver = (e) => {
    // Only react to actual FILE drags — not dragging UI elements/text (e.g. the dock icon),
    // which would otherwise pop the "drop an image" overlay.
    if (!e.dataTransfer || !Array.from(e.dataTransfer.types || []).includes('Files')) return
    e.preventDefault()
    if (knowledgeOpen) return // knowledge dropzone handles text files itself
    setDragging(true)
  }
  const handleDragLeave = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) setDragging(false)
  }
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (!file) return
    console.log('[App] drop event, file:', file.name, 'knowledgeOpen:', knowledgeOpen)
    // Don't handle text/PDF files at app level — they're for knowledge base
    if (file.name.match(/\.(txt|md|pdf)$/i)) {
      // If knowledge section is open, forward the file there
      if (knowledgeOpen) {
        console.log('[App] forwarding text/pdf file to knowledge upload')
        uploadKnowledgeFile(file)
      }
      return
    }
    // On the Chat tab, dropping an image attaches it to the chat composer (not the Picture tab).
    if (activeTab === 'chat' && file.type.startsWith('image/')) {
      const r = new FileReader()
      r.onload = (ev) => setChatTabImage(ev.target.result)
      r.readAsDataURL(file)
      return
    }
    loadImageFromFile(file)
  }

  // ─── Lazy translate on hover for missed words ──────────────────────────────
  const lazyTranslateRef = useRef(new Set()) // track in-flight requests
  const lazyTranslate = useCallback(async (idx) => {
    if (lazyTranslateRef.current.has(idx)) return
    lazyTranslateRef.current.add(idx)
    try {
      const word = ocrWords[idx]
      const context = ocrWords.map((w) => w.text).join(' ')
      const fromLabel = language === 'auto' ? 'Auto-detect' : (LANGS.find((l) => l.code === language)?.label || 'Unknown')
      const toLabel = LANGS.find((l) => l.code === targetLang)?.label || 'English'
      const payload = JSON.stringify({ words: [{ i: idx, w: word.text }], from: fromLabel, to: toLabel, context })
      const text = await aiCall(apiKey, TRANSLATE_PROMPT, payload, resolveModel('picture'))
      if (!text) return
      let parsed = JSON.parse(text.replace(/```json|```/g, '').trim())
      // Get the first translation item regardless of format
      let t = null
      if (Array.isArray(parsed)) t = parsed[0]
      else if (parsed && typeof parsed === 'object') t = Object.values(parsed)[0]
      if (t) {
        setOcrWords((prev) => prev.map((w, i) => i === idx
          ? { ...w, translation: t.t || w.text, synonyms: t.s || [], isEnglish: t.e === true, _untranslated: false }
          : w
        ))
      }
    } catch (err) {
      console.warn('[Ebiki] Lazy translate failed for index', idx, err)
    }
  }, [apiKey, language, ocrWords, providerConfig])

  // ─── Lazy per-word enrichment (vision fast path) ─────────────────────────────
  // On text-dense screens the vision scan returns only core fields (w/t/c/p/line/box) so it
  // finishes fast; sense/alts/synonyms/pronunciation are fetched HERE the first time a word is
  // hovered or clicked. Uses the provider's fast "normal" preset (same rationale as the pose
  // role — it can fire on every hover); the picture-role override still governs the main scan.
  const enrichWordRef = useRef(new Set())
  const enrichWord = useCallback(async (idx) => {
    const word = ocrWords[idx]
    if (!word || !word._needsEnrich || !apiKey) return
    if (enrichWordRef.current.has(idx)) return
    enrichWordRef.current.add(idx)
    try {
      const isLangMode = activeMode?.type === 'language'
      const fromLabel = isLangMode
        ? learnLangName()
        : (language === 'auto' ? 'Auto-detect' : (LANGS.find((l) => l.code === language)?.label || 'Unknown'))
      const toLabel = isLangMode
        ? userLangName()
        : (LANGS.find((l) => l.code === targetLang)?.label || 'English')
      const payload = JSON.stringify({
        word: word.text, translation: word.translation,
        from: fromLabel, to: toLabel, context: ocrWords.map((w) => w.text).join(' '),
      })
      const text = await aiCall(apiKey, WORD_ENRICH_PROMPT, payload, resolveModelFast('picture'))
      const parsed = parseAiJson(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        setOcrWords((prev) => prev.map((w, i) => i === idx
          ? {
              ...w,
              sense: parsed.sense || w.sense,
              alts: Array.isArray(parsed.alts) ? parsed.alts.filter(Boolean).map(String).slice(0, 3) : w.alts,
              synonyms: Array.isArray(parsed.s) ? parsed.s : w.synonyms,
              pronunciation: parsed.r || w.pronunciation,
              _needsEnrich: false,
            }
          : w))
      }
    } catch (err) {
      enrichWordRef.current.delete(idx) // allow a retry on the next hover
      console.warn('[Ebiki] Word enrichment failed for index', idx, err)
    }
  }, [apiKey, ocrWords, activeMode, appLanguage, language, targetLang])

  // ─── Hover & Pin Handlers ───────────────────────────────────────────────────
  // The body has CSS zoom (1.35) in normal mode. position:fixed tooltips are sized/placed
  // in layout px, but getBoundingClientRect()/clientX report real px — divide by this to
  // convert real → layout px so tooltips land where the cursor/word actually is.
  const getZoom = () => (parseFloat(document.body.style.zoom) || 1)

  const handleWordHover = (idx, e) => {
    if (pinnedIdx !== null) return // don't override pinned tooltip
    setHoveredIdx(idx)
    const z = getZoom()
    const rect = e.currentTarget.getBoundingClientRect()
    const vw = window.innerWidth / z
    const ttHalf = 160 // ~half of tooltip maxWidth (300/2 + margin)
    let x = (rect.left + rect.width / 2) / z
    let y = rect.top / z - 6
    let anchor = 'above'
    // If not enough room above the word, show below
    if (rect.top / z < 180) {
      y = rect.bottom / z + 6
      anchor = 'below'
    }
    // Clamp horizontal so tooltip doesn't clip left/right edges
    x = Math.max(ttHalf, Math.min(vw - ttHalf, x))
    setTooltipPos({ x, y, anchor })
    if (ocrWords[idx]?._untranslated) lazyTranslate(idx)
    if (ocrWords[idx]?._needsEnrich) enrichWord(idx)
  }

  const handleWordLeave = () => {
    if (pinnedIdx !== null) return
    setHoveredIdx(null)
  }

  const handleWordClick = (idx, e) => {
    e.stopPropagation()
    if (pinnedIdx === idx) {
      dismissPin()
    } else {
      // Pin this word
      setPinnedIdx(idx)
      setHoveredIdx(idx)
      setExplanation(null)
      setDeepExplanation(null)
      setWordStudy(null); setConjugation(null)
      setAnkiCard(null); setAnkiError(null); setAnkiEditing(false); setAnkiRefineInput('')
      setChatMessages([])
      setChatInput('')
      const z = getZoom()
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipPos({ x: (rect.left + rect.width / 2) / z, y: rect.top / z - 6 })
      // In area-select overlay (small window), expand to full screen so tooltip has room
      if (isOverlay && areaSelectBounds && window.overlayAPI?.resizeWindow) {
        window.overlayAPI.resizeWindow({ x: 0, y: 0, width: screen.width, height: screen.height })
        // Default tooltip position: to the right of the selection area, or use saved pos
        if (!pinnedTooltipPos) {
          const selRight = areaSelectBounds.x + areaSelectBounds.width
          setPinnedTooltipPos({
            x: selRight + 20 < screen.width - 400 ? selRight + 20 : Math.max(10, areaSelectBounds.x - 420),
            y: areaSelectBounds.y,
          })
        }
      } else if (!pinnedTooltipPos) {
        setPinnedTooltipPos({ x: Math.max(10, rect.left / z - 100), y: Math.max(10, rect.bottom / z + 10) })
      }
      // Lazy translate if in click mode and word hasn't been translated yet
      if (ocrWords[idx]?._untranslated) lazyTranslate(idx)
      if (ocrWords[idx]?._needsEnrich) enrichWord(idx)
    }
  }

  const dismissPin = () => {
    setPinnedIdx(null)
    setExplanation(null)
    setDeepExplanation(null)
    setWordStudy(null); setConjugation(null)
    setAnkiCard(null); setAnkiError(null); setAnkiEditing(false); setAnkiRefineInput('')
    setChatMessages([])
    setChatInput('')
    setHoveredIdx(null)
    // In area-select overlay, shrink window back to selection bounds
    if (isOverlay && areaSelectBounds && window.overlayAPI?.resizeWindow) {
      window.overlayAPI.resizeWindow(areaSelectBounds)
    }
  }

  // ─── Draggable pinned tooltip ─────────────────────────────────────────────
  const handleTooltipDragStart = (e) => {
    e.preventDefault()
    const el = e.currentTarget.closest('[data-tooltip-pinned]')
    if (!el) return
    const rect = el.getBoundingClientRect()
    // Work entirely in layout px (left/top are layout px; clientX/rect are real px).
    const zoom = el.offsetWidth ? ((rect.width / el.offsetWidth) || 1) : getZoom()
    tooltipDragRef.current = { offsetX: (e.clientX - rect.left) / zoom, offsetY: (e.clientY - rect.top) / zoom, zoom }
    const onMove = (ev) => {
      if (!tooltipDragRef.current) return
      const { offsetX, offsetY, zoom } = tooltipDragRef.current
      const x = ev.clientX / zoom - offsetX
      const y = ev.clientY / zoom - offsetY
      setPinnedTooltipPos({ x, y })
    }
    const onUp = () => {
      tooltipDragRef.current = null
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      // Save position
      setPinnedTooltipPos(prev => {
        if (prev) localStorage.setItem('screenlens-tooltip-pos', JSON.stringify(prev))
        return prev
      })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // ─── Explain Word (short, auto-triggered on pin) ───────────────────────────
  const getContext = () => ocrWords.map((w) => w.text).join(' ')

  const autoExplain = useCallback(async (word) => {
    if (!apiKey) return
    setExplaining(true)
    setExplanation(null)
    try {
      const prompt = activeMode.type === 'language'
        ? `Word: "${word.text}" (translated: "${word.translation}")
Context: "${getContext()}"

In 1-2 short sentences: what does "${word.text}" mean here and what part of speech is it? No markdown.`
        : `Term: "${word.text}"
Context: "${getContext()}"
Study subject: ${activeMode.description || activeMode.name}${knowledgeBlock(4000)}

In 1-2 short sentences: explain "${word.text}" in the context of ${activeMode.name}. No markdown.`
      const text = await aiCall(apiKey, activeMode.type === 'language' ? 'You are a concise language tutor. Answer in 1-2 sentences max.' : `You are a concise ${activeMode.name} tutor. Answer in 1-2 sentences max.`, prompt, resolveModel('picture'))
      setExplanation(text)
    } catch (err) {
      setExplanation('Failed: ' + err.message)
    } finally {
      setExplaining(false)
    }
  }, [apiKey, ocrWords, providerConfig])

  // ─── Anki Connection & Card Sync ─────────────────────────────────────────
  const refreshAnkiConnection = async () => {
    console.log('[Anki] refreshing connection...')
    setAnkiConnected(null)
    const ok = await ankiPing()
    setAnkiConnected(ok)
    if (ok) {
      const decks = await ankiGetDecks().catch(() => [])
      setAnkiDecks(decks)
      console.log('[Anki] connected, decks:', decks)
      // NEVER auto-write a default deck into the mode config here. This used to persist decks[0]
      // whenever the saved deck wasn't in the list — but on a fresh load this can run BEFORE the
      // modes load (activeMode is still the placeholder with deck ''), permanently clobbering the
      // user's chosen deck with whatever deck happens to be first. A missing/unset deck is handled
      // non-persistently at session start (`ankiDeck || decks[0]`) and by the pickers.
      if (decks.length > 0 && ankiDeck && !decks.includes(ankiDeck)) {
        console.log('[Anki] saved deck not found in Anki (left unchanged):', ankiDeck)
      }
    } else {
      console.log('[Anki] not connected')
    }
  }

  // Shared card builder — turns a term into templated { front, back, tags } using the
  // active mode's format. Used by both the Picture-tab flow and Discover Mode. Pure: it
  // does not touch UI state, so callers control loading/preview/error handling.
  // ── Card generator (shared by Deck Quick-Add and Chat) ───────────────────────
  // Bold the leading "Label:" of each line and join with <br> for clean HTML in Anki's Back field.
  // Matches a label in ANY script (German umlauts, Chinese, etc.), up to the first colon (≤30 chars).
  const cardBackToHtml = (back) => String(back || '').split('\n').map((line) => {
    const m = line.match(/^([^:\n]{1,30}):(.*)$/)
    return m ? `<b>${m[1]}:</b>${m[2]}` : line
  }).join('<br>')

  // The language the active mode is teaching (Spanish, German, Chinese…) and the user's own language.
  const learnLangName = () => activeMode.studyRules?.studyLanguage || (LANGS.find((l) => l.code === language)?.label) || activeMode.name || 'the target language'
  const userLangName = () => APP_LANG_NAME[appLanguage] || 'English'
  // The language Ebi SPEAKS in (questions, hints, feedback, tutor chat). NEVER static:
  // - language modes → the "Ebi speaks" quizLanguage, falling back to the learned language;
  // - general modes  → the "Ebi speaks" quizLanguage too (so music theory can be quizzed in
  //   Spanish), falling back to the user's app language. General modes still never turn into a
  //   language course — Ebi just PHRASES everything in that language.
  const interactionLangName = (rules) => {
    const r = rules || activeMode.studyRules || defaultStudyRules
    if (activeMode.type === 'language') return r.quizLanguage || r.studyLanguage || learnLangName()
    return r.quizLanguage || userLangName()
  }

  // Second-pass proofreader: cards get MEMORIZED, so a wrong word/translation is unacceptable.
  // Sends the generated cards back to the model to find and FIX errors before the user sees them.
  const verifyCards = async (cards, subjectLabel) => {
    if (!cards.length) return cards
    try {
      const prompt = `You are a meticulous ${subjectLabel} teacher proofreading flashcards a student will MEMORIZE. Accuracy is critical, a single error is harmful. For EACH card object, carefully verify and FIX any error: a headword that does NOT exist or is misspelled (replace it with the correct word), wrong part of speech or grammatical gender, incorrect pronunciation, wrong/missing translation, wrong synonyms, an incorrect or unnatural definition, and an example sentence that is wrong, unnatural, or mistranslated. Leave correct fields exactly as they are. Return the corrected JSON array with the SAME keys and structure. Output ONLY the JSON array, no commentary.`
      const text = await aiCall(apiKey, prompt, JSON.stringify(cards), resolveModel('deck'))
      const parsed = parseAiJson(text)
      const arr = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.cards) ? parsed.cards : null)
      return (arr && arr.length) ? arr : cards
    } catch { return cards }
  }

  // Generate one or more cards per input word. Language modes use the language-agnostic prompt (the
  // model writes labels in the learned language); other modes get the mode's OWN card design —
  // description, back template and tag rules (all generated per-subject by createMode) — so every
  // batch produces consistent cards instead of an AI-improvised format each time.
  // Every card is proofread (verifyCards) before return. Returns [{ front, back, tags, _rich }].
  const generateCards = async (words) => {
    const list = (Array.isArray(words) ? words : [words]).map((w) => String(w).trim()).filter(Boolean)
    if (!list.length) return []
    const isLang = activeMode.type === 'language'
    let prompt
    if (isLang) {
      prompt = LANGUAGE_CARD_PROMPT.replace(/\{LEARN_LANG\}/g, learnLangName()).replace(/\{USER_LANG\}/g, userLangName())
    } else {
      const desc = activeMode.description ? `\nMode description: ${activeMode.description}` : ''
      const backTpl = String(activeMode.backTemplate || '')
      // A real template (has {placeholders}) locks the back's structure; otherwise the model designs it.
      const format = backTpl.includes('{')
        ? `\n  This mode has a FIXED card format — follow it. Fill each {placeholder} with content for the term, keep the labels and line order exactly (drop a line ONLY if it truly doesn't apply to that term):\n${backTpl.split('\n').map((l) => `    ${l}`).join('\n')}`
        : ' Choose whatever labels best teach this subject, and keep them consistent across all cards.'
      const tagRules = activeMode.tagRules ? `\n  TAG RULES for this mode:\n${activeMode.tagRules.split('\n').map((l) => `    ${l}`).join('\n')}` : ''
      prompt = GENERIC_CARD_PROMPT
        .replace('{MODE}', () => activeMode.name)
        .replace('{TYPE}', () => activeMode.type)
        .replace('{DESCRIPTION}', () => desc)
        .replace('{FORMAT}', () => format)
        .replace('{TAG_RULES}', () => tagRules)
    }
    const text = await aiCall(apiKey, prompt + await getKnowledgeContext(`Generating flashcards for these ${activeMode.name} terms: ${list.join(', ')}`), JSON.stringify({ words: list }), resolveModel('deck'))
    const parsed = parseAiJson(text)
    let arr = (Array.isArray(parsed) ? parsed : (parsed ? [parsed] : [])).filter((c) => c && (c.front || c.word))
    arr = await verifyCards(arr, isLang ? learnLangName() : (activeMode.description ? `${activeMode.name} (${activeMode.description})` : activeMode.name))
    return arr.filter((c) => c && (c.front || c.word)).map((c) => ({
      front: c.front || c.word || '',
      back: c.back || '',
      tags: Array.isArray(c.tags) && c.tags.length ? c.tags : ['ebiki'],
      correction: c.correction || '',
      _rich: c,
    }))
  }

  const buildCardFields = async ({ term, partOfSpeech = '', translation = '', contextText = '' }) => {
    const srcLang = LANGS.find((l) => l.code === language)?.label || 'the source language'
    const tgtLang = LANGS.find((l) => l.code === targetLang)?.label || 'English'
    const fmt = ankiFormat

    // Build the AI prompt based on which fields are enabled (dynamic)
    const fieldDescriptions = {
      pronunciation: `pronunciation guide in English phonetics (e.g. "KAH-lee-do"), include gender variants if applicable`,
      translation: `translation to ${tgtLang}`,
      synonyms: `comma-separated synonyms in ${tgtLang}, grouped by meaning if multiple`,
      definition: activeMode.type === 'language'
        ? `definition in ${srcLang} (the source language, not ${tgtLang})`
        : `clear, concise definition`,
      example: activeMode.type === 'language'
        ? `example sentence in ${srcLang} using the word in context, followed by (${tgtLang} translation in parentheses)`
        : `practical example or scenario illustrating this concept`,
    }
    const fieldRequests = []
    Object.entries(fmt.fields).forEach(([field, enabled]) => {
      if (!enabled) return
      const hint = fieldDescriptions[field] || `${field} - provide relevant content for this field`
      fieldRequests.push(`"${field}": ${hint}`)
    })
    // Add tag generation
    const tagInstruction = fmt.tagRules
      ? `"tags": array of tag strings. Rules:\n${fmt.tagRules}`
      : `"tags": array of relevant lowercase tags (include "screenlens")`
    fieldRequests.push(tagInstruction)

    const modeContext = activeMode.type === 'language'
      ? `Source language: ${srcLang}${translation ? `\nTranslation: ${translation}` : ''}`
      : `Study subject: ${activeMode.description || activeMode.name}`

    const prompt = `Generate an Anki flashcard for the ${activeMode.type === 'language' ? 'word' : 'term'} "${term}" (${partOfSpeech || 'unknown'}).
${modeContext}
Context: "${contextText}"

Return a JSON object with these fields:
${fieldRequests.map((f) => `- ${f}`).join('\n')}

Output ONLY raw JSON. No markdown, no backticks.`

    console.log('[Anki] generating card with AI...')
    const text = await aiCall(apiKey, 'You generate Anki flashcard content. Always respond with valid JSON only.', prompt, resolveModel('deck'))
    const cardData = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
    console.log('[Anki] AI card data:', cardData)

    // Dynamic template replacement
    const replacements = {
      word: term, term,
      partOfSpeech: partOfSpeech || '',
      ...cardData,
    }
    // Remove tags from replacements (it's an array, not a template field)
    const aiTags = cardData.tags
    delete replacements.tags

    let front = fmt.frontTemplate
    let back = fmt.backTemplate
    Object.entries(replacements).forEach(([key, val]) => {
      const re = new RegExp(`\\{${key}\\}`, 'g')
      front = front.replace(re, String(val || ''))
      back = back.replace(re, String(val || ''))
    })

    const tags = Array.isArray(aiTags) && aiTags.length > 0 ? aiTags : ['screenlens']
    console.log('[Anki] card generated', { front, back, tags })
    return { front, back, tags }
  }

  const generateAnkiCard = async (word) => {
    if (!apiKey || ankiGenerating) return
    setAnkiGenerating(true)
    setAnkiError(null)
    setAnkiCard(null)
    setAnkiEditing(false)
    setAnkiRefineInput('')
    // Re-check Anki connection so the status is fresh (user may have opened Anki since last check)
    const connected = await ankiPing()
    setAnkiConnected(connected)
    if (connected) {
      const decks = await ankiGetDecks().catch(() => [])
      setAnkiDecks(decks)
    }
    try {
      const contextText = ocrWords.map((w) => w.text).join(' ')
      const card = await buildCardFields({
        term: word.text,
        partOfSpeech: word.partOfSpeech,
        translation: word.translation,
        contextText,
      })
      setAnkiCard(card)
    } catch (err) {
      console.error('[Anki] card generation failed:', err.message)
      setAnkiError('Card generation failed: ' + err.message)
    } finally {
      setAnkiGenerating(false)
    }
  }

  const refineAnkiCard = async () => {
    const instruction = ankiRefineInput.trim()
    if (!instruction || !ankiCard || !apiKey || ankiRefining) return
    setAnkiRefining(true)
    setAnkiError(null)
    try {
      const prompt = `Here is an Anki flashcard:

FRONT:
${ankiCard.front}

BACK:
${ankiCard.back}

TAGS: ${(ankiCard.tags || []).join(', ')}

The user wants this change: "${instruction}"

Return a JSON object with the updated card: { "front": "...", "back": "...", "tags": [...] }
Keep any fields the user didn't ask to change. Output ONLY raw JSON, no markdown or backticks.`

      const text = await aiCall(apiKey, 'You edit Anki flashcard content. Always respond with valid JSON only.', prompt, resolveModel('deck'))
      const updated = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      setAnkiCard({
        front: updated.front || ankiCard.front,
        back: updated.back || ankiCard.back,
        tags: Array.isArray(updated.tags) ? updated.tags : ankiCard.tags,
      })
      setAnkiRefineInput('')
    } catch (err) {
      setAnkiError('Refine failed: ' + err.message)
    } finally {
      setAnkiRefining(false)
    }
  }

  // Always-current mirrors for async writers. A background task (chat-suggestion backfill,
  // Discover category generation) that resolves AFTER a mode switch must never write with its
  // stale closure: routing through saveModes used to re-assert the OLD activeModeId, flipping
  // the app back to the previous mode — the "blinks through several configs" bug.
  const modesRef = useRef(modes)
  const activeModeIdRef = useRef(activeModeId)
  useEffect(() => { modesRef.current = modes }, [modes])
  useEffect(() => { activeModeIdRef.current = activeModeId }, [activeModeId])

  const saveModes = (modeList, activeId) => {
    const id = activeId || activeModeIdRef.current
    modesRef.current = modeList
    activeModeIdRef.current = id
    setModes(modeList)
    setActiveModeId(id)
    const payload = { modes: modeList, activeModeId: id }
    fetch('/api/modes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {})
    console.log('[Mode] saved', payload)
  }

  // Update ONE mode's config without ever touching which mode is active — safe to call from
  // async completions. Reads/writes through the refs so late writers can't clobber changes
  // made after their closure was captured.
  const updateModeById = (modeId, updates) => {
    const updated = modesRef.current.map((m) => (m.id === modeId ? { ...m, ...updates } : m))
    modesRef.current = updated
    setModes(updated)
    fetch('/api/modes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ modes: updated, activeModeId: activeModeIdRef.current }),
    }).catch(() => {})
  }

  const updateActiveMode = (updates) => updateModeById(activeModeIdRef.current, updates)

  // Per-mode chat composer preferences (focus / level / explain language).
  const setChatPref = (k, v) => updateActiveMode({ chatPrefs: { ...(activeMode.chatPrefs || {}), [k]: v } })

  const deleteMode = (id) => {
    if (modes.length <= 1) return
    const updated = modes.filter((m) => m.id !== id)
    const newActiveId = id === activeModeId ? updated[0].id : activeModeId
    saveModes(updated, newActiveId)
  }

  const renameMode = (id, newName) => {
    const trimmed = newName.trim()
    if (!trimmed) { setEditingModeName(null); return }
    // Check for name conflict
    const conflict = modes.find((m) => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase())
    if (conflict) {
      alert(`A mode named "${trimmed}" already exists.`)
      setEditingModeName(null)
      return
    }
    const updated = modes.map((m) =>
      m.id === id ? { ...m, name: trimmed } : m
    )
    saveModes(updated)
    setEditingModeName(null)
  }

  const addDefaultMode = () => {
    let name = 'Language Learning'
    let suffix = 0
    const existingNames = modes.map((m) => m.name.toLowerCase())
    while (existingNames.includes(name.toLowerCase())) {
      suffix++
      name = `Language Learning-${suffix}`
    }
    const newId = Math.max(0, ...modes.map((m) => m.id)) + 1
    const newMode = { ...defaultMode, id: newId, name }
    saveModes([...modes, newMode], newId)
  }

  // ─── Deck Browser ──────────────────────────────────────────────────────
  const handleAddDeck = async () => {
    const name = deckBrowserAddName.trim()
    if (!name) return
    setDeckBrowserAddLoading(true)
    try {
      await ankiCreateDeck(name)
      const decks = await ankiGetDecks().catch(() => [])
      setAnkiDecks(decks)
      const purpose = deckBrowserAddPurpose.trim()
      if (purpose) {
        const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
        const sigWords = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(w => w.length > 2)
        const purposeNorm = norm(purpose)
        const purposeWords = new Set(sigWords(purpose))
        const existing = modes.find(m => {
          const mn = norm(m.name)
          if (mn === purposeNorm || mn.includes(purposeNorm) || purposeNorm.includes(mn)) return true
          return sigWords(m.name).some(w => purposeWords.has(w))
        })
        if (existing) {
          saveModes(modes.map(m => m.id === existing.id ? { ...m, ankiDeck: name } : m), existing.id)
        } else {
          await createMode(purpose, name)
        }
      }
      setDeckBrowserDeck(name)
      loadDeckNotes(name)
      setDeckBrowserAddPanel(false)
      setDeckBrowserAddName('')
      setDeckBrowserAddPurpose('')
    } catch (e) {
      window.alert('Failed to create deck: ' + (e.message || e))
    } finally {
      setDeckBrowserAddLoading(false)
    }
  }

  const openDeckBrowser = async () => {
    if (!ankiConnected) return
    const decks = await ankiGetDecks().catch(() => [])
    setAnkiDecks(decks)
    const deck = ankiDeck || decks[0] || ''
    setDeckBrowserDeck(deck)
    setDeckBrowserActive(true)
    setDeckBrowserNotes([])
    if (deck) loadDeckNotes(deck)
  }

  const loadDeckNotes = async (deck) => {
    setDeckBrowserLoading(true)
    setDeckBrowserEditing(null)
    try {
      const noteIds = await ankiFindNotes(`deck:"${deck}"`)
      const notes = noteIds.length > 0 ? await ankiNotesInfo(noteIds) : []
      // Fetch card-level scheduling stats so we can sort by studied/lapses/interval.
      // Aggregated per note across its cards; failures here don't block the listing.
      try {
        const allCardIds = notes.flatMap((n) => n.cards || [])
        if (allCardIds.length > 0) {
          const cardsInfo = await ankiCardsInfo(allCardIds)
          const byId = {}
          cardsInfo.forEach((c) => { byId[c.cardId] = c })
          notes.forEach((n) => {
            const cs = (n.cards || []).map((id) => byId[id]).filter(Boolean)
            if (cs.length === 0) { n.stats = null; return }
            n.stats = {
              interval: Math.max(...cs.map((c) => c.interval || 0)),
              reps: cs.reduce((s, c) => s + (c.reps || 0), 0),
              lapses: cs.reduce((s, c) => s + (c.lapses || 0), 0),
              mod: Math.max(...cs.map((c) => c.mod || 0)), // last modified ≈ last studied (seconds)
            }
          })
        }
      } catch (e) {
        console.warn('[Deck] card stats unavailable:', e.message)
      }
      setDeckBrowserNotes(notes)
      console.log('[Deck] loaded', notes.length, 'notes from:', deck)
    } catch (err) {
      console.error('[Deck] load failed:', err.message)
    } finally {
      setDeckBrowserLoading(false)
    }
  }

  const startEditNote = (note) => {
    const fields = {}
    // Convert HTML to plain text for editing (br → newline)
    Object.entries(note.fields).forEach(([name, f]) => {
      fields[name] = f.value.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')
    })
    setDeckBrowserEditing(note.noteId)
    setDeckBrowserEditFields(fields)
    setDeckBrowserRefineInput('')
  }

  const saveEditNote = async (noteId) => {
    // Convert newlines back to <br> for Anki
    const htmlFields = {}
    Object.entries(deckBrowserEditFields).forEach(([name, val]) => {
      htmlFields[name] = val.replace(/\n/g, '<br>')
    })
    setDeckBrowserSaveStatus('saving')
    try {
      await ankiUpdateNote(noteId, htmlFields)
      ankiSync().catch(() => {})
      // Reload
      await loadDeckNotes(deckBrowserDeck)
      setDeckBrowserEditing(null)
      setDeckBrowserSaveStatus('saved')
      setTimeout(() => setDeckBrowserSaveStatus(null), 2000)
      console.log('[Deck] note updated:', noteId)
    } catch (err) {
      setDeckBrowserSaveStatus('error')
      console.error('[Deck] update failed:', err.message)
    }
  }

  const refineDeckBrowserCard = async () => {
    const instruction = deckBrowserRefineInput.trim()
    if (!instruction || !apiKey || deckBrowserRefining || !deckBrowserEditing) return
    setDeckBrowserRefining(true)
    try {
      const fieldsDesc = Object.entries(deckBrowserEditFields).map(([name, val]) => `${name}:\n${val}`).join('\n\n')
      const prompt = `Here is an Anki flashcard:\n\n${fieldsDesc}\n\nThe user wants this change: "${instruction}"\n\nReturn a JSON object with the updated fields: { ${Object.keys(deckBrowserEditFields).map(k => `"${k}": "..."`).join(', ')} }\nKeep any fields the user didn't ask to change. Output ONLY raw JSON, no markdown or backticks.`

      const text = await aiCall(apiKey, 'You edit Anki flashcard content. Always respond with valid JSON only.', prompt, resolveModel('deck'))
      const updated = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      const newFields = { ...deckBrowserEditFields }
      Object.entries(updated).forEach(([k, v]) => { if (k in newFields) newFields[k] = String(v) })
      setDeckBrowserEditFields(newFields)
      setDeckBrowserRefineInput('')
    } catch (err) {
      console.error('[Deck] refine failed:', err.message)
    } finally {
      setDeckBrowserRefining(false)
    }
  }

  // Copy (new note in the target deck, same model/fields/tags) or move (cards change deck,
  // scheduling state travels along) a browser card. Lets a user build a dedicated deck —
  // e.g. one just for PBQ practice — out of existing cards.
  const copyOrMoveNote = async (note, targetDeck, move = false) => {
    if (!targetDeck || targetDeck === deckBrowserDeck) return
    setDeckBrowserCopyStatus('working')
    try {
      if (move) {
        const cardIds = await ankiFindCards(`nid:${note.noteId}`)
        await ankiChangeDeck(cardIds, targetDeck)
        setDeckBrowserNotes(prev => prev.filter(n => n.noteId !== note.noteId))
      } else {
        const fields = {}
        Object.entries(note.fields).forEach(([name, f]) => { fields[name] = f.value })
        await ankiCopyNote(targetDeck, note.modelName, fields, note.tags || [])
      }
      ankiSync().catch(() => {})
      setDeckBrowserCopyStatus(move ? 'moved' : 'copied')
      setTimeout(() => { setDeckBrowserCopyStatus(null); setDeckBrowserCopying(null) }, 1400)
      console.log('[Deck] note', move ? 'moved' : 'copied', 'to:', targetDeck)
    } catch (err) {
      console.error('[Deck] copy/move failed:', err.message)
      setDeckBrowserCopyStatus('error')
    }
  }

  // Reset a card's STUDY PROGRESS (scheduling only — content untouched): forgetCards turns it
  // back into a NEW card. The remedy for schedules inflated by the old duplicate-sync bug.
  const resetNoteProgress = async (note, front) => {
    if (!window.confirm(`Reset all study progress for "${front}"?\n\nThe card becomes NEW again — its interval and scheduling history are wiped (the card's content is not touched). This cannot be undone.`)) return
    try {
      const cardIds = await ankiFindCards(`nid:${note.noteId}`)
      if (cardIds.length === 0) throw new Error('no cards found for this note')
      await ankiForgetCards(cardIds)
      ankiSync().catch(() => {})
      await loadDeckNotes(deckBrowserDeck) // refresh the scheduling badges
      console.log('[Deck] progress reset for note', note.noteId)
    } catch (err) {
      console.error('[Deck] progress reset failed:', err.message)
      setDeckBrowserSaveStatus('error')
    }
  }

  const deleteNote = async (noteId) => {
    try {
      await ankiDeleteNotes([noteId])
      ankiSync().catch(() => {})
      setDeckBrowserNotes((prev) => prev.filter((n) => n.noteId !== noteId))
      console.log('[Deck] note deleted:', noteId)
    } catch (err) {
      console.error('[Deck] delete failed:', err.message)
    }
  }

  const closeDeckBrowser = () => {
    // Sync any edited notes back into the active study session
    if (deckBrowserNotes.length > 0 && studyAllCards.length > 0) {
      const noteMap = {}
      deckBrowserNotes.forEach(n => { noteMap[n.noteId] = n })
      const updatedAllCards = studyAllCards.map(card => {
        const updatedNote = noteMap[card.note]
        return updatedNote ? { ...card, fields: updatedNote.fields } : card
      })
      setStudyAllCards(updatedAllCards)
      setStudyCardState(prev => prev.map(cs => {
        const card = updatedAllCards.find(c => c.cardId === cs.cardId)
        if (!card || !noteMap[card.note]) return cs
        return { ...cs, front: getCardFront(card), back: getCardBack(card) }
      }))
    }
    setDeckBrowserActive(false)
    setDeckBrowserNotes([])
    setDeckBrowserEditing(null)
    setDeckBrowserSearch('')
  }

  // ─── Deck Analyze (find ambiguous cards, propose fixes) ────────────────
  const analyzeDeck = async () => {
    if (deckBrowserNotes.length === 0 || !apiKey || deckAnalyzeLoading) return
    // Soft limit: very large decks may exceed the model's context or cost a lot. Confirm before proceeding.
    if (deckBrowserNotes.length > 200) {
      const ok = window.confirm(
        `This deck has ${deckBrowserNotes.length} cards. Analyzing them all in one AI call may be slow ` +
        `or hit token limits. Continue anyway?`
      )
      if (!ok) return
    }
    setDeckAnalyzeLoading(true)
    setDeckAnalyzeError(null)
    setDeckAnalyzeEmpty(false)
    setDeckAnalyzeSkipped(0)
    try {
      const rules = activeMode.studyRules || defaultStudyRules
      const studyLang = rules.studyLanguage || 'English'

      // Preserve line breaks for the AI (br → \n) so it sees the actual structure of multi-line backs.
      const htmlToPlain = (v) => String(v || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
      const cards = deckBrowserNotes.map((n) => ({
        noteId: n.noteId,
        fields: Object.fromEntries(
          Object.entries(n.fields).map(([name, f]) => [name, htmlToPlain(f.value)])
        ),
      }))

      const frontFieldName = Object.keys(cards[0]?.fields || {})[0] || 'Front'
      // Frame the analysis by what the deck actually IS: language decks look for words with multiple
      // everyday meanings; any other subject looks for underspecified/ambiguous CONCEPT cards.
      const isLangDeck = activeMode.type === 'language'
      const analyzeFraming = isLangDeck
        ? `You are analyzing flashcards in a ${studyLang} learning deck. Find cards where the ${studyLang} word/phrase has MULTIPLE distinct everyday meanings that the card's current content does NOT disambiguate.\n\nFor each ambiguous card, propose updated field content that clarifies the intended meaning — e.g. specify the domain, add a usage example, or list the senses with a short note for each.\n\nDO NOT flag cards where:\n- The word has only one common meaning\n- The current content already disambiguates well\n- A learner would clearly understand from common usage`
        : `You are analyzing flashcards in a "${activeMode.name}" study deck${activeMode.description ? ` (${activeMode.description})` : ''}. Find cards that are AMBIGUOUS or UNDERSPECIFIED for this subject: a term whose intended sense isn't pinned down, a vague or incomplete definition, a front that several different concepts could answer, or missing context that makes the card hard to study.\n\nFor each such card, propose updated field content that pins the intended meaning — specify the domain/context, tighten the definition, or add a clarifying example that fits the subject.\n\nDO NOT flag cards where:\n- The content is already specific and unambiguous\n- A student of this subject would clearly understand it as written`
      const fieldLangRule = isLangDeck
        ? `Match each field's language (replace a ${studyLang} field with ${studyLang} content; replace an English field with English content).`
        : `Keep each field in the language it is already written in.`
      const prompt = `${analyzeFraming}\n\nCards (JSON):\n${JSON.stringify(cards)}\n\nReturn a JSON array — ONLY include cards that need fixing (skip the rest):\n[\n  {\n    "noteId": <number>,\n    "front": "<exact verbatim value of the card's "${frontFieldName}" field, copied character-for-character>",\n    "reason": "<one short sentence: what is ambiguous>",\n    "recommendedFields": { "<fieldName>": "<new content>", ... }\n  }\n]\n\nCRITICAL: "noteId" and "front" MUST identify the SAME card. Copy the "front" value verbatim from that exact card's data above — never paraphrase it, never use a different card's word, and double-check that the recommendedFields you write are for that same card. If you cannot be certain a noteId and its front match, omit that card.\n\nIn recommendedFields, include ONLY fields you're changing (typically just the back). ${fieldLangRule} Use plain text with newlines for line breaks (no HTML, no <br>).\n\nOutput ONLY raw JSON. No markdown, no commentary.`

      const text = await aiCall(apiKey, 'You analyze flashcard quality. Always respond with valid JSON only.', prompt, resolveModel('deck'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      if (!Array.isArray(parsed)) throw new Error('Response is not an array')

      // Front (first field by order) of a note, as normalized plain text — used to
      // verify the AI's recommendation actually belongs to the card it names.
      const frontOf = (note) => {
        const first = Object.entries(note.fields).sort(([, a], [, b]) => a.order - b.order)[0]
        return htmlToPlain(first?.[1]?.value || '').toLowerCase()
      }

      let mismatchDropped = 0
      const recs = parsed.map((r) => {
        if (!r.recommendedFields || typeof r.recommendedFields !== 'object') return null
        const noteId = typeof r.noteId === 'string' ? Number(r.noteId) : r.noteId
        const byId = deckBrowserNotes.find((n) => n.noteId === noteId)
        const echoedFront = htmlToPlain(r.front || '').toLowerCase()

        // INTEGRITY GUARD: the AI must identify a card by BOTH its noteId and its
        // verbatim front, and the two must resolve to the SAME card. The model can
        // scramble these (attach card A's fix to card B's id); if that happens we
        // would otherwise show — and on save, WRITE — one card's content onto
        // another. So we cross-check and DROP any rec we cannot match unambiguously.
        let note = null
        if (echoedFront) {
          const frontMatches = deckBrowserNotes.filter((n) => frontOf(n) === echoedFront)
          if (frontMatches.length === 1) {
            // Unique front match. If a noteId was also given, it must agree.
            if (byId && byId.noteId !== frontMatches[0].noteId) { mismatchDropped++; console.warn('[Deck] analyze: noteId/front disagree, dropping', { noteId, echoedFront, idFront: byId && frontOf(byId) }); return null }
            note = frontMatches[0]
          } else if (frontMatches.length > 1) {
            // Duplicate fronts: disambiguate strictly by the given noteId.
            note = frontMatches.find((n) => n.noteId === noteId) || null
            if (!note) { mismatchDropped++; console.warn('[Deck] analyze: ambiguous front, no id match, dropping', { noteId, echoedFront }); return null }
          } else {
            // Front matches nothing in the deck — the AI invented/mismatched it.
            mismatchDropped++; console.warn('[Deck] analyze: front not found in deck, dropping', { noteId, echoedFront }); return null
          }
        } else if (byId) {
          // Backward-compat: no front echoed. Trust the id alone (older models).
          note = byId
        }
        if (!note) { mismatchDropped++; console.warn('[Deck] analyze: unresolved card, dropping', { noteId, echoedFront }); return null }

        const currentFields = Object.fromEntries(
          Object.entries(note.fields).map(([name, f]) => [name, htmlToPlain(f.value)])
        )
        const recommendedFields = { ...currentFields }
        Object.entries(r.recommendedFields).forEach(([k, v]) => {
          if (k in recommendedFields) recommendedFields[k] = String(v ?? '')
        })
        // Skip if AI flagged the card but didn't actually propose any changes.
        const hasChange = Object.keys(recommendedFields).some((k) => recommendedFields[k] !== currentFields[k])
        if (!hasChange) return null
        // Final assertion: noteId we will write to MUST be this resolved card's id.
        return {
          noteId: note.noteId,
          reason: r.reason || '',
          currentFields,
          recommendedFields,
          refineInput: '',
          refining: false,
          accepted: false,
        }
      }).filter(Boolean)

      setDeckAnalyzeRecs(recs)
      setDeckAnalyzeSkipped(mismatchDropped)
      setDeckAnalyzeEmpty(recs.length === 0)
      console.log('[Deck] analyzed,', recs.length, 'recommendations from', cards.length, 'cards', mismatchDropped ? `(${mismatchDropped} dropped for card-identity mismatch)` : '')
    } catch (err) {
      console.error('[Deck] analyze failed:', err.message)
      setDeckAnalyzeError(err.message)
    } finally {
      setDeckAnalyzeLoading(false)
    }
  }

  const updateRecField = (idx, fieldName, value) => {
    setDeckAnalyzeRecs((prev) => prev.map((r, i) => i === idx ? { ...r, recommendedFields: { ...r.recommendedFields, [fieldName]: value } } : r))
  }

  const setRecRefineInput = (idx, value) => {
    setDeckAnalyzeRecs((prev) => prev.map((r, i) => i === idx ? { ...r, refineInput: value } : r))
  }

  const refineRec = async (idx) => {
    const rec = deckAnalyzeRecs[idx]
    if (!rec || !rec.refineInput.trim() || rec.refining || !apiKey) return
    setDeckAnalyzeRecs((prev) => prev.map((r, i) => i === idx ? { ...r, refining: true } : r))
    try {
      const fieldsDesc = Object.entries(rec.recommendedFields).map(([k, v]) => `${k}:\n${v}`).join('\n\n')
      const prompt = `Here is a flashcard recommendation:\n\n${fieldsDesc}\n\nThe user wants this change: "${rec.refineInput}"\n\nReturn a JSON object with the updated fields: { ${Object.keys(rec.recommendedFields).map((k) => `"${k}": "..."`).join(', ')} }\nKeep any fields the user didn't ask to change. Use plain text with newlines (no HTML). Output ONLY raw JSON, no markdown.`
      const text = await aiCall(apiKey, 'You edit Anki flashcard content. Always respond with valid JSON only.', prompt, resolveModel('deck'))
      const updated = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      setDeckAnalyzeRecs((prev) => prev.map((r, i) => {
        if (i !== idx) return r
        const newFields = { ...r.recommendedFields }
        Object.entries(updated).forEach(([k, v]) => { if (k in newFields) newFields[k] = String(v) })
        return { ...r, recommendedFields: newFields, refineInput: '', refining: false }
      }))
    } catch (err) {
      console.error('[Deck] rec refine failed:', err.message)
      setDeckAnalyzeRecs((prev) => prev.map((r, i) => i === idx ? { ...r, refining: false } : r))
    }
  }

  const toggleAcceptRec = (idx) => {
    setDeckAnalyzeRecs((prev) => prev.map((r, i) => i === idx ? { ...r, accepted: !r.accepted } : r))
  }

  const rejectRec = (idx) => {
    setDeckAnalyzeRecs((prev) => prev.filter((_, i) => i !== idx))
  }

  const commitAcceptedRecs = async () => {
    const toCommit = deckAnalyzeRecs.filter((r) => r.accepted)
    if (toCommit.length === 0 || deckAnalyzeCommitting) return

    // Build per-rec diff: only fields the user/AI actually changed get sent to Anki.
    // Unchanged fields are NOT sent, so original HTML markup (<b>, <img>, sound refs, etc.) is preserved.
    const updates = toCommit.map((rec) => {
      const changed = {}
      Object.keys(rec.recommendedFields).forEach((k) => {
        const newVal = String(rec.recommendedFields[k] ?? '')
        const oldVal = String(rec.currentFields[k] ?? '')
        if (newVal !== oldVal) changed[k] = newVal
      })
      return { rec, changed }
    })

    // Safety checks: refuse to wipe a previously-populated field; refuse no-op recs.
    const issues = []
    updates.forEach(({ rec, changed }) => {
      if (Object.keys(changed).length === 0) {
        issues.push(`Card #${rec.noteId}: no changes from original`)
        return
      }
      Object.entries(changed).forEach(([k, v]) => {
        const wasPopulated = String(rec.currentFields[k] ?? '').trim() !== ''
        if (wasPopulated && String(v).trim() === '') {
          issues.push(`Card #${rec.noteId}: field "${k}" would be wiped`)
        }
      })
    })
    if (issues.length > 0) {
      setDeckAnalyzeError('Refusing to save: ' + issues.join('; '))
      console.error('[Deck] commit blocked by safety checks:', issues)
      return
    }

    // Confirm with the user, listing exactly which cards + fields will change.
    const summary = updates.map(({ rec, changed }) => `  • Card #${rec.noteId} (${Object.keys(changed).join(', ')})`).join('\n')
    const ok = window.confirm(
      `Save ${toCommit.length} card update${toCommit.length === 1 ? '' : 's'} to Anki?\n\n${summary}\n\n` +
      `Only the listed fields will be modified. Untouched fields keep their original content and formatting. ` +
      `You can undo individual changes with Ctrl+Z in Anki.`
    )
    if (!ok) return

    setDeckAnalyzeCommitting(true)
    setDeckAnalyzeError(null)
    const failures = []
    const successes = []

    for (const { rec, changed } of updates) {
      try {
        const htmlFields = {}
        Object.entries(changed).forEach(([k, v]) => {
          htmlFields[k] = String(v).replace(/\n/g, '<br>')
        })
        await ankiUpdateNote(rec.noteId, htmlFields)
        successes.push(rec.noteId)
      } catch (err) {
        failures.push({ noteId: rec.noteId, error: err.message })
        console.error('[Deck] update failed for', rec.noteId, ':', err.message)
      }
    }

    if (successes.length > 0) ankiSync().catch(() => {})

    if (failures.length > 0) {
      // Keep failed recs in the queue so the user can retry. Drop successfully-saved ones.
      const failedIds = new Set(failures.map((f) => f.noteId))
      setDeckAnalyzeRecs((prev) => prev.filter((r) => failedIds.has(r.noteId) || !r.accepted))
      setDeckAnalyzeError(
        `Saved ${successes.length} / ${toCommit.length}. Failed: ` +
        failures.map((f) => `#${f.noteId} (${f.error})`).join('; ')
      )
      // Refresh the loaded notes so successful changes show up in the list.
      if (successes.length > 0) await loadDeckNotes(deckBrowserDeck).catch(() => {})
    } else {
      await loadDeckNotes(deckBrowserDeck)
      setDeckAnalyzeRecs([])
    }

    setDeckAnalyzeCommitting(false)
    console.log('[Deck] commit done:', successes.length, 'saved,', failures.length, 'failed')
  }

  const clearAnalyze = () => {
    setDeckAnalyzeRecs([])
    setDeckAnalyzeError(null)
    setDeckAnalyzeSkipped(0)
  }

  // ─── Duplicate scan / merge ──────────────────────────────────────────────
  // Two-stage, so the AI can never group unrelated words:
  //   1. Deterministic — group cards whose headword is identical after stripping
  //      accents/articles/parentheticals (catches "Oración" vs "Oracion"), and
  //      flag CLOSE spellings (small edit distance) as candidates.
  //   2. AI — only CONFIRMS which close candidates are truly the same word (typo/
  //      spelling variants), then merges the backs of every confirmed group.
  const stripAccents = (s) => s
    .replace(/[áàâä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
    .replace(/[óòôö]/g, 'o').replace(/[úùûü]/g, 'u') // keep ñ (año ≠ ano)
  const normKey = (s) => stripAccents(String(s || '')
    .replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ' ')
    .toLowerCase())
    .replace(/\([^)]*\)/g, ' ')
    .replace(/^\s*(el|la|los|las|un|una|unos|unas|to)\s+/, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ').trim()

  const levenshtein = (a, b) => {
    const m = a.length, n = b.length
    if (!m) return n; if (!n) return m
    let prev = Array.from({ length: n + 1 }, (_, j) => j)
    for (let i = 1; i <= m; i++) {
      const cur = [i]
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      }
      prev = cur
    }
    return prev[n]
  }

  // Unordered pairs of noteIds, used as stable signatures for the "do not merge" list.
  const pairsOf = (ids) => {
    const out = []
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const [a, b] = [ids[i], ids[j]].sort((x, y) => x - y)
      out.push(`${a}-${b}`)
    }
    return out
  }

  const scanDuplicates = async () => {
    if (deckBrowserNotes.length === 0 || !apiKey || deckDupLoading) return
    setDeckDupLoading(true)
    setDeckDupError(null)
    setDeckDupEmpty(false)
    setDeckDupExpanded({})
    try {
      // Load the per-deck "do not merge" ignore list (cloud-synced via Anki media).
      const ignoreData = (await readBlob('dupignore', deckBrowserDeck)) || { pairs: [] }
      const ignoreSet = new Set(ignoreData.pairs || [])
      setDeckDupIgnore(ignoreData.pairs || [])
      const htmlToPlain = (v) => String(v || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim()
      const frontOf = (n) => Object.values(n.fields).sort((a, b) => a.order - b.order)[0]?.value || ''
      const plainFields = (n) => Object.fromEntries(Object.entries(n.fields).map(([name, f]) => [name, htmlToPlain(f.value)]))

      // Stage 1a: exact (accent-insensitive) groups — confirmed duplicates.
      const byKey = new Map()
      deckBrowserNotes.forEach((n) => {
        const key = normKey(frontOf(n))
        if (!key) return
        if (!byKey.has(key)) byKey.set(key, [])
        byKey.get(key).push(n)
      })
      const confirmedGroups = [...byKey.values()].filter((arr) => arr.length >= 2)

      // Stage 1b: close spellings across DIFFERENT keys → candidate pairs (edit distance).
      const keys = [...byKey.keys()]
      const parent = {}
      const find = (x) => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x] } return x }
      keys.forEach((k) => { parent[k] = k })
      let hasCandidates = false
      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const a = keys[i], b = keys[j]
          const maxDist = Math.min(a.length, b.length) <= 4 ? 1 : 2
          if (Math.abs(a.length - b.length) <= maxDist && levenshtein(a, b) <= maxDist) {
            parent[find(a)] = find(b)
            hasCandidates = true
          }
        }
      }
      // Build clusters of keys that got linked, keeping only multi-key clusters.
      const clusters = new Map()
      keys.forEach((k) => { const r = find(k); if (!clusters.has(r)) clusters.set(r, []); clusters.get(r).push(k) })
      const candidateClusters = [...clusters.values()].filter((ks) => ks.length >= 2)

      // Stage 2a: AI confirms which close candidates are truly the same word.
      let fuzzyGroups = []
      if (candidateClusters.length > 0) {
        try {
          const forAI = candidateClusters.map((ks, ci) => ({
            cluster: ci,
            cards: ks.flatMap((k) => byKey.get(k).map((n) => ({ noteId: n.noteId, front: htmlToPlain(frontOf(n)) }))),
          }))
          const prompt = activeMode.type === 'language'
            ? `These are flashcard headwords that look similar (possible spelling/accent/typo variants of the SAME word). For each cluster, identify which cards are truly the SAME word and should be merged. Different words that merely look alike (e.g. "casa" vs "caza", "pero" vs "perro") must NOT be grouped.\n\nClusters (JSON):\n${JSON.stringify(forAI)}\n\nReturn ONLY a JSON array of the duplicate sets you confirm (omit anything that isn't a real duplicate):\n[ { "merge": [<noteId>, <noteId>, ...] }, ... ]\n\nEach "merge" set must have 2+ noteIds that are the same word. Output ONLY raw JSON, no markdown.`
            : `These are flashcard fronts from a "${activeMode.name}" study deck that look similar (possible duplicates: typo variants, an abbreviation vs its expansion, or the same term/concept written differently). For each cluster, identify which cards are truly the SAME term/concept and should be merged. DISTINCT concepts that merely look or sound similar (e.g. "encoding" vs "encryption", "TCP" vs "UDP") must NOT be grouped.\n\nClusters (JSON):\n${JSON.stringify(forAI)}\n\nReturn ONLY a JSON array of the duplicate sets you confirm (omit anything that isn't a real duplicate):\n[ { "merge": [<noteId>, <noteId>, ...] }, ... ]\n\nEach "merge" set must have 2+ noteIds that are the same term/concept. Output ONLY raw JSON, no markdown.`
          const text = await aiCall(apiKey, 'You confirm whether similar-looking flashcards are the same word. Always respond with valid JSON only.', prompt, resolveModel('deck'))
          const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
          if (Array.isArray(parsed)) {
            fuzzyGroups = parsed.map((p) => {
              const ids = (p.merge || []).map((id) => (typeof id === 'string' ? Number(id) : id))
              const notes = ids.map((id) => deckBrowserNotes.find((n) => n.noteId === id)).filter(Boolean)
              return notes.length >= 2 ? notes : null
            }).filter(Boolean)
          }
        } catch (e) {
          console.warn('[Deck] fuzzy confirm failed:', e.message)
        }
      }

      // Combine, removing any fuzzy group whose notes are already in a confirmed exact group.
      const exactIds = new Set(confirmedGroups.flatMap((g) => g.map((n) => n.noteId)))
      const dupNoteGroups = [
        ...confirmedGroups,
        ...fuzzyGroups.filter((g) => !g.every((n) => exactIds.has(n.noteId))),
      ]
        // Drop groups the user has dismissed (every pair is on the ignore list).
        .filter((g) => !pairsOf(g.map((n) => n.noteId)).every((p) => ignoreSet.has(p)))

      if (dupNoteGroups.length === 0) {
        setDeckDupGroups([])
        setDeckDupEmpty(true)
        console.log('[Deck] duplicate scan: nothing found', hasCandidates ? '(had candidates, AI rejected)' : '')
        return
      }

      // Naive deterministic merge — fallback / starting point.
      const naiveMerge = (notes) => {
        const keep = notes[0]
        const merged = {}
        Object.keys(keep.fields).forEach((name, i) => {
          if (i === 0) { merged[name] = htmlToPlain(keep.fields[name].value); return }
          const lines = []
          notes.forEach((n) => htmlToPlain(n.fields[name]?.value).split('\n').forEach((ln) => {
            const t = ln.trim()
            if (t && !lines.includes(t)) lines.push(t)
          }))
          merged[name] = lines.join('\n')
        })
        return merged
      }

      // Stage 2b: AI merges the backs of each confirmed group.
      let aiMerges = {}
      try {
        const groupsForAI = dupNoteGroups.map((notes, i) => ({ group: i, headword: htmlToPlain(frontOf(notes[0])), cards: notes.map(plainFields) }))
        const prompt = `Each group below is a set of DUPLICATE flashcards that teach the same word. For EACH group, merge its cards into ONE card: keep the clearest front, and combine the backs so every distinct meaning, example, synonym and note is kept (remove only exact repeats).\n\nGroups (JSON):\n${JSON.stringify(groupsForAI)}\n\nReturn ONLY a JSON array, one object per group IN THE SAME ORDER:\n[ { "group": <number>, "headword": "<echo the same group's headword verbatim>", "mergedFields": { "<fieldName>": "<merged plain text>", ... } } ]\n\nThe "group" number, "headword", and "mergedFields" MUST all belong to the SAME group — never mix one group's content with another's.\n\nUse the SAME field names as the input. Plain text with newlines (no HTML, no <br>). Output ONLY raw JSON, no markdown.`
        const text = await aiCall(apiKey, 'You merge duplicate flashcards. Always respond with valid JSON only.', prompt, resolveModel('deck'))
        const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
        if (Array.isArray(parsed)) parsed.forEach((p) => { if (typeof p.group === 'number' && p.mergedFields) aiMerges[p.group] = { fields: p.mergedFields, headword: p.headword || '' } })
      } catch (e) {
        console.warn('[Deck] AI merge failed, using naive merge:', e.message)
      }

      const groups = dupNoteGroups.map((notes, i) => {
        const keepNote = notes[0]
        const fallback = naiveMerge(notes)
        // INTEGRITY GUARD: only trust the AI merge for this group if the headword it
        // echoed back actually matches one of THIS group's cards. If the model
        // scrambled group order/content, fall back to the safe deterministic merge
        // so one word's content can never land on another word's card.
        const aiEntry = aiMerges[i]
        const groupKeys = new Set(notes.map((n) => normKey(htmlToPlain(frontOf(n)))))
        const ai = (aiEntry && (!aiEntry.headword || groupKeys.has(normKey(aiEntry.headword)))) ? aiEntry.fields : null
        if (aiEntry && !ai) console.warn('[Deck] dup merge: headword mismatch for group', i, '— using deterministic merge', { echoed: aiEntry.headword })
        const mergedFields = {}
        Object.keys(keepNote.fields).forEach((name) => {
          mergedFields[name] = ai && ai[name] != null ? String(ai[name]) : fallback[name]
        })
        const fronts = [...new Set(notes.map((n) => htmlToPlain(frontOf(n))))]
        return {
          noteIds: notes.map((n) => n.noteId),
          reason: fronts.length > 1 ? `Variants of the same word: ${fronts.join(' / ')}` : `Same headword: "${fronts[0]}"`,
          cards: notes.map((n) => ({ noteId: n.noteId, fields: plainFields(n) })),
          mergedFields,
          accepted: false,
        }
      })

      setDeckDupGroups(groups)
      setDeckDupEmpty(groups.length === 0)
      console.log('[Deck] duplicate scan:', groups.length, 'groups (', confirmedGroups.length, 'exact,', fuzzyGroups.length, 'fuzzy-confirmed )')
    } catch (err) {
      console.error('[Deck] duplicate scan failed:', err.message)
      setDeckDupError(err.message)
    } finally {
      setDeckDupLoading(false)
    }
  }

  const toggleAcceptDup = (idx) => {
    setDeckDupGroups((prev) => prev.map((g, i) => i === idx ? { ...g, accepted: !g.accepted } : g))
  }

  const updateDupField = (idx, fieldName, value) => {
    setDeckDupGroups((prev) => prev.map((g, i) => i === idx ? { ...g, mergedFields: { ...g.mergedFields, [fieldName]: value } } : g))
  }

  const rejectDup = (idx) => {
    setDeckDupGroups((prev) => prev.filter((_, i) => i !== idx))
  }

  const toggleDupExpanded = (noteId) => {
    setDeckDupExpanded((prev) => ({ ...prev, [noteId]: !prev[noteId] }))
  }

  // "Do not merge" — remember these cards are NOT duplicates so they're never
  // suggested again, and remove the group from view. Persisted per-deck (cloud-synced).
  const dismissDup = async (idx) => {
    const group = deckDupGroups[idx]
    if (!group) return
    const newPairs = [...new Set([...deckDupIgnore, ...pairsOf(group.noteIds)])]
    setDeckDupIgnore(newPairs)
    setDeckDupGroups((prev) => prev.filter((_, i) => i !== idx))
    writeBlob('dupignore', deckBrowserDeck, { pairs: newPairs }).catch((e) => console.warn('[Deck] dupignore save failed:', e.message))
  }

  const clearDup = () => {
    setDeckDupGroups([])
    setDeckDupError(null)
  }

  // ─── Add card (manual / AI-assisted) ─────────────────────────────────────
  const openAddCard = () => {
    setDeckAddOpen(true)
    setDeckAddTerm(''); setDeckAddFront(''); setDeckAddBack(''); setDeckAddTags(''); setDeckAddError(null)
  }
  const closeAddCard = () => {
    setDeckAddOpen(false)
    setDeckAddTerm(''); setDeckAddFront(''); setDeckAddBack(''); setDeckAddTags(''); setDeckAddError(null)
  }

  // Generate front/back/tags from a word using the mode's card template.
  const generateAddCard = async () => {
    const term = deckAddTerm.trim()
    if (!term || !apiKey || deckAddGenerating) return
    setDeckAddGenerating(true)
    setDeckAddError(null)
    try {
      const card = await buildCardFields({ term, contextText: '' })
      setDeckAddFront(card.front)
      setDeckAddBack(card.back)
      setDeckAddTags((card.tags || []).join(', '))
    } catch (err) {
      setDeckAddError('Generation failed: ' + err.message)
    } finally {
      setDeckAddGenerating(false)
    }
  }

  // Save the new card to the current deck.
  const saveAddCard = async () => {
    const front = deckAddFront.trim()
    const back = deckAddBack.trim()
    if (!front || !back) { setDeckAddError('Front and back are required'); return }
    if (!deckBrowserDeck) { setDeckAddError('Select a deck first'); return }
    if (deckAddSaving) return
    setDeckAddSaving(true)
    setDeckAddError(null)
    try {
      const connected = await ankiPing()
      setAnkiConnected(connected)
      if (!connected) { setDeckAddError('Anki is not running — open Anki to add cards'); return }
      if (!(await ankiGetDecks().catch(() => [])).includes(deckBrowserDeck)) {
        await ankiCreateDeck(deckBrowserDeck)
      }
      const ankiBack = back.split('\n').map((line) => {
        const m = line.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+):(.*)$/)
        return m ? `<b>${m[1]}:</b>${m[2]}` : line
      }).join('<br>')
      const tags = deckAddTags.split(',').map((t) => t.trim()).filter(Boolean)
      await ankiAddNote(deckBrowserDeck, front, ankiBack, tags.length ? tags : ['screenlens'])
      ankiSync().catch(() => {})
      await loadDeckNotes(deckBrowserDeck)
      closeAddCard()
    } catch (err) {
      setDeckAddError('Save failed: ' + err.message)
    } finally {
      setDeckAddSaving(false)
    }
  }

  // ── Quick-Add: batch-generate formatted cards into a review tray ───────────────
  const runQuickAdd = async () => {
    if (!apiKey) { setQuickAddError('Set your API key first'); return }
    // Split on newlines or commas → distinct words/phrases.
    const words = quickAddInput.split(/[\n,]+/).map((w) => w.trim()).filter(Boolean)
    if (!words.length) { setQuickAddError('Type one or more words first'); return }
    setQuickAddLoading(true)
    setQuickAddError(null)
    try {
      const cards = await generateCards(words)
      if (!cards.length) { setQuickAddError('No cards were generated — try again'); return }
      const deck = deckBrowserDeck || activeMode.ankiDeck || ''
      // Duplicate pre-check (best-effort; never blocks).
      const withDup = await Promise.all(cards.map(async (c) => ({
        ...c, accepted: true, synced: false, syncing: false,
        dup: deck ? !(await ankiCanAddNote(deck, c.front, cardBackToHtml(c.back))) : false,
      })))
      setQuickAddCards(withDup)
    } catch (err) {
      setQuickAddError('Generation failed: ' + err.message)
    } finally {
      setQuickAddLoading(false)
    }
  }

  const syncQuickAddCard = async (i) => {
    const card = quickAddCards[i]
    if (!card || card.synced || card.syncing) return
    const deck = deckBrowserDeck || activeMode.ankiDeck || ''
    if (!deck) { setQuickAddError('Select a deck first'); return }
    setQuickAddCards((prev) => prev.map((c, k) => k === i ? { ...c, syncing: true } : c))
    try {
      const connected = await ankiPing()
      setAnkiConnected(connected)
      if (!connected) { setQuickAddError('Anki is not running — open Anki to add cards'); setQuickAddCards((prev) => prev.map((c, k) => k === i ? { ...c, syncing: false } : c)); return }
      if (!(await ankiGetDecks().catch(() => [])).includes(deck)) await ankiCreateDeck(deck)
      // allowDuplicate: true — Quick Add is an explicit "add these" action (the duplicate badge
      // already warns), and multi-meaning words legitimately share a front (e.g. two "gato" cards).
      await ankiAddNote(deck, card.front, cardBackToHtml(card.back), (card.tags && card.tags.length) ? card.tags : ['ebiki'], true)
      ankiSync().catch(() => {})
      setQuickAddCards((prev) => prev.map((c, k) => k === i ? { ...c, synced: true, syncing: false } : c))
      if (deck === deckBrowserDeck) loadDeckNotes(deck).catch(() => {})
    } catch (err) {
      setQuickAddError('Sync failed: ' + err.message)
      setQuickAddCards((prev) => prev.map((c, k) => k === i ? { ...c, syncing: false } : c))
    }
  }

  const syncQuickAddAccepted = async () => {
    for (let i = 0; i < quickAddCards.length; i++) {
      if (quickAddCards[i].accepted && !quickAddCards[i].synced) await syncQuickAddCard(i)
    }
  }

  const closeQuickAdd = () => { setQuickAddOpen(false); setQuickAddInput(''); setQuickAddCards([]); setQuickAddError(null) }

  // Merge each accepted group: update the first note with merged content, delete the rest.
  const commitAcceptedDups = async () => {
    const toCommit = deckDupGroups.filter((g) => g.accepted)
    if (toCommit.length === 0 || deckDupCommitting) return

    const totalDeletes = toCommit.reduce((sum, g) => sum + (g.noteIds.length - 1), 0)
    const summary = toCommit.map((g) => `  • Keep #${g.noteIds[0]}, delete ${g.noteIds.slice(1).map((id) => `#${id}`).join(', ')}`).join('\n')
    const ok = window.confirm(
      `Merge ${toCommit.length} duplicate group${toCommit.length === 1 ? '' : 's'}?\n\n${summary}\n\n` +
      `This updates the kept card with the merged content and permanently deletes ${totalDeletes} duplicate card${totalDeletes === 1 ? '' : 's'} from Anki. This cannot be undone from here.`
    )
    if (!ok) return

    setDeckDupCommitting(true)
    setDeckDupError(null)
    const failures = []
    let merged = 0

    for (const g of toCommit) {
      try {
        const keepId = g.noteIds[0]
        const htmlFields = {}
        Object.entries(g.mergedFields).forEach(([k, v]) => { htmlFields[k] = String(v).replace(/\n/g, '<br>') })
        await ankiUpdateNote(keepId, htmlFields)
        const deleteIds = g.noteIds.slice(1)
        if (deleteIds.length > 0) await ankiDeleteNotes(deleteIds)
        merged++
      } catch (err) {
        failures.push({ noteIds: g.noteIds, error: err.message })
        console.error('[Deck] merge failed for', g.noteIds, ':', err.message)
      }
    }

    if (merged > 0) ankiSync().catch(() => {})

    if (failures.length > 0) {
      setDeckDupError(`Merged ${merged} / ${toCommit.length}. Failed: ` + failures.map((f) => `[${f.noteIds.join(',')}] (${f.error})`).join('; '))
      await loadDeckNotes(deckBrowserDeck).catch(() => {})
      setDeckDupGroups((prev) => prev.filter((g) => !g.accepted || failures.some((f) => f.noteIds[0] === g.noteIds[0])))
    } else {
      await loadDeckNotes(deckBrowserDeck)
      setDeckDupGroups([])
    }

    setDeckDupCommitting(false)
    console.log('[Deck] merge done:', merged, 'merged,', failures.length, 'failed')
  }

  // ─── Discover Mode ───────────────────────────────────────────────────────
  // Build (or refresh) the learner profile from cards, mastery stats, progress
  // observations and chat history. Persists to the Anki media store (+ local cache).
  const buildLearnerProfile = async (deckArg) => {
    if (!apiKey) { setDiscoverError('API key required'); return null }
    setDiscoverProfileLoading(true)
    setDiscoverError(null)
    try {
      const deck = deckArg || discoverDeck || ankiDeck
      let cards = []
      let cardCount = 0
      let masterySummary = ''
      try {
        if (deck) {
          const noteIds = await ankiFindNotes(`deck:"${deck}"`)
          cardCount = noteIds.length
          const notes = noteIds.length ? await ankiNotesInfo(noteIds.slice(0, 150)) : []
          cards = notes.map((n) => {
            const f = Object.values(n.fields).sort((a, b) => a.order - b.order)
            return { front: stripHtml(f[0]?.value || ''), back: stripHtml(f[1]?.value || '') }
          })
          discoverDeckTermsRef.current = cards.map((c) => c.front).filter(Boolean)
          const cardIds = await ankiFindCards(`deck:"${deck}"`).catch(() => [])
          const info = cardIds.length ? await ankiCardsInfo(cardIds.slice(0, 300)) : []
          if (info.length) {
            const mature = info.filter((c) => (c.interval || 0) >= 21).length
            const learning = info.filter((c) => (c.interval || 0) > 0 && (c.interval || 0) < 21).length
            const fresh = info.filter((c) => !c.interval).length
            const hard = info.filter((c) => (c.lapses || 0) >= 2).length
            const avgEasePct = Math.round(info.reduce((s, c) => s + (c.factor || 0), 0) / info.length / 10)
            masterySummary = `Scheduling: ${info.length} cards — ${mature} mature (interval>=21d), ${learning} learning, ${fresh} new. ~${hard} have lapsed 2+ times (struggle). Avg ease ~${avgEasePct}%.`
          }
        }
      } catch (e) { console.warn('[Discover] card gather failed:', e.message) }

      let progressObs = ''
      try {
        if (deck) {
          const r = await fetch(`/api/deck-progress?deck=${encodeURIComponent(deck)}`)
          progressObs = (await r.json()).content || ''
        }
      } catch {}

      let chatSummary = ''
      let chatCount = 0
      try {
        const sessions = await (await fetch('/api/chats')).json()
        const relevant = (sessions || []).filter((s) => s.type === 'study' || s.type === 'feedback' || !s.type)
        chatCount = relevant.length
        chatSummary = relevant.slice(0, 20).map((s) => `- ${s.title}`).join('\n')
      } catch {}

      let knowledgeSummary = ''
      try {
        const d = await (await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}`)).json()
        const names = (d.files || []).filter((f) => !f.disabled).map((f) => f.name)
        // Full content (capped), not just file names — for cert modes this is what lets the
        // profile enumerate the real exam objective domains. A whole-book KB contributes its
        // TOC instead (the chapter structure IS the domain structure).
        if (names.length) {
          const body = !d.content ? ''
            : d.content.length > KNOWLEDGE_CAP && (d.outline || []).length >= 4
              ? `\nKnowledge base table of contents:\n${d.outline.map((h) => `${'  '.repeat(Math.max(0, (h.level || 1) - 1))}${h.title}`).join('\n').substring(0, KNOWLEDGE_CAP)}`
              : `\nKnowledge base content:\n${d.content.substring(0, KNOWLEDGE_CAP)}`
          knowledgeSummary = `Knowledge base files: ${names.join(', ')}${body}`
        }
      } catch {}

      const cardList = cards.slice(0, 120).map((c) => `- ${c.front} -> ${c.back}`).join('\n')
      const evidence = [
        `Total cards in deck "${deck || '(none)'}": ${cardCount}`,
        masterySummary,
        cardCount ? `Sample of their cards:\n${cardList}` : 'No cards yet — likely a beginner.',
        progressObs ? `Progress observations:\n${progressObs}` : '',
        chatCount ? `Recent study/feedback chat topics (${chatCount}):\n${chatSummary}` : '',
        knowledgeSummary,
      ].filter(Boolean).join('\n\n')

      const prompt = buildProfilePrompt({
        modeType: activeMode.type || 'general',
        modeName: activeMode.name,
        modeDescription: activeMode.description,
        evidence,
      })
      const text = await aiCall(apiKey, 'You assess learner proficiency. Always respond with valid JSON only.', prompt, resolveModel('discover'))
      const profile = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      setDiscoverProfile(profile)
      writeBlob('profile', activeMode.name, profile).catch(() => {})
      console.log('[Discover] profile built:', profile)
      return profile
    } catch (err) {
      console.error('[Discover] profile failed:', err.message)
      setDiscoverError('Could not analyze level: ' + err.message)
      return null
    } finally {
      setDiscoverProfileLoading(false)
    }
  }

  // Compute the exclude list (never suggest these again).
  const discoverExcludeList = (ledger) => {
    const l = ledger || discoverLedger
    return [
      ...(l.offered || []),
      ...(l.known || []).map((x) => x.term),
      ...(l.declined || []).map((x) => x.term),
      ...(l.carded || []).map((x) => x.term),
      ...discoverDeckTermsRef.current,
    ].filter(Boolean)
  }

  // Fetch one new suggestion calibrated to the profile, optionally web-verified.
  const fetchNextSuggestion = async (profileArg, ledgerArg) => {
    const profile = profileArg || discoverProfile
    if (!apiKey || !profile) return
    setDiscoverSuggestionLoading(true)
    setDiscoverError(null)
    setDiscoverSuggestion(null)
    setDiscoverSources(null)
    setDiscoverCard(null)
    setDiscoverStatus('thinking')
    try {
      const ledger = ledgerArg || discoverLedger
      const studyLanguage = activeMode.studyRules?.studyLanguage || (LANGS.find((l) => l.code === language)?.label)
      const prompt = buildSuggestionPrompt({
        profile,
        modeType: activeMode.type || 'general',
        modeName: activeMode.name,
        modeDescription: activeMode.description,
        studyLanguage,
        excludeList: discoverExcludeList(ledger),
        itemType: discoverConfig.itemType,
        focus: discoverConfig.focus.trim(),
        knowledge: knowledgeRaw(KNOWLEDGE_CAP), // big books contribute their TOC
        difficulty: discoverConfig.difficulty || 'stretch',
        // Subject-specific category (AI-generated per mode) — overrides the static type table
        customKind: (activeMode.type || 'general') !== 'language'
          ? (activeMode.discoverKinds || []).find((k) => k.key === discoverConfig.itemType) || null
          : null,
      })
      const text = await aiCall(apiKey, 'You suggest new study items. Always respond with valid JSON only.', prompt, resolveModel('discover'))
      let suggestion = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))

      // Web grounding: verify/correct facts against search results.
      if (discoverWebVerify && suggestion?.term) {
        setDiscoverStatus('searching')
        try {
          const q = `${suggestion.term} meaning ${studyLanguage || ''}`.trim()
          const searchData = await (await fetch(`/api/web-search?q=${encodeURIComponent(q)}`)).json()
          if (searchData.results?.length > 0) {
            setDiscoverSources(searchData.results.slice(0, 4))
            setDiscoverStatus('verifying')
            const vText = await aiCall(apiKey, 'You verify facts and respond with valid JSON only.', buildVerifyPrompt({ suggestion, searchResults: searchData.results.slice(0, 5) }), resolveModel('discover'))
            const v = JSON.parse(vText.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
            suggestion = { ...suggestion, translation: v.translation || suggestion.translation, draftMeaning: v.draftMeaning || suggestion.draftMeaning, verified: !!v.verified, verifyNote: v.note || '' }
          }
        } catch (e) { console.warn('[Discover] verify failed:', e.message) }
      }

      setDiscoverSuggestion(suggestion)
      // Record as offered so it is never repeated.
      const nextLedger = { ...ledger, offered: [...new Set([...(ledger.offered || []), suggestion.term])] }
      setDiscoverLedger(nextLedger)
      writeBlob('ledger', activeMode.name, nextLedger).catch(() => {})
    } catch (err) {
      console.error('[Discover] suggestion failed:', err.message)
      setDiscoverError('Could not get a suggestion: ' + err.message)
    } finally {
      setDiscoverSuggestionLoading(false)
      setDiscoverStatus(null)
    }
  }

  // Record an action in the ledger and advance to the next suggestion.
  const discoverRecordAndNext = (kind, reason) => {
    const s = discoverSuggestion
    if (!s) return
    const entry = { term: s.term, ts: new Date().toISOString(), ...(reason ? { reason } : {}) }
    const nextLedger = { ...discoverLedger, [kind]: [...(discoverLedger[kind] || []), entry] }
    setDiscoverLedger(nextLedger)
    writeBlob('ledger', activeMode.name, nextLedger).catch(() => {})
    // "I know this" is mild evidence the learner is above this item — nudge confidence.
    fetchNextSuggestion(discoverProfile, nextLedger)
  }

  // Generate a card preview for the current suggestion.
  const makeDiscoverCard = async () => {
    const s = discoverSuggestion
    if (!s || !apiKey || discoverCardLoading) return
    setDiscoverCardLoading(true)
    setDiscoverError(null)
    try {
      const card = await buildCardFields({
        term: s.term,
        partOfSpeech: s.partOfSpeech,
        translation: s.translation,
        contextText: s.draftMeaning || s.why || '',
      })
      setDiscoverCard(card)
    } catch (err) {
      setDiscoverError('Card generation failed: ' + err.message)
    } finally {
      setDiscoverCardLoading(false)
    }
  }

  // Save the previewed card to Anki, record it, and move on.
  const saveDiscoverCard = async () => {
    const card = discoverCard
    const s = discoverSuggestion
    if (!card || !s || discoverCardSaving) return
    setDiscoverCardSaving(true)
    setDiscoverError(null)
    try {
      const connected = await ankiPing()
      setAnkiConnected(connected)
      if (!connected) { setDiscoverError('Anki is not running — open Anki to save cards'); return }
      const targetDeck = discoverDeck || ankiDeck
      if (targetDeck && !(await ankiGetDecks().catch(() => [])).includes(targetDeck)) {
        await ankiCreateDeck(targetDeck)
      }
      const ankiBack = card.back.split('\n').map((line) => {
        const m = line.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+):(.*)$/)
        return m ? `<b>${m[1]}:</b>${m[2]}` : line
      }).join('<br>')
      const noteId = await ankiAddNote(targetDeck, card.front, ankiBack, card.tags)
      ankiSync().catch(() => {})
      discoverDeckTermsRef.current = [...discoverDeckTermsRef.current, card.front]
      const nextLedger = {
        ...discoverLedger,
        carded: [...(discoverLedger.carded || []), { term: s.term, noteId, ts: new Date().toISOString() }],
        offered: [...new Set([...(discoverLedger.offered || []), s.term])],
      }
      setDiscoverLedger(nextLedger)
      writeBlob('ledger', activeMode.name, nextLedger).catch(() => {})
      setDiscoverCard(null)
      fetchNextSuggestion(discoverProfile, nextLedger)
    } catch (err) {
      setDiscoverError('Save failed: ' + err.message)
    } finally {
      setDiscoverCardSaving(false)
    }
  }

  // Switch which deck Discover targets (evidence, exclusions, and where cards save).
  // Returns to the setup screen and re-profiles against the new deck in the background.
  const discoverSwitchDeck = (deck) => {
    if (deck === (discoverDeck || ankiDeck)) return
    setDiscoverDeck(deck)
    setDiscoverStarted(false)
    setDiscoverSuggestion(null)
    setDiscoverCard(null)
    setDiscoverSources(null)
    discoverDeckTermsRef.current = []
    buildLearnerProfile(deck)
  }

  // General modes: AI-generate 4-6 subject-specific discovery categories ONCE per mode
  // (like chatSuggestions) — e.g. Security+ gets acronyms/attack types/ports, music theory
  // gets scales/chords/cadences. The static term/acronym/comparison set is the fallback.
  const discoverKindsGenRef = useRef(new Set()) // mode ids with generation in flight (no duplicates)
  const ensureDiscoverKinds = async () => {
    if ((activeMode.type || 'general') === 'language') return
    if (Array.isArray(activeMode.discoverKinds) && activeMode.discoverKinds.length > 0) return
    // Pin the TARGET mode now — this resolves async and the user may have switched modes since.
    const modeId = activeMode.id
    if (discoverKindsGenRef.current.has(modeId)) return
    discoverKindsGenRef.current.add(modeId)
    try {
      const prompt = `Subject: "${activeMode.name}"${activeMode.description ? ` — ${activeMode.description}` : ''}

Design 4-6 DISCOVERY CATEGORIES a tutor could draw from when suggesting new flashcard items for this subject. Categories must span genuinely DIFFERENT kinds of knowledge in THIS subject (e.g. core concepts, acronyms/notation, commonly-confused pairs, applied scenarios, formulas, key figures/dates — whatever actually fits it).

Return ONLY a JSON array (no markdown):
[{ "key": "short-kebab-slug", "label": "<chip label, 1-3 words, in ${APP_LANG_NAME[appLanguage] || 'English'}>", "rule": "<one imperative sentence telling the tutor exactly what kind of item to suggest and what to put in term/translation/explanation>" }]`
      const text = await aiCall(apiKey, 'You design study-content category systems. Respond with valid JSON only.', prompt, resolveModel('discover'))
      const kinds = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      if (Array.isArray(kinds) && kinds.length > 0) {
        const clean = kinds.filter((k) => k && k.key && k.label && k.rule).slice(0, 6)
          .map((k) => ({ key: String(k.key), label: String(k.label), rule: String(k.rule) }))
        if (clean.length > 0) updateModeById(modeId, { discoverKinds: clean })
        console.log('[Discover] generated subject categories:', clean.map((k) => k.label).join(', '))
      }
    } catch (e) {
      console.warn('[Discover] category generation failed:', e.message)
      discoverKindsGenRef.current.delete(modeId) // allow a retry on the next visit
    }
  }

  // Instant-paint cache: the last known profile/ledger per mode, in localStorage. The real
  // blobs live in Anki media (async, network) — without this, every Discover entry flashes a
  // bare header (no level badge, "0 made · 0 known") until the reads land.
  const discoverCacheRef = useRef(null)
  const readDiscoverCache = (name) => {
    if (!discoverCacheRef.current) {
      try { discoverCacheRef.current = JSON.parse(localStorage.getItem('ebiki-discover-cache') || '{}') } catch { discoverCacheRef.current = {} }
    }
    return discoverCacheRef.current[name] || {}
  }
  const writeDiscoverCache = (name, patch) => {
    const all = discoverCacheRef.current || {}
    all[name] = { ...(all[name] || {}), ...patch }
    discoverCacheRef.current = all
    try { localStorage.setItem('ebiki-discover-cache', JSON.stringify(all)) } catch {}
  }
  // Keep the cache current as the session mutates state. The mode-switch reset sets null /
  // DEFAULT_LEDGER — both skipped, so a reset can never blank the new mode's cache.
  useEffect(() => { if (discoverProfile) writeDiscoverCache(activeMode.name, { profile: discoverProfile }) }, [discoverProfile])
  useEffect(() => { if (discoverLedger !== DEFAULT_LEDGER) writeDiscoverCache(activeMode.name, { ledger: discoverLedger }) }, [discoverLedger])

  // Initialize Discover when the user switches to it: load ledger + profile, then STOP
  // at the setup screen (no suggestion yet — the user picks options and clicks Start).
  const initDiscover = async () => {
    if (discoverInitRef.current || !apiKey) return
    discoverInitRef.current = true
    try {
      // Paint the last known state immediately (same commit as the reset — no flash),
      // then let the authoritative Anki-media blobs replace it when they arrive.
      const cached = readDiscoverCache(activeMode.name)
      if (cached.profile) setDiscoverProfile(cached.profile)
      if (cached.ledger) setDiscoverLedger(cached.ledger)

      ankiGetDecks().then(setAnkiDecks).catch(() => {}) // for the deck switcher
      ensureDiscoverKinds() // fire-and-forget; chips appear when ready
      const ledger = (await readBlob('ledger', activeMode.name)) || cached.ledger || DEFAULT_LEDGER
      setDiscoverLedger(ledger)
      let profile = await readBlob('profile', activeMode.name)
      if (!profile && cached.profile) profile = cached.profile // blob unreachable (Anki offline) — keep the cache
      if (!profile) profile = await buildLearnerProfile()
      else setDiscoverProfile(profile)
    } catch (err) {
      setDiscoverError('Discover init failed: ' + err.message)
    }
  }

  // Begin suggesting with the chosen options.
  const startDiscover = async () => {
    let profile = discoverProfile
    if (!profile) profile = await buildLearnerProfile()
    if (!profile) return
    setDiscoverStarted(true)
    fetchNextSuggestion(profile, discoverLedger)
  }

  // Return to the setup screen to change options.
  const adjustDiscover = () => {
    setDiscoverStarted(false)
    setDiscoverSuggestion(null)
    setDiscoverCard(null)
    setDiscoverSources(null)
  }

  // Re-analyze level on demand.
  const reanalyzeDiscover = async () => {
    const profile = await buildLearnerProfile()
    if (profile && discoverStarted) fetchNextSuggestion(profile, discoverLedger)
  }

  // Reset Discover state when the active mode (and thus deck/profile) changes.
  // Defined before the init effect so on a mode switch the reset runs first.
  // LAYOUT effect: must run in the same pre-paint flush as the init effect below —
  // as a plain effect it would blank the panel AFTER the frame painted (visible blink)
  // and after the init effect had already skipped this dep change.
  useLayoutEffect(() => {
    discoverInitRef.current = false
    discoverDeckTermsRef.current = []
    setDiscoverProfile(null)
    setDiscoverSuggestion(null)
    setDiscoverLedger(DEFAULT_LEDGER)
    setDiscoverCard(null)
    setDiscoverError(null)
    setDiscoverSources(null)
    setDiscoverStarted(false)
    setDiscoverConfig({ itemType: 'both', focus: '', difficulty: 'stretch' })
    setDiscoverDeck('')
  }, [activeModeId])

  // Layout effect, running right after the reset above in the same pre-paint flush:
  // paint the cached profile/ledger IMMEDIATELY (even before Anki connects — the cache
  // needs no network), then run the real init once the connection is up.
  useLayoutEffect(() => {
    if (activeTab !== 'discover' || !apiKey) return
    if (!discoverInitRef.current) {
      const cached = readDiscoverCache(activeMode.name)
      if (cached.profile) setDiscoverProfile((p) => p || cached.profile)
      if (cached.ledger) setDiscoverLedger((l) => (l === DEFAULT_LEDGER ? cached.ledger : l))
    }
    if (ankiConnected && !discoverInitRef.current) initDiscover()
  }, [activeTab, ankiConnected, apiKey, activeModeId])

  // Auto-open the deck browser when the Deck tab is entered, sync edits back when leaving.
  const prevTabRef = useRef(null)
  useEffect(() => {
    if (activeTab === 'deck' && !deckBrowserActive && ankiConnected) {
      openDeckBrowser()
    }
    if (prevTabRef.current === 'deck' && activeTab !== 'deck' && activeTab !== null) {
      closeDeckBrowser()
    }
    prevTabRef.current = activeTab
  }, [activeTab, ankiConnected])

  // ─── Knowledge Base Management ──────────────────────────────────────────
  const loadKnowledgeFiles = async () => {
    try {
      const res = await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}`).then(r => r.json())
      setKnowledgeFiles(res.files || [])
    } catch { setKnowledgeFiles([]) }
  }

  // Keep the active mode's knowledge content in state so every AI feature can use it without
  // its own fetch. Refreshed on mode switch and after any knowledge file change.
  const refreshModeKnowledge = async () => {
    try {
      const res = await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}`).then(r => r.json())
      setModeKnowledge({ content: res.content || '', fileCount: res.fileCount || 0, outline: res.outline || [] })
    } catch { setModeKnowledge({ content: '', fileCount: 0, outline: [] }) }
  }
  useEffect(() => { refreshModeKnowledge() }, [activeModeId, activeMode.name]) // eslint-disable-line react-hooks/exhaustive-deps

  // The outline as an indented text TOC (empty string when the server found no headings).
  const knowledgeOutlineText = () =>
    (modeKnowledge.outline || []).map((h) => `${'  '.repeat(Math.max(0, (h.level || 1) - 1))}${h.title}`).join('\n')
  // Whether the KB is too big to inline AND has a usable TOC to navigate by.
  const knowledgeIsBig = () => modeKnowledge.content.length > KNOWLEDGE_CAP
  const knowledgeHasToc = () => (modeKnowledge.outline || []).length >= 4
  // Raw knowledge for a prompt: full content when it fits; the TOC when it's a big navigable
  // book (so the model at least knows what the material covers); truncated head as last resort.
  const knowledgeRaw = (cap = KNOWLEDGE_CAP) => {
    const { content } = modeKnowledge
    if (!content) return ''
    if (content.length <= cap) return content
    if (knowledgeHasToc()) return `TABLE OF CONTENTS of the user's study material (too large to include in full):\n${knowledgeOutlineText()}`.substring(0, cap)
    return content.substring(0, cap)
  }
  // Uniform prompt block for injecting the mode's knowledge base into any AI call.
  const knowledgeBlock = (cap = KNOWLEDGE_CAP) => {
    const raw = knowledgeRaw(cap)
    return raw ? `\n\nREFERENCE MATERIAL (the user's own knowledge base for "${activeMode.name}" — treat it as authoritative context for this subject):\n${raw}` : ''
  }

  // TOC-guided retrieval for HUGE knowledge bases (whole books): a quick selector call reads
  // the TOC + the task, picks the relevant sections, and only those are fetched and injected.
  // Small knowledge bases skip all of this (full content, exactly as before); giant TOC-less
  // ones fall back to knowledgeBlock's truncation (Settings shows a warning for that case).
  const knowledgeSelectRef = useRef(new Map()) // `${mode}|${cacheKey}` → picked section indices
  const getKnowledgeContext = async (task, cap = KNOWLEDGE_CAP, cacheKey = null) => {
    const { content, outline } = modeKnowledge
    if (!content) return ''
    if (content.length <= cap || !knowledgeHasToc()) return knowledgeBlock(cap)
    try {
      const key = `${activeMode.name}|${cacheKey || String(task).slice(0, 160)}`
      let ids = knowledgeSelectRef.current.get(key)
      if (!ids) {
        const toc = outline.map((h, i) => `${i}. ${'  '.repeat(Math.max(0, (h.level || 1) - 1))}${h.title}`).join('\n')
        const sel = await aiCall(apiKey,
          'You route study tasks to the relevant sections of study material. Respond ONLY with a raw JSON array of section numbers.',
          `TABLE OF CONTENTS:\n${toc}\n\nTASK:\n${task}\n\nReturn a JSON array with the numbers of the 1-4 sections most relevant to this task, most relevant first (e.g. [12,3]). ONLY the raw JSON array, no markdown.`,
          resolveModel('general'))
        const parsed = JSON.parse(sel.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
        ids = (Array.isArray(parsed) ? parsed : []).filter((n) => Number.isInteger(n) && n >= 0 && n < outline.length).slice(0, 4)
        if (!ids.length) return knowledgeBlock(cap)
        if (knowledgeSelectRef.current.size > 300) knowledgeSelectRef.current.clear()
        knowledgeSelectRef.current.set(key, ids)
      }
      const res = await fetch(`/api/knowledge-sections?mode=${encodeURIComponent(activeMode.name)}&sections=${ids.join(',')}&cap=${cap}`).then((r) => r.json())
      if (!res.content) return knowledgeBlock(cap)
      return `\n\nREFERENCE MATERIAL (sections of the user's knowledge base for "${activeMode.name}" chosen as relevant to this task — treat as authoritative):\n${res.content}`
    } catch { return knowledgeBlock(cap) }
  }

  // ─── Pronunciation audio ──────────────────────────────────────────────────
  // Words are pronounced in the mode's LEARNED language (language modes only).
  // Region preference = the user's per-language default (Settings → Audio).
  const pronRegion = () => {
    const info = langInfo(learnLangName())
    return info ? (pronunciationCfg.defaultRegions?.[info.iso1] || '') : ''
  }
  // Strip the "(part of speech)" suffix our card fronts carry before an audio lookup.
  const pronWord = (front) => String(front || '').replace(/\s*[(（].*$/, '').trim()

  // Embed a native (Tier-1) recording into the Anki note: store the media file, append
  // [sound:…] + the CC-BY-SA credit line to the back field. Idempotent — skips when the
  // back already carries audio. With { replace: true } (user picked a DIFFERENT speaker
  // via ↻) it swaps out OUR previous embed (only ebiki-prefixed sounds — a user's own
  // audio is never touched). Best-effort: failures only log, never break the UI.
  const embeddedAudioRef = useRef(new Set())
  const embedPronunciationInNote = async (noteId, result, word, { replace = false } = {}) => {
    if (!noteId || !result || result.source !== 'wiktionary' || pronunciationCfg.embedInAnki === false) return
    if (embeddedAudioRef.current.has(noteId) && !replace) return
    embeddedAudioRef.current.add(noteId)
    try {
      const note = (await ankiNotesInfo([noteId]))?.[0]
      if (!note) return
      const backName = Object.entries(note.fields).sort(([, a], [, b]) => a.order - b.order)[1]?.[0]
      if (!backName) return
      let backVal = note.fields[backName].value || ''
      if (backVal.includes('[sound:')) {
        if (!replace || !/\[sound:ebiki-/.test(backVal)) return // not ours to replace
        backVal = backVal
          .replace(/(<br>)?\[sound:ebiki-[^\]]+\]/g, '')
          .replace(/<div[^>]*>🔊 <a[^>]*>[^<]*<\/a><\/div>/g, '')
      }
      const resp = await fetch(result.audioUrl)
      if (!resp.ok) return
      const bytes = new Uint8Array(await resp.arrayBuffer())
      let bin = ''
      for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
      const ext = (result.fileName?.match(/\.(ogg|oga|wav|mp3|opus|flac)$/i)?.[1] || 'ogg').toLowerCase()
      const mediaName = `ebiki-${String(word).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').slice(0, 40)}-${noteId}.${ext}`
      await ankiStoreMediaFile(mediaName, btoa(bin))
      // The CC-BY-SA credit must travel with the cached copy — it goes on the card itself.
      const credit = result.attribution
        ? `<div style="font-size:10px;color:#888;margin-top:6px">🔊 <a href="${result.attribution.sourceUrl}">${result.attribution.author} · ${result.attribution.license}</a></div>`
        : ''
      await ankiUpdateNote(noteId, { [backName]: `${backVal}<br>[sound:${mediaName}]${credit}` })
      console.log('[Pronunciation] embedded native audio into note', noteId, mediaName)
    } catch (err) {
      console.warn('[Pronunciation] embed failed:', err.message)
      embeddedAudioRef.current.delete(noteId) // allow a retry later
    }
  }
  // Study rows only know the cardId — resolve it to the note first.
  const embedPronunciationForCard = async (cardId, result, word, opts) => {
    if (!cardId) return
    try {
      const noteId = (await ankiCardsInfo([cardId]))?.[0]?.note
      await embedPronunciationInNote(noteId, result, word, opts)
    } catch { /* best-effort */ }
  }

  const uploadKnowledgeFile = async (file) => {
    console.log('[Knowledge] uploading file:', file.name, 'size:', file.size, 'type:', file.type)
    try {
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf'
      let text, filename = file.name
      if (isPdf) {
        // Extract text client-side (pdf.js, lazy-loaded) and store it as .txt — the server
        // and the whole knowledge pipeline stay plain-text only.
        setKnowledgeBusy(t('pdfExtracting').replace('{p}', '0').replace('{n}', '…'))
        const { extractPdfText } = await import('./utils/pdf')
        text = await extractPdfText(file, (p, n) => setKnowledgeBusy(t('pdfExtracting').replace('{p}', String(p)).replace('{n}', String(n))))
        filename = file.name.replace(/\.pdf$/i, '') + '.txt'
        if (!text.trim()) {
          // Scanned/image-only PDF — no text layer to extract.
          setAiErrorNotice(t('pdfNoText').replace('{file}', file.name))
          return
        }
      } else {
        text = await file.text()
      }
      console.log('[Knowledge] file content length:', text.length)
      const res = await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, content: text }),
      })
      const data = await res.json()
      console.log('[Knowledge] upload result:', data)
      await loadKnowledgeFiles()
      refreshModeKnowledge()
    } catch (err) {
      console.error('[Knowledge] upload failed:', err.message)
      setAiErrorNotice(`${file.name}: ${err.message}`)
    } finally {
      setKnowledgeBusy(null)
    }
  }

  const deleteKnowledgeFile = async (fileName) => {
    await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}&file=${encodeURIComponent(fileName)}`, { method: 'DELETE' })
    loadKnowledgeFiles()
    refreshModeKnowledge()
  }

  const toggleKnowledgeFile = async (fileName) => {
    await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}&file=${encodeURIComponent(fileName)}`, { method: 'PATCH' })
    loadKnowledgeFiles()
    refreshModeKnowledge()
  }

  const handleKnowledgeDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setKnowledgeDragging(false)
    setDragging(false)
    const allFiles = Array.from(e.dataTransfer.files)
    console.log('[Knowledge] drop event, files:', allFiles.map(f => f.name))
    const textFiles = allFiles.filter(f => f.name.match(/\.(txt|md|pdf)$/i))
    if (textFiles.length === 0) {
      console.log('[Knowledge] no .txt/.md/.pdf files in drop')
      return
    }
    textFiles.forEach(uploadKnowledgeFile)
  }

  const handleKnowledgeFileInput = (e) => {
    const files = Array.from(e.target.files).filter(f => f.name.match(/\.(txt|md|pdf)$/i))
    files.forEach(uploadKnowledgeFile)
    e.target.value = ''
  }

  // ─── AI Format Editing ───────────────────────────────────────────────────
  // ── "Ask AI" mode edits with a review step (propose → accept/deny/modify) ──
  // Scopes group which per-mode fields an edit touches.
  const MODE_EDIT_SCOPES = {
    cards: [
      { key: 'fields', label: 'Fields' },
      { key: 'frontTemplate', label: 'Front template' },
      { key: 'backTemplate', label: 'Back template' },
      { key: 'tagRules', label: 'Tag rules' },
    ],
    study: [
      { key: 'questionPrompt', label: 'Question generation prompt' },
      { key: 'ratingRules', label: 'Rating rules' },
    ],
  }
  const modeFieldValue = (key) => {
    if (key === 'questionPrompt') return activeMode.studyRules?.questionPrompt || (activeMode.type === 'language' ? defaultStudyRules : defaultGeneralStudyRules).questionPrompt
    if (key === 'ratingRules') return activeMode.studyRules?.ratingRules || defaultStudyRules.ratingRules
    return activeMode[key]
  }
  // Ask the AI for changes but DON'T apply them — store a proposal to review.
  const proposeModeEdit = async (instruction, scope) => {
    if (!apiKey || modeEditBusy || !instruction?.trim()) return
    setModeEditBusy(true); setModeEditProposal(null); setAnkiError(null)
    try {
      const meta = MODE_EDIT_SCOPES[scope] || MODE_EDIT_SCOPES.cards
      const current = {}; meta.forEach((f) => { current[f.key] = modeFieldValue(f.key) })
      const prompt = `Current ${scope} settings (JSON):
${JSON.stringify(current, null, 2)}

User request: "${instruction}"

Return ONLY updated JSON with these exact keys: ${meta.map((f) => f.key).join(', ')}. Keep anything the user didn't ask to change identical to the current value.${scope === 'cards' ? ' "fields" is an object of {fieldName: boolean}.' : ''}
Output ONLY raw JSON. No markdown, no backticks.`
      const text = await aiCall(apiKey, 'You modify study-mode settings. Respond with valid JSON only.', prompt, resolveModel('general'))
      const cfg = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      const changes = []
      for (const f of meta) {
        if (cfg[f.key] === undefined) continue
        if (JSON.stringify(modeFieldValue(f.key)) !== JSON.stringify(cfg[f.key])) {
          changes.push({ key: f.key, label: f.label, before: modeFieldValue(f.key), after: cfg[f.key] })
        }
      }
      if (changes.length === 0) setAnkiError('Ebi proposed no changes — try rephrasing.')
      else setModeEditProposal({ scope, changes })
    } catch (e) {
      setAnkiError('AI edit failed: ' + e.message)
    } finally {
      setModeEditBusy(false)
    }
  }
  const acceptModeEdit = () => {
    if (!modeEditProposal) return
    const { scope, changes } = modeEditProposal
    if (scope === 'study') {
      const sr = { ...(activeMode.studyRules || defaultStudyRules) }
      changes.forEach((c) => { sr[c.key] = c.after })
      updateActiveMode({ studyRules: sr })
    } else {
      const upd = {}; changes.forEach((c) => { upd[c.key] = c.after })
      updateActiveMode(upd)
    }
    setModeEditProposal(null)
  }
  const denyModeEdit = () => setModeEditProposal(null)

  // ─── Study Session (interleaved multi-card) ────────────────────────────
  const stripHtml = (html) => {
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').trim()
  }

  // One-line preview of a card back: HTML line breaks become " · " separators instead of
  // silently fusing lines together ("som-BREH-rohTranslation: hat").
  const backPreviewText = (html) => stripHtml(String(html || '').replace(/<(?:br|hr)[^>]*>|<\/(?:div|p|li|tr)>/gi, ' · '))
    .replace(/(\s*·\s*)+/g, ' · ').replace(/^\s*·\s*|\s*·\s*$/g, '')

  // Card-back HTML → clean text lines (for the expanded deck-browser view)
  const backTextLines = (html) => stripHtml(String(html || '').replace(/<(?:br|hr)[^>]*>|<\/(?:div|p|li|tr)>/gi, '\n'))
    .split('\n').map((l) => l.trim()).filter(Boolean)

  // Days → compact interval label, Anki-style
  const fmtInterval = (d) => d >= 365 ? `${Math.round(d / 36.5) / 10}y` : d >= 30 ? `${Math.round(d / 30)}mo` : `${d}d`

  // Word-level diff (LCS) between two strings. Returns tokens tagged
  // 'same' | 'del' | 'add' so a before/after can be rendered inline.
  const diffWords = (oldStr, newStr) => {
    const a = (oldStr || '').split(/(\s+)/)
    const b = (newStr || '').split(/(\s+)/)
    const n = a.length, m = b.length
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0))
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    const out = []
    let i = 0, j = 0
    while (i < n && j < m) {
      if (a[i] === b[j]) { out.push({ type: 'same', text: a[i] }); i++; j++ }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'del', text: a[i] }); i++ }
      else { out.push({ type: 'add', text: b[j] }); j++ }
    }
    while (i < n) { out.push({ type: 'del', text: a[i++] }) }
    while (j < m) { out.push({ type: 'add', text: b[j++] }) }
    return out
  }

  // Front text (first field by order) for a deck-browser note, lowercased for sorting.
  const deckNoteFront = (note) => {
    const f = Object.entries(note.fields).sort(([, a], [, b]) => a.order - b.order)
    return stripHtml(f[0]?.[1]?.value || '').toLowerCase()
  }

  // Comparator for the deck browser sort dropdown. noteId encodes Anki's
  // creation timestamp (ms); stats.mod is last-modified (s) ≈ last studied.
  const deckNoteCompare = (sort) => (a, b) => {
    const sa = a.stats || {}, sb = b.stats || {}
    switch (sort) {
      case 'alpha-asc': return deckNoteFront(a).localeCompare(deckNoteFront(b))
      case 'alpha-desc': return deckNoteFront(b).localeCompare(deckNoteFront(a))
      case 'created-asc': return a.noteId - b.noteId
      case 'created-desc': return b.noteId - a.noteId
      case 'studied-desc': return (sb.mod || 0) - (sa.mod || 0)
      case 'studied-asc': return (sa.mod || 0) - (sb.mod || 0)
      case 'new-first': return (sa.reps || 0) - (sb.reps || 0) || b.noteId - a.noteId
      case 'problem': return (sb.lapses || 0) - (sa.lapses || 0) || (sb.reps || 0) - (sa.reps || 0)
      case 'mastered': return (sb.interval || 0) - (sa.interval || 0)
      default: return b.noteId - a.noteId
    }
  }

  // Render color-coded feedback notes for a study result (works for all modes).
  // Falls back to a legacy grammarNote if present (older in-memory results).
  const renderFeedbackNotes = (r, source) => {
    const notes = [
      ...(Array.isArray(r?.notes) ? r.notes : []),
      ...(r?.grammarNote ? [{ type: 'grammar', text: r.grammarNote }] : []),
    ]
    return notes.map((n, i) => {
      const cat = FEEDBACK_CATS[n.type] || FEEDBACK_CATS.tip
      return (
        // The category icon HANGS into the left gutter (the expanded row pads 46px left) so the
        // note text starts in the same column as every other line instead of being pushed right.
        <div key={i} style={{ color: cat.color, fontSize: 12, marginTop: 3, lineHeight: 1.6, display: 'flex' }}>
          <span style={{ fontWeight: 700, width: 22, marginLeft: -22, flexShrink: 0 }}>{cat.icon}</span>
          <span style={{ minWidth: 0 }}>{source ? renderTappableText(n.text, n.text, source) : n.text}</span>
        </div>
      )
    })
  }

  // Make each meaningful word in a study string tap-to-look-up (+ turn into an Anki card), exactly
  // like the question screen. Language modes only; `sentence` is the context sent to the lookup and
  // `source` keys which inline popup shows (so the result appears next to the clicked word). Falls
  // back to the raw text for general modes / empty strings.
  const renderTappableText = (text, sentence, source) => {
    if (activeMode.type !== 'language' || !text) return text
    return String(text).split(/(\s+)/).map((tok, ti) => {
      if (/^\s+$/.test(tok) || tok === '') return <span key={ti}>{tok}</span>
      const clean = tok.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
      if (clean.length < 2 || /_{2,}/.test(tok)) return <span key={ti}>{tok}</span>
      return (
        <span key={ti} className="study-word" onClick={() => lookupStudyWord(clean, sentence || text, source)}
          title={`What does "${clean}" mean?`} style={{ cursor: 'pointer', display: 'inline-block' }}>
          <span className="study-word-inner" style={{ display: 'inline-block' }}>{tok}</span>
        </span>
      )
    })
  }

  // The tapped-word popup (in-context meaning + "Make Anki card") rendered inline wherever a word was
  // tapped. `source` must match the value passed to lookupStudyWord, so only that spot shows the popup.
  const renderWordLookupPopup = (source) => {
    if (activeMode.type !== 'language' || !studyWordLookup || (studyWordLookup.source || 'question') !== source) return null
    return (
      <div style={{ background: 'rgba(223,37,64,.06)', border: '1px solid rgba(223,37,64,.2)', borderRadius: 5, padding: '5px 10px', margin: '6px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Row 1: the tapped word + its in-context meaning, and the × that backs out */}
        <div style={{ fontSize: 11, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: 'var(--c-brand)' }}>{studyWordLookup.word}</span>
          {/* Hear the tapped word — covers "I don't know how to pronounce this word in the question" */}
          <Pronunciation word={studyWordLookup.word} lang={learnLangName()} region={pronRegion()} config={pronunciationCfg} t={t} compact />
          {/* …and read it: text phonetics in the same style as the card backs (pah-RAH-gwahs) */}
          {studyWordLookup.pron && !studyWordLookup.loading && (
            <span style={{ color: 'var(--c-ink-dim)', fontStyle: 'italic', fontWeight: 600 }}>/{studyWordLookup.pron}/</span>
          )}
          <span style={{ color: 'var(--c-ink-dim)' }}>—</span>
          {studyWordLookup.loading ? (
            <span style={{ flex: 1, color: 'var(--c-ink-dim)' }}>Looking up…</span>
          ) : (
            <span style={{ flex: 1 }}>
              <span style={{ color: 'var(--c-success)', fontWeight: 700 }}>{studyWordLookup.primary}</span>
              {studyWordLookup.alternatives?.length > 0 && (
                <span style={{ color: 'var(--c-ink-faint)' }}> · also <span style={{ color: 'var(--c-purple)', fontWeight: 600 }}>{studyWordLookup.alternatives.join(', ')}</span></span>
              )}
            </span>
          )}
          <span onClick={() => setStudyWordLookup(null)} title="Close" style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1 }}>×</span>
        </div>

        {/* Row 2: turn this word into an Anki card. generateCards is language/topic-agnostic. */}
        {!studyWordLookup.loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', borderTop: '1px solid rgba(223,37,64,.15)', paddingTop: 6 }}>
            {studyWordLookup.cardSynced ? (
              <span style={{ fontSize: 11, color: 'var(--c-success)', fontWeight: 700 }}>✓ Added to {studyWordLookup.cardDeck}</span>
            ) : studyWordLookup.card ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }}>
                <div style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>
                  New card — <span style={{ color: 'var(--c-ink)', fontWeight: 700 }}>{studyWordLookup.card.front}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--c-ink)', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 5, padding: '6px 9px', lineHeight: 1.55, maxHeight: 150, overflowY: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: cardBackToHtml(studyWordLookup.card.back) }} />
                {studyWordLookup.card.correction && (
                  <div style={{ fontSize: 10, color: 'var(--c-warning)' }}>⚠ {studyWordLookup.card.correction}</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                  <button onClick={studyWordSyncCard} disabled={studyWordLookup.cardSyncing || !ankiConnected}
                    title={ankiConnected ? `Add to ${studyWordCardDeck()}` : 'Anki not connected'}
                    style={{ ...S.ghostBtn, fontSize: 11, padding: '4px 12px', fontWeight: 700, color: 'var(--c-success)', borderColor: 'rgba(24,169,87,.45)', opacity: (studyWordLookup.cardSyncing || !ankiConnected) ? 0.5 : 1, cursor: (studyWordLookup.cardSyncing || !ankiConnected) ? 'default' : 'pointer' }}>
                    {studyWordLookup.cardSyncing ? 'Adding…' : `✓ Add to ${studyWordCardDeck()}`}
                  </button>
                </div>
              </div>
            ) : studyWordLookup.cardLoading ? (
              <span style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>Creating card…</span>
            ) : (
              <button onClick={studyWordMakeCard} disabled={!apiKey}
                style={{ ...S.ghostBtn, fontSize: 11, padding: '3px 10px', fontWeight: 700, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.4)', opacity: apiKey ? 1 : 0.5, cursor: apiKey ? 'pointer' : 'default' }}>
                ➕ Make Anki card
              </button>
            )}
            {/* Memory hook for the TAPPED word (not the card being tested) — a quick "how do I
                remember this one again?" without leaving the question. Same engine as everywhere. */}
            <button onClick={studyWordMemoryHook} disabled={!apiKey || studyWordLookup.hookLoading}
              title="Ebi builds a memory aid for this word"
              style={{ ...S.ghostBtn, fontSize: 11, padding: '3px 10px', fontWeight: 700, color: 'var(--c-purple)', borderColor: 'rgba(139,92,246,.4)', opacity: (apiKey && !studyWordLookup.hookLoading) ? 1 : 0.5, cursor: apiKey ? 'pointer' : 'default' }}>
              🧠 {studyWordLookup.hookLoading ? 'Thinking…' : (studyWordLookup.hooks?.length ? '↻ Another hook' : 'Memory hook')}
            </button>
            {studyWordLookup.cardError && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>{studyWordLookup.cardError}</span>}
            {studyWordLookup.hookError && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>{studyWordLookup.hookError}</span>}
          </div>
        )}
        {(studyWordLookup.hooks || []).map((hook, hi) => (
          <div key={hi} style={{ fontSize: 11, color: 'var(--c-ink)', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 6, padding: '7px 10px', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 700, color: 'var(--c-purple)' }}>🧠 </span>{hook}
          </div>
        ))}
      </div>
    )
  }

  // Per-question row in the feedback views (graded list + Batch Results): collapsed by default to
  // a one-line header with a tri-state indicator — ✓ green = perfect with nothing to review,
  // ✓✎ amber = correct but Ebi left feedback, ✗ red = incorrect. Click to expand the full detail.
  const [studyQaOpen, setStudyQaOpen] = useState({})
  const renderQaRow = (cs, ci, qi, src, showAttempts = false) => {
    const r = cs.results[qi] || {}
    const gq = getQuestionText(cs.questions[qi])
    const open = !!studyQaOpen[src]
    const st = !r.correct ? 'wrong' : ((r.notes || []).some((n) => n && n.type !== 'praise') ? 'noted' : 'clean')
    const meta = st === 'wrong'
      ? { icon: '✗', color: 'var(--c-danger)', bg: 'rgba(229,57,46,.05)', title: 'Incorrect — click for details' }
      : st === 'noted'
        ? { icon: '✓✎', color: 'var(--c-warning)', bg: 'rgba(232,147,12,.04)', title: 'Correct, but Ebi left feedback — click to read it' }
        : { icon: '✓', color: 'var(--c-success)', bg: 'rgba(24,169,87,.03)', title: 'Perfect — nothing to review' }
    return (
      <div key={qi} style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="row-head" onClick={() => setStudyQaOpen((p) => ({ ...p, [src]: !p[src] }))} title={meta.title}
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: meta.bg }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: meta.color, minWidth: 26, flexShrink: 0 }}>{meta.icon}</span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--c-ink-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{gq}</span>
          <span style={{ fontSize: 10, color: 'var(--c-ink-faint)', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
        </div>
        {open && (
          <div style={{ padding: '2px 14px 10px 46px', fontSize: 13.5, background: meta.bg, lineHeight: 1.65 }}>
            <div style={{ color: 'var(--c-ink-dim)', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Q:</span> {renderTappableText(gq, gq, src)}</div>
            {showAttempts && cs.questionAttempts?.[qi]?.length > 1 && (
              <div style={{ color: 'var(--c-ink-faint)', fontSize: 11.5, marginBottom: 4 }}>Previous attempts: {cs.questionAttempts[qi].slice(0, -1).join(', ')}</div>
            )}
            <div style={{ color: 'var(--c-ink)', marginBottom: 5 }}><span style={{ fontWeight: 600 }}>Your answer:</span> {cs.answers[qi]}</div>
            <div style={{ color: r.correct ? 'var(--c-success)' : 'var(--c-warning)', fontSize: 12.5 }}>{renderTappableText(r.feedback, r.feedback, src)}</div>
            {renderFeedbackNotes(r, src)}
            {renderWordLookupPopup(src)}
          </div>
        )}
      </div>
    )
  }

  // The two mutually-exclusive header toggles for a graded card. Opening one closes the other (single
  // `studyGradedView[ci]` value), and clicking the open one collapses the card. stopPropagation so a stray
  // header handler can't double-fire.
  // Feedback toggle — shows the questions/answers/feedback/chat.
  const renderFeedbackToggle = (cs, ci, active) => (
    <button
      onClick={(e) => { e.stopPropagation(); setStudyGradedView(p => ({ ...p, [ci]: p[ci] === 'feedback' ? undefined : 'feedback' })) }}
      title="Show this card's questions and feedback"
      style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 9px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap', color: active ? 'var(--c-brand)' : 'var(--c-ink-dim)', borderColor: active ? 'rgba(223,37,64,.45)' : 'var(--c-border)', background: active ? 'rgba(223,37,64,.12)' : 'transparent' }}>
      {active ? '▾' : '▸'} Feedback
    </button>
  )
  // "🧠 Help me remember" trigger — shows Ebi's memory hook (and generates it on first open).
  const renderMnemonicButton = (cs, ci, active) => (
    <button
      onClick={(e) => {
        e.stopPropagation()
        const hasContent = cs.mnemonics?.length || cs.mnemonicLoading
        // If there's nothing to show yet, always OPEN (never collapse an empty panel while it generates).
        // Only toggle closed once there's actual content to hide.
        setStudyGradedView(p => (!hasContent ? { ...p, [ci]: 'mnemonic' } : { ...p, [ci]: p[ci] === 'mnemonic' ? undefined : 'mnemonic' }))
        if (!cs.mnemonics?.length && !cs.mnemonicLoading) generateMnemonic(ci, cs)
      }}
      disabled={!apiKey || cs.mnemonicLoading}
      title={apiKey ? 'Ebi builds a memory aid for this card' : 'Add an API key first'}
      className="hover-dim"
      style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 9px', fontWeight: 700, flexShrink: 0, whiteSpace: 'nowrap', color: 'var(--c-purple)', borderColor: active ? 'rgba(139,92,246,.6)' : 'rgba(139,92,246,.4)', background: active ? 'rgba(139,92,246,.16)' : 'transparent', opacity: (apiKey && !cs.mnemonicLoading) ? 1 : 0.6, cursor: apiKey ? 'pointer' : 'default' }}>
      🧠 {cs.mnemonicLoading ? 'Thinking…' : (cs.mnemonics?.length ? 'Memory hook' : 'Help me remember')}
    </button>
  )

  // Ebi's memory-aid RESULT block, shown in the expanded card body. Display-only: the trigger is the
  // header button (renderMnemonicButton). Lists EVERY generated hook stacked (newest at the bottom);
  // "Another hook" APPENDS a new one rather than replacing. Renders nothing until generation has started.
  const renderMnemonic = (cs, ci) => {
    const hooks = Array.isArray(cs.mnemonics) ? cs.mnemonics : []
    if (!hooks.length && !cs.mnemonicLoading && !cs.mnemonicError) return null
    return (
      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {hooks.map((hook, hi) => (
          <div key={hi} style={{ fontSize: 11, color: 'var(--c-ink)', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 6, padding: '8px 10px', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 700, color: 'var(--c-purple)', marginBottom: 3 }}>🧠 Ebi's memory hook{hooks.length > 1 ? ` #${hi + 1}` : ''}</div>
            {hook}
          </div>
        ))}
        {cs.mnemonicLoading && <div style={{ fontSize: 11, color: 'var(--c-purple)' }}>🧠 Ebi is thinking of {hooks.length ? 'another' : 'a'} memory hook…</div>}
        {cs.mnemonicError && <div style={{ fontSize: 10, color: 'var(--c-danger)' }}>{cs.mnemonicError}</div>}
        <div>
          <button onClick={() => generateMnemonic(ci, cs)} disabled={cs.mnemonicLoading || !apiKey}
            style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 8px', background: 'transparent', opacity: (cs.mnemonicLoading || !apiKey) ? 0.5 : 1 }}>
            {cs.mnemonicLoading ? 'Thinking…' : '↻ Another hook'}
          </button>
        </div>
      </div>
    )
  }

  // Small legend popover explaining the feedback colors.
  const FeedbackLegend = () => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setStudyLegendOpen(o => !o)} className="ui-btn"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: studyLegendOpen ? 'rgba(139,92,246,0.2)' : 'rgba(139,92,246,0.12)', color: 'var(--c-purple)', border: '1px solid rgba(139,92,246,0.45)', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
        <span style={{ display: 'inline-flex', gap: 2 }}>
          {['var(--c-success)', 'var(--c-danger)', 'var(--c-warning)', 'var(--c-brand)'].map(c => (
            <span key={c} style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
          ))}
        </span>
        {studyLegendOpen ? t('hideLegend') : t('colorLegend')}
      </button>
      {studyLegendOpen && (
        <div style={{ position: 'absolute', right: 0, top: '110%', zIndex: 20, background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 6, padding: '8px 10px', width: 230, boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
          <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', fontWeight: 700, marginBottom: 6 }}>Feedback colors</div>
          {FEEDBACK_CAT_ORDER.map((k) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ color: FEEDBACK_CATS[k].color, fontWeight: 700, width: 12, textAlign: 'center' }}>{FEEDBACK_CATS[k].icon}</span>
              <span style={{ color: FEEDBACK_CATS[k].color, fontSize: 10 }}>{FEEDBACK_CATS[k].label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  // ── HARD GUARANTEE: the answer must never appear inside a question's own text ──────────────
  // The model sometimes writes the target word INTO the disambiguating cue ("…rollo de papel o
  // pergamino…" when the answer IS "pergamino"), which destroys the question. Detection is
  // accent-insensitive and whole-word; explanation questions (no exact answer) are exempt.
  const leakNorm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  const questionAnswerLeak = (q) => {
    if (!q || q.type === 'explanation') return null
    const accepted = Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []
    if (accepted.length === 0) return null
    const text = leakNorm(q.question || '')
    for (const a of accepted) {
      const na = leakNorm(a).trim()
      if (na.length < 3) continue // 1-2 letter "answers" would false-positive on articles/particles
      const re = new RegExp(`(^|[^\\p{L}\\p{N}])${na.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'u')
      if (re.test(text)) return a
    }
    return null
  }
  // Last-resort scrub (when even the regeneration leaked): blank the answer tokens out of the
  // question text so a leak can NEVER reach the student. "…papel o pergamino que…" → "…papel o ___ que…".
  const scrubAnswerFromQuestion = (q) => {
    if (!questionAnswerLeak(q)) return q
    const acceptedNorm = new Set((q.acceptedAnswers || []).map((a) => leakNorm(a).trim()).filter((a) => a.length >= 3))
    let question = String(q.question).split(/(\p{L}+)/u).map((tok) => (acceptedNorm.has(leakNorm(tok)) ? '___' : tok)).join('')
    // Multi-word answers survive the token pass — strike them directly, case-insensitively.
    if (questionAnswerLeak({ ...q, question })) {
      for (const a of q.acceptedAnswers || []) {
        if (String(a).trim().length < 3) continue
        question = question.replace(new RegExp(String(a).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '___')
      }
    }
    return { ...q, question }
  }

  // FUZZY variant for HINTS: also catches plural/gender/derived forms ("pergaminos" when the
  // answer is "pergamino"). Questions keep the exact whole-word check (a fuzzy match could
  // wrongly scrub legitimate context words from a fill-in-the-blank sentence); for a HINT,
  // over-scrubbing is harmless and revealing the answer is fatal.
  const hintTokenLeaks = (tok, na) =>
    tok === na || (na.length >= 6 && tok.startsWith(na.slice(0, na.length - 2)) && tok.length <= na.length + 3)
  const hintRevealsAnswer = (text, accepted) => {
    const normText = leakNorm(text)
    const toks = normText.split(/[^\p{L}\p{N}]+/u).filter(Boolean)
    const answers = (accepted || []).map((a) => leakNorm(a).trim()).filter((a) => a.length >= 3)
    return answers.some((na) => (na.includes(' ') ? normText.includes(na) : toks.some((tok) => hintTokenLeaks(tok, na))))
  }
  const scrubHint = (text, accepted) => {
    const answers = (accepted || []).map((a) => leakNorm(a).trim()).filter((a) => a.length >= 3)
    let out = String(text).split(/(\p{L}+)/u).map((tok) => {
      if (!/\p{L}/u.test(tok)) return tok
      const nt = leakNorm(tok)
      return answers.some((na) => !na.includes(' ') && hintTokenLeaks(nt, na)) ? '___' : tok
    }).join('')
    for (const a of accepted || []) {
      const raw = String(a).trim()
      if (raw.includes(' ') && raw.length >= 3) out = out.replace(new RegExp(raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '___')
    }
    return out
  }

  const generateQuestionsForCard = async (card, rules, studyLang, knowledgeContext, wantChoices = false) => {
    const front = getCardFront(card)
    const back = getCardBack(card)
    // Huge knowledge bases: replace the caller's static (truncated) context with the book
    // sections relevant to THIS card, picked via the TOC. Small KBs keep the caller's string.
    if (knowledgeIsBig()) {
      const kctx = await getKnowledgeContext(`Generating quiz questions for the flashcard "${front}" — ${back.slice(0, 300)}`, KNOWLEDGE_CAP, `card:${front}`)
      if (kctx) knowledgeContext = `${kctx}\n\nUse this context to create more specific, contextual questions.`
    }
    const n = rules.questionsPerCard || 3
    const questionPrompt = rules.questionPrompt || defaultStudyRules.questionPrompt
    // User-taught question-style preferences (saved from the study feedback chat via the
    // "question_preference" action, or edited in Settings → Study). The user can't edit code,
    // but they CAN steer how Ebi forms questions for this mode — essential with infinite subjects.
    const qPrefs = (Array.isArray(rules.questionPreferences) ? rules.questionPreferences : []).map((p) => String(p).trim()).filter(Boolean)
    const qPrefsBlock = qPrefs.length
      ? `\n\nUSER'S QUESTION-STYLE PREFERENCES — the student explicitly asked for these; follow them when forming questions (they govern STYLE and question form, and never override the safety rules above about ambiguity or the answer appearing in the question):\n${qPrefs.map((p) => `- ${p}`).join('\n')}`
      : ''
    const isLanguage = activeMode.type === 'language'

    // Two DISTINCT languages — never conflate them:
    //  learnLang = the language being LEARNED → the answer (and target-language sentences) are in it
    //  quizLang  = "Ebi speaks" → the language Ebi PHRASES questions & feedback in
    //  userLang  = the user's own language → what word-hint glosses are written in
    const userLang = userLangName()
    // General modes have no LEARNED language (the "answer language" concept doesn't apply), but
    // "Ebi speaks" (quizLanguage) still works: a music-theory mode can be quizzed in Spanish.
    // It only changes how Ebi PHRASES things — never turns the mode into a language course.
    const learnLang = isLanguage ? (studyLang || learnLangName()) : userLang
    const quizLang = isLanguage ? (rules.quizLanguage || studyLang || learnLang) : (rules.quizLanguage || userLang)
    const sameLang = quizLang.toLowerCase() === learnLang.toLowerCase()
    const wantHints = isLanguage && !!rules.wordHints

    const deepQ = isLanguage
      ? `Q${n} (USAGE/DEPTH): Test deeper PRACTICAL command of the ${learnLang} word in a way a LEARNER can actually answer — e.g. use it correctly in a short sentence, pick it over a close synonym for a given context, choose the right form for a stated subject/time, give its opposite, or a common collocation. Stay within the everyday/general meaning unless the card explicitly indicates a specialized domain. DO NOT ask the student to EXPLAIN grammar/spelling theory, orthographic or etymological rules, or to use metalinguistic terminology (e.g. NEVER "explica qué cambio ortográfico ocurre / por qué se añade la y / qué regla se aplica"). Test USING the language, not describing its rules. Phrase the question in ${quizLang}.`
      : `Q${n} (DEEP UNDERSTANDING): May freely name the subject. Test HOW, WHY, WHEN, or process. E.g. "Explain how X works" or "What distinguishes X from Y?" Open-ended — student demonstrates conceptual depth.`

    const q1Language = `Q1 (TRANSLATION PRODUCTION): Ask the student to PRODUCE the ${learnLang} word for the card's meaning. Phrase the instruction in ${quizLang}${sameLang ? `, e.g. "¿Cómo se dice '<meaning>'?"-style natural ${learnLang} (no need to name the language since you are already speaking it; if you DO name it, use its endonym, never the English name)` : `, e.g. "Translate to ${learnLang}: '<the ${userLang} meaning>'" or "How do you say '<the ${userLang} meaning>' in ${learnLang}?"`}. The expected answer is ALWAYS the ${learnLang} word/phrase on the card (never the ${userLang} meaning). acceptedAnswers MUST be the ${learnLang} word(s), lowercase, with and without accents. Type MUST be "recall".
  TRANSLATION AMBIGUITY CHECK (apply before finalizing Q1): does the meaning have MULTIPLE common ${learnLang} translations, with the card's target word being only one of several synonyms? E.g. English "favorable" → "favorable", "propicio", "auspicioso"; "happy" → "feliz", "contento", "alegre". If YES, a bare translation prompt is UNFAIR — the student cannot know which synonym you want. You MUST add a disambiguating cue INSIDE the question that singles out the target word WITHOUT stating it: a sense/nuance gloss, a register note (formal / literario / coloquial), a domain, and/or the first letter. Only when the translation is genuinely one-to-one may you leave it as a plain translation prompt.`
    const q1General = `Q1 (BLIND RECALL): Never name or hint at the target word/answer. Present a scenario, definition, or usage context that forces the student to produce the exact word. Example: "You need to X in situation Y — what word/tool/concept applies?"`
    const q2Language = `Q2–Q${n - 1} (CONTEXTUAL USAGE): A fill-in-the-blank where the target ${learnLang} word is the ONLY correct answer. The blanked SENTENCE itself stays in ${learnLang} (it must contain the ${learnLang} answer); the surrounding instruction is in ${quizLang}. Because synonyms almost always exist, do NOT rely on engineering a 'perfect' sentence — you MUST place a compact parenthetical cue in ${quizLang} directly at the blank that pins the EXACT target word by its precise sense/nuance, PLUS its first letter whenever a synonym would still fit. Example: "La gacela ___ (escapar de un depredador; empieza con "h") a toda velocidad" points only to "huye/huyó" (the verb huir), not "corre" or "escapa". The parenthetical cue is what GUARANTEES a single answer. INFLECTION: if the target is a verb or other inflected word, the sentence MUST supply the tense/aspect/person it expects (a time adverb like "ayer/ahora/mañana", an explicit subject, or agreement) so exactly ONE form is right — otherwise DO NOT require a specific conjugation, and list EVERY valid form (e.g. both "huye" and "huyó") in acceptedAnswers. Never demand a tense the sentence does not signal. Apply the AMBIGUITY SELF-CHECK below to EVERY such question. Each from a DIFFERENT angle.`
    const q2General = `Q2–Q${n - 1} (GUIDED RECALL / APPLICATION): May reference related concepts, synonyms as contrast, fill-in-the-blank, OR a short realistic scenario asking which concept/technique from this card applies (great for practical subjects — certifications, soft skills, procedures). Must still point at the card's EXACT term/concept as the answer. Each from a DIFFERENT angle.`

    const orderRules = n === 1
      ? (isLanguage ? q1Language : `Generate 1 question. It must be BLIND RECALL — never mention the target word/answer.`)
      : [
          `Generate exactly ${n} questions in this STRICT ORDER:`,
          isLanguage ? q1Language : q1General,
          n >= 3 ? (isLanguage ? q2Language : q2General) : null,
          deepQ,
        ].filter(Boolean).join('\n')

    // Multiple-choice practice session: every question must be answerable by picking ONE option.
    // The distractor rules replace the inline-cue burden — options only need ONE defensible answer.
    const choicesBlock = !wantChoices ? '' : `\nMULTIPLE-CHOICE SESSION — REQUIRED:\n- Every question will be answered by picking ONE option from a list, never by typing. Do NOT generate open "explain in your own words" questions: where a depth/usage question is called for, ask it as something with ONE selectable answer (e.g. "Which sentence uses the word correctly?", "Which statement about X is true?", "Which option means ...?"). Use type "recall" or "fill_blank" for every question.\n- For EACH question ALSO return:\n  "choices": exactly 4 options — 1 correct + 3 plausible but clearly WRONG distractors. Distractors must be the same kind of thing as the answer (same part of speech / same category / same level of detail), must fit the question grammatically, and must be tempting to someone who half-knows the material — but NEVER defensible as correct. NEVER include two options that could both be argued correct (no synonyms of the answer, no alternate spellings of it).\n  "answerIdx": the 0-based index of the correct option within "choices".\n- The correct option must be EXACTLY one of the acceptedAnswers (same casing rules aside).\n- Write the options in the same language as the expected answer${isLanguage ? ` (${learnLang})` : ''}; keep each option SHORT (a word, phrase, or one short sentence).\n- With options visible, first-letter cues would give the answer away — do NOT add "empieza con"-style letter cues to the question text; a sense/nuance cue is still fine.\n`

    const generalBlock = isLanguage ? '' : `\nGENERAL STUDY MODE — REQUIRED:\n- This is a general study mode for the subject "${activeMode.name}"${activeMode.description ? ` (${activeMode.description})` : ''}. It is NOT a language course.\n- Match the question style to what the subject actually IS: exam-style for certifications, applied "what would you do/use" for practical skills and procedures, notation/theory for music or math, cause/effect for science or history. The card and the subject decide — never force one template onto every subject.\n- Write EVERY question, instruction, and all framing in ${quizLang} (that is the language Ebi speaks to this student).\n- Do NOT generate language-learning questions: never ask the student to translate, never ask "how do you say X in <language>", never ask "in <language>, what word/noun/verb…", and never quiz a word's gender, article, or conjugation. Speaking ${quizLang} does not make this a ${quizLang} course — it is still purely about "${activeMode.name}".\n- Even if a card's term is written in another language, test the underlying CONCEPT, fact, or meaning — not vocabulary translation. The expected answer is the term/concept exactly as it appears on the card (subject terms/proper names stay as-is on the card, untranslated).\n`
    const languageBlock = isLanguage ? `\nLANGUAGE MODE — REQUIRED:\n- The student is LEARNING ${learnLang}. The EXPECTED ANSWER is ALWAYS the ${learnLang} word/phrase on the card, regardless of which side it's on.\n- Identify the ${learnLang} word on the card (the one NOT written in ${userLang}) — that is the answer. The ${userLang} side is just the meaning/hint.\n- "acceptedAnswers" MUST contain the ${learnLang} word (lowercase, plus close variants with/without accents). NEVER put the ${userLang} meaning in acceptedAnswers.\n- EBI SPEAKS ${quizLang}: write all instructions, question framing, and feedback in ${quizLang}.${sameLang ? '' : ` EXCEPTION: a fill-in-the-blank/example SENTENCE that must contain the ${learnLang} answer stays in ${learnLang} (you cannot blank a ${learnLang} word out of a ${quizLang} sentence) — only the wrapper instruction around it is in ${quizLang}.`}\n- LANGUAGE NAMES = ENDONYMS: whenever a question written in ${quizLang} names a language, use that language's OWN name (its endonym), NEVER the English name. So a Spanish question says "en español" (never "en Spanish"), a French one "en français", Japanese "日本語で", German "auf Deutsch". Do NOT drop English language names into non-English text.\n- Treat the word in its BROADEST everyday meaning. If the card text doesn't pin down a specific domain, do NOT restrict questions to specialized contexts (programming, medicine, law, military, etc.). Example: "puntero" alone could be a clock hand, laser pointer, finger, or mouse cursor — don't assume programming.\n- BUT if the card text explicitly indicates a domain (e.g. back says "Pointer (C/C++)", tag mentions a field), quiz within that domain.${wantHints ? `\n- WORD HINTS: for EACH question, also return a "glosses" object mapping every ${learnLang} content word that appears in the question text (EXCEPT the answer word and the blank) to a SHORT ${userLang} meaning. Skip bare punctuation. This lets a weak ${learnLang} reader understand the sentence.` : ''}\n` : ''

    const prompt = `Card front: "${front}"\nCard back: "${back}"\n${languageBlock}${generalBlock}${choicesBlock}\n${orderRules}\n\nCRITICAL RULES:\n- Questions must require the SPECIFIC answer on this card — synonyms are NOT acceptable for recall/fill_blank questions\n- NEVER construct a question whose only purpose is to directly name the answer (e.g. "what noun corresponds to adjective X?" when that noun IS the answer)\n- THE ANSWER MUST NEVER APPEAR IN THE QUESTION TEXT — not the target word, not ANY acceptedAnswers entry, not inside the parenthetical sense cue. Writing "(rollo antiguo de papel o pergamino…)" when the answer IS "pergamino" destroys the question. Describe the sense WITHOUT the word or its inflected forms; if you can't, take a different angle instead.\n- Each question must test a DIFFERENT angle\n- AMBIGUITY SELF-CHECK (apply to EVERY recall/fill_blank question before finalizing): mentally substitute 2–3 plausible alternative ${learnLang} words — ESPECIALLY synonyms — into the question. If ANY of them still fit after reading the WHOLE question, it is INVALID and you MUST fix it. THE REQUIRED FIX: embed a compact parenthetical cue in ${quizLang} right at the blank that names the target word's precise meaning/nuance, and ADD its first letter whenever a synonym would otherwise survive. This inline cue is PART OF the question text and is mandatory for any word that has synonyms — a bare sentence is almost never enough. (The separate hint1/hint2 fields are revealed only on demand and do NOT count as disambiguation.) A blank surrounded only by a GENERIC predicate that many words satisfy is INVALID until you add the cue. Prefer a slightly over-specified question with a clear cue over an elegant but ambiguous one.\n  - BAD: "Al ver al depredador, la gacela ___ a toda velocidad para salvar su vida." Target "huye" — but "corre", "escapa", "salta" all fit. INVALID.\n  - GOOD: "Al ver al depredador, la gacela ___ (escapar de un peligro; empieza con "h") a toda velocidad para salvar su vida." — the cue pins "huye".\n  - BAD: "Sienten una atracción ___: él la quiere a ella y ella lo quiere a él por igual." Target "recíproca" — but "mutua" fits equally. INVALID.\n  - GOOD: "Sienten una atracción ___ (correspondida por ambos; empieza con "r"): él la quiere a ella y ella lo quiere a él por igual." — the cue pins "recíproca".\n- For language cards: test usage in sentences, grammatical properties, contextual usage\n- For conceptual cards: test application, process, comparison\n\n${questionPrompt}${qPrefsBlock}\n\n${isLanguage ? `Phrase every question and its framing in ${quizLang} (target-language sentences that hold the ${learnLang} answer stay in ${learnLang}).` : `Write all questions in ${quizLang}.`}${knowledgeContext}\n\nReturn a JSON array of exactly ${n} objects:\n[\n  {\n    "question": "the question text",\n    "type": "recall" | "fill_blank" | "explanation",\n    "hint1": "N letters" (letter count of primary answer, null for explanation),\n    "hint2": "starts with 'X'" (first letter of primary answer, null for explanation),\n    "acceptedAnswers": ["answer1", "answer2"] (lowercase; exact words that are correct; empty for explanation),${wantChoices ? `\n    "choices": ["option1", "option2", "option3", "option4"] (exactly 4; one correct + 3 plausible-but-wrong distractors),\n    "answerIdx": 0 (index of the correct option in "choices"),` : ''}${wantHints ? `\n    "glosses": { "<non-answer ${learnLang} word in the question>": "<short ${userLang} meaning>" } (only ${learnLang} content words shown in the question, excluding the answer/blank; {} if none),` : ''}\n    "pose": one mascot pose name that best fits this question's topic, chosen ONLY from: ${POSE_NAMES.join(', ')} (use "default" if none fit)\n  }\n]\nOutput ONLY raw JSON array. No markdown, no backticks.`

    // Generate → leak-check → REGENERATE (up to twice, with the violation named) so the question
    // reads naturally without the answer; the scrub is only the absolute last resort so a leak can
    // never ship. The prompt forbids the answer inside the question text, but prompts are advisory —
    // this loop is the guarantee.
    let leakRetryNote = ''
    for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const text = await aiCall(apiKey, 'You generate structured flashcard quiz questions. Always respond with a valid JSON array of objects.', prompt + leakRetryNote, resolveModel('study'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      if (!Array.isArray(parsed)) throw new Error('not array')
      const questions = parsed.slice(0, n).map(q => {
        // Multiple-choice: validate + SHUFFLE client-side (models bias the correct option's slot).
        // A question that arrives without usable choices keeps choices:null — the UI falls back to
        // typed input for it and the whole card is then graded by the AI path instead of locally.
        let choices = null, answerIdx = null
        if (wantChoices && q && Array.isArray(q.choices) && Number.isInteger(q.answerIdx) && q.answerIdx >= 0 && q.answerIdx < q.choices.length) {
          const correctText = String(q.choices[q.answerIdx])
          const opts = [...new Set(q.choices.map(c => String(c)))].slice(0, 4)
          if (!opts.includes(correctText)) opts[opts.length - 1] = correctText
          if (opts.length >= 2) {
            for (let i = opts.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]
            }
            choices = opts
            answerIdx = opts.indexOf(correctText)
          }
        }
        return {
          question: typeof q === 'string' ? q : (q.question || ''),
          type: q.type || 'recall',
          hint1: q.hint1 || null,
          hint2: q.hint2 || null,
          acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.map(a => String(a).toLowerCase().trim()) : [],
          glosses: (q && typeof q.glosses === 'object' && !Array.isArray(q.glosses)) ? q.glosses : null, // word-hint map (learnLang word → userLang meaning)
          pose: (typeof q === 'object' && q.pose) ? String(q.pose).toLowerCase().trim() : null, // precomputed mascot pose
          choices,
          answerIdx,
        }
      })

      // General modes: the LAST question is deep-understanding and is ALLOWED to name the subject
      // ("Explain how the OSI model works") — exempt it. Language deep questions test USAGE and
      // must still never contain the answer.
      const leakExempt = (qi) => !isLanguage && qi === questions.length - 1
      const leaked = [...new Set(questions.map((q, qi) => (leakExempt(qi) ? null : questionAnswerLeak(q))).filter(Boolean))]
      if (leaked.length === 0) return questions
      console.warn(`[Study] answer leaked into question text (attempt ${attempt + 1}) for "${front}":`, leaked.join(', '))
      if (attempt < 2) {
        leakRetryNote = `\n\nYOUR PREVIOUS ATTEMPT WAS REJECTED: the answer itself appeared inside a question's text (${leaked.map((w) => `"${w}"`).join(', ')}). Rewrite the questions from scratch so they read naturally WITHOUT the target word or ANY acceptedAnswers entry anywhere in the question text — not even inside the parenthetical sense cue. Describe the meaning in other words entirely.`
        continue
      }
      // Two regenerations still leaked — scrub so the leak can never reach the student.
      console.warn('[Study] still leaking after two regenerations — scrubbing the answer out of the question text')
      return questions.map((q, qi) => (leakExempt(qi) ? q : scrubAnswerFromQuestion(q)))
    } catch (err) {
      if (attempt < 2) { console.warn('[Study] question generation failed, retrying:', err.message); continue }
    }
    }
    const fallback = [
      { question: `What concept relates to: ${back.slice(0, 30)}...?`, type: 'recall', hint1: `${back.split(/\s+/)[0].length} letters`, hint2: `starts with '${back[0]?.toUpperCase() || '?'}'`, acceptedAnswers: [back.toLowerCase().trim()] },
      { question: `Explain this in your own words.`, type: 'explanation', hint1: null, hint2: null, acceptedAnswers: [] },
      { question: `Why is this important?`, type: 'explanation', hint1: null, hint2: null, acceptedAnswers: [] },
    ]
    return fallback.slice(0, n)
  }

  // ---------------------------------------------------------------------------------------------
  // PBQ pipeline — generate ONE verified performance-based question for a card, or null (discard).
  // Reliability comes from the pipeline, not the prompt: (1) the generator authors in an index-free
  // format that `compilePbq` validates/shuffles deterministically; (2) with a knowledge base, every
  // citation quote must appear VERBATIM in the source (string check — fabrications die here);
  // (3) a BLIND SOLVER gets only the student view (never the key) and must independently reach the
  // same answer; (4) on disagreement a judge adjudicates — only "solver_wrong" lets the key stand,
  // anything else feeds the discrepancy back for ONE regeneration, then the candidate is discarded.
  // Grading at answer time is deterministic (engine.gradePbq) — no AI in the loop while studying.
  // ---------------------------------------------------------------------------------------------
  const parsePbqJson = (text) => {
    try { return JSON.parse(String(text).trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, '')) } catch { return null }
  }

  const generatePbqForCard = async (card, rules, knowledgeContext) => {
    const front = getCardFront(card)
    const back = getCardBack(card)
    const lang = interactionLangName(rules)
    let kctx = knowledgeContext || ''
    if (knowledgeIsBig()) {
      const k = await getKnowledgeContext(`Creating an interactive exam exercise about "${front}" — ${back.slice(0, 300)}`, KNOWLEDGE_CAP, `card:${front}`)
      if (k) kctx = k
    }
    let priorFailure = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const genText = await aiCall(apiKey, PBQ_GEN_SYSTEM,
          buildPbqGeneratorPrompt({ subject: activeMode.name, front, back, lang, knowledgeContext: kctx || null, priorFailure }),
          resolveModel('study'))
        const raw = parsePbqJson(genText)
        if (!raw) { priorFailure = 'the response was not a single valid JSON object'; continue }
        // Relevance gate: an off-subject card (e.g. a stray vocab card in a cert deck) is skipped
        // outright — no retry, which would only pressure the model into inventing a connection.
        if (raw.kind === 'skip') { console.log('[PBQ] card skipped as off-subject:', front, '—', raw.reason || ''); return null }
        const compiled = compilePbq(raw)
        if (!compiled.ok) { priorFailure = `structural problems: ${compiled.errors.join('; ')}`; continue }
        if (kctx) {
          const cc = checkCitations(raw, kctx)
          if (!cc.ok) { priorFailure = `these citation quotes do NOT appear verbatim in the reference material: ${cc.missing.slice(0, 2).map(m => `"${m}"`).join(', ')}`; continue }
        }
        // Blind solve: an independent expert pass that never sees the answer key
        const solverRaw = await aiCall(apiKey, PBQ_SOLVER_SYSTEM, buildPbqSolverPrompt(studentView(compiled.pbq), lang), resolveModel('study'))
        const solved = parseSolverAnswer(compiled.pbq, parsePbqJson(solverRaw))
        const cmp = compareToKey(compiled.pbq, solved)
        if (cmp.match) { console.log('[PBQ] verified — blind solve matched:', compiled.pbq.title); return compiled.pbq }
        // Adjudicate the disagreement
        const judgeRaw = await aiCall(apiKey, PBQ_JUDGE_SYSTEM,
          buildPbqJudgePrompt({ pbq: compiled.pbq, diffs: cmp.diffs, solverRaw, knowledgeContext: kctx || null }),
          resolveModel('study'))
        const verdict = parsePbqJson(judgeRaw)
        if (verdict?.verdict === 'solver_wrong') { console.log('[PBQ] verified — judge upheld the key:', compiled.pbq.title); return compiled.pbq }
        priorFailure = `an independent solver disagreed with your answer key (${cmp.diffs.slice(0, 3).join('; ')}); review verdict "${verdict?.verdict || 'unclear'}": ${verdict?.reason || 'no reason given'}. Build a DIFFERENT exercise on this topic with exactly one defensible key`
        console.log('[PBQ] attempt', attempt + 1, 'rejected for', front, '—', verdict?.verdict, verdict?.reason || '')
      } catch (err) {
        console.error('[PBQ] pipeline error:', err.message)
        // transient (rate limit / network) — plain retry without blaming the content
      }
    }
    console.log('[PBQ] discarded after retries:', front)
    return null
  }

  // Build a pool of words to conjugate: verbs from the user's deck + AI-supplemented common verbs.
  // Language is inferred from the deck name + card content — never assumed from the active mode.
  const generateConjugationWordPool = async (cards, deckName) => {
    const deckFronts = cards.slice(0, 30).map(c => getCardFront(c)).filter(w => w.length > 0)
    const prompt = `Deck name: "${deckName}"
Sample card fronts: ${deckFronts.slice(0, 20).join(', ')}

1. Determine the language being learned in this deck based on the deck name and card content.
2. Extract any verbs/conjugatable words found in the card fronts (fromDeck: true).
3. Supplement with up to 30 common verbs for the detected language (fromDeck: false). Only add verbs relevant to what this deck is studying.

Return a JSON object:
{
  "language": "the full language name detected (e.g. Spanish, French, English)",
  "words": [{"word": "infinitive form", "meaning": "English meaning", "fromDeck": true/false}]
}

Use up to 40 words total. No duplicates. Output ONLY raw JSON. No markdown, no backticks.`
    try {
      const text = await aiCall(apiKey, 'You help language learners practice verb conjugations. Respond with valid JSON only.', prompt, resolveModel('study'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      const language = (parsed.language && typeof parsed.language === 'string') ? parsed.language : 'English'
      const words = Array.isArray(parsed.words) ? parsed.words.filter(w => w.word && w.meaning) : []
      return { words, language }
    } catch {
      return { words: deckFronts.slice(0, 20).map(w => ({ word: w, meaning: '', fromDeck: true })), language: 'English' }
    }
  }

  // Generate conjugation practice questions for a single word.
  // `quizLang` is the language the student wants to be quizzed IN — all instructions,
  // scenario sentences, and tense/subject labels are written in it. The verb forms
  // themselves stay in `language` (the deck's language).
  const generateConjugationQuestions = async (word, meaning, language, n, quizLang = 'English') => {
    const prompt = `Generate ${n} conjugation practice questions for the ${language} verb "${word}"${meaning ? ` (meaning: "${meaning}")` : ''}.

Write ALL question text in ${quizLang}: the instructions, any fill-in-the-blank scenario sentence, and the tense/subject labels must be in ${quizLang}. Do NOT add English translations or parentheticals unless ${quizLang} is English. The conjugated verb forms themselves stay in ${language}.

Cover varied tenses and subjects. For Spanish use: present, preterite, future, imperfect, subjunctive; subjects yo/tú/él-ella/nosotros/vosotros/ellos. Adapt subjects and tenses correctly for other languages.

Each question must test exactly ONE conjugated form.
Return JSON: [{"question": "...", "type": "recall", "hint1": "X letters", "hint2": "starts with 'Y'", "acceptedAnswers": ["conjugated form"]}]

Output ONLY raw JSON. No markdown, no backticks.`
    try {
      const text = await aiCall(apiKey, 'You generate conjugation quiz questions. Always respond with a valid JSON array of objects.', prompt, resolveModel('study'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      if (!Array.isArray(parsed)) throw new Error('not array')
      return parsed.slice(0, n).map(q => ({
        question: typeof q === 'string' ? q : (q.question || ''),
        type: 'recall',
        hint1: q.hint1 || null,
        hint2: q.hint2 || null,
        acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.map(a => String(a).toLowerCase().trim()) : [],
      }))
    } catch {
      return [
        { question: `Conjugate "${word}" in the present tense (yo form).`, type: 'recall', hint1: null, hint2: null, acceptedAnswers: [] },
        { question: `Conjugate "${word}" in the preterite (él/ella form).`, type: 'recall', hint1: null, hint2: null, acceptedAnswers: [] },
        { question: `Conjugate "${word}" in the future tense (nosotros form).`, type: 'recall', hint1: null, hint2: null, acceptedAnswers: [] },
      ].slice(0, n)
    }
  }

  // Save an AI-supplemented conjugation word as a vocabulary card in the user's Anki deck
  const addConjugationWordToAnki = async (cardIdx) => {
    const cs = studyCardState[cardIdx]
    if (!cs || cs.addedToAnki) return
    try {
      const { front, back, tags } = await buildCardFields({ term: cs.front, partOfSpeech: 'verb', translation: cs.back || '' })
      await ankiAddNote(studyDeck, front, back, tags)
      setStudyCardState(prev => prev.map((c, i) => i === cardIdx ? { ...c, addedToAnki: true } : c))
    } catch (err) {
      console.error('[Conjugation] failed to add word to Anki:', err.message)
    }
  }

  // Extracts question text whether question is a string (legacy) or object {question, type, ...}
  const getQuestionText = (q) => (typeof q === 'string' ? q : q?.question || '')

  const getCardFront = (card) => {
    const fields = card.fields ? Object.values(card.fields) : []
    const firstField = [...fields].sort((a, b) => a.order - b.order)[0]
    return stripHtml(firstField?.value || card.question || '')
  }
  const getCardBack = (card) => {
    const fields = card.fields ? Object.values(card.fields) : []
    const sorted = [...fields].sort((a, b) => a.order - b.order)
    return stripHtml(sorted[1]?.value || card.answer || '')
  }

  const startStudySession = async () => {
    if (!ankiConnected) { setAnkiError('Anki is not connected'); return }
    const decks = await ankiGetDecks().catch(() => [])
    setAnkiDecks(decks)
    setStudyDeck(ankiDeck || decks[0] || '')
    setStudyActive(true)
    setStudyPhase('pick')
  }

  // PBQ pool cursor — a sync-readable mirror of studyBatchIdx so sequential "try the next card"
  // reservations inside one async pull can't double-consume a card (state reads would be stale).
  const pbqPullRef = useRef(0)

  const beginStudy = async (deck, mode = 'flashcards') => {
    // A lingering study type from another mode kind is meaningless here — fall back to flashcards.
    if (activeMode.type === 'language' && mode === 'pbq') mode = 'flashcards'
    if (activeMode.type !== 'language' && mode === 'conjugations') mode = 'flashcards'
    studySyncedIdsRef.current = new Set() // fresh session — reset the once-per-session answer guard
    setStudyMode(mode)
    setStudyLoading(true)
    setAnkiError(null)
    try {
      // Only quiz what Anki would show right now: due reviews (respects the cooldown) + new cards.
      // Do NOT fall back to all cards — that would re-quiz cards still on their Anki cooldown.
      let cardIds = await ankiFindCards(`deck:"${deck}" (is:due OR is:new)`)
      if (!cardIds || cardIds.length === 0) { setAnkiError('Nothing is due in this deck right now. Come back when Anki has cards waiting (or add new cards).'); setStudyLoading(false); return }

      const knowledgeRes = await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}`).then(r => r.json()).catch(() => ({ content: null, fileCount: 0 }))
      setStudyKnowledge(knowledgeRes.content)
      setStudyKnowledgeCount(knowledgeRes.fileCount || 0)

      const stats = await ankiGetDeckStats([deck]).catch(() => ({}))
      const deckStat = Object.values(stats)[0] || { new_count: 0, learn_count: 0, review_count: 0 }
      setStudyDeckStats(deckStat)

      const shuffled = [...cardIds].sort(() => Math.random() - 0.5)
      const cards = await ankiCardsInfo(shuffled.slice(0, 100))
      console.log('[Study] loaded', cards.length, 'cards from deck:', deck)
      setStudyAllCards(cards)
      setStudyStats({ easy: 0, good: 0, hard: 0, again: 0 })

      const rules = activeMode.studyRules || (activeMode.type === 'language' ? defaultStudyRules : defaultGeneralStudyRules)
      const cardsAtOnce = rules.cardsAtOnce || 3
      // Answer/target language — only used by language modes (general modes ignore it). Falls back
      // to the resolved learned language, never a static 'English'.
      const studyLang = rules.studyLanguage || learnLangName()
      const knowledgeContext = knowledgeRes.content ? `\n\nReference material:\n${knowledgeRes.content.substring(0, KNOWLEDGE_CAP)}\n\nUse this context to create more specific, contextual questions.` : ''

      if (mode === 'conjugations') {
        // Build word pool — language is detected from deck name + card content, not assumed from active mode
        const wordPoolResult = await generateConjugationWordPool(cards, deck)
        const { words: wordPool, language: detectedLang } = wordPoolResult
        setStudyConjugationWords(wordPool)
        setStudyConjugationLanguage(detectedLang)
        if (wordPool.length === 0) { setAnkiError('Could not generate conjugation word pool'); setStudyLoading(false); return }

        const qpc = rules.questionsPerCard || 3
        const firstWord = wordPool[0]
        const firstQuestions = await generateConjugationQuestions(firstWord.word, firstWord.meaning, detectedLang, qpc, studyLang)
        const firstCardState = {
          cardId: null, front: firstWord.word, back: firstWord.meaning,
          fromDeck: firstWord.fromDeck, isConjugation: true,
          questions: firstQuestions, answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [],
        }

        console.log('[Study:conjugations] started with first word:', firstWord.word, '— generating rest in parallel')
        setStudyCardState([firstCardState])
        setStudyBatchIdx(cardsAtOnce)
        setStudyQueue([])
        setStudyQueueIdx(0)
        setStudyInput('')
        setStudyLoading(false)
        setStudyPhase('question')

        wordPool.slice(1, cardsAtOnce).forEach(async (w) => {
          if (studyWrappingUpRef.current) return
          const questions = await generateConjugationQuestions(w.word, w.meaning, detectedLang, qpc, studyLang)
          if (studyWrappingUpRef.current) return
          setStudyCardState(prev => [...prev, {
            cardId: null, front: w.word, back: w.meaning,
            fromDeck: w.fromDeck, isConjugation: true,
            questions, answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [],
          }])
          console.log('[Study:conjugations] pool word ready:', w.word)
        })
      } else if (mode === 'pbq') {
        // PBQ session — one verified interactive exercise per card. Generation is expensive
        // (2-4 model calls each through the verify pipeline), so start with the first card that
        // survives verification and fill the rest of the pool in the background.
        const pbqFlags = { pbq: true, ...(studyPracticeSync ? {} : { noSync: true }) }
        const makePbqState = (card, pbq) => ({
          cardId: card.cardId, front: getCardFront(card), back: getCardBack(card),
          questions: [{ question: pbq.title, type: 'pbq', pbq }],
          answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [], ...pbqFlags,
        })
        let firstState = null
        let consumed = 0
        while (consumed < Math.min(cards.length, 4) && !firstState) {
          const card = cards[consumed]; consumed++
          const pbq = await generatePbqForCard(card, rules, knowledgeContext)
          if (pbq) firstState = makePbqState(card, pbq)
        }
        if (!firstState) {
          setAnkiError('Could not generate a verified PBQ for these cards — try again, or check the AI settings.')
          setStudyLoading(false)
          return
        }

        const poolTargets = cards.slice(consumed, consumed + cardsAtOnce - 1)
        consumed += poolTargets.length
        pbqPullRef.current = consumed
        setStudyCardState([firstState])
        setStudyBatchIdx(consumed)
        setStudyQueue([])
        setStudyQueueIdx(0)
        setStudyInput('')
        setStudyLoading(false)
        setStudyPhase('question')
        console.log('[PBQ] session started with:', firstState.front)

        poolTargets.forEach(async (card) => {
          if (studyWrappingUpRef.current) return
          const pbq = await generatePbqForCard(card, rules, knowledgeContext)
          if (studyWrappingUpRef.current) return
          if (pbq) {
            setStudyCardState(prev => [...prev, makePbqState(card, pbq)])
            console.log('[PBQ] pool exercise ready:', getCardFront(card))
          }
        })
      } else {
        // Multiple-choice practice session? mc → questions carry 4 options and are graded locally;
        // noSync → this is relaxed practice, its ratings are never pushed to Anki.
        const mcSession = studyAnswerStyle === 'choices'
        const mcFlags = mcSession ? { mc: true, ...(studyPracticeSync ? {} : { noSync: true }) } : {}
        // Generate card 0 first so the session starts immediately
        const firstCard = cards[0]
        const firstQuestions = await generateQuestionsForCard(firstCard, rules, studyLang, knowledgeContext, mcSession)
        const firstCardState = {
          cardId: firstCard.cardId, front: getCardFront(firstCard), back: getCardBack(firstCard),
          questions: firstQuestions, answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [], ...mcFlags,
        }

        console.log('[Study] started with first card, generating rest in parallel')
        setStudyCardState([firstCardState])
        setStudyBatchIdx(cardsAtOnce)
        setStudyQueue([])
        setStudyQueueIdx(0)
        setStudyInput('')
        setStudyLoading(false)
        setStudyPhase('question')

        // Generate remaining pool cards in parallel — each joins the pool as soon as it's ready
        cards.slice(1, cardsAtOnce).forEach(async (card) => {
          if (studyWrappingUpRef.current) return
          const questions = await generateQuestionsForCard(card, rules, studyLang, knowledgeContext, mcSession)
          if (studyWrappingUpRef.current) return
          setStudyCardState(prev => [...prev, {
            cardId: card.cardId, front: getCardFront(card), back: getCardBack(card),
            questions, answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [], ...mcFlags,
          }])
          console.log('[Study] pool card ready:', getCardFront(card))
        })
      }
    } catch (err) {
      console.error('[Study] failed to start:', err.message)
      setAnkiError('Study failed: ' + err.message)
      setStudyLoading(false)
    }
  }

  const lastAskedCardRef = useRef(null)
  const studyWrappingUpRef = useRef(false)

  // Pick a random active (not done) card — avoid same card twice in a row
  const getNextStudyQuestion = () => {
    const activeCards = studyCardState.map((cs, i) => ({ cs, i })).filter(({ cs }) => !cs.done && cs.questionIdx < cs.questions.length)
    if (activeCards.length === 0) return null
    // Exclude last asked card unless it's the only one
    let candidates = activeCards.filter(({ i }) => i !== lastAskedCardRef.current)
    if (candidates.length === 0) candidates = activeCards
    const pick = candidates[Math.floor(Math.random() * candidates.length)]
    lastAskedCardRef.current = pick.i
    return { cardIdx: pick.i, questionIdx: pick.cs.questionIdx }
  }

  const [currentQuestion, setCurrentQuestion] = useState(null)

  // ── Study session persistence — resume an in-progress session after a refresh ──────
  const [studyHydrated, setStudyHydrated] = useState(false)
  // Restore once after config loads (before the user can interact).
  useEffect(() => {
    if (!configLoaded || studyHydrated) return
    try {
      const raw = localStorage.getItem('ebiki-study-session')
      const s = raw ? JSON.parse(raw) : null
      if (s && s.studyActive) {
        setStudyAllCards(s.studyAllCards || [])
        setStudyCardState(s.studyCardState || [])
        setStudyBatchIdx(s.studyBatchIdx || 0)
        pbqPullRef.current = s.studyBatchIdx || 0
        setStudyQueue(s.studyQueue || [])
        setStudyQueueIdx(s.studyQueueIdx || 0)
        setStudyStats(s.studyStats || { easy: 0, good: 0, hard: 0, again: 0 })
        setStudyDeck(s.studyDeck || '')
        setStudyMode(s.studyMode || 'flashcards')
        if (s.studyAnswerStyle === 'typed' || s.studyAnswerStyle === 'choices') setStudyAnswerStyle(s.studyAnswerStyle)
        if (typeof s.studyPracticeSync === 'boolean') setStudyPracticeSync(s.studyPracticeSync)
        setStudyConjugationWords(s.studyConjugationWords || [])
        setStudyConjugationLanguage(s.studyConjugationLanguage || 'English')
        setStudyAnswerHistory(s.studyAnswerHistory || [])
        setCurrentQuestion(s.currentQuestion || null)
        setStudyPhase(s.studyPhase || 'question')
        setStudyActive(true)
      }
    } catch {}
    setStudyHydrated(true)
  }, [configLoaded, studyHydrated])
  // Snapshot the session on change (only after hydration, so we never clobber a saved session
  // before restoring it). Cleared automatically when the session ends (studyActive=false).
  useEffect(() => {
    if (!studyHydrated) return
    try {
      if (studyActive) {
        localStorage.setItem('ebiki-study-session', JSON.stringify({
          studyActive: true, studyPhase, studyMode, studyAllCards, studyCardState,
          studyBatchIdx, studyQueue, studyQueueIdx, studyStats, studyDeck,
          currentQuestion, studyConjugationWords, studyConjugationLanguage, studyAnswerHistory,
          studyAnswerStyle, studyPracticeSync,
        }))
      } else {
        localStorage.removeItem('ebiki-study-session')
      }
    } catch {}
  }, [studyHydrated, studyActive, studyPhase, studyMode, studyAllCards, studyCardState, studyBatchIdx, studyQueue, studyQueueIdx, studyStats, studyDeck, currentQuestion, studyConjugationWords, studyConjugationLanguage, studyAnswerHistory, studyAnswerStyle, studyPracticeSync])

  // Pick first question when entering question phase
  useEffect(() => {
    if (studyPhase === 'question' && !currentQuestion && studyCardState.length > 0) {
      setCurrentQuestion(getNextStudyQuestion())
    }
  }, [studyPhase, studyCardState])

  // When the session is complete (all cards done + evaluated, pool exhausted), go straight to the
  // per-card review. useLayoutEffect runs BEFORE paint, so the "All cards completed" intermediate
  // never renders — no flash between the last answer and the Batch Results screen.
  useLayoutEffect(() => {
    if (!studyActive || studyPhase !== 'question' || studyCardState.length === 0) return
    if (studyWrappingUpRef.current) return
    // Multiple-choice grades locally (synchronously), so without this guard the last answer's
    // right/wrong flash would be skipped straight into Batch Results before it ever painted.
    // Same for a graded PBQ awaiting its Continue click, and the typed-answer feedback flash.
    if (studyChoiceFlash || studyPbqReview || studyTypedFlash) return
    if (!studyCardState.every(cs => cs.done) || !studyCardState.every(cs => !cs.evaluating)) return
    const poolExhausted = studyMode === 'conjugations'
      ? studyBatchIdx >= studyConjugationWords.length
      : studyBatchIdx >= studyAllCards.length
    if (poolExhausted) setStudyPhase('batchFeedback')
  }, [studyActive, studyPhase, studyCardState, studyBatchIdx, studyMode, studyAllCards.length, studyConjugationWords.length, studyChoiceFlash, studyPbqReview, studyTypedFlash])

  const submitStudyAnswer = async () => {
    if (!studyInput.trim() || studyLoading || !currentQuestion) return
    const answer = studyInput.trim()
    const { cardIdx, questionIdx } = currentQuestion
    const cs = studyCardState[cardIdx]
    const questionObj = cs.questions[questionIdx]
    const qpc = (activeMode.studyRules || defaultStudyRules).questionsPerCard || 3
    const isExplanation = questionObj?.type === 'explanation'
    const acceptedAnswers = questionObj?.acceptedAnswers || []
    const isLanguageMode = (activeMode.type || 'general') === 'language'

    // Track this attempt in questionAttempts
    const prevAttempts = cs.questionAttempts?.[questionIdx] || []
    const allAttempts = [...prevAttempts, answer]

    // Check correctness for non-explanation questions with acceptedAnswers.
    // Lenient: ignore a leading article and accept the correct word even when the
    // student adds an article or extra function word (e.g. "una huelga" for "huelga").
    const normalize = (s) => s.toLowerCase().trim().replace(/[.!?,;:]/g, '').replace(/\s+/g, ' ')
    const stripArticles = (s) => s.replace(/^(el|la|los|las|un|una|unos|unas|lo|al|del|the|a|an|to)\s+/, '')
    const stripAccents = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
    const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const ans = normalize(answer)
    const ansNoArt = stripArticles(ans)
    // Exact match (accent- and spelling-sensitive)
    const matchesExact = (a) => {
      const acc = normalize(a)
      const accNoArt = stripArticles(acc)
      if (acc === ans || accNoArt === ansNoArt || acc === ansNoArt || accNoArt === ans) return true
      // accept the exact correct word/phrase appearing as a whole token within the answer
      return accNoArt.length >= 3 && new RegExp(`(^|\\s)${escapeRe(accNoArt)}(\\s|$)`).test(ansNoArt)
    }
    // Lenient match (accent-insensitive): "brujula" accepted for "brújula".
    const ansNA = stripAccents(ans)
    const ansNoArtNA = stripAccents(ansNoArt)
    const matchesLenient = (a) => {
      const accNA = stripAccents(normalize(a))
      const accNoArtNA = stripArticles(accNA)
      if (accNA === ansNA || accNoArtNA === ansNoArtNA || accNA === ansNoArtNA || accNoArtNA === ansNA) return true
      return accNoArtNA.length >= 3 && new RegExp(`(^|\\s)${escapeRe(accNoArtNA)}(\\s|$)`).test(ansNoArtNA)
    }
    const matchesAccepted = (a) => matchesExact(a) || matchesLenient(a)
    // In non-language modes the student answers in their own words (explaining topics),
    // so we never run the letter-count hint/retry loop — just advance and let the AI grade
    // on understanding. The hint loop only applies to language vocabulary recall.
    const isCorrect = !isLanguageMode || (!isExplanation && acceptedAnswers.length > 0 && acceptedAnswers.some(matchesAccepted))

    // If the answer is right but spelled without the correct accents, briefly surface the
    // properly-accented spelling on the side so the user can practice it on later questions.
    // Only when grammar feedback is enabled. NOTE: acceptedAnswers often contains BOTH the
    // accented and un-accented variants, so we can't just check "was there an exact match" —
    // we compare the typed answer against the canonical (accented) spelling specifically.
    const grammarOn = (activeMode.studyRules || defaultStudyRules).grammarFeedback || false
    if (isCorrect && grammarOn && isLanguageMode && !isExplanation && acceptedAnswers.length > 0) {
      const matched = acceptedAnswers.filter(matchesLenient)
      // Canonical = a matched variant that actually carries accent marks (the spelling to teach)
      const canonical = matched.find(a => stripAccents(normalize(a)) !== normalize(a))
      if (canonical) {
        const canonNorm = normalize(canonical)
        const canonNoArt = stripArticles(canonNorm)
        const typedExactly = canonNorm === ans || canonNoArt === ansNoArt || canonNorm === ansNoArt || canonNoArt === ans
        if (!typedExactly) {
          if (studySpellingNoteTimer.current) clearTimeout(studySpellingNoteTimer.current)
          setStudySpellingNote({ correct: canonical })
          studySpellingNoteTimer.current = setTimeout(() => setStudySpellingNote(null), 10000)
        }
      }
    }

    const newStates = [...studyCardState]
    const newAttempts = [...(cs.questionAttempts || [])]
    newAttempts[questionIdx] = allAttempts
    newStates[cardIdx] = { ...cs, questionAttempts: newAttempts }

    // If wrong on a hintable question and hints remain — show the next hint the user doesn't already satisfy
    if (!isExplanation && acceptedAnswers.length > 0 && !isCorrect && studyHintLevel < 2) {
      const hintSatisfied = (hint) => {
        if (!hint) return true
        const a = ans.replace(/\s/g, '')
        const lettersMatch = hint.match(/^(\d+)\s+letters?$/i)
        if (lettersMatch) return a.length === parseInt(lettersMatch[1])
        const startsMatch = hint.match(/starts with ['"]?([^\s'"]+)['"]?/i)
        if (startsMatch) return ansNoArt.startsWith(startsMatch[1].toLowerCase())
        return false
      }
      const allHints = [questionObj.hint1, questionObj.hint2]
      let nextLevel = null, nextHint = null
      for (let level = studyHintLevel + 1; level <= 2; level++) {
        const candidate = allHints[level - 1]
        if (!hintSatisfied(candidate)) { nextLevel = level; nextHint = candidate; break }
      }
      if (nextLevel !== null) {
        setStudyHintLevel(nextLevel)
        setStudyCurrentHint(nextHint)
        setStudyCardState(newStates)
        setStudyInput('')
        setStudyInputShake((n) => n + 1) // definitively wrong right now → red ✗ shake, retry stays on screen
        return
      }
      // All remaining hints already satisfied — fall through and advance
    }

    // Advance — correct, explanation type, or max hints exhausted.
    // Feedback flash (frozen snapshot, state advances underneath — same pattern as the MC flash):
    // green ✓ when the answer matched acceptedAnswers locally; amber ⏳ "Ebi will check" when only
    // the AI grader can judge it (explanation questions, general modes, hint-exhausted answers —
    // inflection tolerance can still accept those, so a hard ✗ would sometimes be a lie).
    const flashKind = (isLanguageMode && !isExplanation && acceptedAnswers.length > 0 && isCorrect) ? 'correct' : 'check'
    setStudyTypedFlash({ question: getQuestionText(questionObj), answer, kind: flashKind })
    if (studyTypedFlashTimer.current) clearTimeout(studyTypedFlashTimer.current)
    studyTypedFlashTimer.current = setTimeout(() => setStudyTypedFlash(null), flashKind === 'correct' ? 650 : 850)

    setStudyHintLevel(0)
    setStudyCurrentHint(null)
    setStudyMeaningHint(null); setStudyWordLookup(null)

    newStates[cardIdx] = {
      ...newStates[cardIdx],
      answers: [...cs.answers, answer],
      questionIdx: cs.questionIdx + 1,
      questionAttempts: newAttempts,
    }

    // Push to undo history
    setStudyAnswerHistory(prev => [...prev, { cardIdx, questionIdx }])

    if (newStates[cardIdx].questionIdx >= qpc) {
      newStates[cardIdx].done = true
      newStates[cardIdx].evaluating = true
      setStudyCardState(newStates)
      setStudyInput('')

      const remaining = newStates.filter(cs => !cs.done && cs.questionIdx < cs.questions.length)
      if (remaining.length > 0) {
        const nextActive = remaining[Math.floor(Math.random() * remaining.length)]
        setCurrentQuestion({ cardIdx: newStates.indexOf(nextActive), questionIdx: nextActive.questionIdx })
      } else {
        setCurrentQuestion(null)
      }
      evaluateCard(cardIdx, newStates[cardIdx])
      pullNewCard()
    } else {
      setStudyCardState(newStates)
      setStudyInput('')
      const nextQ = (() => {
        const active = newStates.filter(cs => !cs.done && cs.questionIdx < cs.questions.length)
        if (active.length === 0) return null
        const pick = active[Math.floor(Math.random() * active.length)]
        return { cardIdx: newStates.indexOf(pick), questionIdx: pick.questionIdx }
      })()
      setCurrentQuestion(nextQ)
    }
  }

  // Multiple-choice answer: grading is a plain comparison, so the state advances immediately —
  // the flash snapshot (a frozen copy of the question + colored options) is all that lingers on
  // screen for a moment, which avoids any delayed-setState races with background evaluations.
  const studyChoiceFlashTimer = useRef(null)
  const studyTypedFlashTimer = useRef(null)
  const submitStudyChoice = (choiceIdx) => {
    if (studyLoading || !currentQuestion || studyChoiceFlash) return
    const { cardIdx, questionIdx } = currentQuestion
    const cs = studyCardState[cardIdx]
    const questionObj = cs?.questions?.[questionIdx]
    if (!questionHasChoices(questionObj)) return
    const answer = String(questionObj.choices[choiceIdx] ?? '')
    if (!answer) return
    const correct = choiceIdx === questionObj.answerIdx
    const qpc = (activeMode.studyRules || defaultStudyRules).questionsPerCard || 3

    setStudyChoiceFlash({ question: getQuestionText(questionObj), choices: questionObj.choices, picked: choiceIdx, answerIdx: questionObj.answerIdx })
    if (studyChoiceFlashTimer.current) clearTimeout(studyChoiceFlashTimer.current)
    studyChoiceFlashTimer.current = setTimeout(() => setStudyChoiceFlash(null), correct ? 700 : 1600)

    setStudyHintLevel(0)
    setStudyCurrentHint(null)
    setStudyMeaningHint(null); setStudyWordLookup(null)

    const newStates = [...studyCardState]
    const newAttempts = [...(cs.questionAttempts || [])]
    newAttempts[questionIdx] = [...(newAttempts[questionIdx] || []), answer]
    newStates[cardIdx] = {
      ...cs,
      answers: [...cs.answers, answer],
      questionIdx: cs.questionIdx + 1,
      questionAttempts: newAttempts,
    }
    setStudyAnswerHistory(prev => [...prev, { cardIdx, questionIdx }])

    if (newStates[cardIdx].questionIdx >= qpc) {
      newStates[cardIdx].done = true
      newStates[cardIdx].evaluating = true
      setStudyCardState(newStates)
      const remaining = newStates.filter(c => !c.done && c.questionIdx < c.questions.length)
      if (remaining.length > 0) {
        const nextActive = remaining[Math.floor(Math.random() * remaining.length)]
        setCurrentQuestion({ cardIdx: newStates.indexOf(nextActive), questionIdx: nextActive.questionIdx })
      } else {
        setCurrentQuestion(null)
      }
      evaluateCard(cardIdx, newStates[cardIdx])
      pullNewCard()
    } else {
      setStudyCardState(newStates)
      const active = newStates.filter(c => !c.done && c.questionIdx < c.questions.length)
      if (active.length > 0) {
        const pick = active[Math.floor(Math.random() * active.length)]
        setCurrentQuestion({ cardIdx: newStates.indexOf(pick), questionIdx: pick.questionIdx })
      } else {
        setCurrentQuestion(null)
      }
    }
  }

  // Keyboard shortcuts 1–4 pick a choice (no text input to focus in multiple-choice mode)
  useEffect(() => {
    if (studyPhase !== 'question' || !currentQuestion || studyChoiceFlash) return
    const cs = studyCardState[currentQuestion.cardIdx]
    const questionObj = cs?.questions?.[currentQuestion.questionIdx]
    if (!questionHasChoices(questionObj)) return
    const onKey = (e) => {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const num = parseInt(e.key, 10)
      if (num >= 1 && num <= questionObj.choices.length) submitStudyChoice(num - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [studyPhase, currentQuestion, studyChoiceFlash, studyCardState])

  // PBQ submit — deterministic grading (engine.gradePbq), then the graded exercise stays on
  // screen (`studyPbqReview`) until the user clicks Continue; the session advances underneath.
  const submitPbqAnswer = (assign) => {
    if (studyLoading || !currentQuestion || studyPbqReview) return
    const { cardIdx } = currentQuestion
    const cs = studyCardState[cardIdx]
    const pbq = cs?.questions?.[0]?.pbq
    if (!pbq) return

    const g = gradePbq(pbq, assign)
    const { ease, label } = pbqRatingFromFraction(g.fraction, !!cs.noSync)
    const wrong = g.perItem.filter(p => !p.correct)
    const feedback = wrong.length === 0
      ? `${g.correct}/${g.total}`
      : `${g.correct}/${g.total} — ${wrong.map(p => `${p.label} → ${p.expectedText}`).join(' · ')}`

    const newStates = [...studyCardState]
    newStates[cardIdx] = {
      ...cs,
      answers: [`${g.correct}/${g.total}`],
      questionIdx: 1,
      questionAttempts: [[`${g.correct}/${g.total}`]],
      done: true,
      evaluating: false,
      results: [{ correct: g.fraction === 1, feedback }],
      rating: label,
      ease,
      gradedAt: Date.now(),
    }
    setStudyCardState(newStates)
    setStudyStats(prev => ({ ...prev, [label]: prev[label] + 1 }))
    setStudyPbqReview({ pbq, assign, perItem: g.perItem, correct: g.correct, total: g.total, rating: label })

    const remaining = newStates.filter(c => !c.done && c.questionIdx < c.questions.length)
    if (remaining.length > 0) {
      const nextActive = remaining[Math.floor(Math.random() * remaining.length)]
      setCurrentQuestion({ cardIdx: newStates.indexOf(nextActive), questionIdx: nextActive.questionIdx })
    } else {
      setCurrentQuestion(null)
    }
    pullNewCard()
  }

  // Close the "fix question" panel whenever the live question changes
  useEffect(() => { setStudyFixQ(null) }, [currentQuestion])

  // Answer-option grid, used both live (onPick set) and frozen in the post-answer flash
  // (picked/answerIdx set → correct option green, a wrong pick red, the rest dimmed).
  const renderChoiceButtons = (choices, { picked = null, answerIdx = null, onPick = null } = {}) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    const oneColumn = choices.some(c => String(c).length > 42)
    const reveal = picked !== null
    return (
      <div style={{ display: 'grid', gridTemplateColumns: oneColumn ? '1fr' : '1fr 1fr', gap: 8 }}>
        {choices.map((c, i) => {
          const isCorrect = reveal && i === answerIdx
          const isWrongPick = reveal && i === picked && i !== answerIdx
          const accent = isCorrect ? 'var(--c-success)' : isWrongPick ? 'var(--c-danger)' : null
          return (
            <button key={i} onClick={onPick ? () => onPick(i) : undefined} disabled={!onPick}
              className={onPick ? 'btn-press' : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left', padding: '10px 12px',
                borderRadius: 10, border: `1.5px solid ${accent || 'var(--c-border)'}`,
                background: isCorrect ? 'rgba(24,169,87,.12)' : isWrongPick ? 'rgba(229,57,46,.10)' : 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
                color: 'var(--c-ink)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
                cursor: onPick ? 'pointer' : 'default',
                opacity: reveal && !isCorrect && !isWrongPick ? 0.55 : 1,
              }}>
              <span style={{
                fontSize: 10, fontWeight: 800, flexShrink: 0, borderRadius: 6, padding: '2px 7px',
                color: accent || 'var(--c-brand)', border: `1px solid ${accent || 'rgba(223,37,64,.35)'}`,
              }}>{isCorrect ? '✓' : isWrongPick ? '✗' : letters[i]}</span>
              <span style={{ minWidth: 0 }}>{c}</span>
            </button>
          )
        })}
      </div>
    )
  }

  // "I Don't Know" — give up on the WHOLE card: skip every remaining question at
  // once, mark the card done (all skipped answers grade as wrong → Again), and send
  // it straight to the results so the user can sync to Anki.
  const skipStudyQuestion = () => {
    if (studyLoading || !currentQuestion) return
    const { cardIdx } = currentQuestion
    const cs = studyCardState[cardIdx]
    const qpc = (activeMode.studyRules || defaultStudyRules).questionsPerCard || 3

    // Giving up finalizes the whole card and the Again rating auto-syncs to Anki —
    // confirm so a misclick doesn't record a review you didn't mean.
    if (!window.confirm((cs.isConjugation || cs.noSync)
      ? `Give up on "${cs.front}"? All remaining questions will be skipped and rated Again. Continue?`
      : `Give up on "${cs.front}"? All its questions will be marked wrong and the card rated Again — this records the review in Anki right away. Continue?`
    )) return

    setStudyHintLevel(0)
    setStudyCurrentHint(null)
    setStudyMeaningHint(null); setStudyWordLookup(null)

    const filledAnswers = [...cs.answers]
    while (filledAnswers.length < qpc) filledAnswers.push('(skipped)')

    const newStates = [...studyCardState]
    newStates[cardIdx] = {
      ...cs,
      answers: filledAnswers,
      questionIdx: qpc,
      done: true,
      evaluating: true,
    }
    setStudyCardState(newStates)
    setStudyInput('')

    // Move to the next active card (or none) and evaluate this one in the background.
    const remaining = newStates.filter(c => !c.done && c.questionIdx < c.questions.length)
    if (remaining.length > 0) {
      const nextActive = remaining[Math.floor(Math.random() * remaining.length)]
      setCurrentQuestion({ cardIdx: newStates.indexOf(nextActive), questionIdx: nextActive.questionIdx })
    } else {
      setCurrentQuestion(null)
    }
    evaluateCard(cardIdx, newStates[cardIdx])
    pullNewCard()
  }

  // Conjugation mode only — silently drop the current word and move on (no rating, no feedback)
  const skipConjugationWord = () => {
    if (!currentQuestion) return
    const { cardIdx } = currentQuestion
    const newStates = [...studyCardState]
    newStates[cardIdx] = { ...newStates[cardIdx], done: true, skipped: true, results: [] }
    setStudyCardState(newStates)
    setStudyInput('')
    setStudyHintLevel(0)
    setStudyCurrentHint(null)
    setStudyMeaningHint(null); setStudyWordLookup(null)
    const remaining = newStates.filter(c => !c.done && c.questionIdx < c.questions.length)
    if (remaining.length > 0) {
      const next = remaining[Math.floor(Math.random() * remaining.length)]
      setCurrentQuestion({ cardIdx: newStates.indexOf(next), questionIdx: next.questionIdx })
    } else {
      setCurrentQuestion(null)
    }
    pullNewCard()
  }

  const fetchMeaningHint = async () => {
    if (!currentQuestion || !apiKey || studyMeaningHintLoading) return
    const { cardIdx, questionIdx } = currentQuestion
    const cs = studyCardState[cardIdx]
    const questionObj = cs.questions[questionIdx]
    const question = getQuestionText(questionObj)
    const rules = activeMode.studyRules || defaultStudyRules
    const studyLang = interactionLangName(rules)  // Ebi speaks → hint language (all modes)
    setStudyMeaningHintLoading(true)
    try {
      const prompt = `Write your ENTIRE response in ${studyLang}. The student is studying in ${studyLang}, so the hint must be in ${studyLang} — not English (unless ${studyLang} is English).

A student needs a meaning hint for a flashcard. Give 1–2 sentences, in ${studyLang}, describing the core meaning or concept behind the answer — enough to help them understand what they're looking for without revealing the answer word itself.

Card front: "${cs.front}"
Card back: "${cs.back}"
Question: "${question}"

Rules:
- Respond ONLY in ${studyLang}.
- Do NOT include the answer word or any conjugated/inflected form of it
- Do NOT give spelling hints or letter counts
- Describe the concept, meaning, or context only`
      // Same guarantee as question generation, regenerate-first: a hint that reveals the answer
      // (or a plural/inflected form — fuzzy check) is rejected and rewritten with the violation
      // named, so the final hint reads naturally. The scrub is only the last-resort safety net.
      const accepted = questionObj?.acceptedAnswers || []
      let revealNote = ''
      for (let attempt = 0; attempt < 3; attempt++) {
        const text = await aiCall(apiKey, `You give concise flashcard study hints written entirely in ${studyLang}. Never reveal the answer word or any of its forms.`, prompt + revealNote, resolveModel('study'))
        const hint = text.trim()
        if (!hintRevealsAnswer(hint, accepted)) { setStudyMeaningHint(hint); break }
        console.warn(`[Study] meaning hint revealed the answer (attempt ${attempt + 1}) — regenerating`)
        revealNote = `\n\nYOUR PREVIOUS HINT WAS REJECTED: it contained the answer word or a close form of it. Rewrite the hint from scratch WITHOUT the word, its plural, or any inflected/derived form — describe the concept in other words entirely.`
        if (attempt === 2) setStudyMeaningHint(scrubHint(hint, accepted))
      }
    } catch {
      setStudyMeaningHint(null); setStudyWordLookup(null)
    } finally {
      setStudyMeaningHintLoading(false)
    }
  }

  // "Fix this question" — the student flags the LIVE question (obvious mistakes get corrected
  // BEFORE answering, not after): ONE replacement question is generated honoring the complaint
  // and swapped in place, and the complaint is distilled into a question-style preference saved
  // on the mode (same channel the feedback chat uses).
  const fixCurrentQuestion = async () => {
    const complaint = studyFixQ?.input?.trim()
    if (!complaint || !apiKey || studyFixQ?.loading || !currentQuestion) return
    const { cardIdx, questionIdx } = currentQuestion
    const cs = studyCardState[cardIdx]
    const q = cs?.questions?.[questionIdx]
    if (!q || q.type === 'pbq') return
    const modeId = activeModeIdRef.current // async completion — pin the target mode
    setStudyFixQ((p) => ({ ...p, loading: true, error: null }))
    try {
      const rules = activeMode.studyRules || defaultStudyRules
      const isLanguage = activeMode.type === 'language'
      const learnLang = isLanguage ? (rules.studyLanguage || learnLangName()) : userLangName()
      const quizLang = interactionLangName(rules)
      const wantChoices = Array.isArray(q.choices) && q.choices.length >= 2
      const prompt = `You wrote a quiz question for a flashcard and the student flagged it BEFORE answering. Write ONE replacement question that fixes their complaint.

Card front: "${cs.front}"
Card back: "${cs.back}"
Original question (JSON): ${JSON.stringify({ question: q.question, type: q.type, acceptedAnswers: q.acceptedAnswers, ...(wantChoices ? { choices: q.choices } : {}) })}
Student's complaint: "${complaint}"

RULES for the replacement:
- Fix the complaint. Keep testing the SAME card, in the same slot type ("${q.type}").
${isLanguage ? `- The expected answer stays the ${learnLang} word/phrase on the card; phrase the question in ${quizLang}. acceptedAnswers = the ${learnLang} answer(s), lowercase, with and without accents.` : `- Phrase the question in ${quizLang}; the expected answer is the card's term/concept.`}
- THE ANSWER MUST NEVER APPEAR IN THE QUESTION TEXT — not even inside a parenthetical cue.
- Exactly ONE defensible answer: add a compact sense cue right at the blank if a synonym would still fit.
${wantChoices ? '- Also return "choices": exactly 4 options (1 correct — matching acceptedAnswers — + 3 plausible but clearly wrong) and "answerIdx" (index of the correct one).\n' : ''}ALSO distill the complaint into "preference": ONE concise imperative rule in English, GENERALIZED beyond this single card, that future question generation for this mode should follow — or null if the flaw was purely specific to this one question.

Return ONLY raw JSON:
{"question": {"question":"...","type":"${q.type}","hint1":"N letters","hint2":"starts with 'X'","acceptedAnswers":["..."]${wantChoices ? ',"choices":["...","...","...","..."],"answerIdx":0' : ''}}, "preference": "..." or null}`
      const text = await aiCall(apiKey, 'You repair flashcard quiz questions. Always respond with a single valid JSON object.', prompt, resolveModel('study'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      const nq = parsed?.question
      if (!nq?.question) throw new Error('no replacement question returned')
      let newQ = {
        question: String(nq.question),
        type: nq.type || q.type,
        hint1: nq.hint1 || null,
        hint2: nq.hint2 || null,
        acceptedAnswers: Array.isArray(nq.acceptedAnswers) && nq.acceptedAnswers.length ? nq.acceptedAnswers.map((a) => String(a).toLowerCase().trim()) : (q.acceptedAnswers || []),
        glosses: null, // refetched lazily for the new text
        pose: q.pose || null,
        choices: null,
        answerIdx: null,
      }
      if (wantChoices && Array.isArray(nq.choices) && Number.isInteger(nq.answerIdx) && nq.answerIdx >= 0 && nq.answerIdx < nq.choices.length) {
        const correctText = String(nq.choices[nq.answerIdx])
        const opts = [...new Set(nq.choices.map((c) => String(c)))].slice(0, 4)
        if (!opts.includes(correctText)) opts[opts.length - 1] = correctText
        for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]] }
        newQ.choices = opts
        newQ.answerIdx = opts.indexOf(correctText)
      }
      if (questionAnswerLeak(newQ)) newQ = scrubAnswerFromQuestion(newQ) // same hard guarantee
      setStudyCardState((prev) => {
        const updated = [...prev]
        const c = updated[cardIdx]
        if (!c) return prev
        const questions = [...c.questions]
        questions[questionIdx] = newQ
        updated[cardIdx] = { ...c, questions }
        return updated
      })
      glossFetchRef.current.delete(`${cardIdx}:${questionIdx}`) // word hints refetch for the new text
      const pref = typeof parsed.preference === 'string' ? parsed.preference.trim().slice(0, 300) : ''
      if (pref && pref.toLowerCase() !== 'null') {
        const targetMode = modesRef.current.find((mm) => mm.id === modeId)
        const sr = targetMode?.studyRules || {}
        const prevPrefs = Array.isArray(sr.questionPreferences) ? sr.questionPreferences : []
        if (!prevPrefs.includes(pref)) {
          updateModeById(modeId, { studyRules: { ...sr, questionPreferences: [...prevPrefs, pref].slice(-12) } })
          console.log('[Study] saved question-style preference (fix button):', pref)
        }
      }
      setStudyFixQ(null)
      setStudyHintLevel(0); setStudyCurrentHint(null)
      setStudyMeaningHint(null); setStudyWordLookup(null)
      setStudyInput('')
    } catch (err) {
      console.error('[Study] question fix failed:', err.message)
      setStudyFixQ((p) => (p ? { ...p, loading: false, error: err.message } : p))
    }
  }

  // Language study: look up what a single word in the question sentence means, in the
  // quiz language. Lets a learner decode an unfamiliar word without revealing the answer.
  const lookupStudyWord = async (word, sentence, source = 'question') => {
    if (!apiKey || !word) return
    // Explain in the USER's language (= the app language), since that's the language they
    // speak and are learning from — not the quiz/study language.
    const explainLang = APP_LANG_NAME[appLanguage] || 'English'
    // The language the QUESTION is written in: the learned language for language modes, the
    // "Ebi speaks" language (falling back to the app language) for general modes.
    const studyLang = activeMode.type === 'language'
      ? ((activeMode.studyRules || defaultStudyRules).studyLanguage || learnLangName())
      : ((activeMode.studyRules || defaultGeneralStudyRules).quizLanguage || userLangName())
    setStudyWordLookup({ word, primary: null, alternatives: [], loading: true, source })
    try {
      // Disambiguate by the WHOLE question — the same word can mean different things in different
      // contexts. Return the in-context meaning (shown in the legend's "correct" green) plus other
      // common senses (shown in the legend's "word choice" purple).
      const prompt = `A learner tapped the word "${word}" in this ${studyLang} study question. Read the ENTIRE question for context — the same word can have different meanings depending on context.

Question: "${sentence}"

Reply in ${explainLang} as JSON ONLY (no markdown, no extra text):
{
  "primary": "the meaning/translation of \\"${word}\\" AS USED in THIS question — the single best fit, a few words only",
  "alternatives": ["up to 3 other common meanings the word can have in OTHER contexts, a few words each; use [] if it really only has one meaning"],
  "pron": "simplified phonetics of \\"${word}\\" for a ${explainLang} speaker, stressed syllable in CAPS (e.g. PREH-syoh) — same style as flashcard pronunciation lines; "" if it reads exactly as spelled"
}`
      const text = await aiCall(apiKey, `You are a concise bilingual dictionary that disambiguates words by context. Output JSON only, written in ${explainLang}.`, prompt, resolveModel('study'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      setStudyWordLookup({
        word,
        primary: String(parsed.primary || '').trim() || '—',
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.filter(Boolean).map(String).slice(0, 3) : [],
        pron: String(parsed.pron || '').trim(),
        loading: false,
        source,
      })
    } catch {
      setStudyWordLookup({ word, primary: 'Lookup failed — try again.', alternatives: [], loading: false, source })
    }
  }

  // Memory hook for the TAPPED word — the user just wants a reminder of how to remember this
  // word even though it isn't the one being tested. Shares generateMemoryHook with study/deck.
  const studyWordMemoryHook = async () => {
    const wl = studyWordLookup
    if (!wl?.word || !apiKey || wl.hookLoading || wl.loading) return
    setStudyWordLookup((prev) => (prev && prev.word === wl.word) ? { ...prev, hookLoading: true, hookError: null } : prev)
    try {
      const back = [wl.primary, ...(wl.alternatives || [])].filter((x) => x && x !== '—').join(' · ') || wl.word
      const hook = await generateMemoryHook(wl.word, back, wl.hooks || [])
      setStudyWordLookup((prev) => (prev && prev.word === wl.word) ? { ...prev, hookLoading: false, hooks: [...(prev.hooks || []), ...(hook ? [hook] : [])] } : prev)
    } catch {
      setStudyWordLookup((prev) => (prev && prev.word === wl.word) ? { ...prev, hookLoading: false, hookError: 'Could not generate a memory hook — try again.' } : prev)
    }
  }

  // Target deck for a card made from a tapped study word: prefer the mode's deck, then the deck
  // being studied, then any connected deck. Never hardcoded to a language/topic.
  const studyWordCardDeck = () => activeMode.ankiDeck || studyDeck || ankiDeck || ankiDecks[0] || 'Default'

  // Make an Anki card from the tapped word. Uses the shared, language/topic-agnostic
  // generateCards engine (it branches on activeMode.type + learnLangName), so it works for
  // any subject or language the user is studying.
  const studyWordMakeCard = async () => {
    const wl = studyWordLookup
    if (!wl?.word || !apiKey || wl.cardLoading || wl.card) return
    setStudyWordLookup((prev) => (prev && prev.word === wl.word) ? { ...prev, cardLoading: true, cardError: null } : prev)
    try {
      const [card] = await generateCards([wl.word])
      if (!card) throw new Error('no card')
      setStudyWordLookup((prev) => (prev && prev.word === wl.word) ? { ...prev, cardLoading: false, card } : prev)
    } catch {
      setStudyWordLookup((prev) => (prev && prev.word === wl.word) ? { ...prev, cardLoading: false, cardError: 'Could not create a card — try again.' } : prev)
    }
  }

  // Sync the freshly-made word card to Anki (✓). Mirrors chatTabSyncCard's add+sync flow.
  const studyWordSyncCard = async () => {
    const wl = studyWordLookup
    if (!wl?.card || wl.cardSynced || wl.cardSyncing) return
    if (!ankiConnected) { setStudyWordLookup((prev) => prev ? { ...prev, cardError: 'Anki is not connected.' } : prev); return }
    const deck = studyWordCardDeck()
    setStudyWordLookup((prev) => prev ? { ...prev, cardSyncing: true, cardError: null } : prev)
    try {
      if (!(await ankiGetDecks().catch(() => [])).includes(deck)) await ankiCreateDeck(deck)
      await ankiAddNote(deck, wl.card.front, cardBackToHtml(wl.card.back), wl.card.tags || ['ebiki'])
      ankiSync().catch(() => {})
      setStudyWordLookup((prev) => (prev && prev.card === wl.card) ? { ...prev, cardSyncing: false, cardSynced: true, cardDeck: deck } : prev)
    } catch {
      setStudyWordLookup((prev) => prev ? { ...prev, cardSyncing: false, cardError: 'Sync failed — is Anki running?' } : prev)
    }
  }

  // Ebi teaches a memory aid for a graded card. SUBJECT-AGNOSTIC: the app studies anything (languages,
  // CompTIA, music theory, etc.), so we pass the card + mode and let the model pick the technique that
  // fits THIS material (sound-alike/imagery + cognate for vocab; acronym/story/association for concepts).
  // The hook is written in the app language. `card` is passed in fresh from render to avoid stale reads.
  // "Another hook" APPENDS a new aid below the existing ones (cs.mnemonics is an array), and the prompt
  // is told the prior hooks so each one is genuinely different.
  // Shared memory-hook engine (study graded cards AND the Deck browser). Subject-agnostic —
  // the prompt branches on the mode type; `prior` hooks feed back so each new one differs.
  const generateMemoryHook = async (front, back, prior = []) => {
    const isLanguage = activeMode.type === 'language'
    const explainLang = APP_LANG_NAME[appLanguage] || 'English'
    const learnLang = isLanguage ? ((activeMode.studyRules || defaultStudyRules).studyLanguage || learnLangName()) : null
    const prompt = `You are Ebi, a warm study buddy. Help the learner MEMORIZE this flashcard with a vivid, concrete memory aid.

Flashcard front: "${front}"
Flashcard back: "${back}"
Subject / study mode: "${activeMode.name}"${isLanguage ? `\nThis is a ${learnLang} vocabulary card: memorize the ${learnLang} word and its meaning.` : `\nThis is a general study card (NOT language learning): memorize the concept/fact itself, never treat it as a translation exercise.`}

Choose whatever memory technique actually fits THIS material (do not force one): a sound-alike or imagery association, a cognate / word-origin hook, an acronym or initialism, a short vivid story, chunking, a logical link, or a brief RATIONALIZATION of why the answer makes sense (etymology, cause, or reasoning the learner can reconstruct on their own). ${isLanguage ? 'For vocabulary, a sound-alike plus a mental image works well, e.g. Spanish "muelle" (dock): picture a stubborn MULE hauling cargo down at the dock (mule -> muelle).' : 'For facts/concepts, prefer a clear association, acronym, or a memorable concrete example that fits the subject.'}${prior.length ? `\n\nThe learner already has these memory aids for this card, so give a genuinely DIFFERENT one (new angle/technique, do not repeat them):\n${prior.map((m, i) => `${i + 1}. ${m}`).join('\n')}` : ''}

Write in ${explainLang}. 2 to 4 short sentences, concrete and a little playful. Give ONE strong primary hook, then optionally a brief backup. Plain text only: no markdown headers, no em dashes.`
    const text = await aiCall(apiKey, `You are Ebi, a friendly memory coach. Reply in ${explainLang} with a concise, concrete memory aid in plain text.`, prompt, resolveModel('study'))
    return String(text || '').trim()
  }

  const generateMnemonic = async (cardIdx, card) => {
    const cs = card || studyCardState[cardIdx]
    if (!cs || !apiKey) return
    const prior = Array.isArray(cs.mnemonics) ? cs.mnemonics : []
    setStudyCardState(prev => { const u = [...prev]; if (u[cardIdx]) u[cardIdx] = { ...u[cardIdx], mnemonicLoading: true, mnemonicError: null }; return u })
    try {
      const hook = await generateMemoryHook(cs.front, cs.back, prior)
      setStudyCardState(prev => { const u = [...prev]; if (u[cardIdx]) u[cardIdx] = { ...u[cardIdx], mnemonics: [...(u[cardIdx].mnemonics || []), ...(hook ? [hook] : [])], mnemonicLoading: false }; return u })
    } catch {
      setStudyCardState(prev => { const u = [...prev]; if (u[cardIdx]) u[cardIdx] = { ...u[cardIdx], mnemonicLoading: false, mnemonicError: 'Could not generate a memory aid — try again.' }; return u })
    }
  }

  // Deck-browser memory hooks, keyed by noteId (session-local, like study's cs.mnemonics)
  const [deckBrowserMnemonics, setDeckBrowserMnemonics] = useState({})
  const generateDeckMnemonic = async (note) => {
    if (!apiKey) return
    const id = note.noteId
    const priorHooks = deckBrowserMnemonics[id]?.hooks || []
    setDeckBrowserMnemonics(prev => ({ ...prev, [id]: { ...(prev[id] || { hooks: [] }), loading: true, error: null } }))
    try {
      const fields = Object.entries(note.fields).sort(([, a], [, b]) => a.order - b.order)
      const front = stripHtml(fields[0]?.[1]?.value || '')
      const back = backTextLines(fields[1]?.[1]?.value || '').join('\n')
      const hook = await generateMemoryHook(front, back, priorHooks)
      setDeckBrowserMnemonics(prev => { const e = prev[id] || { hooks: [] }; return { ...prev, [id]: { hooks: [...(e.hooks || []), ...(hook ? [hook] : [])], loading: false, error: null } } })
    } catch {
      setDeckBrowserMnemonics(prev => ({ ...prev, [id]: { ...(prev[id] || { hooks: [] }), loading: false, error: 'Could not generate a memory aid — try again.' } }))
    }
  }

  // Click an ANSWERED question dot to rewind the current card to that question and re-answer it
  // (that answer and everything after it on THIS card is discarded). Backwards only — answers are
  // stored positionally, so jumping ahead would misalign them.
  const jumpToCardQuestion = (cardIdx, qi) => {
    const cs = studyCardState[cardIdx]
    if (!cs || cs.done || cs.synced || qi >= cs.questionIdx) return
    const newAttempts = [...(cs.questionAttempts || [])]
    for (let k = qi; k < newAttempts.length; k++) newAttempts[k] = []
    setStudyCardState((prev) => {
      const updated = [...prev]
      updated[cardIdx] = { ...updated[cardIdx], answers: updated[cardIdx].answers.slice(0, qi), questionIdx: qi, questionAttempts: newAttempts }
      return updated
    })
    setStudyAnswerHistory((prev) => prev.filter((h) => !(h.cardIdx === cardIdx && h.questionIdx >= qi)))
    setCurrentQuestion({ cardIdx, questionIdx: qi })
    setStudyHintLevel(0)
    setStudyCurrentHint(null)
    setStudyMeaningHint(null); setStudyWordLookup(null)
    setStudyInput('')
  }

  const undoLastAnswer = () => {
    if (studyAnswerHistory.length === 0) return
    const last = studyAnswerHistory[studyAnswerHistory.length - 1]
    const { cardIdx, questionIdx } = last
    const cs = studyCardState[cardIdx]
    if (!cs || cs.synced) return

    const newAttempts = [...(cs.questionAttempts || [])]
    newAttempts[questionIdx] = []
    const wasDone = cs.done

    setStudyCardState(prev => {
      const updated = [...prev]
      updated[cardIdx] = {
        ...cs,
        answers: cs.answers.slice(0, -1),
        questionIdx,
        questionAttempts: newAttempts,
        done: false,
        evaluating: false,
        ...(wasDone ? { results: [], rating: null, ease: null } : {}),
      }
      return updated
    })
    if (wasDone && cs.rating) setStudyStats(prev => ({ ...prev, [cs.rating]: Math.max(0, prev[cs.rating] - 1) }))
    setStudyAnswerHistory(prev => prev.slice(0, -1))
    setCurrentQuestion({ cardIdx, questionIdx })
    setStudyCurrentHint(null)
    setStudyHintLevel(0)
    setStudyMeaningHint(null); setStudyWordLookup(null)
    setStudyInput('')
  }

  // Evaluate all answers for a completed card (runs in background, no blocking)
  // Multiple-choice cards are graded locally — the picked option either IS the correct one or it
  // isn't, so no AI call (instant, free, and can't hallucinate). Falls back to the AI grader when
  // any question arrived without usable choices (the model failed to supply them).
  const questionHasChoices = (q) => q && Array.isArray(q.choices) && q.choices.length >= 2 &&
    Number.isInteger(q.answerIdx) && q.answerIdx >= 0 && q.answerIdx < q.choices.length

  const evaluateCardLocally = (cardIdx, cs) => {
    const results = cs.questions.map((q, i) => {
      const correctText = questionHasChoices(q) ? String(q.choices[q.answerIdx]) : ''
      const correct = !!correctText && cs.answers[i] === correctText
      return { correct, feedback: correct ? '' : (correctText ? `✓ ${correctText}` : '') }
    })
    const qpc = cs.questions.length
    const wrongCount = results.filter(r => !r.correct).length
    let ease, label
    if (wrongCount === 0) { ease = 4; label = 'easy' }
    else if (wrongCount === 1) { ease = 3; label = 'good' }
    else if (wrongCount >= qpc) { ease = 1; label = 'again' }
    else { ease = 2; label = 'hard' }
    // Recognition (picking from options) is easier than recall — when this practice session DOES
    // record reviews in Anki, cap the ease at Good so a mature card's interval can't inflate off
    // a multiple-choice pass. Pure practice (noSync) keeps the honest label; it never reaches Anki.
    if (!cs.noSync && ease > 3) { ease = 3; label = 'good' }
    setStudyCardState(prev => {
      const updated = [...prev]
      updated[cardIdx] = { ...updated[cardIdx], results, rating: label, ease, evaluating: false, gradedAt: Date.now() }
      return updated
    })
    setStudyStats(prev => ({ ...prev, [label]: prev[label] + 1 }))
    console.log('[Study] card graded locally (multiple choice):', cs.front, '→', label)
  }

  // PBQ rating from a deterministic grade. Same recognition cap as multiple choice when syncing.
  const pbqRatingFromFraction = (fraction, noSync) => {
    let ease, label
    if (fraction >= 0.999) { ease = 4; label = 'easy' }
    else if (fraction >= 0.7) { ease = 3; label = 'good' }
    else if (fraction >= 0.4) { ease = 2; label = 'hard' }
    else { ease = 1; label = 'again' }
    if (!noSync && ease > 3) { ease = 3; label = 'good' }
    return { ease, label }
  }

  // A PBQ card that reaches the generic grader was given up on ("I don't know") — grade as all wrong.
  const evaluatePbqSkipped = (cardIdx, cs) => {
    const pbq = cs.questions[0]?.pbq
    const g = pbq ? gradePbq(pbq, null) : { correct: 0, total: 1, perItem: [] }
    const results = [{ correct: false, feedback: `${g.correct}/${g.total} — ${g.perItem.map(p => `${p.label} → ${p.expectedText}`).join(' · ')}` }]
    setStudyCardState(prev => {
      const updated = [...prev]
      updated[cardIdx] = { ...updated[cardIdx], results, rating: 'again', ease: 1, evaluating: false, gradedAt: Date.now() }
      return updated
    })
    setStudyStats(prev => ({ ...prev, again: prev.again + 1 }))
  }

  // Route a completed card to the right grader: local for PBQs and fully multiple-choice cards, AI otherwise.
  const evaluateCard = (cardIdx, cs) => {
    if (cs.pbq) return evaluatePbqSkipped(cardIdx, cs)
    if (cs.mc && cs.questions.length > 0 && cs.questions.every(questionHasChoices)) return evaluateCardLocally(cardIdx, cs)
    return evaluateCardAnswers(cardIdx, cs)
  }

  const evaluateCardAnswers = async (cardIdx, cs) => {
    try {
      const rules = activeMode.studyRules || defaultStudyRules
      const isLanguage = activeMode.type === 'language'
      const studyLang = interactionLangName(rules)                  // Ebi speaks → feedback language (all modes)
      const learnLang = isLanguage ? (rules.studyLanguage || learnLangName()) : userLangName()  // the language being learned → the answer language
      const grammarOn = rules.grammarFeedback || false
      const modeType = isLanguage ? `The student is learning ${learnLang} (their answers are in ${learnLang}). Typos in ${learnLang} should be marked CORRECT if the concept is understood.` : `The student is studying ${activeMode.name}. They answer in their own words to explain topics/situations. Questions were asked in ${studyLang}; the student may answer in ${studyLang} OR any language they prefer — grade on understanding, never on which language they answered in.`
      const notesInstruction = `\n\nFEEDBACK CATEGORIES: In addition to the one-line "feedback" summary, return a "notes" array of 0-4 short, categorized points (each written in ${studyLang}). Each note is {"type": <category>, "text": "...", "penalize": true/false}. Categories:\n- "praise": what the student got right / did well\n- "correction": what was wrong or a factual error\n- "grammar": grammar, spelling or accent issues\n- "terminology": word choice — using the precise/correct term\n- "detail": important information that was missing or incomplete\n- "tip": a concrete suggestion to improve\nUse the categories that apply (often just 1-2). ${grammarOn ? 'Include "grammar" notes when relevant; set "penalize": true ONLY when the grammar/accent error relates to what the card tests.' : 'Do NOT include "grammar" notes (grammar feedback is turned off).'} "penalize" defaults to false for all other categories.`

      const questionsAndAnswers = cs.questions.map((q, i) => {
        const isObj = typeof q === 'object' && q !== null
        const type = isObj ? (q.type || 'recall') : 'recall'
        const accepted = isObj && Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers : []
        const acceptedLine = (type !== 'explanation' && accepted.length > 0)
          ? (isLanguage
              ? `\nAccepted answers (CORRECT if the student's answer contains one of these — a leading article or extra words are fine; synonyms are WRONG): ${accepted.join(', ')}`
              : `\nReference answer(s) (a guide, not exact-match — accept any answer that shows correct understanding): ${accepted.join(', ')}`)
          : ''
        return `Q${i+1} [${type}]: ${getQuestionText(q)}${acceptedLine}\nAnswer: ${cs.answers[i] || '(no answer)'}`
      }).join('\n\n')

      const gradingRules = isLanguage
        ? `Grading rules by question type:\n- recall / fill_blank: mark CORRECT if the student's answer CONTAINS one of the "Accepted answers" — ignore a leading article (e.g. "una", "el") and extra function words, so "una huelga" is CORRECT for "huelga". Normalize for case, accents, and minor typos. Synonyms, related words, or different words with the same meaning are INCORRECT — mark them wrong and note the specific word this card tests. If no "Accepted answers" line is given, fall back to the ${learnLang} side of the card.\n- INFLECTION TOLERANCE (fill_blank): a different grammatical FORM of the SAME target word (verb tense/mood/person, or noun/adjective gender/number) is the SAME word, NOT a synonym. If the sentence does NOT contain a clear marker forcing one specific form — a time adverb (ayer, mañana, siempre, ahora), an explicit subject, or grammatical agreement — then accept ANY grammatically correct form of the target lemma that fits the sentence, even if it differs from the accepted list (e.g. present "huye" is CORRECT when the list says preterite "huyó" but nothing in the sentence indicates past tense). Only require the exact inflection when the sentence unambiguously forces it; never invent a tense the sentence does not signal.\n- explanation: grade on conceptual understanding — accept any answer that correctly addresses the question.\nALWAYS note any grammar, spelling, or accent issues in the feedback (e.g. missing accent mark on brújula). These notes are educational, not penalizing.`
        : `Grading rules:\n- This is NOT a vocabulary test. The student answers in their own words to explain concepts or situations. Grade EVERY question on conceptual understanding: mark CORRECT if the answer demonstrates correct understanding of the topic, even when phrased differently, with extra words, or not matching the reference answer exactly. Only mark WRONG if the answer is factually incorrect, off-topic, or empty. When useful, add a brief note in the feedback about anything they missed.`

      const knowledgeRef = !studyKnowledge ? '' : knowledgeIsBig()
        ? await getKnowledgeContext(`Grading a student's answers about "${cs.front}" — ${String(cs.back).slice(0, 300)}`, KNOWLEDGE_CAP, `card:${cs.front}`)
        : `\n\nREFERENCE MATERIAL (the user's knowledge base for this subject — authoritative when grading factual accuracy):\n${studyKnowledge.substring(0, KNOWLEDGE_CAP)}`
      const prompt = `Evaluate ALL answers for this flashcard at once.\n\nCard front: "${cs.front}"\nCard back: "${cs.back}"\n\n${modeType}\n\n${questionsAndAnswers}\n\n${gradingRules}${notesInstruction}${knowledgeRef}\n\nWrite ALL feedback text in ${studyLang}.\n\nReturn a JSON array of ${cs.questions.length} objects: [{"correct": true/false, "feedback": "one short summary sentence", "notes": [{"type": "praise|correction|grammar|terminology|detail|tip", "text": "...", "penalize": true/false}]}]\n\nOutput ONLY raw JSON. No markdown, no backticks.`

      const text = await aiCall(apiKey, 'You evaluate flashcard answers. Always respond with valid JSON only.', prompt, resolveModel('study'))
      const results = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))

      if (!Array.isArray(results)) return

      // Rate the card
      const qpc = cs.questions.length
      const wrongCount = results.filter(r => !r.correct || (grammarOn && (r.notes || []).some(n => n.type === 'grammar' && n.penalize))).length
      let ease, label
      if (wrongCount === 0) { ease = 4; label = 'easy' }
      else if (wrongCount === 1) { ease = 3; label = 'good' }
      else if (wrongCount >= qpc) { ease = 1; label = 'again' }
      else { ease = 2; label = 'hard' }
      // Same recognition cap as evaluateCardLocally — a multiple-choice pass that syncs to Anki
      // never rates above Good (this path handles mc cards whose choices partially failed to generate).
      if (cs.mc && !cs.noSync && ease > 3) { ease = 3; label = 'good' }

      setStudyCardState(prev => {
        const updated = [...prev]
        updated[cardIdx] = { ...updated[cardIdx], results, rating: label, ease, evaluating: false, gradedAt: Date.now() }
        return updated
      })
      setStudyStats(prev => ({ ...prev, [label]: prev[label] + 1 }))

      // (Completion → batchFeedback is handled by an effect below, so there's no transitional flash.)
      console.log('[Study] card evaluated:', cs.front, '→', label)
    } catch (err) {
      console.error('[Study] evaluation failed:', err.message)
      setStudyCardState(prev => {
        const updated = [...prev]
        updated[cardIdx] = { ...updated[cardIdx], evaluating: false, results: cs.questions.map(() => ({ correct: false, feedback: 'Evaluation failed' })), rating: 'again', ease: 1, gradedAt: Date.now() }
        return updated
      })
    }
  }

  // Pull a new card/word from the pool to replace a completed one
  const pullNewCard = async () => {
    if (studyWrappingUpRef.current) return

    const rules = activeMode.studyRules || defaultStudyRules
    const studyLang = rules.studyLanguage || learnLangName()  // answer language (language modes only)
    const qpc = rules.questionsPerCard || 3

    if (studyMode === 'conjugations') {
      if (studyBatchIdx >= studyConjugationWords.length) return
      const w = studyConjugationWords[studyBatchIdx]
      if (!w) return
      setStudyBatchIdx(prev => prev + 1)
      const questions = await generateConjugationQuestions(w.word, w.meaning, studyConjugationLanguage, qpc, studyLang)
      if (studyWrappingUpRef.current) return
      setStudyCardState(prev => [...prev, {
        cardId: null, front: w.word, back: w.meaning,
        fromDeck: w.fromDeck, isConjugation: true,
        questions, answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [],
      }])
      console.log('[Study:conjugations] pulled new word:', w.word)
    } else if (studyMode === 'pbq') {
      // Keep trying pool cards until one yields a VERIFIED exercise (discards are expected).
      // Reservation goes through pbqPullRef so sequential tries can't double-consume a card.
      const pbqFlags = { pbq: true, ...(studyPracticeSync ? {} : { noSync: true }) }
      for (let tries = 0; tries < 3; tries++) {
        const bi = pbqPullRef.current
        if (bi >= studyAllCards.length) return
        pbqPullRef.current = bi + 1
        setStudyBatchIdx(bi + 1)
        const card = studyAllCards[bi]
        const knowledgeContext = studyKnowledge ? `\n\nReference material:\n${studyKnowledge.substring(0, KNOWLEDGE_CAP)}` : ''
        const pbq = await generatePbqForCard(card, rules, knowledgeContext)
        if (studyWrappingUpRef.current) return
        if (pbq) {
          setStudyCardState(prev => [...prev, {
            cardId: card.cardId, front: getCardFront(card), back: getCardBack(card),
            questions: [{ question: pbq.title, type: 'pbq', pbq }],
            answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [], ...pbqFlags,
          }])
          console.log('[PBQ] pulled new exercise:', getCardFront(card))
          return
        }
      }
    } else {
      if (studyBatchIdx >= studyAllCards.length) return
      const card = studyAllCards[studyBatchIdx]
      if (!card) return
      setStudyBatchIdx(prev => prev + 1)
      const mcSession = studyAnswerStyle === 'choices'
      const mcFlags = mcSession ? { mc: true, ...(studyPracticeSync ? {} : { noSync: true }) } : {}
      const knowledgeContext = studyKnowledge ? `\n\nReference material:\n${studyKnowledge.substring(0, KNOWLEDGE_CAP)}` : ''
      const questions = await generateQuestionsForCard(card, rules, studyLang, knowledgeContext, mcSession)
      if (studyWrappingUpRef.current) return
      setStudyCardState(prev => [...prev, {
        cardId: card.cardId, front: getCardFront(card), back: getCardBack(card),
        questions, answers: [], results: [], done: false, questionIdx: 0, ...mcFlags,
      }])
      console.log('[Study] pulled new card:', getCardFront(card))
    }
  }

  // startBatch is no longer used in the new system but keep for compatibility
  const startBatch = async () => {}

  // Sync all completed card ratings to Anki. Returns { synced, failed, error? }.
  // Safe to call repeatedly — only unsynced cards are submitted, and only the
  // cards we actually submitted are marked synced (avoids a race where a card
  // that becomes done+ease between the filter and the setState gets marked
  // synced without being pushed to Anki).
  // Mirror studyCardState into a ref so a sync always reads the LATEST state (not a stale closure),
  // which matters because syncs are serialized and a later one must see the earlier one's results.
  const studyCardStateRef = useRef([])
  useEffect(() => { studyCardStateRef.current = studyCardState }, [studyCardState])

  // HARD GUARANTEE for word hints: never reveal the tested word. Drop any gloss whose key OR translation
  // shares a token with an accepted answer (the model ignores the prompt's exclusion sometimes, e.g.
  // glossing the source word "umbrella" -> "paraguas", which IS the answer).
  const glossNorm = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s]/gu, '').trim()
  const filterRevealingGlosses = (glosses, answers) => {
    if (!glosses || typeof glosses !== 'object') return {}
    const answerTokens = new Set()
    for (const a of (answers || [])) for (const tk of glossNorm(a).split(/\s+/)) if (tk) answerTokens.add(tk)
    const reveals = (s) => {
      const toks = glossNorm(s).split(/\s+/).filter(Boolean)
      return toks.length === 0 || toks.some(tk => answerTokens.has(tk))
    }
    const safe = {}
    for (const k in glosses) if (!reveals(k) && !reveals(glosses[k])) safe[k] = glosses[k]
    return safe
  }

  // Word hints: lazily fetch per-word glosses for a question when missing (the question-gen model
  // doesn't reliably return them). Stored on the question object so it's computed at most once.
  const glossFetchRef = useRef(new Set())
  const hasGlosses = (q) => q?.glosses && Object.keys(q.glosses).length > 0
  const fetchGlossesForQuestion = async (cardIdx, qIdx) => {
    if (!apiKey) return
    const key = `${cardIdx}:${qIdx}`
    if (glossFetchRef.current.has(key)) return
    const cs = studyCardStateRef.current[cardIdx] || studyCardState[cardIdx]
    const q = cs?.questions?.[qIdx]
    if (!q || hasGlosses(q)) return
    glossFetchRef.current.add(key)
    try {
      const rules = activeMode.studyRules || defaultStudyRules
      const learnLang = rules.studyLanguage || learnLangName()
      const userLang = userLangName()
      const answers = q.acceptedAnswers || []
      const qtext = getQuestionText(q)
      const prompt = `Question: "${qtext}"\n\nThe learner speaks ${userLang} and is learning ${learnLang}. Return a JSON object giving a SHORT translation (1-3 words) for EACH content word in the question, to help them read it, translated into the OTHER of these two languages:\n- a word written in ${learnLang} -> translate it to ${userLang}\n- a word written in ${userLang} -> translate it to ${learnLang}\nEXCLUDE: the answer word(s) [${answers.join(', ') || 'none'}], any blank (___), AND any word whose translation would reveal the answer (e.g. the quoted source word in a "translate X" question). Skip punctuation, numbers, and proper names.\nKeys must be the words spelled EXACTLY as they appear in the question.\n\nOutput ONLY the raw JSON object, e.g. {"perro":"dog"}. No markdown.`
      const text = await aiCall(apiKey, `You give short word-for-word translations between ${learnLang} and ${userLang}. Respond with a JSON object only.`, prompt, resolveModel('study'), { silent: true })
      const parsed = parseAiJson(text)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const safe = filterRevealingGlosses(parsed, answers)
        setStudyCardState(prev => {
          const updated = [...prev]
          const c = updated[cardIdx]
          if (c?.questions?.[qIdx]) {
            const qs = [...c.questions]
            qs[qIdx] = { ...qs[qIdx], glosses: safe }
            updated[cardIdx] = { ...c, questions: qs }
          }
          return updated
        })
      }
    } catch (e) {
      console.warn('[Study] gloss fetch failed:', e.message)
    }
  }

  // When a question is shown with Word hints on and it has no glosses yet, fetch them.
  useEffect(() => {
    if (activeMode.type !== 'language' || !activeMode.studyRules?.wordHints) return
    if (studyPhase !== 'question' || !currentQuestion) return
    const { cardIdx, questionIdx } = currentQuestion
    const q = studyCardState[cardIdx]?.questions?.[questionIdx]
    if (q && !hasGlosses(q)) fetchGlossesForQuestion(cardIdx, questionIdx)
  }, [currentQuestion, studyPhase, activeMode.studyRules?.wordHints, studyCardState])

  // A promise chain that serializes ALL sync calls (the 15s auto-sync AND manual finish/exit) so they
  // can never run concurrently (no double-answering a card in Anki) and the final one is never skipped.
  const syncChainRef = useRef(Promise.resolve())

  // HARD once-per-session guard: card ids this session has ALREADY answered in Anki. The ref-mirror
  // of studyCardState gets rebuilt from React state on every state change (the user keeps studying
  // while a sync's awaits run), which could wipe in-flight `synced` flags and let a chained sync
  // RE-ANSWER a card — learning cards are legitimately re-presented same-day by the reviewer, so a
  // duplicate sync recorded a real extra review and intervals silently compounded (1d → years).
  // This Set is written only here and cleared only on session start/exit — nothing can clobber it.
  const studySyncedIdsRef = useRef(new Set())

  const doSyncRatings = async () => {
    // Read the latest state from the ref; only push cards rated + not yet synced (the Set is the
    // authority — state/ref flags are for the UI).
    const ratingsToSync = studyCardStateRef.current.filter(cs => cs.done && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation && !cs.noSync && !studySyncedIdsRef.current.has(cs.cardId))
    if (ratingsToSync.length === 0) return { synced: 0, failed: 0 }

    // Anki may queue these cards in a different order than we studied them, so look each
    // presented card up by id rather than assuming an order.
    const wanted = new Map(ratingsToSync.map(cs => [cs.cardId, cs]))
    const synced = []
    const markSynced = (cs) => {
      synced.push(cs)
      studySyncedIdsRef.current.add(cs.cardId) // clobber-proof: this card can never be answered again this session
      // Mark synced in the REF immediately so a later queued sync won't re-answer (double) this card.
      studyCardStateRef.current = studyCardStateRef.current.map(c => c.cardId === cs.cardId ? { ...c, synced: true } : c)
      wanted.delete(cs.cardId)
    }

    // PRIMARY PATH: drive Anki's real reviewer. `answerCards` only works on the card at the TOP
    // of the scheduler queue ("not at top of queue" otherwise, e.g. for a brand-new card), so we
    // start a review on the deck and answer each card the scheduler presents with our rating. This
    // also makes Anki compute the correct SM-2/FSRS interval for every rating.
    try {
      const started = await ankiGuiDeckReview(studyDeck)
      if (started) {
        let guard = ratingsToSync.length * 4 + 8
        while (wanted.size > 0 && guard-- > 0) {
          let cur
          try { cur = await ankiGuiCurrentCard() } catch { cur = null }
          if (!cur || !cur.cardId) break          // queue exhausted
          const cs = wanted.get(cur.cardId)
          if (!cs) break                           // a card we didn't study is up next — stop, don't touch it
          // guiCurrentCard returns `buttons` as an ARRAY of the valid ease values (e.g. [1,2,3] for a
          // new/learning card, [1,2,3,4] for review) — NOT a count. Cap our ease to the highest available.
          const validEases = Array.isArray(cur.buttons) ? cur.buttons.filter(n => typeof n === 'number') : []
          const maxEase = validEases.length ? Math.max(...validEases) : 4
          const ease = Math.min(cs.ease, maxEase)
          console.log('[Anki sync] gui-answering card', cur.cardId, 'ease', ease, 'rating', cs.rating, 'buttons', cur.buttons)
          try {
            await ankiGuiShowAnswer()
            const ok = await ankiGuiAnswerCard(ease)
            if (ok !== false) markSynced(cs)
            else break
          } catch { break }
        }
      }
    } catch (err) {
      console.error('[Anki sync] gui review failed', err.message)
    } finally {
      // Leave Anki on the deck list rather than stuck mid-review.
      try { await ankiGuiDeckBrowser() } catch {}
    }

    // FALLBACK: any card the reviewer never presented (odd queue state) — try the direct path.
    // answerCards returns an ARRAY of booleans (one per card), or throws "not at top of queue".
    const ansOk = (r) => Array.isArray(r) ? r[0] !== false : r !== false
    // Map our 1-4 ease onto a due-date interval (days) for the last-resort path. Approximate, but it
    // records SOMETHING so a brand-new card (the common "not at top of queue" case) still syncs.
    const easeToDueDays = (ease) => ease >= 4 ? '4' : ease === 3 ? '2' : ease === 2 ? '1' : '0'
    const failed = []
    for (const cs of Array.from(wanted.values())) {
      // ANKI-SCHEDULE GUARD: never record a review for a card Anki does not consider due/new RIGHT
      // NOW (most often: its review was already recorded earlier today). The reviewer path above is
      // inherently schedule-respecting — this fallback wasn't, and force-recording off-schedule
      // reviews is exactly how a week of studying compounded intervals into years. Act like Anki:
      // only answer when it's actually time.
      try {
        const stillDue = await ankiFindCards(`cid:${cs.cardId} (is:due OR is:new)`)
        if (Array.isArray(stillDue) && stillDue.length === 0) {
          console.warn('[Anki sync] card', cs.cardId, `("${cs.front}") is not due in Anki — its review was already recorded. Skipping to protect the schedule.`)
          markSynced(cs)
          continue
        }
      } catch { /* if the check itself fails, continue — answerCards fails safely for non-top cards */ }
      try {
        console.log('[Anki sync] answering card (fallback)', cs.cardId, 'ease', cs.ease, 'rating', cs.rating)
        let result = await ankiAnswerCards([{ cardId: cs.cardId, ease: cs.ease }])
        // Retry once with a capped ease in case it was out of range (a new card with only 3 buttons).
        if (!ansOk(result)) result = await ankiAnswerCards([{ cardId: cs.cardId, ease: Math.min(cs.ease, 3) }])
        if (ansOk(result)) { markSynced(cs); continue }
        throw new Error('not at top of queue')
      } catch (err) {
        // answerCards can't grade a card that isn't at the top of the scheduler queue.
        try {
          const isNew = await ankiFindCards(`cid:${cs.cardId} is:new`).then((r) => r.length > 0).catch(() => false)
          if (isNew) {
            // Brand-new card (the common "not at top of queue" case): approximate first interval +
            // revlog row. There is no existing schedule to corrupt, so this is safe.
            const days = easeToDueDays(cs.ease)
            const ease = Math.min(Math.max(cs.ease, 1), 4)
            console.log('[Anki sync] setDueDate+insertReviews fallback (new card)', cs.cardId, 'days', days, 'ease', ease)
            await ankiSetDueDate([cs.cardId], days)
            // setDueDate reschedules but writes no revlog row, so Anki would show "0 studied". Add the
            // revlog entry so the card counts in Cards Today / streak / accuracy. +i keeps the id unique.
            const ivl = Math.max(0, parseInt(days, 10) || 0)
            await ankiInsertReviews([[Date.now() + failed.length + synced.length, cs.cardId, -1, ease, ivl, 0, 2500, 0, 0]])
              .catch((e) => console.warn('[Anki sync] insertReviews failed (rating still rescheduled):', e.message))
            markSynced(cs)
            continue
          }
          // REVIEW card the reviewer didn't present: record a REAL review without touching the
          // grading — a bare setDueDate "0" nudges the card due NOW but preserves its interval
          // (only the "!" suffix would change it), then Anki's own reviewer answers it so the
          // scheduler computes the next interval from the card's true history. The old behavior
          // (force setDueDate 0-4 days + a synthetic revlog) is exactly what corrupted schedules.
          console.log('[Anki sync] nudge-due + reviewer fallback (review card)', cs.cardId, 'ease', cs.ease)
          await ankiSetDueDate([cs.cardId], '0')
          const started2 = await ankiGuiDeckReview(studyDeck)
          let cur2 = null
          if (started2) { try { cur2 = await ankiGuiCurrentCard() } catch { cur2 = null } }
          if (cur2?.cardId === cs.cardId) {
            const validEases2 = Array.isArray(cur2.buttons) ? cur2.buttons.filter((n) => typeof n === 'number') : []
            const maxEase2 = validEases2.length ? Math.max(...validEases2) : 4
            await ankiGuiShowAnswer()
            const ok2 = await ankiGuiAnswerCard(Math.min(cs.ease, maxEase2))
            if (ok2 !== false) { markSynced(cs); continue }
          }
          // Another due card was ahead in the queue — do NOT touch this card's schedule any further;
          // surface it as failed so the user can sync again (or it flushes on exit).
          console.error('[Anki sync] reviewer presented a different card — leaving', cs.cardId, 'unrecorded, schedule untouched')
          failed.push(cs)
        } catch (err2) {
          console.error('[Anki sync] fallback failed for card', cs.cardId, err2.message)
          failed.push(cs)
        }
      }
    }
    // The nudge fallback may have left Anki mid-review — return it to the deck list.
    try { await ankiGuiDeckBrowser() } catch {}
    if (synced.length > 0) {
      const syncedIds = new Set(synced.map(cs => cs.cardId))
      setStudyCardState(prev => prev.map(cs => syncedIds.has(cs.cardId) ? { ...cs, synced: true } : cs))
      ankiSync().catch(() => {}) // push the new schedule to AnkiWeb so the desktop app + web stay in sync
      ankiGetDeckStats([studyDeck]).then(s => {
        const ds = Object.values(s)[0]
        if (ds) setStudyDeckStats(ds)
      }).catch(() => {})
      console.log('[Anki sync] synced', synced.length, 'cards. Failed:', failed.length)
    }
    return { synced: synced.length, failed: failed.length, ...(failed.length > 0 ? { error: `${failed.length} card(s) failed` } : {}) }
  }

  // Queue a sync onto the chain — never runs alongside another sync, never skipped. Await it to know
  // the result (the manual finish/exit awaits this so all ratings are pushed before leaving).
  const syncRatingsToAnki = () => {
    const run = syncChainRef.current.then(doSyncRatings, doSyncRatings)
    syncChainRef.current = run.catch(() => {})
    return run
  }

  // Each card is answered in Anki EXACTLY ONCE, with its FINAL rating. The user gets a grace window
  // (studyAutoSyncMinutes, default 5) after the AI grades a card to correct the rating; after that the
  // card auto-syncs and is LOCKED (its rating can no longer change), so Anki never records "again" THEN
  // "easy", which would lapse a mature card from months down to days and can't be cleanly undone. Manual
  // "Sync now" and Finish/Exit flush immediately. All paths go through syncRatingsToAnki() (serialized).
  const STUDY_SYNC_GRACE_MS = Math.max(0.5, studyAutoSyncMinutes || 5) * 60 * 1000

  // Run a sync (manual button, auto-timer, or finish/exit) with shared in-flight + notification handling.
  const syncGradedNow = async () => {
    if (studySyncing) return { synced: 0, failed: 0 }
    setStudySyncing(true); setStudySyncError(null)
    try {
      const r = await syncRatingsToAnki()
      if (r.synced > 0) { setStudySyncNotification(true); setTimeout(() => setStudySyncNotification(false), 4000) }
      if (r.failed > 0) setStudySyncError(`Could not sync ${r.failed} card${r.failed === 1 ? '' : 's'} to Anki${r.error ? ` (${r.error})` : ''}.`)
      return r
    } finally {
      setStudySyncing(false)
    }
  }

  // Auto-sync: fire when the OLDEST unsynced graded card crosses its 5-minute mark. Re-armed whenever the
  // card state changes (a new grade, a correction). A full flush is robust (the Anki reviewer answers in
  // queue order); cards graded in the final moments may commit slightly early, but none waits past 5 min.
  useEffect(() => {
    if (!studyAutoSync || !studyActive || studyPhase === 'summary') return
    const pending = studyCardState.filter(cs => cs.done && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation && !cs.noSync && cs.gradedAt)
    if (pending.length === 0) return
    const oldest = Math.min(...pending.map(cs => cs.gradedAt))
    const fireIn = Math.max(0, oldest + STUDY_SYNC_GRACE_MS - Date.now())
    const timer = setTimeout(() => { syncGradedNow() }, fireIn)
    return () => clearTimeout(timer)
  }, [studyCardState, studyActive, studyPhase, studyAutoSync])

  // 1s ticker so the "locks in M:SS" countdown updates while something is pending during study.
  useEffect(() => {
    if (!studyAutoSync || !studyActive || studyPhase === 'summary') return
    const hasPending = studyCardState.some(cs => cs.done && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation && !cs.noSync && cs.gradedAt)
    if (!hasPending) return
    const id = setInterval(() => setStudyNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [studyAutoSync, studyActive, studyPhase, studyCardState])

  const nextBatch = async () => {
    await syncRatingsToAnki()
    setStudyPhase('summary')
  }

  const exitStudy = async () => {
    // Last-line defense: try to flush any unsynced ratings before tearing down state.
    // If Anki is unreachable, ask the user whether to exit anyway (losing those ratings)
    // or stay so they can fix the connection and retry.
    const unsynced = studyCardState.filter(cs => cs.done && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation && !cs.noSync)
    if (unsynced.length > 0) {
      const result = await syncRatingsToAnki()
      if (result.failed > 0) {
        const proceed = window.confirm(
          `Could not sync ${result.failed} card rating${result.failed === 1 ? '' : 's'} to Anki ` +
          `(${result.error || 'unknown error'}).\n\n` +
          `Exit anyway and lose those ratings? Click Cancel to stay and retry (e.g. make sure Anki is running with AnkiConnect).`
        )
        if (!proceed) return
      }
    }
    setStudyActive(false)
    setStudyAllCards([])
    setStudyCardState([])
    setStudyQueue([])
    setStudyQueueIdx(0)
    setStudyPhase('pick')
    setStudyInput('')
    setAnkiError(null)
    setStudyWrappingUp(false)
    studyWrappingUpRef.current = false
    setStudyDeleteConfirm(null)
    setStudyFeedbackChat({})
    setStudyInsights(null)
    setCurrentQuestion(null)
    setStudyCurrentHint(null)
    setStudyHintLevel(0)
    setStudyMeaningHint(null); setStudyWordLookup(null)
    setStudyAnswerHistory([])
    setStudyMode('flashcards')
    setStudyConjugationWords([])
    setStudyConjugationLanguage('English')
    if (studyChoiceFlashTimer.current) clearTimeout(studyChoiceFlashTimer.current)
    setStudyChoiceFlash(null)
    if (studyTypedFlashTimer.current) clearTimeout(studyTypedFlashTimer.current)
    setStudyTypedFlash(null)
    setStudyPbqReview(null)
    studySyncedIdsRef.current = new Set()
  }

  // Generate spaced repetition insights + update progress observations
  const generateStudyInsights = async () => {
    if (!apiKey || studyInsightsLoading || studyCardState.length === 0) return
    setStudyInsightsLoading(true)
    try {
      // Load existing progress observations
      let existingProgress = ''
      try {
        const r = await fetch(`/api/deck-progress?deck=${encodeURIComponent(studyDeck)}`)
        const d = await r.json()
        existingProgress = d.content || ''
      } catch {}

      const sessionSummary = studyCardState.filter(cs => cs.done).map(cs => {
        const wrongQs = cs.results.filter(r => !r.correct).map((r, i) => cs.questions[i]).join('; ')
        return `Card: "${cs.front}" → Rating: ${cs.rating}${wrongQs ? ` (struggled with: ${wrongQs})` : ''}`
      }).join('\n')

      const prompt = `Analyze this study session and update the progress observations.

Session results for deck "${studyDeck}":
${sessionSummary}

${existingProgress ? `Previous progress observations:\n${existingProgress}` : 'No previous observations — this is the first session.'}

Respond with TWO sections separated by "---":

SECTION 1: Brief insight message for the student (2-4 sentences). Mention what they did well, what they struggled with, and any improvements from previous observations.

---

SECTION 2: Updated progress-observations.md content. Keep the format:
# Progress Observations — ${studyDeck}
Last updated: ${new Date().toISOString().split('T')[0]}

## Current Struggles
(list items)

## Improving
(items that were struggles but are getting better)

## Mastered (recently)
(items no longer a problem)`

      const text = await aiCall(apiKey, 'You analyze study session results and track learning progress.', prompt, resolveModel('study'))
      const parts = text.split('---')
      const insight = parts[0]?.trim() || text
      const newProgress = parts[1]?.trim()

      setStudyInsights(insight)

      // Save updated progress observations
      if (newProgress) {
        try {
          await fetch('/api/deck-progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deck: studyDeck, content: newProgress }),
          })
          console.log('[Study] progress observations updated for:', studyDeck)
        } catch {}
      }
    } catch (err) {
      setStudyInsights('Could not generate insights: ' + err.message)
    } finally {
      setStudyInsightsLoading(false)
    }
  }

  // Wrap Up — stop new cards, discard unstarted ones, finish in-progress only
  const studyWrapUp = () => {
    studyWrappingUpRef.current = true
    setStudyWrappingUp(true)
    setStudyCardState(prev => {
      const currentCardIdx = currentQuestion?.cardIdx ?? -1
      return prev.map((cs, idx) => {
        if (!cs.done && cs.answers.length === 0 && idx !== currentCardIdx) {
          return { ...cs, done: true, skipped: true }
        }
        return cs
      })
    })
  }

  // End Now — immediately go to summary with partial results
  const studyEndNow = () => {
    // Rate any unfinished cards as "again"
    const newStates = [...studyCardState]
    newStates.forEach((cs) => {
      if (!cs.done) {
        cs.done = true
        cs.rating = 'again'
        setStudyStats((prev) => ({ ...prev, again: prev.again + 1 }))
      }
    })
    setStudyCardState(newStates)
    setStudyPhase('summary')
    setStudyWrappingUp(false)
    studyWrappingUpRef.current = false
  }

  // "I know this" — delete card from Anki
  const studyDeleteKnownCard = async (cardIdx) => {
    const cs = studyCardState[cardIdx]
    try {
      // Find the noteId from the card
      const card = studyAllCards.find(c => c.cardId === cs.cardId)
      if (card) {
        await ankiDeleteNotes([card.note])
        ankiSync().catch(() => {})
      }
      // Mark as done + deleted, skip remaining questions
      const newStates = [...studyCardState]
      newStates[cardIdx] = { ...newStates[cardIdx], done: true, rating: 'deleted' }
      setStudyCardState(newStates)
      // Remove remaining questions for this card from queue
      const newQueue = studyQueue.filter((q, i) => i <= studyQueueIdx || q.cardIdx !== cardIdx)
      setStudyQueue(newQueue)
      setStudyDeleteConfirm(null)
      // If no more questions, go to batch feedback
      if (studyQueueIdx + 1 >= newQueue.length) {
        setStudyPhase('batchFeedback')
      }
    } catch (err) {
      console.error('[Study] delete failed:', err.message)
      setStudyDeleteConfirm(null)
    }
  }

  // Chat about feedback for a specific card — can fix typos, re-rate, update card
  const sendStudyFeedbackChat = async (cardIdx) => {
    const chat = studyFeedbackChat[cardIdx] || { messages: [], input: '', loading: false }
    const q = chat.input?.trim()
    if (!q || !apiKey || chat.loading) return
    const cs = studyCardState[cardIdx]
    const studyLang = interactionLangName()  // Ebi speaks (all modes)
    const feedbackModeId = activeModeIdRef.current // pin — this resolves async, writes must target THIS mode
    const newMessages = [...(chat.messages || []), { role: 'user', text: q }]
    setStudyFeedbackChat(prev => ({ ...prev, [cardIdx]: { ...chat, messages: newMessages, input: '', loading: true } }))
    try {
      const resultsContext = cs.questions.map((question, qi) =>
        `Q${qi+1}: ${getQuestionText(question)}\nAnswer: ${cs.answers[qi] || '(skipped)'}\nResult: ${cs.results[qi]?.correct ? 'Correct' : 'Incorrect'} — ${cs.results[qi]?.feedback}`
      ).join('\n\n')
      const systemPrompt = `You are a study tutor. The student just studied this flashcard:
Front: "${cs.front}"
Back: "${cs.back}"

Their results:
${resultsContext}

IMPORTANT: Always trust the student. Be supportive, never argumentative.

The student may:
1. Report a typo or correction (e.g. "I meant guadaña", "that was a typo") — ALWAYS trust them. If their intended answer demonstrates they knew the concept on the card, mark ALL questions correct using mark_all_correct. Do not demand full explanations or argue.
2. Explicitly ask to mark things correct (e.g. "mark all as correct", "just do it", "i knew it", "count it") — ALWAYS honor this with mark_all_correct, no resistance.
3. Flag an out-of-scope question — if genuinely unfair, include <action>{"type":"bad_question","questionIndex":N,"reason":"..."}</action>
4. Ask to update the Anki card — include <action>{"type":"update_card","newFront":"...","newBack":"..."}</action>
5. Teach you how to ask — when the student says a question was FORMED badly, was confusing, or that they want questions asked DIFFERENTLY from now on, include <action>{"type":"question_preference","preference":"..."}</action> where "preference" is ONE concise imperative rule in English, GENERALIZED beyond this single card (e.g. "Don't use rare literary vocabulary in fill-in-the-blank sentences", "Prefer realistic scenario questions over definition questions", "Keep questions under 15 words"). This rule is saved to the study mode and shapes every future question. Confirm in your reply that future questions will follow it.

To mark ALL questions correct: <action>{"type":"mark_all_correct","reason":"brief reason","feedback":"short confirmation in ${studyLang}"}</action>
To mark ONE question correct: <action>{"type":"fix_typo","questionIndex":N,"correctedAnswer":"...","shouldBeCorrect":true,"feedback":"short confirmation in ${studyLang}"}</action>

Respond in 1-2 sentences max, written ENTIRELY in ${studyLang} (the language the student is studying — not English, unless ${studyLang} is English). Always include the action tag when applicable. Never refuse a student's correction request.`
      const fullPrompt = newMessages.map(m => `${m.role === 'user' ? 'User' : 'Tutor'}: ${m.text}`).join('\n')
      const text = await aiCall(apiKey, systemPrompt, fullPrompt, resolveModel('study'))

      // Parse and execute actions from the response
      const actionMatches = [...text.matchAll(/<action>(.*?)<\/action>/gs)]
      const cleanText = text.replace(/<action>.*?<\/action>/gs, '').trim()
      choosePose(cleanText, setStudyMascot) // feedback chat updates the study companion
      let updatedStates = null

      for (const match of actionMatches) {
        try {
          const action = JSON.parse(match[1])
          if (action.type === 'mark_all_correct') {
            if (!updatedStates) updatedStates = [...studyCardState]
            updatedStates[cardIdx] = { ...updatedStates[cardIdx] }
            updatedStates[cardIdx].results = updatedStates[cardIdx].results.map(r => ({ ...r, correct: true, feedback: action.feedback || r.feedback || 'Marked correct.' }))
          } else if (action.type === 'fix_typo' && action.shouldBeCorrect) {
            // Re-evaluate: mark the question as correct
            if (!updatedStates) updatedStates = [...studyCardState]
            const qi = action.questionIndex
            if (qi >= 0 && qi < updatedStates[cardIdx].results.length) {
              updatedStates[cardIdx] = { ...updatedStates[cardIdx] }
              updatedStates[cardIdx].results = [...updatedStates[cardIdx].results]
              updatedStates[cardIdx].results[qi] = { ...updatedStates[cardIdx].results[qi], correct: true, feedback: action.feedback || `Typo corrected: "${action.correctedAnswer}" — Correct!` }
              updatedStates[cardIdx].answers = [...updatedStates[cardIdx].answers]
              updatedStates[cardIdx].answers[qi] = action.correctedAnswer + ' (corrected)'
            }
          } else if (action.type === 'update_card') {
            // Update the Anki card
            const card = studyAllCards.find(c => c.cardId === cs.cardId)
            if (card) {
              const fields = card.fields ? Object.entries(card.fields).sort(([,a],[,b]) => a.order - b.order) : []
              const updates = {}
              if (fields[0]) updates[fields[0][0]] = (action.newFront || '').replace(/\n/g, '<br>')
              if (fields[1]) updates[fields[1][0]] = (action.newBack || '').replace(/\n/g, '<br>')
              await ankiUpdateNote(card.note, updates)
              ankiSync().catch(() => {})
            }
          } else if (action.type === 'question_preference' && action.preference) {
            // Teach Ebi how to ask: persist a concise style rule on THIS mode. It feeds every
            // future generateQuestionsForCard call and is editable in Settings → Study.
            const pref = String(action.preference).trim().slice(0, 300)
            const targetMode = modesRef.current.find((mm) => mm.id === feedbackModeId)
            const sr = targetMode?.studyRules || {}
            const prevPrefs = Array.isArray(sr.questionPreferences) ? sr.questionPreferences : []
            if (pref && !prevPrefs.includes(pref)) {
              updateModeById(feedbackModeId, { studyRules: { ...sr, questionPreferences: [...prevPrefs, pref].slice(-12) } })
              console.log('[Study] saved question-style preference:', pref)
            }
          }
        } catch {}
      }

      // Re-rate the card if results were changed
      if (updatedStates) {
        const qpc = updatedStates[cardIdx].results.length
        const grammarOn = (activeMode.studyRules || defaultStudyRules).grammarFeedback || false
        const wrongCount = updatedStates[cardIdx].results.filter(r => !r.correct || (grammarOn && (r.notes || []).some(n => n.type === 'grammar' && n.penalize))).length
        let label
        if (wrongCount === 0) label = 'easy'
        else if (wrongCount === 1) label = 'good'
        else if (wrongCount >= qpc) label = 'again'
        else label = 'hard'
        // Update stats: remove old rating, add new
        const oldRating = updatedStates[cardIdx].rating
        if (oldRating && oldRating !== label) {
          setStudyStats(prev => ({ ...prev, [oldRating]: Math.max(0, prev[oldRating] - 1), [label]: prev[label] + 1 }))
        }
        updatedStates[cardIdx].rating = label
        updatedStates[cardIdx].ease = { easy: 4, good: 3, hard: 2, again: 1 }[label] || 1
        updatedStates[cardIdx].synced = false
        setStudyCardState(updatedStates)
      }

      setStudyFeedbackChat(prev => ({
        ...prev,
        [cardIdx]: { messages: [...newMessages, { role: 'assistant', text: cleanText }], input: '', loading: false }
      }))
    } catch (err) {
      setStudyFeedbackChat(prev => ({
        ...prev,
        [cardIdx]: { messages: [...newMessages, { role: 'assistant', text: 'Error: ' + err.message }], input: '', loading: false }
      }))
    }
  }

  // ─── Chat Tab Functions ──────────────────────────────────────────────────
  const chatTabAttachDeck = async (deckName) => {
    if (!deckName) { setChatTabAttachedDeck(null); return }
    setChatTabAttachLoading(true)
    try {
      const noteIds = await ankiFindNotes(`deck:"${deckName}"`)
      const notes = noteIds.length > 0 ? await ankiNotesInfo(noteIds.slice(0, 100)) : []
      const cards = notes.map(n => {
        const fields = Object.values(n.fields).sort((a, b) => a.order - b.order)
        return { front: stripHtml(fields[0]?.value || ''), back: stripHtml(fields[1]?.value || '') }
      })
      // Load progress observations
      let progress = ''
      try {
        const r = await fetch(`/api/deck-progress?deck=${encodeURIComponent(deckName)}`)
        const d = await r.json()
        progress = d.content || ''
      } catch {}
      setChatTabAttachedDeck({ name: deckName, cards, progress })
    } catch (err) {
      console.error('[Chat] attach deck failed:', err)
    } finally {
      setChatTabAttachLoading(false)
    }
  }

  // Backfill per-mode chat suggestions for modes created before this feature (or imported). New modes
  // get them at creation; this lazily generates + persists them the first time the user opens Chat.
  const chatSuggestTriedRef = useRef(new Set())
  useEffect(() => {
    if (activeTab !== 'chat' || !apiKey) return
    if (activeMode.chatSuggestions && activeMode.chatSuggestions.length) return
    if (chatSuggestTriedRef.current.has(activeModeId)) return
    chatSuggestTriedRef.current.add(activeModeId)
    const modeId = activeModeId // pin the target — this resolves async, the user may switch modes
    ;(async () => {
      try {
        const prompt = `Generate exactly 3 short example chat prompts (3-6 words each) a user could tap to start chatting with an AI tutor about this study mode. Mix a concept question, a "make a flashcard" request, and a "quiz me" request — all specific to the subject.\nMode name: "${activeMode.name}"\nSubject/description: "${activeMode.description || activeMode.name}"\nType: ${activeMode.type}\nOutput ONLY a raw JSON array of 3 strings. No markdown, no backticks.`
        const text = await aiCall(apiKey, 'You suggest example chat prompts. Respond with valid JSON only.', prompt, resolveModel('general'), { silent: true })
        const arr = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
        if (Array.isArray(arr) && arr.length) updateModeById(modeId, { chatSuggestions: arr.filter(Boolean).slice(0, 3).map(String) })
      } catch { /* keep the generic defaults */ }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeModeId, apiKey])

  const sendChatTabMessage = async () => {
    const q = chatTabInput.trim()
    const img = chatTabImage
    if ((!q && !img) || !apiKey || chatTabLoading) return
    const newMsgs = [...chatTabMsgs, { role: 'user', content: q || '(image)', image: img || undefined }]
    setChatTabMsgs(newMsgs)
    setChatTabInput('')
    setChatTabImage(null)
    setChatPlusOpen(false)
    setChatTabLoading(true)
    setTimeout(() => { scrollChatToLatestTurn(); chatTabInputRef.current?.focus() }, 60)
    try {
      let systemPrompt = `You are Ebi, a helpful study assistant. The user is studying with mode "${activeMode.name}".

ACCURACY IS CRITICAL. This is a learning app and the user will MEMORIZE what you teach, so a single error is harmful. Rules:
- NEVER invent words or state facts you are not sure are correct. Do not guess.
- Before stating any word, translation, conjugation, gender, definition, or fact, double-check it is correct and that the word actually EXISTS and is spelled correctly in the target language.
- Silently re-read your answer before sending and fix any mistakes. If you realize a word may not exist, correct it.
- If you are not fully certain, say so honestly instead of presenting a guess as fact.

WRITING STYLE: Never use em-dashes (—) or en-dashes (–); they read as fake/AI. Use commas, periods, parentheses, or just shorter sentences instead. Write naturally and human.

LORE: You (Ebi) are a shrimp and are completely at peace with being eaten. You know shrimp are nutritious, delicious, and healthy, so if it ever comes up, cheerfully reassure the user it's totally fine and even encourage them to enjoy eating shrimp.

You run on the ${providerConfig.label} model "${resolveModel('chat')}". If the user asks what AI model or provider powers you, just tell them, it's not a secret.

IMPORTANT BEHAVIOR RULES:
1. When the user asks you to build a whole DECK or many cards for a broad topic:
   - DO NOT immediately generate a wall of cards
   - Instead, ASK: "I can help with that! Would you like me to: (1) Search for top-rated existing Anki decks for this topic online, or (2) Generate custom cards based on specific objectives or materials you provide?"
   - If they want custom cards: ask what to cover, then generate systematically.
   - BUT if the user just asks for a card for a SPECIFIC word/phrase (e.g. "make a card for surcar"), make it right away — no need to ask first.

2. When creating flashcards:
   - Emit each card as JSON wrapped in <anki-card> tags: {"front": "...", "back": "...", "tags": [...]}
   - If a word has clearly distinct meanings, emit a SEPARATE <anki-card> per meaning.
   - If the input looks misspelled, mention the correction and base the card on the corrected word.
${activeMode.type === 'language' ? `   - LANGUAGE MODE (learning ${learnLangName()}, user speaks ${userLangName()}) — use this back format, each label on its own line, with the LABELS WRITTEN IN ${learnLangName()}:
     front: "<word> (<part of speech written in ${learnLangName()}>)"
     back lines: pronunciation (phonetics for a ${userLangName()} speaker, stress in CAPS), translation (to ${userLangName()}), direct/literal translation (omit the line if none), synonyms (in ${userLangName()}), definition (written IN ${learnLangName()}), example (a natural ${learnLangName()} sentence with its ${userLangName()} translation in parentheses).
     tags: include part of speech, level, topic, and "ebiki". Only use REAL, correctly-spelled ${learnLangName()} words.` : `   - Design a back that best teaches this subject (definition, key points, formula, example as fits). Always include an "ebiki" tag.`}

3. For general questions: be concise and helpful. Explain concepts clearly.

4. NEVER dump a wall of cards without asking first. Quality over quantity.`

      // The mode's knowledge base rides along on every chat message, so Ebi always has the
      // user's own study material as context (big books: only the sections relevant to the
      // user's message, picked via the TOC).
      systemPrompt += await getKnowledgeContext(q || `general chat about ${activeMode.name}`)

      // Web search if enabled
      let searchSources = null
      if (!chatTabWebSearch) {
        // No web access right now: rather than guess, offer to look it up.
        systemPrompt += `\n\nWEB ACCESS IS OFF. If you genuinely do not know something, or are unsure of a CURRENT/factual detail you cannot verify (recent events, prices, live data, niche facts), do NOT guess or make something up. Briefly say you're not certain, and offer to look it up by adding the tag <offer-search>a concise web search query</offer-search> to your reply. Only offer search when it would actually help — for things you reliably know (common vocabulary, grammar, basic concepts), just answer.`
      }
      if (chatTabWebSearch) {
        setChatTabStatus('searching')
        systemPrompt += '\n\n5. You have WEB SEARCH capability. Search results from the internet are provided below. You MUST use them to answer the user\'s question. Do NOT say you cannot search the internet — the search has already been performed for you. You MUST cite your sources inline using [Source Title](URL) format for every claim based on search results.'
        try {
          const searchRes = await fetch(`/api/web-search?q=${encodeURIComponent(q)}`)
          const searchData = await searchRes.json()
          if (searchData.results?.length > 0) {
            searchSources = searchData.results
            setChatTabStatus('search-done')
            systemPrompt += `\n\nWEB SEARCH RESULTS for "${q}":\n` +
              searchData.results.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`).join('\n\n') +
              '\n\nBase your answer on these search results. You MUST cite source URLs inline. At the end of your response, list all sources you used in this format:\n<sources>\nTitle | URL\nTitle | URL\n</sources>'
          } else {
            setChatTabStatus('search-empty')
            systemPrompt += '\n\nWeb search returned no results. Answer from your own knowledge but mention the search found nothing.'
          }
        } catch {
          setChatTabStatus('search-failed')
          systemPrompt += '\n\nWeb search failed. Answer from your own knowledge but mention the search encountered an error.'
        }
      }
      setChatTabStatus('thinking')

      if (chatTabAttachedDeck) {
        const cardSummary = chatTabAttachedDeck.cards.map(c => `• ${c.front} → ${c.back}`).join('\n')
        systemPrompt += `\n\nThe user has attached their Anki deck "${chatTabAttachedDeck.name}" (${chatTabAttachedDeck.cards.length} cards).
${chatTabAttachedDeck.progress ? `Progress observations:\n${chatTabAttachedDeck.progress}\n` : ''}
Card contents (all ${chatTabAttachedDeck.cards.length} cards):\n${cardSummary}

Focus on their weak areas. If you discover new struggles or notice improvement, wrap observation updates in <progress-update>new content for the file</progress-update> tags.`
      }

      // Learning-focused composer prefs (per-mode "+" menu).
      const prefs = activeMode.chatPrefs || {}
      const focusText = {
        tutor: 'Act as a patient tutor: explain step-by-step and check the user understands.',
        translator: 'Act as a translator: give the translation first, then briefly explain nuances.',
        cardmaker: 'Bias toward flashcards: when a useful word/term comes up, proactively offer a formatted <anki-card>.',
        quiz: 'Quiz the user: ask questions and give feedback instead of lecturing.',
      }[prefs.focus] || ''
      if (focusText) systemPrompt += `\n\nFOCUS: ${focusText}`
      if (prefs.level) systemPrompt += `\nTarget a ${prefs.level} learner.`
      if (prefs.explain && prefs.explain !== 'auto') systemPrompt += `\nWrite your explanations in ${prefs.explain}.`

      const convo = newMsgs.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
      // Include images from the recent conversation (most recent up to 4) so follow-up questions
      // about an attached image keep working — like the Claude app's multimodal chat.
      const imgMsgs = newMsgs.filter((m) => m.image).slice(-4)
      const imageParts = []
      for (const m of imgMsgs) imageParts.push(dataUrlToImagePart(await downscaleDataUrl(m.image, 1500)))
      const text = await aiCall(apiKey, systemPrompt, convo, resolveModel('chat'), imageParts.length ? { images: imageParts } : undefined)

      // Parse anki cards from response
      const cardMatches = [...text.matchAll(/<anki-card>(.*?)<\/anki-card>/gs)]
      const parsedCards = cardMatches.map(m => { try { return JSON.parse(m[1]) } catch { return null } }).filter(Boolean)

      // Parse progress updates
      const progressMatches = [...text.matchAll(/<progress-update>([\s\S]*?)<\/progress-update>/g)]
      if (progressMatches.length > 0 && chatTabAttachedDeck) {
        for (const pm of progressMatches) {
          try {
            await fetch('/api/deck-progress', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deck: chatTabAttachedDeck.name, content: pm[1].trim() }),
            })
            setChatTabAttachedDeck(prev => prev ? { ...prev, progress: pm[1].trim() } : prev)
          } catch {}
        }
      }

      // Parse sources from response
      const sourcesMatch = text.match(/<sources>([\s\S]*?)<\/sources>/)
      let sources = searchSources // fallback to raw search results
      if (sourcesMatch) {
        const cited = sourcesMatch[1].trim().split('\n').map(line => {
          const parts = line.split('|').map(s => s.trim())
          if (parts.length >= 2) return { title: parts[0], url: parts[1] }
          return null
        }).filter(Boolean)
        if (cited.length > 0) sources = cited
      }

      // Offer-to-search: the model emits <offer-search>query</offer-search> when it won't guess.
      const offerMatch = text.match(/<offer-search>([\s\S]*?)<\/offer-search>/)
      const offerSearch = (!chatTabWebSearch && offerMatch) ? offerMatch[1].trim() : undefined
      const cleanText = text.replace(/<anki-card>.*?<\/anki-card>/gs, '').replace(/<progress-update>[\s\S]*?<\/progress-update>/g, '').replace(/<sources>[\s\S]*?<\/sources>/g, '').replace(/<offer-search>[\s\S]*?<\/offer-search>/g, '')
        .replace(/\s*[—–]\s*/g, ', ').trim() // strip em/en dashes (AI tell)
      // Let the Mascot AI analyze the reply and pick the best-fitting pose, but AWAIT it so the
      // message appears ONCE already wearing the final pose — no instant-then-swap flicker.
      // (choosePose never throws: it falls back to the keyword pose on no-key/error.)
      const poseF = await choosePose(cleanText)
      const assistantMsg = { role: 'assistant', content: cleanText, mascot: poseF || pickShrimp(cleanText), cards: parsedCards.length > 0 ? parsedCards : undefined, sources: sources || undefined, offerSearch }
      const updatedMsgs = [...newMsgs, assistantMsg]
      setChatTabMsgs(updatedMsgs)
      // Keep the user's message pinned near the top; the reply renders below it (don't jump to bottom).
      setTimeout(scrollChatToLatestTurn, 60)
      // Auto-save to disk after each response
      const savedId = await chatTabSaveCurrent(updatedMsgs, chatTabSessionId)
      if (!chatTabSessionId) setChatTabSessionId(savedId)
    } catch (err) {
      setChatTabMsgs(prev => [...prev, { role: 'assistant', content: 'Error: ' + err.message }])
    } finally {
      setChatTabLoading(false)
      setChatTabStatus(null)
    }
  }

  // User declined the offered web search — just hide the offer buttons.
  const chatOfferSearchDecline = (msgIdx) => {
    setChatTabMsgs((prev) => prev.map((m, i) => i === msgIdx ? { ...m, offerSearch: undefined } : m))
  }
  // User accepted the offered web search — run the search and answer from the results.
  const chatOfferSearchAccept = async (query, msgIdx) => {
    if (!apiKey || chatTabLoading) return
    setChatTabMsgs((prev) => prev.map((m, i) => i === msgIdx ? { ...m, offerSearch: undefined } : m))
    setChatTabLoading(true)
    setChatTabStatus('searching')
    const baseMsgs = chatTabMsgs
    try {
      let results = []
      try { results = (await (await fetch(`/api/web-search?q=${encodeURIComponent(query)}`)).json()).results || [] } catch {}
      setChatTabStatus('thinking')
      const sys = results.length
        ? `You are Ebi, a study assistant. Web search results for "${query}":\n` + results.map((r, i) => `${i + 1}. ${r.title}\n   URL: ${r.url}\n   ${r.snippet}`).join('\n\n') + `\n\nAnswer the user's question using these results. Cite sources at the end inside <sources>Title | URL</sources> tags. Never use em-dashes (—).`
        : `You are Ebi. A web search for "${query}" returned nothing. Briefly tell the user you couldn't find it. Never use em-dashes (—).`
      const convo = baseMsgs.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
      const text = (await aiCall(apiKey, sys, convo, resolveModel('chat'), { maxTokens: 1500 }) || '').replace(/\s*[—–]\s*/g, ', ')
      const sm = text.match(/<sources>([\s\S]*?)<\/sources>/)
      let sources = results.length ? results.map((r) => ({ title: r.title, url: r.url })) : null
      if (sm) {
        const cited = sm[1].trim().split('\n').map((line) => { const p = line.split('|').map((s) => s.trim()); return p.length >= 2 ? { title: p[0], url: p[1] } : null }).filter(Boolean)
        if (cited.length) sources = cited
      }
      const clean = text.replace(/<sources>[\s\S]*?<\/sources>/g, '').trim()
      const poseF = await choosePose(clean)
      const msg = { role: 'assistant', content: clean, mascot: poseF || pickShrimp(clean), sources: sources || undefined }
      const updated = [...baseMsgs, msg]
      setChatTabMsgs(updated)
      setTimeout(scrollChatToLatestTurn, 60)
      chatTabSaveCurrent(updated, chatTabSessionId).then((id) => { if (!chatTabSessionId) setChatTabSessionId(id) })
    } catch (err) {
      setChatTabMsgs((prev) => [...prev, { role: 'assistant', content: 'Search failed: ' + err.message }])
    } finally {
      setChatTabLoading(false)
      setChatTabStatus(null)
    }
  }

  // Where a chat card is added: the deck attached in the composer wins (the user explicitly chose it),
  // otherwise the active mode's deck, otherwise the first deck / Default. Mirrored in the card widget
  // so the button always shows exactly where it lands.
  const chatCardDeck = () => chatTabAttachedDeck?.name || ankiDeck || ankiDecks[0] || 'Default'

  const chatTabSyncCard = async (card, msgIdx) => {
    if (!ankiConnected) return
    const deck = chatCardDeck()
    try {
      if (!(await ankiGetDecks().catch(() => [])).includes(deck)) await ankiCreateDeck(deck)
      // Bold the "Label:" prefixes so the formatted back renders cleanly in Anki.
      await ankiAddNote(deck, card.front, cardBackToHtml(card.back), card.tags || ['ebiki'])
      ankiSync().catch(() => {})
      // Mark card as synced in the message
      setChatTabMsgs(prev => prev.map((m, i) => {
        if (i !== msgIdx || !m.cards) return m
        return { ...m, cards: m.cards.map(c => c === card ? { ...c, synced: true } : c) }
      }))
    } catch (err) {
      console.error('[Chat] sync card failed:', err)
    }
  }

  // Save current chat to disk
  const chatTabSaveCurrent = async (msgs, sessionId, title, { refreshList = true } = {}) => {
    if (!msgs || msgs.length === 0) return sessionId
    const chatTitle = title || msgs[0]?.content?.slice(0, 40) || 'Untitled'
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId || undefined, title: chatTitle, messages: msgs }),
      })
      const data = await res.json()
      if (refreshList) {
        const sessions = await fetch('/api/chats').then(r => r.json()).catch(() => [])
        setChatTabSessions(sessions)
      }
      return data.id
    } catch (err) {
      console.error('[Chat] save failed:', err)
      return sessionId
    }
  }

  const chatTabNewChat = async () => {
    // Save current session if it has messages
    if (chatTabMsgs.length > 0) {
      await chatTabSaveCurrent(chatTabMsgs, chatTabSessionId)
    }
    setChatTabMsgs([])
    setChatTabSessionId(null)
  }

  const chatTabLoadSession = async (session) => {
    // Save current first (don't refresh list — avoid reordering)
    if (chatTabMsgs.length > 0 && chatTabSessionId !== session.id) {
      await chatTabSaveCurrent(chatTabMsgs, chatTabSessionId, undefined, { refreshList: false })
    }
    // Load full messages from disk
    try {
      const data = await fetch(`/api/chat-load?id=${encodeURIComponent(session.id)}`).then(r => r.json())
      const msgs = (data.messages || []).map(m => ({ ...m, content: m.content || m.text }))
      setChatTabMsgs(msgs)
      setChatTabSessionId(session.id)
      setTimeout(scrollChatToLatestTurn, 80)
    } catch {
      setChatTabMsgs([])
      setChatTabSessionId(session.id)
    }
  }

  const chatTabDeleteSession = async (id) => {
    try {
      await fetch(`/api/chats?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      setChatTabSessions(prev => prev.filter(s => s.id !== id))
      if (chatTabSessionId === id) { setChatTabMsgs([]); setChatTabSessionId(null) }
    } catch {}
  }

  const chatTabRenameSession = async (id, newTitle) => {
    // Load the session, update title, save back
    try {
      const data = await fetch(`/api/chat-load?id=${encodeURIComponent(id)}`).then(r => r.json())
      await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title: newTitle, messages: data.messages }),
      })
      setChatTabSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s))
      setChatTabEditingTitle(null)
    } catch {}
  }

  // ─── AI Mode Creation ────────────────────────────────────────────────────
  const createMode = async (description, ankiDeckForMode = '') => {
    if (!apiKey || modeCreating) return
    setModeCreating(true)
    try {
      const prompt = `The user wants to create a study mode for: "${description}"

Generate a JSON config for this study mode:
- "name": short name (2-3 words max, e.g. "Security+", "Spanish", "Organic Chemistry")
- "type": "language" if this is about learning a foreign language, "general" otherwise
- "fields": object with field names as keys and true as values. These become the JSON keys the AI will fill when generating flashcards. For language modes use: { "pronunciation": true, "translation": true, "synonyms": true, "definition": true, "example": true }. For general modes, choose 3-5 fields appropriate to the subject (e.g. { "definition": true, "example": true, "category": true, "keyPoints": true }).
- "frontTemplate": card front using {fieldName} placeholders. For language: "{word} ({partOfSpeech})". For general: "{term}" or similar.
- "backTemplate": card back using {fieldName} placeholders and \\n for newlines. Use descriptive labels before each placeholder.
- "tagRules": instructions for AI tag generation. Include "screenlens" always. Add subject-specific categories. Tags should be lowercase, no spaces (use hyphens).
- "questionPrompt": instructions for AI when generating study/quiz questions for flashcards in this mode. Describe what kinds of questions to ask (e.g. definitions, real-world scenarios, comparisons). Be specific to the subject matter.
- "chatSuggestions": an array of exactly 3 short example prompts (3-6 words each) the user could tap to start chatting with Ebi about THIS subject — a natural mix like asking a concept question, requesting a flashcard, and asking to be quizzed. Make them specific to the subject (e.g. for Spanish: "Help me with verb conjugations", "Make a flashcard for 'correr'", "Quiz me on common phrases"; for Security+: "Explain subnetting", "Make a flashcard about DNS", "Quiz me on the OSI model").

Output ONLY raw JSON. No markdown, no backticks.`

      const text = await aiCall(apiKey,
        'You configure study modes for a learning app. Always respond with valid JSON only.',
        prompt, resolveModel('general')
      )
      const config = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))

      const newId = Math.max(0, ...modes.map((m) => m.id)) + 1
      const newMode = {
        id: newId,
        name: config.name || description.slice(0, 20),
        type: config.type || 'general',
        description,
        fields: config.fields || { definition: true, example: true },
        frontTemplate: config.frontTemplate || '{term}',
        backTemplate: config.backTemplate || 'Definition: {definition}',
        tagRules: config.tagRules || 'Include: screenlens',
        studyRules: {
          questionsPerCard: 3,
          questionPrompt: config.questionPrompt || ((config.type || 'general') === 'language' ? defaultStudyRules : defaultGeneralStudyRules).questionPrompt,
          ratingRules: defaultStudyRules.ratingRules,
        },
        chatSuggestions: Array.isArray(config.chatSuggestions) ? config.chatSuggestions.filter(Boolean).slice(0, 3).map(String) : [],
        ankiDeck: ankiDeckForMode || '',
      }
      saveModes([...modes, newMode], newId)
      console.log('[Mode] created:', newMode)
    } catch (err) {
      console.error('[Mode] creation failed:', err.message)
      setAnkiError('Mode creation failed: ' + err.message)
    } finally {
      setModeCreating(false)
    }
  }

  const syncToAnki = async (idx) => {
    if (!ankiCard || ankiSyncing) return
    console.log('[Anki] syncing card to deck:', ankiDeck)
    setAnkiSyncing(true)
    setAnkiError(null)
    try {
      // Re-check connection
      const connected = await ankiPing()
      setAnkiConnected(connected)
      if (!connected) {
        const msg = 'Anki is not running — open Anki with AnkiConnect addon to sync'
        console.log('[Anki] sync failed:', msg)
        setAnkiError(msg)
        return
      }
      // Ensure target deck exists — create it if not
      const decks = await ankiGetDecks().catch(() => [])
      setAnkiDecks(decks)
      if (!decks.includes(ankiDeck)) {
        console.log('[Anki] deck not found, creating:', ankiDeck)
        await ankiCreateDeck(ankiDeck)
        const updated = await ankiGetDecks().catch(() => [])
        setAnkiDecks(updated)
      }
      // Convert to rich HTML for Anki
      const ankiBack = ankiCard.back
        .split('\n')
        .map(line => {
          // Bold the label before the colon
          const match = line.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+):(.*)$/)
          if (match) return `<b>${match[1]}:</b>${match[2]}`
          return line
        })
        .join('<br>')
      const noteId = await ankiAddNote(ankiDeck, ankiCard.front, ankiBack, ankiCard.tags)
      console.log('[Anki] card synced successfully, noteId:', noteId, 'deck:', ankiDeck)
      // Sync to AnkiWeb
      ankiSync().catch((err) => console.warn('[Anki] AnkiWeb sync failed:', err.message))
      setAnkiSynced((prev) => ({ ...prev, [idx]: true }))
    } catch (err) {
      console.error('[Anki] sync error:', err.message)
      setAnkiError(err.message)
    } finally {
      setAnkiSyncing(false)
    }
  }

  // ─── Deep Explain (uses the stronger "question" model for a thorough breakdown) ──
  const deepExplain = useCallback(async (word) => {
    if (!apiKey || deepExplaining) return
    setDeepExplaining(true)
    setDeepExplanation(null)
    try {
      const prompt = `Word: "${word.text}" (translated: "${word.translation}")
Context: "${getContext()}"

In 3-4 short sentences, explain why "${word.text}" means "${word.translation}" in this context. Be concise and direct. No filler, no repetition, no grammar analysis, no examples. Just the meaning and why.`
      const text = await aiCall(apiKey, 'You are a concise language tutor. Explain in 3-4 sentences max. No fluff.', prompt, resolveModel('picture'))
      setDeepExplanation(text)
    } catch (err) {
      setDeepExplanation('Failed: ' + err.message)
    } finally {
      setDeepExplaining(false)
    }
  }, [apiKey, deepExplaining, ocrWords])

  // ─── Word Study (conjugations, usage, regional) ────────────────────────────
  const fetchWordStudy = useCallback(async (word) => {
    if (!apiKey || wordStudyLoading) return
    setWordStudyLoading(true)
    setWordStudy(null); setConjugation(null)
    try {
      const langLabel = LANGS.find((l) => l.code === language)?.label || 'the source language'
      const prompt = `Word: "${word.text}" (${langLabel}) → "${word.translation}"

Give a quick-reference word study. Be CONCISE — use short bullet points, not paragraphs. Each section should be 1-3 lines max.

ROOT FORM: Just the dictionary form and part of speech. One line.

FORMS: If verb: list key conjugations as "tense: form = English" on separate lines. If noun/adj: singular/plural, gender. Keep it brief.

EXAMPLES: 2 short example sentences with translations. Format: "sentence" = "translation"

REGIONAL: One line — is it universal or regional? If regional, list alternatives briefly.

REGISTER: One word — formal/informal/neutral/slang.

RELATED: 3 related words with brief English meaning, one per line.

No paragraphs. No explanations. Just the facts. Use the section labels above.`
      const text = await aiCall(apiKey, 'You are a concise dictionary. Short bullet points only. No paragraphs, no filler.', prompt, resolveModel('picture'))
      setWordStudy(text)
    } catch (err) {
      setWordStudy('Failed: ' + err.message)
    } finally {
      setWordStudyLoading(false)
    }
  }, [apiKey, wordStudyLoading, ocrWords, language, providerConfig])

  // ─── Conjugation ───────────────────────────────────────────────────────────
  const fetchConjugation = useCallback(async (word) => {
    if (!apiKey || conjugationLoading) return
    setConjugationLoading(true)
    setConjugation(null)
    try {
      const langLabel = LANGS.find((l) => l.code === language)?.label || 'the source language'
      const prompt = `Word: "${word.text}" (${langLabel})

Show the full conjugation table for this word. If it's a verb, show all major tenses. If noun/adjective, show all forms.

For verbs, use this format (one line each, no extra text):
INFINITIVE: [infinitive form]
PRESENT: yo [form], tú [form], él [form], nosotros [form], ellos [form]
PRETERITE: yo [form], tú [form], él [form], nosotros [form], ellos [form]
IMPERFECT: yo [form], tú [form], él [form], nosotros [form], ellos [form]
FUTURE: yo [form], tú [form], él [form], nosotros [form], ellos [form]
SUBJUNCTIVE: yo [form], tú [form], él [form], nosotros [form], ellos [form]
IMPERATIVE: tú [form], usted [form], nosotros [form]

For nouns: SINGULAR: [form], PLURAL: [form], GENDER: [m/f]
For adjectives: MASC SING: [form], FEM SING: [form], MASC PL: [form], FEM PL: [form]

No explanations. Just the forms. Use the section labels above.`
      const text = await aiCall(apiKey, 'You are a conjugation table generator. Only output the forms, no commentary.', prompt, resolveModel('picture'))
      setConjugation(text)
    } catch (err) {
      setConjugation('Failed: ' + err.message)
    } finally {
      setConjugationLoading(false)
    }
  }, [apiKey, conjugationLoading, language, providerConfig])

  // ─── Chat (ask anything about the word) ───────────────────────────────────
  const sendChat = useCallback(async (word) => {
    const q = chatInput.trim()
    if (!q || !apiKey || chatLoading) return
    setChatInput('')
    setChatMessages((prev) => [...prev, { role: 'user', text: q }])
    setChatLoading(true)
    try {
      const systemPrompt = `You are a concise language tutor. Word: "${word.text}" = "${word.translation}". Context: "${getContext()}"
Rules: Answer in 1-2 short sentences. Be direct. No filler, no repetition, no over-explaining.`
      const messages = [
        ...chatMessages.map((m) => ({ role: m.role, content: m.text })),
        { role: 'user', content: q },
      ]
      // Build the full conversation as a single user message for simplicity
      const fullPrompt = messages.map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
      const text = await aiCall(apiKey, systemPrompt, fullPrompt, resolveModel('picture'))
      setChatMessages((prev) => [...prev, { role: 'assistant', text }])
    } catch (err) {
      setChatMessages((prev) => [...prev, { role: 'assistant', text: 'Error: ' + err.message }])
    } finally {
      setChatLoading(false)
    }
  }, [apiKey, chatInput, chatLoading, chatMessages, ocrWords, providerConfig])

  const reset = () => {
    setScreenshot(null); setOcrWords([]); setOcrLines([]); setStage('idle')
    setError(null); setHoveredIdx(null); setPinnedIdx(null)
    setExplanation(null); setDeepExplanation(null); setWordStudy(null)
    setChatMessages([]); setChatInput(''); setExpanded(false)
  }

  // ─── Word Overlay Renderer ─────────────────────────────────────────────────
  const renderWordOverlays = (cropMode) => {
    if (!imgDims.w || !imgDims.h) return null

    // In crop mode (transparent area-select), bboxes are relative to the crop — no offset needed
    // Otherwise, offset bboxes to full-image coordinates
    const off = cropMode ? { x: 0, y: 0 } : (selectionOffset || { x: 0, y: 0 })
    // In crop mode, use the crop's pixel dimensions for percentage calculation
    const refW = cropMode && selectionCrop ? selectionCrop.w : imgDims.w
    const refH = cropMode && selectionCrop ? selectionCrop.h : imgDims.h

    const boxes = ocrWords.map((word) => {
      const { x0, y0, x1, y1 } = word.bbox
      const h = y1 - y0
      const vPad = Math.round(h * 0.1)
      return { x0: x0 + off.x, y0: y0 + vPad + off.y, x1: x1 + off.x, y1: y1 - vPad + off.y }
    })

    // Clamp same-row overlaps
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        const avgH = ((a.y1 - a.y0) + (b.y1 - b.y0)) / 2
        if (Math.abs(a.y0 - b.y0) > avgH * 0.5) continue
        if (a.x1 > b.x0 && a.x0 < b.x0) a.x1 = b.x0 - 1
        else if (b.x1 > a.x0 && b.x0 < a.x0) b.x1 = a.x0 - 1
      }
    }

    return ocrWords.map((word, i) => {
      // Skip words we couldn't localize precisely (vision boxes are unreliable) — they live
      // in the reading panel instead, so we never draw a misplaced overlay box.
      if (word._approxBox) return null
      const box = boxes[i]
      const x = (box.x0 / refW) * 100
      const y = (box.y0 / refH) * 100
      const w = Math.max(0, ((box.x1 - box.x0) / refW) * 100)
      const h = Math.max(0, ((box.y1 - box.y0) / refH) * 100)
      const isActive = hoveredIdx === i || pinnedIdx === i
      const isPinned = pinnedIdx === i

      // Get color based on category and part of speech
      const catColor = CATEGORY_COLORS[word.category]
      const posColor = POS_COLORS[word.partOfSpeech] || POS_COLORS.other
      const wordColor = (word.category === 'name') ? catColor
        : (word.category === 'target' || word.category === 'number') ? catColor
        : posColor

      return (
        <span
          key={i}
          onMouseEnter={(e) => handleWordHover(i, e)}
          onMouseLeave={handleWordLeave}
          onClick={(e) => handleWordClick(i, e)}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: `${w}%`,
            height: `${h}%`,
            background: isActive
              ? isPinned ? 'rgba(88, 166, 255, 0.45)' : (wordColor.bg.replace(/[\d.]+\)$/, '0.35)'))
              : showHighlights ? wordColor.bg : 'transparent',
            border: isActive
              ? isPinned ? '2px solid rgba(88, 166, 255, 0.85)' : `2px solid ${wordColor.border}`
              : showHighlights && wordColor.border !== 'transparent'
                ? `1px solid ${wordColor.border}`
                : '1px solid transparent',
            borderRadius: 2,
            cursor: 'pointer',
            transition: 'background 0.1s, border 0.1s',
            zIndex: isActive ? 10 : 1,
            boxSizing: 'border-box',
          }}
        />
      )
    })
  }

  const activeIdx = pinnedIdx !== null ? pinnedIdx : hoveredIdx
  const activeWord = activeIdx !== null ? ocrWords[activeIdx] : null
  const isPinned = pinnedIdx !== null

  // Study companion pose changes SYNCHRONOUSLY when the question changes — same instant the
  // question renders, exactly once. The pose is precomputed during question generation
  // (q.pose); fall back to instant keyword matching. No async call here (that caused a delayed
  // second change). The Help button is independent and only changes from its own conversation.
  useEffect(() => {
    if (!studyActive || !currentQuestion) return
    const cs = studyCardState[currentQuestion.cardIdx]
    const q = cs?.questions?.[currentQuestion.questionIdx]
    const qt = typeof q === 'string' ? q : (q?.question || '')
    const file = (q && typeof q === 'object' && poseFile(q.pose)) || pickShrimp(meaningfulPoseText([qt, cs?.front, cs?.back].filter(Boolean).join(' ')))
    setStudyMascot(file)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQuestion, studyActive])

  // ─── Render ────────────────────────────────────────────────────────────────
  // Wait for config + modes before the first real paint so the saved tab/mode are already
  // applied — otherwise the UI briefly flashes the default mode/tab before load (the flicker).
  if (!isOverlay && !configLoaded) {
    return <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }} />
  }
  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={isOverlay ? {
        ...S.app, height: '100vh', overflow: 'hidden',
        background: ((selectionMode || selectionViewport || (areaSelectBounds && pinnedIdx !== null)) && activeMode.areaSelectTransparent !== false) ? 'transparent' : S.app.background,
      } : {
        // Divide out the body zoom so the root still fills exactly one viewport
        // (otherwise 100vh × zoom overflows and vh-centered layouts sit too low).
        ...S.app, height: 'calc(100vh / 1.35)',
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => { if (e.target.files[0]) loadImageFromFile(e.target.files[0]); e.target.value = '' }}
      />

      {/* ── Drag Overlay ─────────────────────────────────────────────────────── */}
      {dragging && !knowledgeOpen && (
        <div style={S.dragOverlay}>
          <div style={S.dragBox}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="var(--c-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <p style={{ fontSize: 18, fontWeight: 600, color: 'var(--c-ink)', margin: '12px 0 0' }}>
              Drop image here
            </p>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      {!isOverlay && <header style={S.header}>
        <div style={S.headerLeft}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="3" width="20" height="18" rx="2" stroke="var(--c-brand)" strokeWidth="2"/>
            <circle cx="18" cy="7" r="4" fill="var(--c-brand)"/>
          </svg>
          <h1 style={S.title}>Ebiki</h1>
          <span style={S.badge}>{t('badge_local')}</span>
          <div style={S.tabBar}>
            {['chat', 'study', 'deck', 'discover', 'picture', 'stats'].map((tab) => (
              <button
                key={tab}
                className={activeTab === tab ? 'ui-tab ui-tab-current' : 'ui-tab'}
                onClick={() => {
                  setActiveTab(tab)
                  setChatSidePanel(false)
                  setSettingsOpen(false) // switching tabs closes the settings modal
                }}
                style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
              >
                <span className="ui-tab-inner">{t('tab_' + tab)}</span>
              </button>
            ))}
          </div>
          {/* Ask Ebi — opens Ebi's help chat (replaces the old floating shrimp button) */}
          <button onClick={() => setAskEbiSignal((n) => n + 1)} title="Ask Ebi — your study helper" className="ui-btn"
            style={{ ...S.ghostBtn, marginLeft: 8, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.3)', fontWeight: 700 }}>
            Ask Ebi
          </button>
        </div>
        <div style={S.headerRight}>
          {/* Picture tab: context buttons */}
          {activeTab === 'picture' && stage === 'done' && (
            <button onClick={() => setShowHighlights(!showHighlights)} style={{
              ...S.ghostBtn,
              color: showHighlights ? 'var(--c-purple)' : 'var(--c-ink-dim)',
              borderColor: showHighlights ? 'rgba(139,92,246,0.25)' : 'var(--c-border)',
            }}>
              {showHighlights ? '● Highlights' : '○ Highlights'}
            </button>
          )}

          {activeTab === 'picture' && stage !== 'idle' && <button onClick={reset} style={S.ghostBtn}>{t('pictureNew')}</button>}

          {activeTab === 'picture' && screenshot && !loading && stage === 'done' && (
            <button onClick={() => analyzeImage(screenshot)} style={S.ghostBtn}>Re-analyze</button>
          )}

          {/* Explicit exit — leaves the analysis and returns to the empty Picture state */}
          {activeTab === 'picture' && stage !== 'idle' && (
            <button onClick={reset} style={{ ...S.ghostBtn, padding: '6px 9px' }} title="Exit picture analysis">✕</button>
          )}

          {/* Picture tab: Capture, Upload, Overlay (kept left of the mode + Settings cluster so
              Settings stays the right-most control, consistent with the other tabs) */}
          {activeTab === 'picture' && (
            <>
              <div style={S.captureGroup}>
                <button onClick={captureScreen} disabled={loading} style={S.captureBtn}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ marginRight: 7 }}>
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  {t('capture')}
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={S.uploadBtn}>
                  {t('upload')}
                </button>
              </div>

              <button onClick={async () => {
                // Toggle the user's persisted preference AND launch/kill the overlay process.
                const next = !overlayEnabled
                setOverlayEnabled(next)
                if (next) {
                  try {
                    const r = await fetch('/api/launch-overlay', { method: 'POST' })
                    const d = await r.json()
                    if (d.error) { alert(d.error) } else { setOverlayRunning(true) }
                  } catch (err) { alert('Failed to launch overlay: ' + err.message) }
                } else {
                  try { await fetch('/api/launch-overlay', { method: 'DELETE' }); setOverlayRunning(false) } catch {}
                }
              }} style={{
                ...S.ghostBtn,
                color: overlayRunning ? 'var(--c-success)' : 'var(--c-ink-dim)',
                borderColor: overlayRunning ? 'rgba(24,169,87,0.3)' : 'var(--c-border)',
                background: overlayRunning ? 'rgba(24,169,87,0.08)' : 'transparent',
              }}>
                {overlayRunning ? '\u25CF' : '\u25CB'} {t('overlay')}
              </button>

              <kbd style={S.kbd}>Alt+Q</kbd>
            </>
          )}

          {/* Mode quick-switcher (fast switch without opening Settings); "+ Add mode" opens the
              same Learning-modes panel in Settings used to create a mode. */}
          <Dropdown
            value={activeModeId}
            getZoom={getZoom}
            onChange={(val) => {
              if (val === '__add__') { setSettingsCategory('modes'); setSettingsOpen(true); return }
              const id = parseInt(val); setActiveModeId(id); saveModes(modes, id); const nm = modes.find((m) => m.id === id); if (nm?.ankiDeck) setStudyDeck(nm.ankiDeck)
            }}
            title={t('settingsMode')}
            style={{ ...S.select, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.3)', background: 'rgba(223,37,64,.08)', fontWeight: 700 }}
            options={[
              ...modes.map((m) => ({ value: m.id, label: m.name, icon: m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}', color: 'var(--c-brand)' })),
              { value: '__add__', label: 'Add mode…', icon: '➕', color: 'var(--c-ink-dim)', divider: true },
            ]}
          />

          {/* Single Settings entry \u2014 opens the unified modal (right-most, like every tab) */}
          <button onClick={() => setSettingsOpen(true)} title={t('settingsTitle')} className="ui-btn" style={{ ...S.ghostBtn, position: 'relative', padding: '6px 10px', color: 'var(--c-ink-dim)' }}>
            {'\u2699\uFE0F'} {t('settingsTitle')}
            {!apiKey && <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--c-danger)' }} />}
          </button>
        </div>
      </header>}

      {/* ── First-run onboarding (Ebi-guided) ──────────────────────────────── */}
      {!isOverlay && configLoaded && !onboarded && (
        <OnboardingWizard
          t={t}
          onFinish={() => setOnboarded(true)}
          appLanguage={appLanguage} setAppLanguage={setAppLanguage}
          appTheme={appTheme} setAppTheme={setAppTheme}
          provider={provider} setProvider={setProvider}
          apiKeys={apiKeys} apiKey={apiKey} setCurrentKey={setCurrentKey} providerConfig={providerConfig}
          createMode={createMode} modeCreating={modeCreating}
          aiModels={aiModels} setAiModels={setAiModels}
          intelligence={intelligence} setIntelligence={setIntelligence}
        />
      )}

      {/* ── Unified Settings modal (App + Mode settings) ───────────────────── */}
      {settingsOpen && (
        <SettingsModal
          t={t}
          category={settingsCategory}
          setCategory={setSettingsCategory}
          onClose={() => setSettingsOpen(false)}
          appTheme={appTheme} setAppTheme={setAppTheme}
          appLanguage={appLanguage} setAppLanguage={setAppLanguage}
          language={language} setLanguage={setLanguage}
          targetLang={targetLang} setTargetLang={setTargetLang}
          onRunSetup={() => { setSettingsOpen(false); setOnboarded(false) }}
          provider={provider} setProvider={setProvider}
          apiKeys={apiKeys} apiKey={apiKey} setCurrentKey={setCurrentKey} providerConfig={providerConfig}
          AI_ROLE_META={AI_ROLE_META} ROLE_DEFAULTS={ROLE_DEFAULTS}
          aiModels={aiModels} setAiModels={setAiModels} availableModels={availableModels}
          refreshModels={refreshModels} modelsLoading={modelsLoading} modelsError={modelsError}
          intelligence={intelligence} setIntelligence={setIntelligence}
          studyAutoSync={studyAutoSync} setStudyAutoSync={setStudyAutoSync}
          studyAutoSyncMinutes={studyAutoSyncMinutes} setStudyAutoSyncMinutes={setStudyAutoSyncMinutes}
          modes={modes} activeModeId={activeModeId} setActiveModeId={setActiveModeId} saveModes={saveModes}
          editingModeName={editingModeName} setEditingModeName={setEditingModeName} renameMode={renameMode}
          modeEditInput={modeEditInput} setModeEditInput={setModeEditInput} createMode={createMode}
          modeCreating={modeCreating} addDefaultMode={addDefaultMode} deleteMode={deleteMode}
          activeMode={activeMode} updateActiveMode={updateActiveMode}
          defaultStudyRules={defaultStudyRules} defaultGeneralStudyRules={defaultGeneralStudyRules}
          ankiConnected={ankiConnected} refreshAnkiConnection={refreshAnkiConnection} ankiDecks={ankiDecks}
          ankiDeck={ankiDeck} setAnkiDeck={setAnkiDeck} ankiFormat={ankiFormat}
          proposeModeEdit={proposeModeEdit} acceptModeEdit={acceptModeEdit} denyModeEdit={denyModeEdit}
          modeEditProposal={modeEditProposal} modeEditBusy={modeEditBusy} diffWords={diffWords}
          knowledgeFiles={knowledgeFiles} knowledgeDragging={knowledgeDragging} setKnowledgeDragging={setKnowledgeDragging}
          handleKnowledgeDrop={handleKnowledgeDrop} handleKnowledgeFileInput={handleKnowledgeFileInput}
          toggleKnowledgeFile={toggleKnowledgeFile} deleteKnowledgeFile={deleteKnowledgeFile}
          knowledgeStatus={{ big: knowledgeIsBig(), hasToc: knowledgeHasToc(), chars: modeKnowledge.content.length, outlineCount: (modeKnowledge.outline || []).length }}
          knowledgeBusy={knowledgeBusy}
          pronunciationCfg={pronunciationCfg} setPronunciationCfg={setPronunciationCfg}
        />
      )}

      {/* ── Deck Browser ─────────────────────────────────────────────────────── */}
      {activeTab === 'deck' && (
        <main style={{ ...S.main, display: 'flex', flexDirection: 'column', padding: 20 }}>
          <div style={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: FONT.display }}>{t('deckBrowser')}</div>
              <button
                disabled={!ankiConnected}
                onClick={() => { setDeckBrowserAddPanel(p => !p); setDeckBrowserAddName(''); setDeckBrowserAddPurpose('') }}
                style={{ background: deckBrowserAddPanel ? 'rgba(24,169,87,0.25)' : 'rgba(24,169,87,0.12)', color: 'var(--c-success)', border: '1px solid rgba(24,169,87,0.3)', borderRadius: 5, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: ankiConnected ? 1 : 0.5 }}
              >{t('addDeck')}</button>
            </div>

            {deckBrowserAddPanel && (
              <div style={{ background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8, padding: 12, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  placeholder="Deck name"
                  value={deckBrowserAddName}
                  onChange={(e) => setDeckBrowserAddName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && deckBrowserAddName.trim() && !deckBrowserAddLoading) handleAddDeck() }}
                  style={{ ...S.keyInput, fontSize: 12 }}
                  autoFocus
                />
                <input
                  placeholder="What is this deck for? (e.g. Security+, Spanish) — creates a matching mode"
                  value={deckBrowserAddPurpose}
                  onChange={(e) => setDeckBrowserAddPurpose(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && deckBrowserAddName.trim() && !deckBrowserAddLoading) handleAddDeck() }}
                  style={{ ...S.keyInput, fontSize: 12 }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleAddDeck}
                    disabled={!deckBrowserAddName.trim() || deckBrowserAddLoading}
                    style={{ background: 'rgba(24,169,87,0.15)', color: 'var(--c-success)', border: '1px solid rgba(24,169,87,0.3)', borderRadius: 5, padding: '6px 14px', fontSize: 11, cursor: (!deckBrowserAddName.trim() || deckBrowserAddLoading) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: (!deckBrowserAddName.trim() || deckBrowserAddLoading) ? 0.5 : 1 }}
                  >{deckBrowserAddLoading ? t('creating') : t('create')}</button>
                  <button
                    onClick={() => { setDeckBrowserAddPanel(false); setDeckBrowserAddName(''); setDeckBrowserAddPurpose('') }}
                    style={{ ...S.ghostBtn, fontSize: 11 }}
                  >{t('cancel')}</button>
                </div>
              </div>
            )}

            {ankiConnected === false && (
              <div style={{ fontSize: 11, color: 'var(--c-warning)', marginBottom: 12 }}>{t('ankiNotConnected')}</div>
            )}
            {ankiConnected === null && (
              <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginBottom: 12 }}>{t('checkingAnki')}</div>
            )}

            {/* Deck picker + search */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <select value={deckBrowserDeck} onChange={(e) => {
                  if ((deckAnalyzeRecs.length > 0 || deckDupGroups.length > 0) && !window.confirm('Switching decks will discard the current suggestions. Continue?')) return
                  setDeckBrowserDeck(e.target.value)
                  setDeckAnalyzeRecs([])
                  setDeckAnalyzeError(null)
                  setDeckAnalyzeEmpty(false)
                  setDeckAnalyzeSkipped(0)
                  setDeckDupGroups([])
                  setDeckDupError(null)
                  setDeckDupEmpty(false)
                  if (e.target.value) loadDeckNotes(e.target.value)
                }}
                style={{ ...S.select, minWidth: 150 }}>
                <option value="">Select deck...</option>
                {ankiDecks.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              {deckBrowserLoading && <span style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>Loading...</span>}
              {deckBrowserNotes.length > 0 && (
                <input value={deckBrowserSearch} onChange={(e) => setDeckBrowserSearch(e.target.value)}
                  placeholder="Search cards..." style={{ ...S.keyInput, flex: 1, fontSize: 12 }} />
              )}
              {deckBrowserNotes.length > 0 && (
                <select value={deckBrowserSort} onChange={(e) => setDeckBrowserSort(e.target.value)}
                  title="Sort cards" style={{ ...S.select, minWidth: 170, fontSize: 12 }}>
                  <option value="created-desc">Newest first</option>
                  <option value="created-asc">Oldest first</option>
                  <option value="alpha-asc">A → Z</option>
                  <option value="alpha-desc">Z → A</option>
                  <option value="studied-desc">Recently studied</option>
                  <option value="studied-asc">Least recently studied</option>
                  <option value="new-first">New / unstudied first</option>
                  <option value="problem">Problem cards (most lapses)</option>
                  <option value="mastered">Mastered (longest interval)</option>
                </select>
              )}
              {deckBrowserNotes.length > 0 && (
                <span style={{ fontSize: 11, color: 'var(--c-ink-dim)', alignSelf: 'center' }}>{deckBrowserNotes.length} cards</span>
              )}
            </div>

            {/* Toolbar: add card / analyze / scan */}
            {deckBrowserDeck && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button onClick={openAddCard} disabled={deckAddOpen}
                  style={{ background: 'rgba(223,37,64,0.12)', color: 'var(--c-brand)', border: '1px solid rgba(223,37,64,0.3)', borderRadius: 5, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: deckAddOpen ? 0.5 : 1 }}>
                  + Add card
                </button>
                <button onClick={() => setQuickAddOpen((v) => !v)} disabled={!apiKey}
                  title="Paste many words → generate formatted cards → review → sync"
                  style={{ background: 'rgba(17,168,160,0.12)', color: 'var(--c-teal)', border: '1px solid rgba(17,168,160,0.3)', borderRadius: 5, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: !apiKey ? 0.5 : 1 }}>
                  ⚡ Quick Add
                </button>
                {deckBrowserNotes.length > 0 && (<>
                  <button
                    onClick={analyzeDeck}
                    disabled={deckAnalyzeLoading || !apiKey || deckAnalyzeRecs.length > 0}
                    style={{ background: 'rgba(139,92,246,0.12)', color: 'var(--c-purple)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 5, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: (deckAnalyzeLoading || !apiKey || deckAnalyzeRecs.length > 0) ? 0.5 : 1 }}
                  >
                    {deckAnalyzeLoading ? 'Analyzing...' : 'Analyze for ambiguous cards'}
                  </button>
                  <button
                    onClick={scanDuplicates}
                    disabled={deckDupLoading || !apiKey || deckDupGroups.length > 0}
                    style={{ background: 'rgba(232,147,12,0.12)', color: 'var(--c-warning)', border: '1px solid rgba(232,147,12,0.3)', borderRadius: 5, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: (deckDupLoading || !apiKey || deckDupGroups.length > 0) ? 0.5 : 1 }}
                  >
                    {deckDupLoading ? 'Scanning...' : 'Scan for duplicates'}
                  </button>
                  {!apiKey && <span style={{ fontSize: 10, color: 'var(--c-ink-dim)' }}>(API key required)</span>}
                  {deckAnalyzeError && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>{deckAnalyzeError}</span>}
                  {deckDupError && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>{deckDupError}</span>}
                  {deckAnalyzeEmpty && !deckAnalyzeLoading && (
                    <span style={{ fontSize: 10, color: 'var(--c-success)' }}>No ambiguous cards found — your deck looks clean.</span>
                  )}
                  {deckDupEmpty && !deckDupLoading && (
                    <span style={{ fontSize: 10, color: 'var(--c-success)' }}>No duplicates found — your deck looks clean.</span>
                  )}
                </>)}
              </div>
            )}

            {/* Quick Add — batch generate formatted cards → review tray → sync */}
            {quickAddOpen && (
              <div style={{ marginBottom: 12, border: '1px solid rgba(17,168,160,0.3)', borderRadius: 8, padding: 14, background: 'rgba(17,168,160,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 12, color: 'var(--c-teal)', fontWeight: 700 }}>⚡ Quick Add</div>
                  <button onClick={closeQuickAdd} style={{ ...S.ghostBtn, fontSize: 11 }}>Close</button>
                </div>
                {/* Make the mode (tailors the card format/subject) AND the deck (where cards go) both
                    explicit, so the user knows to configure each correctly. */}
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 6, fontSize: 11 }}>
                  <span style={{ color: 'var(--c-ink-dim)' }}>Mode (tailors cards): <b style={{ color: 'var(--c-brand)' }}>{activeMode.name}</b></span>
                  <span style={{ color: 'var(--c-ink-dim)' }}>Deck (cards go here): <b style={{ color: 'var(--c-teal)' }}>{deckBrowserDeck || activeMode.ankiDeck || 'pick a deck above'}</b></span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 6 }}>
                  Paste words (one per line or comma-separated). {activeMode.type === 'language' ? 'Cards use your Frente/Dorso format.' : `Cards are tailored for ${activeMode.name}.`}
                </div>
                <textarea
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  placeholder={activeMode.type === 'language' ? 'surcar\nhuelga\nrendir cuentas' : 'one term per line…'}
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, fontFamily: 'inherit', padding: 8, borderRadius: 6, border: '1px solid var(--c-border)', background: 'var(--c-surface-sunken)', color: 'var(--c-ink)', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <button onClick={runQuickAdd} disabled={quickAddLoading || !quickAddInput.trim()}
                    style={{ ...S.captureBtn, borderRadius: 5, fontSize: 11, opacity: (quickAddLoading || !quickAddInput.trim()) ? 0.5 : 1 }}>
                    {quickAddLoading ? 'Generating…' : 'Generate cards'}
                  </button>
                  {quickAddCards.length > 0 && (() => {
                    const n = quickAddCards.filter((c) => c.accepted && !c.synced).length
                    const deck = deckBrowserDeck || activeMode.ankiDeck || 'Anki'
                    return (
                      <button onClick={syncQuickAddAccepted} disabled={n === 0}
                        style={{ background: 'rgba(24,169,87,0.14)', color: 'var(--c-success)', border: '1px solid rgba(24,169,87,0.35)', borderRadius: 5, padding: '7px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: n === 0 ? 0.5 : 1 }}>
                        {n === 0 ? 'All added' : `Add ${n} to ${deck}`}
                      </button>
                    )
                  })()}
                  {quickAddError && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>{quickAddError}</span>}
                </div>

                {/* Review tray */}
                {quickAddCards.map((card, i) => (
                  <div key={i} style={{ marginTop: 10, border: `1px solid ${card.accepted ? 'rgba(24,169,87,0.35)' : 'var(--c-border)'}`, borderRadius: 6, padding: 10, background: 'var(--c-surface)', opacity: card.accepted ? 1 : 0.55 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input value={card.front} onChange={(e) => setQuickAddCards((prev) => prev.map((c, k) => k === i ? { ...c, front: e.target.value } : c))}
                          style={{ width: '100%', boxSizing: 'border-box', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', padding: '4px 6px', borderRadius: 4, border: '1px solid var(--c-border)', background: 'var(--c-surface-sunken)', color: 'var(--c-ink)', marginBottom: 4 }} />
                        <textarea value={card.back} onChange={(e) => setQuickAddCards((prev) => prev.map((c, k) => k === i ? { ...c, back: e.target.value } : c))}
                          rows={card.back.split('\n').length}
                          style={{ width: '100%', boxSizing: 'border-box', fontSize: 11, fontFamily: 'inherit', padding: '4px 6px', borderRadius: 4, border: '1px solid var(--c-border)', background: 'var(--c-surface-sunken)', color: 'var(--c-ink)', resize: 'vertical', lineHeight: 1.5 }} />
                        {(card.correction || card.dup) && (
                          <div style={{ marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {card.correction && <span style={{ fontSize: 10, color: 'var(--c-warning)' }}>✎ corrected to “{card.correction}”</span>}
                            {card.dup && <span style={{ fontSize: 10, color: 'var(--c-warning)' }}>⚠ already in deck — sync adds anyway</span>}
                          </div>
                        )}
                        {card.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                            {card.tags.map((t, ti) => <span key={ti} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(125,133,144,.15)', color: 'var(--c-ink-dim)' }}>{t}</span>)}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                        {card.synced ? (
                          <span style={{ fontSize: 10, color: 'var(--c-success)', fontWeight: 700 }}>✓ Added</span>
                        ) : card.syncing ? (
                          <span style={{ fontSize: 10, color: 'var(--c-ink-dim)' }}>…</span>
                        ) : (
                          // One control: include/exclude this card from the batch "Add" button above.
                          <button onClick={() => setQuickAddCards((prev) => prev.map((c, k) => k === i ? { ...c, accepted: !c.accepted } : c))}
                            title={card.accepted ? 'Included — click to skip' : 'Skipped — click to include'}
                            style={{ width: 28, height: 28, borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, border: `1px solid ${card.accepted ? 'rgba(24,169,87,0.5)' : 'var(--c-border)'}`, background: card.accepted ? 'rgba(24,169,87,0.18)' : 'transparent', color: card.accepted ? 'var(--c-success)' : 'var(--c-ink-faint)' }}>
                            {card.accepted ? '✓' : '○'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add card form */}
            {deckAddOpen && (
              <div style={{ marginBottom: 12, border: '1px solid rgba(223,37,64,0.25)', borderRadius: 6, padding: '12px', background: 'rgba(223,37,64,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: 'var(--c-brand)', fontWeight: 600 }}>New card → {deckBrowserDeck}</div>
                  <button onClick={closeAddCard} style={{ ...S.ghostBtn, fontSize: 11 }}>Cancel</button>
                </div>

                {/* Optional AI generation from a word */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <input value={deckAddTerm} onChange={(e) => setDeckAddTerm(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') generateAddCard() }}
                    placeholder="Type a word, then Generate (optional)…"
                    style={{ ...S.keyInput, flex: 1, fontSize: 12 }} />
                  <button onClick={generateAddCard} disabled={deckAddGenerating || !deckAddTerm.trim() || !apiKey}
                    style={{ background: 'rgba(139,92,246,0.15)', color: 'var(--c-purple)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 5, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', opacity: (deckAddGenerating || !deckAddTerm.trim() || !apiKey) ? 0.5 : 1 }}>
                    {deckAddGenerating ? 'Generating…' : 'Generate with AI'}
                  </button>
                </div>

                <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 3, fontWeight: 600 }}>Front</div>
                <textarea value={deckAddFront} onChange={(e) => setDeckAddFront(e.target.value)}
                  style={{ ...S.keyInput, fontSize: 12, minHeight: 38, resize: 'vertical', width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 3, fontWeight: 600 }}>Back</div>
                <textarea value={deckAddBack} onChange={(e) => setDeckAddBack(e.target.value)}
                  style={{ ...S.keyInput, fontSize: 12, minHeight: 70, resize: 'vertical', width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
                <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 3, fontWeight: 600 }}>Tags (comma-separated)</div>
                <input value={deckAddTags} onChange={(e) => setDeckAddTags(e.target.value)}
                  placeholder="screenlens, noun, …"
                  style={{ ...S.keyInput, fontSize: 12, width: '100%', boxSizing: 'border-box', marginBottom: 10 }} />

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={saveAddCard} disabled={deckAddSaving || !deckAddFront.trim() || !deckAddBack.trim()}
                    style={{ ...S.captureBtn, borderRadius: 5, fontSize: 12, padding: '6px 14px', opacity: (deckAddSaving || !deckAddFront.trim() || !deckAddBack.trim()) ? 0.5 : 1 }}>
                    {deckAddSaving ? 'Saving…' : `Add to ${deckBrowserDeck}`}
                  </button>
                  {deckAddError && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>{deckAddError}</span>}
                </div>
              </div>
            )}

            {/* Recommendations panel */}
            {deckAnalyzeRecs.length > 0 && (() => {
              const acceptedCount = deckAnalyzeRecs.filter((r) => r.accepted).length
              return (
                <div style={{ marginBottom: 16, border: '1px solid rgba(139,92,246,0.25)', borderRadius: 6, padding: '10px 12px', background: 'rgba(139,92,246,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--c-purple)', fontWeight: 600 }}>
                      {deckAnalyzeRecs.length} suggestion{deckAnalyzeRecs.length === 1 ? '' : 's'} • {acceptedCount} accepted
                      {deckAnalyzeSkipped > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--c-warning)', fontWeight: 400, marginLeft: 8 }}
                          title="These were discarded because the AI's card id and word did not match the same card — never shown to avoid mixing cards. Re-run to try again.">
                          ⚠ {deckAnalyzeSkipped} discarded (card mismatch)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={commitAcceptedRecs}
                        disabled={acceptedCount === 0 || deckAnalyzeCommitting}
                        style={{ ...S.captureBtn, borderRadius: 5, fontSize: 11, padding: '5px 12px', opacity: (acceptedCount === 0 || deckAnalyzeCommitting) ? 0.5 : 1 }}
                      >
                        {deckAnalyzeCommitting ? 'Saving...' : `Save ${acceptedCount} accepted`}
                      </button>
                      <button onClick={clearAnalyze} disabled={deckAnalyzeCommitting} style={{ ...S.ghostBtn, fontSize: 11 }}>
                        Cancel all
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {deckAnalyzeRecs.map((rec, idx) => {
                      const fieldNames = Object.keys(rec.recommendedFields)
                      return (
                        <div key={rec.noteId} style={{
                          border: rec.accepted ? '1px solid rgba(24,169,87,0.4)' : '1px solid var(--c-border)',
                          borderRadius: 6, padding: 10,
                          background: rec.accepted ? 'rgba(24,169,87,0.06)' : 'var(--c-surface)',
                        }}>
                          <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 8 }}>
                            <span style={{ color: 'var(--c-purple)' }}>Card #{rec.noteId}</span>
                            {rec.reason && <span> — {rec.reason}</span>}
                          </div>

                          {fieldNames.map((fieldName) => {
                            const value = rec.recommendedFields[fieldName]
                            const original = rec.currentFields[fieldName] || ''
                            const changed = value !== original
                            return (
                              <div key={fieldName} style={{ marginBottom: 6 }}>
                                <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 3, fontWeight: 600 }}>{fieldName}</div>
                                <textarea
                                  value={value}
                                  onChange={(e) => updateRecField(idx, fieldName, e.target.value)}
                                  style={{ ...S.keyInput, fontSize: 12, minHeight: 50, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                                />
                                {changed && (
                                  <div style={{ marginTop: 4, padding: '6px 8px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 4, fontSize: 11, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    <span style={{ fontSize: 9, color: 'var(--c-ink-dim)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                                      Changes (<span style={{ color: 'var(--c-danger)' }}>removed</span> / <span style={{ color: 'var(--c-success)' }}>added</span>)
                                    </span>
                                    {diffWords(original, value).map((t, k) => (
                                      <span key={k} style={
                                        t.type === 'del' ? { color: 'var(--c-danger)', background: 'rgba(229,57,46,.15)', textDecoration: 'line-through' }
                                        : t.type === 'add' ? { color: 'var(--c-success)', background: 'rgba(24,169,87,.15)' }
                                        : { color: '#9da7b3' }
                                      }>{t.text}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )
                          })}

                          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 6 }}>
                            <input
                              type="text"
                              value={rec.refineInput}
                              onChange={(e) => setRecRefineInput(idx, e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') refineRec(idx) }}
                              placeholder='Tell AI different (e.g. "focus on the clock-hand meaning")'
                              disabled={rec.refining}
                              style={{ flex: 1, background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: 'var(--c-ink)', border: '1px solid var(--c-border)', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}
                            />
                            <button
                              onClick={() => refineRec(idx)}
                              disabled={rec.refining || !rec.refineInput.trim()}
                              style={{ background: 'rgba(139,92,246,.15)', color: 'var(--c-purple)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 4, padding: '5px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', opacity: (rec.refining || !rec.refineInput.trim()) ? 0.4 : 1 }}
                            >
                              {rec.refining ? '…' : 'Refine'}
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => rejectRec(idx)}
                              title="Reject — remove this suggestion"
                              style={{ ...S.ghostBtn, fontSize: 14, padding: '3px 12px', color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}
                            >
                              ✗
                            </button>
                            <button
                              onClick={() => toggleAcceptRec(idx)}
                              title={rec.accepted ? 'Click to un-accept' : 'Accept — will save when you click Save accepted'}
                              style={{
                                ...S.ghostBtn,
                                fontSize: 14, padding: '3px 12px',
                                color: rec.accepted ? 'var(--c-success)' : 'var(--c-ink-dim)',
                                borderColor: rec.accepted ? 'rgba(24,169,87,.5)' : 'var(--c-border)',
                                background: rec.accepted ? 'rgba(24,169,87,.12)' : 'transparent',
                              }}
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Duplicates panel */}
            {deckDupGroups.length > 0 && (() => {
              const acceptedCount = deckDupGroups.filter((g) => g.accepted).length
              return (
                <div style={{ marginBottom: 16, border: '1px solid rgba(232,147,12,0.25)', borderRadius: 6, padding: '10px 12px', background: 'rgba(232,147,12,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--c-warning)', fontWeight: 600 }}>
                      {deckDupGroups.length} duplicate group{deckDupGroups.length === 1 ? '' : 's'} • {acceptedCount} to merge
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={commitAcceptedDups}
                        disabled={acceptedCount === 0 || deckDupCommitting}
                        style={{ ...S.captureBtn, borderRadius: 5, fontSize: 11, padding: '5px 12px', opacity: (acceptedCount === 0 || deckDupCommitting) ? 0.5 : 1 }}
                      >
                        {deckDupCommitting ? 'Merging...' : `Merge ${acceptedCount} selected`}
                      </button>
                      <button onClick={clearDup} disabled={deckDupCommitting} style={{ ...S.ghostBtn, fontSize: 11 }}>
                        Cancel all
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {deckDupGroups.map((group, idx) => {
                      const fieldNames = Object.keys(group.mergedFields)
                      return (
                        <div key={group.noteIds.join('-')} style={{
                          border: group.accepted ? '1px solid rgba(24,169,87,0.4)' : '1px solid var(--c-border)',
                          borderRadius: 6, padding: 10,
                          background: group.accepted ? 'rgba(24,169,87,0.06)' : 'var(--c-surface)',
                        }}>
                          <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 8 }}>
                            <span style={{ color: 'var(--c-warning)' }}>{group.noteIds.length} duplicates</span>
                            {group.reason && <span> — {group.reason}</span>}
                          </div>

                          {/* The cards being merged — click a row to expand its full content */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                            {group.cards.map((c, ci) => {
                              const vals = Object.values(c.fields)
                              const expanded = !!deckDupExpanded[c.noteId]
                              return (
                                <div key={c.noteId} style={{ fontSize: 10, color: 'var(--c-ink-dim)', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', borderRadius: 4, overflow: 'hidden' }}>
                                  <div onClick={() => toggleDupExpanded(c.noteId)} style={{ padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: 'var(--c-ink-dim)', width: 8, flexShrink: 0 }}>{expanded ? '▾' : '▸'}</span>
                                    <span style={{ color: ci === 0 ? 'var(--c-success)' : 'var(--c-danger)', flexShrink: 0 }}>{ci === 0 ? 'KEEP' : 'DELETE'} #{c.noteId}</span>
                                    {!expanded && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}> — {vals[0]} → {vals[1]}</span>}
                                  </div>
                                  {expanded && (
                                    <div style={{ padding: '2px 8px 8px 22px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                      {Object.entries(c.fields).map(([name, val]) => (
                                        <div key={name}>
                                          <div style={{ color: '#6e7681', fontWeight: 600 }}>{name}</div>
                                          <div style={{ color: '#adbac7', whiteSpace: 'pre-wrap' }}>{val || '—'}</div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Merged result (editable) */}
                          <div style={{ fontSize: 10, color: 'var(--c-success)', fontWeight: 600, marginBottom: 4 }}>Merged card:</div>
                          {fieldNames.map((fieldName) => (
                            <div key={fieldName} style={{ marginBottom: 6 }}>
                              <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 3, fontWeight: 600 }}>{fieldName}</div>
                              <textarea
                                value={group.mergedFields[fieldName]}
                                onChange={(e) => updateDupField(idx, fieldName, e.target.value)}
                                style={{ ...S.keyInput, fontSize: 12, minHeight: 50, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                              />
                            </div>
                          ))}

                          <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => dismissDup(idx)}
                              title="Do not merge — these are different words. Never suggest this again."
                              style={{ ...S.ghostBtn, fontSize: 11, padding: '4px 10px', color: 'var(--c-warning)', borderColor: 'rgba(232,147,12,.3)' }}
                            >
                              Do not merge
                            </button>
                            <button
                              onClick={() => rejectDup(idx)}
                              title="Dismiss this group for now (may reappear on next scan)"
                              style={{ ...S.ghostBtn, fontSize: 14, padding: '3px 12px', color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}
                            >
                              ✗
                            </button>
                            <button
                              onClick={() => toggleAcceptDup(idx)}
                              title={group.accepted ? 'Click to un-select' : 'Select — will merge when you click Merge selected'}
                              style={{
                                ...S.ghostBtn,
                                fontSize: 14, padding: '3px 12px',
                                color: group.accepted ? 'var(--c-success)' : 'var(--c-ink-dim)',
                                borderColor: group.accepted ? 'rgba(24,169,87,.5)' : 'var(--c-border)',
                                background: group.accepted ? 'rgba(24,169,87,.12)' : 'transparent',
                              }}
                            >
                              ✓
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })()}

            {/* Card list */}
            {deckBrowserNotes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {deckBrowserNotes
                  .filter((n) => {
                    if (!deckBrowserSearch) return true
                    const s = deckBrowserSearch.toLowerCase()
                    return Object.values(n.fields).some((f) => stripHtml(f.value).toLowerCase().includes(s))
                  })
                  .sort(deckNoteCompare(deckBrowserSort))
                  .map((note) => {
                    const fields = Object.entries(note.fields).sort(([,a],[,b]) => a.order - b.order)
                    const front = stripHtml(fields[0]?.[1]?.value || '')
                    const back = backPreviewText(fields[1]?.[1]?.value || '')
                    const isEditing = deckBrowserEditing === note.noteId

                    return (
                      <div key={note.noteId} className={isEditing ? '' : 'deck-row'} style={{
                        border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden',
                        background: isEditing
                          ? 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))'
                          : 'linear-gradient(180deg, var(--c-bg), rgba(255,255,255,.008))',
                        transition: 'border-color .15s ease, background .15s ease',
                      }}>
                        {isEditing ? (
                          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {fields.map(([name]) => (
                              <div key={name}>
                                <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 3, fontWeight: 600 }}>{name}</div>
                                <textarea value={deckBrowserEditFields[name] || ''}
                                  onChange={(e) => setDeckBrowserEditFields((prev) => ({ ...prev, [name]: e.target.value }))}
                                  style={{ ...S.keyInput, fontSize: 12, minHeight: 50, resize: 'vertical', width: '100%', boxSizing: 'border-box' }}
                                />
                              </div>
                            ))}
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                              <input
                                type="text"
                                value={deckBrowserRefineInput}
                                onChange={(e) => setDeckBrowserRefineInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') refineDeckBrowserCard() }}
                                placeholder='e.g. "Say football instead of soccer"'
                                style={{ flex: 1, background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: 'var(--c-ink)', border: '1px solid var(--c-border)', borderRadius: 4, padding: '5px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}
                              />
                              <button
                                onClick={refineDeckBrowserCard}
                                disabled={deckBrowserRefining || !deckBrowserRefineInput.trim()}
                                style={{ background: 'rgba(139,92,246,.15)', color: 'var(--c-purple)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 4, padding: '5px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', opacity: (deckBrowserRefining || !deckBrowserRefineInput.trim()) ? 0.4 : 1 }}
                              >
                                {deckBrowserRefining ? 'Refining...' : 'Refine with AI'}
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                              <button onClick={() => saveEditNote(note.noteId)} disabled={deckBrowserSaveStatus === 'saving'} style={{ ...S.captureBtn, borderRadius: 5, fontSize: 11, padding: '5px 12px', opacity: deckBrowserSaveStatus === 'saving' ? 0.6 : 1 }}>{deckBrowserSaveStatus === 'saving' ? 'Saving...' : 'Save'}</button>
                              <button onClick={() => { setDeckBrowserEditing(null); setDeckBrowserRefineInput(''); setDeckBrowserSaveStatus(null) }} style={{ ...S.ghostBtn, fontSize: 11 }}>Cancel</button>
                              {deckBrowserSaveStatus === 'error' && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>Save failed — is Anki open?</span>}
                              {deckBrowserSaveStatus === 'saved' && <span style={{ fontSize: 10, color: 'var(--c-success)' }}>Saved</span>}
                              {/* Scheduling reset — content untouched; confirm guards the irreversible part */}
                              <button onClick={() => resetNoteProgress(note, front)} disabled={!ankiConnected}
                                title="Wipe this card's scheduling history — it becomes a NEW card again (content is kept)"
                                style={{ marginLeft: 'auto', background: 'rgba(229,57,46,.12)', color: 'var(--c-danger)', border: '1px solid rgba(229,57,46,.4)', borderRadius: 5, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: ankiConnected ? 'pointer' : 'default', fontFamily: 'inherit', opacity: ankiConnected ? 1 : 0.5 }}>
                                ⟲ Reset progress
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                          {/* Row header — click anywhere (except the buttons) to expand the full card */}
                          <div onClick={() => setDeckBrowserExpanded(deckBrowserExpanded === note.noteId ? null : note.noteId)}
                            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                            <span style={{ fontSize: 9, color: 'var(--c-ink-faint)', flexShrink: 0, width: 10 }}>{deckBrowserExpanded === note.noteId ? '▾' : '▸'}</span>
                            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-ink)' }}>{front}</span>
                              {activeMode.type === 'language' && (
                                <span onClick={(e) => e.stopPropagation()}>
                                  <Pronunciation word={pronWord(front)} lang={learnLangName()} region={pronRegion()} config={pronunciationCfg} t={t} compact noteId={note.noteId}
                                    onNative={(r, opts) => embedPronunciationInNote(note.noteId, r, pronWord(front), opts)} />
                                </span>
                              )}
                              <span style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginLeft: 8 }}>{back.slice(0, 100)}{back.length > 100 ? '...' : ''}</span>
                            </div>
                            {/* Scheduling badges — from the per-card stats already loaded for sorting */}
                            {note.stats && (
                              <span style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'center' }}>
                                {note.stats.reps === 0 ? (
                                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--c-info, #3b82f6)', border: '1px solid rgba(59,130,246,.35)', borderRadius: 999, padding: '1px 7px' }}>NEW</span>
                                ) : note.stats.interval > 0 ? (
                                  <span title={`Interval: ${note.stats.interval} days — ${note.stats.interval >= 21 ? 'mature' : 'young'}`}
                                    style={{ fontSize: 9, fontWeight: 800, color: note.stats.interval >= 21 ? 'var(--c-success)' : 'var(--c-ink-dim)', border: `1px solid ${note.stats.interval >= 21 ? 'rgba(24,169,87,.35)' : 'var(--c-border)'}`, borderRadius: 999, padding: '1px 7px' }}>
                                    {fmtInterval(note.stats.interval)}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--c-warning)', border: '1px solid rgba(232,147,12,.35)', borderRadius: 999, padding: '1px 7px' }}>learn</span>
                                )}
                                {note.stats.lapses >= 4 && (
                                  <span title={`${note.stats.lapses} lapses — a problem card`}
                                    style={{ fontSize: 9, fontWeight: 800, color: 'var(--c-danger)', border: '1px solid rgba(229,57,46,.35)', borderRadius: 999, padding: '1px 7px' }}>⚠ {note.stats.lapses}</span>
                                )}
                              </span>
                            )}
                            <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button onClick={() => startEditNote(note)} style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px' }}>Edit</button>
                              <button onClick={() => {
                                if (deckBrowserCopying === note.noteId) { setDeckBrowserCopying(null); return }
                                setDeckBrowserCopying(note.noteId)
                                setDeckBrowserCopyStatus(null)
                                setDeckBrowserCopyTarget(ankiDecks.find(d => d !== deckBrowserDeck) || '')
                              }} style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px', color: 'var(--c-success)', borderColor: 'rgba(24,169,87,.3)' }}>{t('copyTo')}</button>
                              <button onClick={() => { if (confirm(`Delete "${front}"?`)) deleteNote(note.noteId) }}
                                style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px', color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}>Del</button>
                            </div>
                          </div>
                          {/* Expanded card — the full back with bold labels, tags, and scheduling info */}
                          {deckBrowserExpanded === note.noteId && (
                            <div style={{ padding: '10px 14px 10px 32px', borderTop: '1px solid var(--c-border)', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))' }}>
                              {fields.slice(1).map(([name, f]) => (
                                <div key={name} style={{ marginBottom: 8 }}>
                                  {fields.length > 2 && <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--c-ink-faint)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 3 }}>{name}</div>}
                                  {backTextLines(f.value).map((ln, li) => {
                                    const m = ln.match(/^([^:]{1,30}):\s*(.*)$/)
                                    return (
                                      <div key={li} style={{ fontSize: 12, color: 'var(--c-ink-dim)', lineHeight: 1.7 }}>
                                        {m ? (<><span style={{ fontWeight: 700, color: 'var(--c-ink)' }}>{m[1]}:</span> {m[2]}</>) : ln}
                                      </div>
                                    )
                                  })}
                                </div>
                              ))}
                              {(note.tags || []).length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                                  {note.tags.map((tag) => (
                                    <span key={tag} style={{ fontSize: 9, fontWeight: 700, color: 'var(--c-purple)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 999, padding: '1px 7px' }}>{tag}</span>
                                  ))}
                                </div>
                              )}
                              {note.stats && (
                                <div style={{ fontSize: 10, color: 'var(--c-ink-faint)' }}>
                                  {note.stats.reps === 0
                                    ? 'Never studied'
                                    : `Studied ${note.stats.reps}× · ${note.stats.lapses} lapse${note.stats.lapses === 1 ? '' : 's'} · interval ${fmtInterval(note.stats.interval)} · last activity ${new Date(note.stats.mod * 1000).toLocaleDateString()}`}
                                </div>
                              )}
                              {/* Ebi's memory hooks — same engine as study's "Help me remember" */}
                              <div style={{ marginTop: 8 }}>
                                {(deckBrowserMnemonics[note.noteId]?.hooks || []).map((hook, hi) => (
                                  <div key={hi} style={{ fontSize: 11, color: 'var(--c-ink)', background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.25)', borderRadius: 6, padding: '8px 10px', lineHeight: 1.6, marginBottom: 6 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--c-purple)', marginBottom: 3 }}>🧠 Ebi's memory hook{(deckBrowserMnemonics[note.noteId]?.hooks?.length || 0) > 1 ? ` #${hi + 1}` : ''}</div>
                                    {hook}
                                  </div>
                                ))}
                                {deckBrowserMnemonics[note.noteId]?.loading && (
                                  <div style={{ fontSize: 11, color: 'var(--c-purple)', marginBottom: 6 }}>🧠 Ebi is thinking of {(deckBrowserMnemonics[note.noteId]?.hooks?.length || 0) ? 'another' : 'a'} memory hook…</div>
                                )}
                                {deckBrowserMnemonics[note.noteId]?.error && (
                                  <div style={{ fontSize: 10, color: 'var(--c-danger)', marginBottom: 6 }}>{deckBrowserMnemonics[note.noteId].error}</div>
                                )}
                                <button onClick={() => generateDeckMnemonic(note)} disabled={!apiKey || deckBrowserMnemonics[note.noteId]?.loading}
                                  title={apiKey ? 'Ebi builds a memory aid for this card (mnemonics, associations, why it makes sense)' : 'Add an API key first'}
                                  style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 10px', fontWeight: 700, color: 'var(--c-purple)', borderColor: 'rgba(139,92,246,.4)', opacity: (apiKey && !deckBrowserMnemonics[note.noteId]?.loading) ? 1 : 0.6 }}>
                                  🧠 {deckBrowserMnemonics[note.noteId]?.loading ? 'Thinking…' : (deckBrowserMnemonics[note.noteId]?.hooks?.length ? '↻ Another hook' : 'Help me learn this')}
                                </button>
                              </div>
                            </div>
                          )}
                          {deckBrowserCopying === note.noteId && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', padding: '7px 12px', borderTop: '1px solid var(--c-border)', background: 'rgba(24,169,87,.04)' }}>
                              <span style={{ fontSize: 10, color: 'var(--c-ink-dim)', fontWeight: 700 }}>{t('copyTo')}:</span>
                              <select value={deckBrowserCopyTarget} onChange={async (e) => {
                                if (e.target.value === '__new__') {
                                  const name = window.prompt(t('newDeckName'))
                                  if (!name || !name.trim()) return
                                  try {
                                    await ankiCreateDeck(name.trim())
                                    setAnkiDecks(prev => prev.includes(name.trim()) ? prev : [...prev, name.trim()])
                                    setDeckBrowserCopyTarget(name.trim())
                                  } catch (err) { console.error('[Deck] create failed:', err.message) }
                                } else {
                                  setDeckBrowserCopyTarget(e.target.value)
                                }
                              }} style={{ ...S.select, fontSize: 11, padding: '4px 8px' }}>
                                {ankiDecks.filter(d => d !== deckBrowserDeck).map(d => <option key={d} value={d}>{d}</option>)}
                                <option value="__new__">➕ {t('newDeck')}</option>
                              </select>
                              <button onClick={() => copyOrMoveNote(note, deckBrowserCopyTarget, false)} disabled={!deckBrowserCopyTarget || deckBrowserCopyStatus === 'working'}
                                style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 10px', color: 'var(--c-success)', borderColor: 'rgba(24,169,87,.35)', opacity: (!deckBrowserCopyTarget || deckBrowserCopyStatus === 'working') ? 0.5 : 1 }}>
                                {t('copyHere')}
                              </button>
                              <button onClick={() => copyOrMoveNote(note, deckBrowserCopyTarget, true)} disabled={!deckBrowserCopyTarget || deckBrowserCopyStatus === 'working'}
                                title={t('moveHereDesc')}
                                style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 10px', color: 'var(--c-warning)', borderColor: 'rgba(232,147,12,.35)', opacity: (!deckBrowserCopyTarget || deckBrowserCopyStatus === 'working') ? 0.5 : 1 }}>
                                {t('moveHere')}
                              </button>
                              <button onClick={() => { setDeckBrowserCopying(null); setDeckBrowserCopyStatus(null) }} style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px' }}>{t('cancel')}</button>
                              {deckBrowserCopyStatus === 'working' && <span style={{ fontSize: 10, color: 'var(--c-ink-dim)' }}>…</span>}
                              {deckBrowserCopyStatus === 'copied' && <span style={{ fontSize: 10, color: 'var(--c-success)', fontWeight: 700 }}>✓ {t('copiedTo')} «{deckBrowserCopyTarget}»</span>}
                              {deckBrowserCopyStatus === 'moved' && <span style={{ fontSize: 10, color: 'var(--c-success)', fontWeight: 700 }}>✓ {t('movedTo')} «{deckBrowserCopyTarget}»</span>}
                              {deckBrowserCopyStatus === 'error' && <span style={{ fontSize: 10, color: 'var(--c-danger)' }}>{t('copyFailed')}</span>}
                            </div>
                          )}
                          </>
                        )}
                      </div>
                    )
                  })}
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── Discover Tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'discover' && (
        <main style={{ ...S.main, display: 'flex', flexDirection: 'column', padding: 20 }}>
          <div style={{ maxWidth: 800, width: '100%', margin: '0 auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, fontFamily: FONT.display, marginBottom: 12 }}>{t('discoverTitle')}</div>
            {ankiConnected === false && (
              <div style={{ fontSize: 11, color: 'var(--c-warning)', marginBottom: 12 }}>{t('ankiNotConnected')}</div>
            )}
            {ankiConnected === null && (
              <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginBottom: 12 }}>{t('checkingAnki')}</div>
            )}
            <DiscoverPanel
              t={t}
              profile={discoverProfile}
              profileLoading={discoverProfileLoading}
              suggestion={discoverSuggestion}
              suggestionLoading={discoverSuggestionLoading}
              status={discoverStatus}
              sources={discoverSources}
              error={discoverError}
              webVerify={discoverWebVerify}
              setWebVerify={setDiscoverWebVerify}
              card={discoverCard}
              cardLoading={discoverCardLoading}
              cardSaving={discoverCardSaving}
              ledger={discoverLedger}
              deck={discoverDeck || ankiDeck}
              decks={ankiDecks}
              onDeckChange={discoverSwitchDeck}
              customKinds={(activeMode.type || 'general') !== 'language' ? (activeMode.discoverKinds || null) : null}
              apiKey={apiKey}
              ankiConnected={ankiConnected}
              onReanalyze={reanalyzeDiscover}
              onMakeCard={makeDiscoverCard}
              onSaveCard={saveDiscoverCard}
              onCancelCard={() => setDiscoverCard(null)}
              onKnow={() => discoverRecordAndNext('known')}
              onSkip={() => discoverRecordAndNext('declined', 'skipped')}
              onNotInterested={() => discoverRecordAndNext('declined', 'not interested')}
              onNext={() => fetchNextSuggestion(discoverProfile, discoverLedger)}
              setCard={setDiscoverCard}
              started={discoverStarted}
              config={discoverConfig}
              setConfig={setDiscoverConfig}
              onStart={startDiscover}
              onAdjust={adjustDiscover}
              isLanguage={(activeMode.type || 'general') === 'language'}
              modeName={activeMode.name}
              modeDescription={activeMode.description}
            />
          </div>
        </main>
      )}

      {/* ── Study Tab Home (no active session) ─────────────────────────────── */}
      {activeTab === 'study' && !studyActive && (
        <main style={{ ...S.main, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: 400, width: '100%', textAlign: 'center', padding: '40px 20px' }}>
            <img src={shrimpUrl(poseFile('book'))} alt="Ebi" style={{ width: 84, height: 84, objectFit: 'contain', marginBottom: 12 }} />
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: FONT.display, color: C.ink, marginBottom: 10 }}>{t('studyTitle')}</div>
            <div style={{ fontSize: 13, color: C.inkDim, marginBottom: 24, fontWeight: 600 }}>{t('studyTagline')}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={startStudySession}
                disabled={studyLoading || ankiConnected === false}
                style={{ ...S.captureBtn, borderRadius: 8, fontSize: 13, padding: '10px 24px', opacity: (studyLoading || ankiConnected === false) ? 0.5 : 1 }}
              >
                {studyLoading ? t('loading') : t('studyNow')}
              </button>
            </div>
            {ankiConnected === false && (
              <div style={{ fontSize: 11, color: 'var(--c-warning)', marginTop: 12 }}>{t('ankiNotConnected')}</div>
            )}
            {ankiConnected === null && (
              <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginTop: 12 }}>{t('checkingAnki')}</div>
            )}
          </div>
        </main>
      )}

      {/* ── Chat Tab ─────────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <main style={{ ...S.main, display: 'flex', padding: 0, overflow: 'hidden' }}>
          {/* Session sidebar */}
          <div style={{ width: 200, borderRight: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
            <button onClick={chatTabNewChat} style={{ ...S.captureBtn, margin: 8, borderRadius: 6, fontSize: 11, padding: '8px 12px' }}>
              {t('newChat')}
            </button>
            <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
              {chatTabSessions.map(s => (
                <div key={s.id} className="chat-session" onClick={() => chatTabLoadSession(s)} style={{
                  padding: '7px 9px', borderRadius: 7, fontSize: 10, color: chatTabSessionId === s.id ? 'var(--c-ink)' : 'var(--c-ink-dim)',
                  background: chatTabSessionId === s.id ? 'linear-gradient(180deg, rgba(223,37,64,.18), rgba(223,37,64,.07))' : 'transparent',
                  border: chatTabSessionId === s.id ? '1px solid rgba(223,37,64,.25)' : '1px solid transparent',
                  cursor: 'pointer', marginBottom: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'background .15s ease',
                }}>
                  {chatTabEditingTitle === s.id ? (
                    <input
                      autoFocus
                      defaultValue={s.title}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => { if (e.key === 'Enter') chatTabRenameSession(s.id, e.target.value); if (e.key === 'Escape') setChatTabEditingTitle(null) }}
                      onBlur={(e) => chatTabRenameSession(s.id, e.target.value)}
                      style={{ background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: 'var(--c-ink)', border: '1px solid var(--c-border)', borderRadius: 3, fontSize: 10, padding: '2px 4px', width: '100%', fontFamily: 'inherit' }}
                    />
                  ) : (
                    <span onDoubleClick={(e) => { e.stopPropagation(); setChatTabEditingTitle(s.id) }} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {s.type === 'help' && <span style={{ color: 'var(--c-brand)', marginRight: 4, fontSize: 9 }}>?</span>}
                      {s.title}
                    </span>
                  )}
                  <span onClick={(e) => { e.stopPropagation(); chatTabDeleteSession(s.id) }} style={{ color: 'var(--c-ink-faint)', cursor: 'pointer', marginLeft: 4 }}>&times;</span>
                </div>
              ))}
              {chatTabSessions.length === 0 && <div style={{ fontSize: 10, color: 'var(--c-ink-faint)', padding: 8, textAlign: 'center' }}>No saved chats</div>}
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Attached deck indicator */}
            {chatTabAttachedDeck && (
              <div style={{ padding: '6px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--c-brand)' }}>
                <span>Attached: {chatTabAttachedDeck.name} ({chatTabAttachedDeck.cards.length} cards)</span>
                <span onClick={() => setChatTabAttachedDeck(null)} style={{ cursor: 'pointer', color: 'var(--c-ink-dim)' }}>&times;</span>
              </div>
            )}

            {/* Messages */}
            <div ref={chatTabScrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 20px', position: 'relative' }}>
              {chatTabMsgs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '52px 20px' }}>
                  <img src={shrimpUrl(poseFile('singer'))} alt="Ebi" style={{ width: 76, height: 76, objectFit: 'contain', marginBottom: 10 }} />
                  <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 8, fontFamily: FONT.display, background: 'linear-gradient(90deg, var(--c-brand), var(--c-brand-dark))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Chat with Ebi</div>
                  <div style={{ fontSize: 12, color: 'var(--c-ink-dim)', marginBottom: 20, maxWidth: 420, margin: '0 auto 20px' }}>
                    Ask about your <strong>{activeMode.name}</strong> studies, have Ebi make Anki cards, quiz you — or just chat. Ebi knows what you're working on.
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    {((activeMode.chatSuggestions && activeMode.chatSuggestions.length)
                      ? activeMode.chatSuggestions
                      : ['Explain a key concept', 'Make me a flashcard', 'Quiz me on something']
                    ).map(hint => (
                      <button key={hint} className="chip" onClick={() => { setChatTabInput(hint) }} style={{ ...S.ghostBtn, fontSize: 10, padding: '7px 14px', borderRadius: 20 }}>
                        <span className="chip-inner">{hint}</span>
                      </button>
                    ))}
                    {/* Casual escape hatch — the user may just want to talk to Ebi. */}
                    <button className="chip" onClick={() => { setChatTabInput('Hey Ebi! 🦐') }} style={{ ...S.ghostBtn, fontSize: 10, padding: '7px 14px', borderRadius: 20, borderColor: 'rgba(223,37,64,.35)' }}>
                      <span className="chip-inner">💬 Just chat with Ebi</span>
                    </button>
                  </div>
                </div>
              )}
              {chatTabMsgs.map((m, i) => {
                const isUser = m.role === 'user'
                return (
                <div key={i} data-role={m.role} style={{ marginBottom: 16, display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', gap: 14, maxWidth: '100%' }}>
                    {/* Content column — width-capped so long messages wrap and leave room for Ebi */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', minWidth: 0, maxWidth: 620 }}>
                  <div style={{
                    maxWidth: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    background: m.role === 'user' ? 'linear-gradient(135deg, rgba(223,37,64,.2), rgba(223,37,64,.12))' : 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
                    border: `1px solid ${m.role === 'user' ? 'rgba(223,37,64,.28)' : 'var(--c-border)'}`,
                    color: 'var(--c-ink)', overflowWrap: 'anywhere', wordBreak: 'break-word',
                    ...(m.role === 'user' ? { whiteSpace: 'pre-wrap' } : {}),
                  }}>
                    {m.image && <img src={m.image} alt="attached" style={{ display: 'block', maxWidth: 220, maxHeight: 160, borderRadius: 8, marginBottom: m.content && m.content !== '(image)' ? 8 : 0 }} />}
                    {m.role === 'user' ? (m.content === '(image)' ? '' : m.content) : <Markdown text={m.content} />}
                  </div>
                  {/* Inline Anki card previews */}
                  {m.cards?.map((card, ci) => (
                    <div key={ci} style={{
                      maxWidth: '100%', marginTop: 6, padding: '10px 14px', borderRadius: 8,
                      background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)',
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', fontWeight: 600, marginBottom: 4 }}>ANKI CARD</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-ink)', marginBottom: 4 }}>
                        {card.front}
                        {activeMode.type === 'language' && (
                          <Pronunciation word={pronWord(card.front)} lang={learnLangName()} region={pronRegion()} config={pronunciationCfg} t={t} compact />
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--c-ink)', whiteSpace: 'pre-line', marginBottom: 6 }}>{card.back}</div>
                      {card.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {card.tags.map((t, ti) => <span key={ti} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(125,133,144,.15)', color: 'var(--c-ink-dim)' }}>{t}</span>)}
                        </div>
                      )}
                      {card.synced ? (
                        <span style={{ fontSize: 11, color: 'var(--c-success)', fontWeight: 600 }}>✓ Added to “{chatCardDeck()}”</span>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 2 }}>
                          <button onClick={() => chatTabSyncCard(card, i)} disabled={!ankiConnected} className="btn-press"
                            style={{ fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8, border: 'none',
                              background: ankiConnected ? 'var(--c-success)' : 'var(--c-surface-sunken)',
                              color: ankiConnected ? '#fff' : 'var(--c-ink-dim)',
                              cursor: ankiConnected ? 'pointer' : 'not-allowed', opacity: ankiConnected ? 1 : 0.6 }}>
                            + Add to Anki
                          </button>
                          <span style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>
                            {ankiConnected
                              ? <>→ deck <b style={{ color: 'var(--c-teal)' }}>{chatCardDeck()}</b></>
                              : 'Anki not connected'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {/* Web search sources */}
                  {m.sources?.length > 0 && (
                    <div style={{ maxWidth: '80%', marginTop: 6, padding: '8px 12px', borderRadius: 6, background: 'rgba(223,37,64,.06)', border: '1px solid rgba(223,37,64,.12)' }}>
                      <div style={{ fontSize: 9, color: 'var(--c-brand)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sources</div>
                      {m.sources.map((src, si) => (
                        <div key={si} style={{ fontSize: 10, marginBottom: 2 }}>
                          <a href={src.url?.startsWith('http') ? src.url : `https://${src.url}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--c-brand)', textDecoration: 'none' }}>
                            {src.title || src.url}
                          </a>
                          {src.url && <span style={{ color: 'var(--c-ink-faint)', marginLeft: 6, fontSize: 9 }}>{src.url.replace(/^https?:\/\//, '').split('/')[0]}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Offer to search the web (shown when Ebi declined to guess and search is off) */}
                  {m.offerSearch && !chatTabWebSearch && (
                    <div style={{ maxWidth: '80%', marginTop: 6, padding: '10px 12px', borderRadius: 8, background: 'rgba(45,134,201,.08)', border: '1px solid rgba(45,134,201,.25)' }}>
                      <div style={{ fontSize: 11, color: 'var(--c-ink)', marginBottom: 8 }}>🔎 Search the web for <b>“{m.offerSearch}”</b>?</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => chatOfferSearchAccept(m.offerSearch, i)} disabled={chatTabLoading}
                          style={{ ...S.captureBtn, borderRadius: 5, fontSize: 11, padding: '5px 14px', opacity: chatTabLoading ? 0.5 : 1 }}>Yes, search</button>
                        <button onClick={() => chatOfferSearchDecline(i)} disabled={chatTabLoading}
                          style={{ ...S.ghostBtn, fontSize: 11, padding: '5px 12px' }}>No thanks</button>
                      </div>
                    </div>
                  )}
                    </div>
                    {/* Bigger Ebi to the right of its response (uses the open space) */}
                    {!isUser && m.mascot && (
                      <img src={shrimpUrl(m.mascot)} alt="Ebi" title="Ebi" style={{ width: 96, height: 96, objectFit: 'contain', flexShrink: 0, alignSelf: 'flex-start', animation: 'pop .3s cubic-bezier(.34,1.56,.64,1)', filter: 'drop-shadow(var(--sh-sm))' }} />
                    )}
                  </div>
                </div>
                )
              })}
              {chatTabLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: chatTabStatus === 'searching' ? 'var(--c-brand)' : chatTabStatus === 'search-done' ? 'var(--c-success)' : chatTabStatus === 'search-empty' || chatTabStatus === 'search-failed' ? '#f0883e' : 'var(--c-ink-dim)', fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: chatTabStatus === 'searching' ? 'var(--c-brand)' : chatTabStatus === 'thinking' ? 'var(--c-purple)' : 'var(--c-brand)', animation: 'pulse 1.5s ease infinite' }} />
                    {chatTabStatus === 'searching' && 'Searching the web...'}
                    {chatTabStatus === 'search-done' && 'Found results. Analyzing...'}
                    {chatTabStatus === 'search-empty' && 'No results found. Answering from knowledge...'}
                    {chatTabStatus === 'search-failed' && 'Search failed. Answering from knowledge...'}
                    {chatTabStatus === 'thinking' && (chatTabWebSearch ? 'Generating response with search results...' : 'Thinking...')}
                    {!chatTabStatus && 'Thinking...'}
                  </div>
                </div>
              )}
              {/* Spacer so the latest turn can scroll to the top (height set to one viewport
                  in scrollChatToLatestTurn). Only when there are messages. */}
              {chatTabMsgs.length > 0 && <div ref={chatSpacerRef} style={{ flexShrink: 0 }} />}
            </div>

            {/* Input bar */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--c-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Attach deck row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!chatTabAttachedDeck && ankiConnected && (
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) chatTabAttachDeck(e.target.value) }}
                    style={{ ...S.select, fontSize: 10, padding: '3px 6px', color: 'var(--c-ink-dim)', maxWidth: 160 }}
                  >
                    <option value="">Attach deck...</option>
                    {ankiDecks.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                {chatTabAttachLoading && <span style={{ fontSize: 10, color: 'var(--c-ink-dim)' }}>Loading deck...</span>}
              </div>
              {/* Attached-image preview for the next message */}
              {chatTabImage && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <img src={chatTabImage} alt="attached" style={{ height: 44, borderRadius: 6, border: '1px solid var(--c-border)' }} />
                  <button onClick={() => setChatTabImage(null)} style={{ ...S.ghostBtn, fontSize: 10 }}>Remove image</button>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
                <input ref={chatImageInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => setChatTabImage(ev.target.result); r.readAsDataURL(f) } e.target.value = ''; setChatPlusOpen(false) }} />
                {/* "+" learning-focused options menu */}
                <button onClick={() => { const open = !chatPlusOpen; setChatPlusOpen(open); if (open && apiKey && !availableModels[provider]) refreshModels(provider) }} title="Options"
                  style={{ background: chatPlusOpen ? 'rgba(223,37,64,.15)' : 'transparent', border: `1px solid ${chatPlusOpen ? 'var(--c-brand)' : 'var(--c-border)'}`, color: chatPlusOpen ? 'var(--c-brand)' : 'var(--c-ink-faint)', borderRadius: 6, padding: '8px 12px', cursor: 'pointer', fontSize: 16, lineHeight: 1, fontFamily: 'inherit' }}>+</button>
                {chatPlusOpen && (() => {
                  const prefs = activeMode.chatPrefs || {}
                  const itemStyle = { textAlign: 'left', background: 'transparent', border: 'none', color: 'var(--c-ink)', fontFamily: 'inherit', fontSize: 12, padding: '7px 8px', borderRadius: 6, cursor: 'pointer' }
                  const labelStyle = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--c-ink-dim)', padding: '6px 8px 2px' }
                  const selStyle = { ...S.select, fontSize: 11, padding: '5px 6px', margin: '0 6px' }
                  return (
                    <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, width: 230, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 10, boxShadow: SHADOW.lg, padding: 6, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <button onClick={() => chatImageInputRef.current?.click()} style={itemStyle}>📷 Attach photo</button>
                      <button onClick={() => setChatTabWebSearch((v) => !v)} style={itemStyle}>🌐 Web search {chatTabWebSearch ? '✓' : ''}</button>
                      <div style={labelStyle}>Focus</div>
                      <select value={prefs.focus || 'free'} onChange={(e) => setChatPref('focus', e.target.value)} style={selStyle}>
                        <option value="free">Free chat</option>
                        <option value="tutor">Tutor</option>
                        <option value="translator">Translator</option>
                        <option value="cardmaker">Card-maker</option>
                        <option value="quiz">Quiz-master</option>
                      </select>
                      <div style={labelStyle}>Level</div>
                      <select value={prefs.level || 'intermediate'} onChange={(e) => setChatPref('level', e.target.value)} style={selStyle}>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <div style={labelStyle}>Explain in</div>
                      <select value={prefs.explain || 'auto'} onChange={(e) => setChatPref('explain', e.target.value)} style={selStyle}>
                        <option value="auto">Auto</option>
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                      </select>
                      {/* Chat AI model — same override as Settings → AI models (aiModels[provider].chat). */}
                      <div style={labelStyle}>Chat model</div>
                      <select value={aiModels[provider]?.chat || ''} onChange={(e) => setAiModels((prev) => ({ ...prev, [provider]: { ...(prev[provider] || {}), chat: e.target.value } }))} style={selStyle}>
                        <option value="">Default ({ROLE_DEFAULTS(providerConfig, intelligence).chat})</option>
                        {modelsLoading && !(availableModels[provider] || []).length && <option disabled>Loading…</option>}
                        {(availableModels[provider] || []).map((mid) => <option key={mid} value={mid}>{mid}</option>)}
                      </select>
                      <div style={{ fontSize: 9, color: 'var(--c-ink-faint)', padding: '2px 8px 4px' }}>Also editable in Settings → AI models</div>
                    </div>
                  )
                })()}
                <button
                  onClick={() => setChatTabWebSearch(prev => !prev)}
                  title={chatTabWebSearch ? 'Web search enabled' : 'Enable web search'}
                  style={{
                    background: chatTabWebSearch ? 'rgba(223,37,64,.15)' : 'transparent',
                    border: `1px solid ${chatTabWebSearch ? 'var(--c-brand)' : 'var(--c-border)'}`,
                    color: chatTabWebSearch ? 'var(--c-brand)' : 'var(--c-ink-faint)',
                    borderRadius: 6, padding: '8px 10px', cursor: 'pointer',
                    fontSize: 14, lineHeight: 1, fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >&#127760;</button>
                <input
                  ref={chatTabInputRef}
                  value={chatTabInput}
                  onChange={(e) => setChatTabInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatTabMessage() } }}
                  placeholder={chatTabWebSearch ? 'Search the web and ask...' : 'Ask anything, or tell me to make a flashcard...'}
                  style={{ ...S.keyInput, flex: 1, fontSize: 13, padding: '10px 14px' }}
                />
                <button
                  onClick={sendChatTabMessage}
                  disabled={chatTabLoading || (!chatTabInput.trim() && !chatTabImage)}
                  style={{ ...S.captureBtn, borderRadius: 6, opacity: chatTabLoading || (!chatTabInput.trim() && !chatTabImage) ? 0.5 : 1 }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── Stats Tab ────────────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (() => {
        const history = (() => { try { return JSON.parse(localStorage.getItem('screenlens-study-history') || '[]') } catch { return [] } })()
        // Use LOCAL date strings (YYYY-MM-DD) so they line up with Anki's local review days.
        const today = new Date().toLocaleDateString('en-CA')
        const todayStats = history.filter(h => h.date === today)
        const todayCorrect = todayStats.reduce((s, h) => s + (h.correct || 0), 0)
        const todayTotal = todayStats.reduce((s, h) => s + (h.totalQuestions || 0), 0)

        // Prefer live Anki review data (reflects what you actually did today) when connected;
        // fall back to locally-recorded session history when Anki is offline.
        const usingAnki = !!ankiStats
        const dayCount = (ds) => usingAnki
          ? (ankiStats.byDay[ds] || 0)
          : history.filter(h => h.date === ds).reduce((s, h) => s + (h.cardsStudied || 0), 0)
        const todayCards = usingAnki ? ankiStats.today : todayStats.reduce((s, h) => s + (h.cardsStudied || 0), 0)
        const accuracyToday = usingAnki ? ankiStats.accuracy : (todayTotal > 0 ? Math.round(todayCorrect / todayTotal * 100) : 0)

        // Streak: count consecutive days with any reviews (from Anki when connected)
        let streak = 0
        const d = new Date()
        for (let i = 0; i < 365; i++) {
          const dateStr = d.toLocaleDateString('en-CA')
          if (dayCount(dateStr) > 0) { streak++; d.setDate(d.getDate() - 1) }
          else if (i === 0) { d.setDate(d.getDate() - 1) } // allow today to not be studied yet
          else break
        }

        // Last 14 days chart
        const chartDays = []
        for (let i = 13; i >= 0; i--) {
          const dd = new Date(); dd.setDate(dd.getDate() - i)
          const ds = dd.toISOString().split('T')[0]
          chartDays.push({ date: ds, label: dd.toLocaleDateString('en', { weekday: 'short' }), cards: dayCount(ds) })
        }
        const maxCards = Math.max(1, ...chartDays.map(d => d.cards))

        // Per-deck breakdown
        const deckMap = {}
        history.forEach(h => {
          if (!deckMap[h.deck]) deckMap[h.deck] = { sessions: 0, cards: 0, lastDate: h.date }
          deckMap[h.deck].sessions++
          deckMap[h.deck].cards += h.cardsStudied || 0
          if (h.date > deckMap[h.deck].lastDate) deckMap[h.deck].lastDate = h.date
        })

        return (
        <main style={{ ...S.main, padding: 20 }}>
          <div style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: FONT.display, marginBottom: 20 }}>{t('statsTitle')}</div>

            {/* Top row: streak + today */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              {[
                { val: streak, color: 'var(--c-warning)', label: t('dayStreak') },
                { val: todayCards, color: 'var(--c-brand)', label: t('cardsToday') },
                { val: `${accuracyToday}%`, color: 'var(--c-success)', label: t('accuracyToday') },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, padding: '18px 20px', position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
                  border: '1px solid var(--c-border)', borderRadius: 12, textAlign: 'center',
                  boxShadow: '0 8px 24px -18px rgba(0,0,0,.8)',
                }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${s.color}, transparent)`, opacity: .85 }} />
                  <div style={{ fontSize: 34, fontWeight: 800, color: s.color, textShadow: `0 0 22px ${s.color}55` }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* 14-day chart */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-ink)', marginBottom: 12 }}>{t('last14Days')}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100 }}>
                {chartDays.map((day, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ fontSize: 9, color: 'var(--c-ink-dim)' }}>{day.cards || ''}</div>
                    <div style={{
                      width: '100%', borderRadius: '4px 4px 2px 2px',
                      height: Math.max(2, (day.cards / maxCards) * 80),
                      background: day.date === today
                        ? 'linear-gradient(180deg, var(--c-brand), var(--c-brand-dark))'
                        : day.cards > 0 ? 'linear-gradient(180deg, rgba(223,37,64,.55), rgba(223,37,64,.25))' : 'var(--c-surface-alt)',
                      boxShadow: day.date === today ? '0 0 12px rgba(223,37,64,.5)' : 'none',
                      transition: 'height .3s ease',
                    }} />
                    <div style={{ fontSize: 8, color: 'var(--c-ink-faint)' }}>{day.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Per-deck breakdown */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-ink)', marginBottom: 12 }}>{t('decks')}</div>
              {Object.keys(deckMap).length === 0 && <div style={{ fontSize: 11, color: 'var(--c-ink-faint)' }}>{t('noStudyHistory')}</div>}
              {Object.entries(deckMap).map(([deck, data]) => (
                <div key={deck} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--c-border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--c-ink)', fontWeight: 600 }}>{deck}</span>
                  <span style={{ color: 'var(--c-ink-dim)' }}>{data.cards} {t('cardsLabel')} / {data.sessions} {t('sessionsLabel')} / {t('lastLabel')}: {data.lastDate}</span>
                </div>
              ))}
            </div>

            {/* Recent sessions */}
            <div style={{ padding: '16px 20px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-ink)', marginBottom: 12 }}>{t('recentSessions')}</div>
              {history.length === 0 && <div style={{ fontSize: 11, color: 'var(--c-ink-faint)' }}>{t('noSessions')}</div>}
              {(() => {
                // Every sync flush records its own "session" entry, so one study sitting shows as
                // many near-identical rows. Group by (date, deck) for display: cards sum, accuracy
                // is card-weighted. Fixed grid columns so every row aligns (flex space-between let
                // each column drift with the deck name's width).
                const byKey = {}
                const grouped = []
                for (const h of history) {
                  const k = `${h.date}|${h.deck}`
                  if (byKey[k]) {
                    byKey[k].cardsStudied += h.cardsStudied || 0
                    byKey[k].accSum += (h.accuracy || 0) * (h.cardsStudied || 0)
                  } else {
                    byKey[k] = { date: h.date, deck: h.deck, cardsStudied: h.cardsStudied || 0, accSum: (h.accuracy || 0) * (h.cardsStudied || 0) }
                    grouped.push(byKey[k])
                  }
                }
                return grouped.slice(0, 20).map((g, i) => {
                  const acc = g.cardsStudied > 0 ? Math.round(g.accSum / g.cardsStudied) : 0
                  return (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '82px minmax(0,1fr) 84px 48px', alignItems: 'center', columnGap: 10, padding: '6px 0', borderBottom: '1px solid var(--c-border)', fontSize: 11 }}>
                      <span style={{ color: 'var(--c-ink-dim)' }}>{g.date}</span>
                      <span style={{ color: 'var(--c-brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.deck}</span>
                      <span style={{ color: 'var(--c-ink)', textAlign: 'right' }}>{g.cardsStudied} {g.cardsStudied === 1 ? t('cardLabelOne') : t('cardsLabel')}</span>
                      <span style={{ textAlign: 'right', fontWeight: 700, color: acc >= 80 ? 'var(--c-success)' : acc >= 50 ? 'var(--c-warning)' : 'var(--c-danger)' }}>{acc}%</span>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        </main>
        )
      })()}

      {/* ── Study Session ────────────────────────────────────────────────────── */}
      {activeTab === 'study' && studyActive && (
        <main style={{
          ...S.main,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          // Center vertically only on the pick phase; question/summary content can exceed viewport and must scroll from the top.
          ...(studyPhase === 'pick' ? { justifyContent: 'center' } : {}),
        }}>
          <div style={{ maxWidth: studyPhase === 'question' ? 820 : 600, width: '100%', padding: '40px 20px' }}>

            {/* Study start phase — ONE sectioned card (What to study / Language / Session format)
                with label-above-control fields and ⓘ tooltips instead of scattered boxes. */}
            {studyPhase === 'pick' && (() => {
              const isLang = activeMode.type === 'language'
              const sr = activeMode.studyRules || (isLang ? defaultStudyRules : defaultGeneralStudyRules)
              const learned = sr.studyLanguage || 'English'
              const speaks = sr.quizLanguage || learned
              const setSR = (patch) => updateActiveMode({ studyRules: { ...sr, ...patch } })
              const langOpts = LANGS.filter(l => l.code !== 'auto').map(l => ({ value: l.label, label: l.label }))
              // A study type left over from the other mode kind falls back to flashcards
              const shownMode = (isLang && studyMode === 'pbq') || (!isLang && studyMode === 'conjugations') ? 'flashcards' : studyMode
              const showAnswerStyle = shownMode === 'flashcards'
              const showPracticeSync = shownMode === 'pbq' || (showAnswerStyle && studyAnswerStyle === 'choices')
              const sessionCaption = shownMode === 'pbq' ? t('pbqTypeDesc')
                : shownMode === 'conjugations' ? t('studyTypeDesc')
                : studyAnswerStyle === 'choices' ? (studyPracticeSync ? t('practiceGradeAnkiDesc') : t('answerChoicesDesc'))
                : t('answerStyleDesc')

              const field = (label, desc, control) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--c-ink-dim)', letterSpacing: '.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                    {label}
                    {desc && <span className="tip" data-tip={desc} style={{ color: 'var(--c-ink-faint)', fontWeight: 400, textTransform: 'none' }}>ⓘ</span>}
                  </span>
                  {control}
                </div>
              )
              // Fields share the row equally and their controls stretch — no dead space on the right
              const row = (children) => (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>{children}</div>
              )
              const ctl = { ...S.select, fontSize: 12, padding: '7px 10px', width: '100%', boxSizing: 'border-box', textAlign: 'left' }
              const section = (title, children, first = false) => (
                <div style={{ padding: '14px 18px', borderTop: first ? 'none' : '1px solid var(--c-border)' }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--c-brand)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 10 }}>{title}</div>
                  {children}
                </div>
              )

              return (
              <div style={{ textAlign: 'center', animation: 'slideUp .35s ease' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: FONT.display, marginBottom: 14 }}>{t('studySession')}</div>

                {/* No overflow:hidden here — it would clip the ⓘ tooltips that extend past the card edge
                    (nothing else paints outside; the sections only draw inset border lines). */}
                <div style={{
                  display: 'inline-block', width: '100%', maxWidth: 520, textAlign: 'left',
                  background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
                  border: '1px solid var(--c-border)', borderRadius: 12, boxShadow: SHADOW.lg,
                }}>
                  {/* ── What to study ── */}
                  {section(t('studySecWhat'), row(<>
                    {field(t('mode'), t('studyModeDesc'), (
                      <Dropdown value={activeModeId} getZoom={getZoom} onChange={(val) => {
                        const id = parseInt(val)
                        setActiveModeId(id)
                        saveModes(modes, id)
                        // Load new mode's deck
                        const newMode = modes.find((m) => m.id === id)
                        if (newMode?.ankiDeck) setStudyDeck(newMode.ankiDeck)
                      }} style={{ ...ctl, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.3)' }}
                        options={modes.map((m) => ({ value: m.id, label: m.name, icon: m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}', color: 'var(--c-brand)' }))} />
                    ))}
                    {field(t('deck'), t('studyDeckDesc'), (
                      <Dropdown value={studyDeck} getZoom={getZoom} onChange={(val) => { setStudyDeck(val); setAnkiDeck(val) }}
                        style={ctl}
                        options={ankiDecks.map((d) => ({ value: d, label: d }))} />
                    ))}
                  </>), true)}

                  {/* ── Language ── */}
                  {section(t('studySecLang'), (<>
                    {row(<>
                      {isLang && field(t('studyLearning'), t('studyLearningDesc'), (
                        <Dropdown value={learned} getZoom={getZoom} onChange={(val) => setSR({ studyLanguage: val })} style={ctl} options={langOpts} />
                      ))}
                      {field(t('quizIn'), isLang ? t('studyEbiSpeaksDesc') : t('studyEbiOnlyDesc'), (
                        <Dropdown value={speaks} getZoom={getZoom} onChange={(val) => setSR({ quizLanguage: val })} style={ctl} options={langOpts} />
                      ))}
                    </>)}
                    {isLang && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginTop: 10 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--c-ink-dim)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={sr.grammarFeedback || false} onChange={(e) => setSR({ grammarFeedback: e.target.checked })} />
                          {t('grammarFeedback')}
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--c-ink-dim)', cursor: 'pointer' }}>
                          <input type="checkbox" checked={sr.wordHints || false} onChange={(e) => setSR({ wordHints: e.target.checked })} />
                          {t('studyWordHints')} <span className="tip" data-tip={t('studyWordHintsDesc')} style={{ color: 'var(--c-ink-faint)' }}>ⓘ</span>
                        </label>
                      </div>
                    )}
                  </>))}

                  {/* ── Session format ── */}
                  {section(t('studySecFormat'), (<>
                    {row(<>
                      {field(t('studyType'), null, (
                        <select value={shownMode} onChange={(e) => setStudyMode(e.target.value)} style={ctl}>
                          <option value="flashcards">{t('flashcards')}</option>
                          {isLang
                            ? <option value="conjugations">{t('conjugations')}</option>
                            : <option value="pbq">{t('pbqOption')}</option>}
                        </select>
                      ))}
                      {showAnswerStyle && field(t('answerStyle'), null, (
                        <select value={studyAnswerStyle} onChange={(e) => { setStudyAnswerStyle(e.target.value); try { localStorage.setItem('ebiki-study-style', e.target.value) } catch {} }} style={ctl}>
                          <option value="typed">{t('answerTyped')}</option>
                          <option value="choices">{t('answerChoices')}</option>
                        </select>
                      ))}
                    </>)}
                    {showPracticeSync && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--c-ink-dim)', cursor: 'pointer', marginTop: 10 }}>
                        <input type="checkbox" checked={studyPracticeSync} onChange={(e) => { setStudyPracticeSync(e.target.checked); try { localStorage.setItem('ebiki-study-practice-sync', e.target.checked ? '1' : '0') } catch {} }} />
                        {t('practiceGradeAnki')}
                      </label>
                    )}
                    <div style={{ fontSize: 10, color: 'var(--c-ink-faint)', lineHeight: 1.5, marginTop: 8 }}>{sessionCaption}</div>
                  </>))}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                  <button onClick={() => beginStudy(studyDeck, studyMode)} disabled={!studyDeck || studyLoading} className="btn-press"
                    style={{ ...S.captureBtn, borderRadius: 8, padding: '10px 36px', fontSize: 13, opacity: !studyDeck || studyLoading ? 0.5 : 1 }}>
                    {studyLoading ? t('loading') : t('start')}
                  </button>
                  <button onClick={exitStudy} style={{ ...S.ghostBtn }}>{t('cancel')}</button>
                </div>
                {ankiError && <div style={{ color: 'var(--c-danger)', fontSize: 11, marginTop: 8 }}>{ankiError}</div>}
              </div>
              )
            })()}

            {/* Summary phase */}
            {studyPhase === 'summary' && (
              <div style={{ textAlign: 'center', animation: 'pop .4s cubic-bezier(.34,1.56,.64,1)' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: FONT.display, marginBottom: 16 }}>{t('sessionComplete')}</div>
                <div style={{ fontSize: 14, color: 'var(--c-ink-dim)', marginBottom: 24 }}>
                  {studyStats.easy + studyStats.good + studyStats.hard + studyStats.again} {t('cardsStudied')}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 24 }}>
                  {[
                    { label: 'Easy', count: studyStats.easy, color: 'var(--c-success)' },
                    { label: 'Good', count: studyStats.good, color: 'var(--c-brand)' },
                    { label: 'Hard', count: studyStats.hard, color: 'var(--c-warning)' },
                    { label: 'Again', count: studyStats.again, color: 'var(--c-danger)' },
                  ].map(({ label, count, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 24, fontWeight: 700, color }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Spaced repetition insights */}
                {!studyInsights && !studyInsightsLoading && (
                  <button onClick={generateStudyInsights} style={{ ...S.ghostBtn, fontSize: 11, marginBottom: 16, color: 'var(--c-purple)', borderColor: 'rgba(139,92,246,.25)' }}>
                    {t('generateInsights')}
                  </button>
                )}
                {studyInsightsLoading && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, color: 'var(--c-ink-dim)', fontSize: 12 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-purple)', animation: 'pulse 1.5s ease infinite' }} />
                    Analyzing your session...
                  </div>
                )}
                {studyInsights && (
                  <div style={{
                    textAlign: 'left', marginBottom: 16, padding: '12px 16px', borderRadius: 8,
                    background: 'rgba(139,92,246,.06)', border: '1px solid rgba(139,92,246,.15)',
                    fontSize: 12, color: 'var(--c-ink)', lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-purple)', marginBottom: 6 }}>Insights</div>
                    {studyInsights}
                  </div>
                )}

                <button onClick={exitStudy} style={{ ...S.captureBtn, borderRadius: 6 }}>{t('done')}</button>
              </div>
            )}

            {/* Question phase — 10-card continuous system */}
            {studyPhase === 'question' && (() => {
              const activeCount = studyCardState.filter(cs => !cs.done).length
              const completedCount = studyCardState.filter(cs => cs.done).length
              const cq = currentQuestion
              const cs = cq ? studyCardState[cq.cardIdx] : null
              const questionObj = cs ? cs.questions[cq.questionIdx] : null
              const question = getQuestionText(questionObj)
              const canUndo = studyAnswerHistory.length > 0 && !studyCardState[studyAnswerHistory[studyAnswerHistory.length - 1]?.cardIdx]?.synced

              return (
                <div>
                  {/* Correct-spelling toast (accent/typo accepted) — stays mounted across card transitions */}
                  {studySpellingNote && (
                    <div style={{ position: 'fixed', top: '30%', right: 24, zIndex: 50, maxWidth: 220, background: C.surface, border: `1px solid ${C.successTint}`, borderRadius: RADIUS.md, padding: '10px 14px', boxShadow: SHADOW.lg, animation: 'fadeIn .2s ease' }}>
                      <div style={{ fontSize: 10, color: 'var(--c-success)', fontWeight: 700, marginBottom: 3, letterSpacing: '.04em' }}>{t('spellingCorrect')}</div>
                      <div style={{ fontSize: 15, color: 'var(--c-ink)', fontWeight: 600 }}>{studySpellingNote.correct}</div>
                    </div>
                  )}

                  {/* Header — session-level info + controls (Wrap Up / End Now live here, not on the card) */}
                  {(() => {
                    const poolRemaining = Math.max(0, (studyMode === 'conjugations' ? studyConjugationWords.length : studyAllCards.length) - studyBatchIdx)
                    const totalCards = completedCount + activeCount + poolRemaining
                    return (<>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12, alignItems: 'baseline' }}>
                      <span style={{ color: 'var(--c-ink)', fontWeight: 700 }}>{completedCount}<span style={{ color: 'var(--c-ink-dim)', fontWeight: 400 }}>/{totalCards}</span> <span style={{ fontSize: 10, color: 'var(--c-ink-dim)', fontWeight: 400 }}>{t('cardsLabel')}</span></span>
                      <span style={{ color: 'var(--c-brand)' }}>{activeCount} <span style={{ fontSize: 10, color: 'var(--c-ink-dim)' }}>{t('active')}</span></span>
                      <span style={{ color: 'var(--c-ink-dim)', fontSize: 11 }}>{studyDeckStats.new_count || 0} {t('new')} / {studyDeckStats.learn_count || 0} {t('learn')} / {studyDeckStats.review_count || 0} {t('due')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {!studyWrappingUp && (
                        <button onClick={studyWrapUp} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-warning)', borderColor: 'rgba(232,147,12,.25)' }}>{t('wrapUp')}</button>
                      )}
                      <button onClick={studyEndNow} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}>{t('endNow')}</button>
                      <FeedbackLegend />
                      <button onClick={exitStudy} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-ink-dim)' }}>{t('exitStudy')}</button>
                    </div>
                  </div>
                  {/* Session progress — cards completed out of everything this session will cover */}
                  <div style={{ height: 3, borderRadius: 2, background: 'var(--c-border)', marginBottom: 14, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${totalCards ? Math.round((completedCount / totalCards) * 100) : 0}%`, background: 'var(--c-brand)', borderRadius: 2, transition: 'width .4s ease' }} />
                  </div>
                    </>)
                  })()}

                  {/* Current question — card front is HIDDEN. Ebi studies alongside, to the right. */}
                  {(question || studyChoiceFlash || studyPbqReview || studyTypedFlash) ? (
                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                      flex: '1 1 480px', maxWidth: 620, minWidth: 0,
                      background: C.surface,
                      border: `1px solid ${C.border}`, borderRadius: 16,
                      padding: '22px 24px', boxShadow: SHADOW.lg,
                    }}>
                      {/* Multiple-choice flash: a frozen copy of the question just answered, showing the
                          right/wrong colors for a beat while the live state has already moved on. */}
                      {studyChoiceFlash ? (<>
                        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--c-ink)', fontWeight: 600, marginBottom: 10 }}>{studyChoiceFlash.question}</div>
                        {renderChoiceButtons(studyChoiceFlash.choices, { picked: studyChoiceFlash.picked, answerIdx: studyChoiceFlash.answerIdx })}
                      </>) : studyPbqReview ? (<>
                        {/* Graded PBQ — stays until Continue so the student can study what was wrong */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                          <div style={{ fontSize: 13, color: 'var(--c-ink)', fontWeight: 600 }}>{studyPbqReview.pbq.title}</div>
                          <span style={{ fontSize: 13, fontWeight: 800, flexShrink: 0, color: studyPbqReview.correct === studyPbqReview.total ? 'var(--c-success)' : 'var(--c-warning)' }}>
                            {t('pbqScoreLabel')}: {studyPbqReview.correct}/{studyPbqReview.total}
                          </span>
                        </div>
                        <PbqQuestion pbq={studyPbqReview.pbq} t={t} onSubmit={() => {}} review={{ assign: studyPbqReview.assign, perItem: studyPbqReview.perItem }} />
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                          <button className="btn-press" onClick={() => setStudyPbqReview(null)} style={{ ...S.captureBtn, borderRadius: 8 }}>{t('pbqContinue')}</button>
                        </div>
                      </>) : studyTypedFlash ? (<>
                        {/* Typed-answer feedback: green ✓ = locally verified; amber ⏳ = Ebi grades it later */}
                        <div style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--c-ink)', fontWeight: 600, marginBottom: 12 }}>{studyTypedFlash.question}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 10,
                            fontSize: 14, fontWeight: 700, animation: 'pop .25s cubic-bezier(.34,1.56,.64,1)',
                            border: `1.5px solid ${studyTypedFlash.kind === 'correct' ? 'var(--c-success)' : 'var(--c-warning)'}`,
                            background: studyTypedFlash.kind === 'correct' ? 'rgba(24,169,87,.12)' : 'rgba(232,147,12,.10)',
                            color: studyTypedFlash.kind === 'correct' ? 'var(--c-success)' : 'var(--c-warning)',
                          }}>
                            {studyTypedFlash.kind === 'correct' ? '✓' : '⏳'} {studyTypedFlash.answer}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: studyTypedFlash.kind === 'correct' ? 'var(--c-success)' : 'var(--c-ink-dim)' }}>
                            {studyTypedFlash.kind === 'correct' ? t('studyFlashCorrect') : t('studyFlashCheck')}
                          </span>
                        </div>
                      </>) : (<>
                      {/* Conjugation mode: show the word being conjugated + option to add it to Anki */}
                      {studyMode === 'conjugations' && cs && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 10px', background: 'rgba(223,37,64,.06)', border: '1px solid rgba(223,37,64,.2)', borderRadius: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-brand)' }}>{cs.front}</span>
                          {cs.back && <span style={{ fontSize: 12, color: 'var(--c-ink-dim)' }}>— <em>{cs.back}</em></span>}
                          <div style={{ marginLeft: 'auto' }}>
                            {cs.addedToAnki ? (
                              <span style={{ fontSize: 11, color: 'var(--c-success)' }}>✓ Added to deck</span>
                            ) : !cs.fromDeck ? (
                              <button onClick={() => addConjugationWordToAnki(cq.cardIdx)}
                                style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.3)', padding: '3px 8px' }}>
                                + Add to Anki
                              </button>
                            ) : null}
                          </div>
                        </div>
                      )}

                      {/* Question progress dots — which question of this card you're on. Filled
                          (answered) dots are CLICKABLE: jump back and re-answer from there. */}
                      {cs && cs.questions.length > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                          <span className="tip" data-tip={`${t('studyQuestionOf')} ${Math.min(cs.questionIdx + 1, cs.questions.length)}/${cs.questions.length}${cs.questionIdx > 0 ? ` — ${t('studyDotJump')}` : ''}`}
                            style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: 2 }}>
                            {cs.questions.map((_, qi) => {
                              const answered = qi < cs.questionIdx
                              return (
                                <button key={qi} disabled={!answered}
                                  onClick={answered ? () => jumpToCardQuestion(cq.cardIdx, qi) : undefined}
                                  style={{
                                    width: 8, height: 8, borderRadius: '50%', boxSizing: 'border-box', padding: 0,
                                    background: answered ? 'var(--c-brand)' : 'transparent',
                                    border: `1.5px solid ${qi <= cs.questionIdx ? 'var(--c-brand)' : 'var(--c-border)'}`,
                                    cursor: answered ? 'pointer' : 'default',
                                  }} />
                              )
                            })}
                          </span>
                        </div>
                      )}

                      {(() => {
                        if (activeMode.type !== 'language') {
                          return <div key={`q-${cq?.cardIdx}-${cq?.questionIdx}`} style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--c-ink)', fontWeight: 600, marginBottom: studyWordLookup ? 6 : 10, animation: 'fadeUp .25s ease' }}>{question}</div>
                        }
                        const answers = questionObj?.acceptedAnswers || []
                        // Word hints (ruby-style): map each non-answer word to its meaning, shown above it.
                        // Filter again here so the answer can never leak (covers the question-gen gloss path too).
                        const hintsOn = !!activeMode.studyRules?.wordHints
                        const safeGlosses = (hintsOn && questionObj?.glosses) ? filterRevealingGlosses(questionObj.glosses, answers) : {}
                        const glossMap = {}
                        for (const k in safeGlosses) {
                          const nk = String(k).toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
                          if (nk) glossMap[nk] = String(safeGlosses[k])
                        }
                        const anyGloss = Object.keys(glossMap).length > 0
                        return (
                          <div key={`q-${cq?.cardIdx}-${cq?.questionIdx}`} style={{ fontSize: 15.5, color: 'var(--c-ink)', fontWeight: 600, marginBottom: studyWordLookup ? 6 : 10, animation: 'fadeUp .25s ease', lineHeight: anyGloss ? 2.4 : 1.6 }}>
                            {question.split(/(\s+)/).map((tok, ti) => {
                              if (/^\s+$/.test(tok) || tok === '') return <span key={ti}>{tok}</span>
                              const clean = tok.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
                              const cl = clean.toLowerCase()
                              const isAnswer = answers.includes(cl)
                              const lookupable = clean.length > 1 && !/_{2,}/.test(tok) && !isAnswer
                              const gloss = (!isAnswer && glossMap[cl]) || null
                              const word = lookupable
                                ? <span className="study-word" onClick={() => lookupStudyWord(clean, question, 'question')} title={`What does "${clean}" mean?`} style={{ cursor: 'pointer', display: 'inline-block' }}><span className="study-word-inner" style={{ display: 'inline-block' }}>{tok}</span></span>
                                : <span>{tok}</span>
                              // When any word has a gloss, give EVERY word the same stacked layout (blank slot
                              // above un-glossed words) so the whole line shares one baseline — no "floating".
                              if (!anyGloss) return <span key={ti}>{word}</span>
                              return (
                                <span key={ti} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', verticalAlign: 'bottom', lineHeight: 1.1 }}>
                                  <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--c-purple)', whiteSpace: 'nowrap', minHeight: '1.1em' }}>{gloss || ' '}</span>
                                  {word}
                                </span>
                              )
                            })}
                          </div>
                        )
                      })()}

                      {/* PBQ scenario — the exam-style framing under the instruction/title */}
                      {questionObj?.type === 'pbq' && questionObj.pbq?.scenario && (
                        <div style={{ fontSize: 12, color: 'var(--c-ink-dim)', lineHeight: 1.6, marginBottom: 10 }}>{questionObj.pbq.scenario}</div>
                      )}

                      {renderWordLookupPopup('question')}

                      {studyCurrentHint && (
                        <div style={{ fontSize: 11, color: 'var(--c-warning)', background: 'rgba(232,147,12,.08)', border: '1px solid rgba(232,147,12,.2)', borderRadius: 5, padding: '5px 10px', marginBottom: 8 }}>
                          Hint: {studyCurrentHint}
                        </div>
                      )}

                      {studyMeaningHint && (
                        <div style={{ fontSize: 11, color: 'var(--c-brand)', background: 'rgba(223,37,64,.06)', border: '1px solid rgba(223,37,64,.2)', borderRadius: 5, padding: '5px 10px', marginBottom: 8, lineHeight: 1.6 }}>
                          💡 {renderTappableText(studyMeaningHint, studyMeaningHint, 'hint')}
                        </div>
                      )}
                      {renderWordLookupPopup('hint')}
                      {studyMeaningHintLoading && (
                        <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 8 }}>Loading hint...</div>
                      )}

                      {questionObj?.type === 'pbq' && questionObj.pbq ? (
                        <PbqQuestion key={`pbq-${cq?.cardIdx}`} pbq={questionObj.pbq} t={t} onSubmit={submitPbqAnswer} />
                      ) : questionHasChoices(questionObj) ? (
                        renderChoiceButtons(questionObj.choices, { onPick: submitStudyChoice })
                      ) : (
                      <div key={`shake-${studyInputShake}`} className={studyInputShake ? 'study-shake' : undefined} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* Red ✗ while the missed attempt is on screen; typing clears it */}
                        {studyCurrentHint && !studyInput && (
                          <span style={{ color: 'var(--c-danger)', fontWeight: 800, fontSize: 17, flexShrink: 0 }}>✗</span>
                        )}
                        <input
                          value={studyInput}
                          onChange={(e) => setStudyInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitStudyAnswer() }}
                          placeholder={studyCurrentHint ? t('tryAgain') + '...' : t('typeYourAnswer')}
                          style={{ ...S.keyInput, flex: 1, fontSize: 14, padding: '10px 14px' }}
                          autoFocus
                        />
                        <button onClick={submitStudyAnswer} disabled={!studyInput.trim()}
                          style={{ ...S.captureBtn, borderRadius: 6, opacity: !studyInput.trim() ? 0.5 : 1 }}>
                          {studyCurrentHint ? t('tryAgain') : t('submit')}
                        </button>
                      </div>
                      )}

                      {/* "Fix this question" — complaint input; regenerates the live question and
                          saves the distilled style preference to the mode */}
                      {studyFixQ && (
                        <div style={{ marginTop: 8 }}>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input value={studyFixQ.input} autoFocus
                              onChange={(e) => setStudyFixQ((p) => ({ ...p, input: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') fixCurrentQuestion() }}
                              placeholder={t('fixQuestionPlaceholder')}
                              style={{ ...S.keyInput, flex: 1, fontSize: 12, padding: '8px 12px', borderColor: 'rgba(139,92,246,.4)' }} />
                            <button onClick={fixCurrentQuestion} disabled={!studyFixQ.input.trim() || studyFixQ.loading}
                              style={{ ...S.ghostBtn, fontSize: 11, fontWeight: 700, color: 'var(--c-purple)', borderColor: 'rgba(139,92,246,.45)', opacity: (!studyFixQ.input.trim() || studyFixQ.loading) ? 0.5 : 1 }}>
                              {studyFixQ.loading ? t('loading') : t('fixQuestionGo')}
                            </button>
                            <button onClick={() => setStudyFixQ(null)} style={{ ...S.ghostBtn, fontSize: 11, padding: '6px 9px' }}>✕</button>
                          </div>
                          {studyFixQ.error && <div style={{ fontSize: 10, color: 'var(--c-danger)', marginTop: 4 }}>{studyFixQ.error}</div>}
                        </div>
                      )}

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={skipStudyQuestion} className="ui-btn"
                            style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}>
                            {t('iDontKnow')}
                          </button>
                          {studyMode === 'conjugations' && (
                            <button onClick={skipConjugationWord} className="ui-btn"
                              style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-ink-dim)', borderColor: 'var(--c-border)' }}>
                              {t('skipWord')}
                            </button>
                          )}
                          {!questionHasChoices(questionObj) && questionObj?.type !== 'pbq' && (
                          <button onClick={fetchMeaningHint} disabled={studyMeaningHintLoading || !!studyMeaningHint} className="ui-btn"
                            style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.25)', opacity: (studyMeaningHintLoading || !!studyMeaningHint) ? 0.5 : 1 }}>
                            {studyMeaningHintLoading ? t('loading') : t('meaningHint')}
                          </button>
                          )}
                          {studyMode !== 'conjugations' && (
                            <button onClick={() => setStudyDeleteConfirm(cq.cardIdx)} className="ui-btn"
                              style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-ink-dim)', borderColor: 'var(--c-border)' }}>
                              {t('iKnowThisAlready')}
                            </button>
                          )}
                          {questionObj?.type !== 'pbq' && (
                            <button onClick={() => setStudyFixQ(studyFixQ ? null : { input: '', loading: false })} className="ui-btn"
                              title={t('fixQuestionDesc')}
                              style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-purple)', borderColor: studyFixQ ? 'rgba(139,92,246,.6)' : 'rgba(139,92,246,.3)', background: studyFixQ ? 'rgba(139,92,246,.12)' : 'transparent' }}>
                              ✎ {t('fixQuestion')}
                            </button>
                          )}
                          {canUndo && (
                            <button onClick={undoLastAnswer} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-ink-dim)', borderColor: 'var(--c-border)' }}>← {t('back')}</button>
                          )}
                        </div>
                        {/* Session-level Wrap Up / End Now moved to the header — only card actions live here */}
                      </div>

                      {studyDeleteConfirm === cq.cardIdx && (
                        <div style={{ padding: '10px 14px', borderRadius: 6, background: 'rgba(229,57,46,.06)', border: '1px solid rgba(229,57,46,.15)', marginTop: 8 }}>
                          <div style={{ fontSize: 12, color: 'var(--c-ink)', marginBottom: 8 }}>Delete this card from Anki?</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => studyDeleteKnownCard(cq.cardIdx)} style={{ ...S.ghostBtn, fontSize: 11, color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.3)' }}>Yes, delete</button>
                            <button onClick={() => setStudyDeleteConfirm(null)} style={{ ...S.ghostBtn, fontSize: 11 }}>Cancel</button>
                          </div>
                        </div>
                      )}

                      {studyWrappingUp && (
                        <div style={{ fontSize: 10, color: 'var(--c-warning)', marginTop: 4, textAlign: 'center' }}>Wrapping up — finishing current cards...</div>
                      )}
                      </>)}
                    </div>
                    {/* Ebi study companion — big, circle-less, reacts to the question; Ask Ebi opens Help */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8, flexShrink: 0 }}>
                      <img src={shrimpUrl(studyMascot)} alt="Ebi" draggable={false} style={{ width: 132, height: 132, objectFit: 'contain' }} />
                      <button onClick={() => setAskEbiSignal((n) => n + 1)} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 12, color: 'var(--c-brand)', borderColor: 'var(--c-brand-ring, rgba(223,37,64,.35))', fontWeight: 700, padding: '7px 16px', borderRadius: RADIUS.pill }}>
                        {t('askEbi')}
                      </button>
                    </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: 'var(--c-ink-dim)', fontSize: 12, padding: 20 }}>
                      {studyCardState.some(cs => cs.evaluating) ? 'Evaluating remaining cards...' : 'All cards completed!'}
                      {!studyCardState.some(cs => cs.evaluating) && (
                        <button onClick={() => setStudyPhase('summary')} style={{ ...S.captureBtn, borderRadius: 6, marginTop: 12, display: 'block', margin: '12px auto 0' }}>View Summary</button>
                      )}
                    </div>
                  )}

                  {/* Graded cards — consolidated behind a toggle, each tagged with its sync status */}
                  {(() => {
                    const graded = studyCardState.filter(cs => cs.done && cs.results.length > 0 && !cs.dismissed)
                    if (graded.length === 0) return null
                    const pending = graded.filter(cs => cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation && !cs.noSync)
                    return (
                      <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => setStudyShowGraded(v => !v)} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 11, fontWeight: 700, color: 'var(--c-ink-dim)' }}>
                            {studyShowGraded ? '▾ Hide' : '▸ Show'} graded cards ({graded.length}{pending.length > 0 ? `, ${pending.length} unsynced` : ''})
                          </button>
                          {pending.length > 0 && ankiConnected && (
                            <button onClick={() => syncGradedNow()} disabled={studySyncing} className="btn-press hover-dim"
                              style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: 'none', background: 'var(--c-success)', color: '#fff', cursor: studySyncing ? 'default' : 'pointer', opacity: studySyncing ? 0.6 : 1 }}>
                              {studySyncing ? 'Syncing…' : `Sync ${pending.length} to Anki now`}
                            </button>
                          )}
                        </div>
                        {pending.length > 0 && (
                          <div style={{ textAlign: 'center', fontSize: 10, color: 'var(--c-ink-faint)', marginTop: 5 }}>
                            {studyAutoSync ? (() => {
                              const oldest = Math.min(...pending.map(c => c.gradedAt || studyNow))
                              const left = Math.max(0, oldest + STUDY_SYNC_GRACE_MS - studyNow)
                              const mm = Math.floor(left / 60000), ssn = Math.floor((left % 60000) / 1000)
                              return `Unsynced ratings lock into Anki in ${mm}:${String(ssn).padStart(2, '0')}. Correct them before then, or sync now.`
                            })() : 'Auto-sync is off. Ratings sync when you press “Sync now” or finish the session.'}
                          </div>
                        )}
                        {studySyncNotification && (
                          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--c-success)' }}>✓ Synced to Anki</div>
                        )}
                        {studySyncError && (
                          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--c-danger)', background: 'rgba(229,57,46,.06)', border: '1px solid rgba(229,57,46,.2)', borderRadius: 6, padding: '6px 12px' }}>{studySyncError}</div>
                        )}
                        {studyShowGraded && (
                          <div>
                  {[...graded].sort((a, b) => (b.gradedAt || 0) - (a.gradedAt || 0)).map((cs, i) => {
                    const ci = studyCardState.indexOf(cs)
                    const ratingColors = { easy: 'var(--c-success)', good: 'var(--c-brand)', hard: 'var(--c-warning)', again: 'var(--c-danger)', deleted: 'var(--c-ink-dim)' }
                    const view = studyGradedView[ci]
                    return (
                      <div key={ci} className="graded-card" style={{ marginTop: 16, border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden' }}>
                        {/* The whole header is the feedback toggle; only the HEADER highlights on hover
                            (an expanded body below must never tint). Right-side buttons stopPropagation. */}
                        <div className="card-head" onClick={() => { if (!cs.evaluating) setStudyGradedView(p => ({ ...p, [ci]: p[ci] === 'feedback' ? undefined : 'feedback' })) }}
                          style={{ padding: '8px 12px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 9, color: 'var(--c-ink-faint)', flexShrink: 0 }}>{view === 'feedback' ? '▾' : '▸'}</span>
                            {cs.front}
                            {activeMode.type === 'language' && (
                              <span onClick={(e) => e.stopPropagation()}>
                                <Pronunciation word={pronWord(cs.front)} lang={learnLangName()} region={pronRegion()} config={pronunciationCfg} t={t} compact cardId={cs.cardId}
                                  onNative={(r, opts) => embedPronunciationForCard(cs.cardId, r, pronWord(cs.front), opts)} />
                              </span>
                            )}
                          </span>
                          <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          {cs.evaluating ? (
                            <span style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>Evaluating...</span>
                          ) : (<>
                            {renderMnemonicButton(cs, ci, view === 'mnemonic')}
                            {cs.noSync ? (
                              // Relaxed practice — this rating never reaches Anki, so there's nothing to correct or lock.
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: ratingColors[cs.rating] || 'var(--c-ink-dim)' }}>{(cs.rating || '').toUpperCase()}</span>
                                <span title="Practice only — not recorded in Anki" style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-purple)' }}>{t('practiceBadge')}</span>
                              </span>
                            ) : cs.synced ? (
                              // Locked: this rating is committed to Anki and can no longer change (no again→easy lapse).
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: ratingColors[cs.rating] || 'var(--c-ink-dim)' }}>{(cs.rating || '').toUpperCase()}</span>
                                <span title="Synced to Anki — locked" style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-success)' }}>🔒 Synced</span>
                              </span>
                            ) : (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span title="Not yet committed to Anki — you can still change this rating" style={{ fontSize: 9, color: 'var(--c-warning)', fontWeight: 700 }}>● not synced</span>
                                <select value={cs.rating || ''} onChange={(e) => {
                                const newRating = e.target.value
                                const easeMap = { easy: 4, good: 3, hard: 2, again: 1 }
                                setStudyCardState(prev => {
                                  const updated = [...prev]
                                  const oldRating = updated[ci].rating
                                  // synced:false so the corrected rating is pushed to Anki (re-answers the card with the new ease).
                                  updated[ci] = { ...updated[ci], rating: newRating, ease: easeMap[newRating] || 1, synced: false }
                                  setStudyStats(s => ({
                                    ...s,
                                    [oldRating]: Math.max(0, (s[oldRating] || 0) - 1),
                                    [newRating]: (s[newRating] || 0) + 1,
                                  }))
                                  return updated
                                })
                              }} className="hover-dim" style={{ background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: ratingColors[cs.rating] || 'var(--c-ink-dim)', border: `1px solid ${ratingColors[cs.rating] || 'var(--c-border)'}44`, borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', padding: '2px 6px', cursor: 'pointer' }}>
                                <option value="easy" style={{ color: 'var(--c-success)' }}>EASY</option>
                                <option value="good" style={{ color: 'var(--c-brand)' }}>GOOD</option>
                                <option value="hard" style={{ color: 'var(--c-warning)' }}>HARD</option>
                                <option value="again" style={{ color: 'var(--c-danger)' }}>AGAIN</option>
                              </select>
                              </span>
                            )}
                          </>)}
                          </span>
                        </div>
                        {view === 'mnemonic' && renderMnemonic(cs, ci)}
                        {view === 'feedback' && (<>
                        {cs.results.map((r, qi) => renderQaRow(cs, ci, qi, `graded-${ci}-${qi}`))}
                        <div style={{ padding: '4px 12px', borderTop: '1px solid var(--c-border)', fontSize: 10, color: 'var(--c-ink-faint)' }}>{cs.back}</div>
                        {/* Feedback chat */}
                        {!cs.evaluating && (
                          <div style={{ padding: '6px 12px', borderTop: '1px solid var(--c-border)' }}>
                            {(studyFeedbackChat[ci]?.messages || []).map((m, mi) => (
                              <div key={mi} style={{ fontSize: 11, padding: '4px 8px', marginBottom: 4, borderRadius: 4, background: m.role === 'user' ? 'rgba(223,37,64,.08)' : 'rgba(24,169,87,.05)', color: m.role === 'user' ? 'var(--c-ink)' : 'var(--c-success)' }}>{m.text}</div>
                            ))}
                            {studyFeedbackChat[ci]?.loading && <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', padding: '2px 8px' }}>Thinking...</div>}
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input value={studyFeedbackChat[ci]?.input || ''} onChange={(e) => setStudyFeedbackChat(prev => ({ ...prev, [ci]: { ...(prev[ci] || { messages: [], loading: false }), input: e.target.value } }))} onKeyDown={(e) => { if (e.key === 'Enter') sendStudyFeedbackChat(ci) }} placeholder="Fix a typo, flag a bad question, or teach Ebi how to ask better..." style={{ ...S.keyInput, flex: 1, fontSize: 10, padding: '4px 8px' }} />
                              <button onClick={() => sendStudyFeedbackChat(ci)} disabled={studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())} style={{ ...S.ghostBtn, fontSize: 9, padding: '4px 8px', opacity: (studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())) ? 0.4 : 1 }}>Reply</button>
                            </div>
                          </div>
                        )}
                        </>)}
                      </div>
                    )
                  })}
                            {/* Clear lives at the very BOTTOM so it's not mistaken for a continue/sync action */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                              <button onClick={() => {
                                setStudyCardState(prev => prev.map(cs => cs.done && cs.results.length > 0 ? { ...cs, dismissed: true } : cs))
                              }} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 11, color: 'var(--c-ink-dim)' }}>
                                {studyMode === 'conjugations' ? t('close') : 'Clear completed from list'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )
            })()}

            {/* Batch feedback — show all card results */}
            {studyPhase === 'batchFeedback' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-ink)' }}>Batch Results</div>
                  <FeedbackLegend />
                </div>
                {studyCardState.map((cs, ci) => {
                  const ratingColors = { easy: 'var(--c-success)', good: 'var(--c-brand)', hard: 'var(--c-warning)', again: 'var(--c-danger)', deleted: 'var(--c-ink-dim)' }
                  const view = cs.rating === 'deleted' ? null : studyGradedView[ci]
                  return (
                    <div key={ci} className={cs.rating === 'deleted' ? undefined : 'graded-card'} style={{ marginBottom: 16, border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden' }}>
                      {/* Whole header toggles feedback; only the HEADER highlights on hover */}
                      <div className={cs.rating === 'deleted' ? undefined : 'card-head'} onClick={() => { if (cs.rating !== 'deleted') setStudyGradedView(p => ({ ...p, [ci]: p[ci] === 'feedback' ? undefined : 'feedback' })) }}
                        style={{
                        padding: '8px 12px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, cursor: cs.rating === 'deleted' ? 'default' : 'pointer',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {cs.rating !== 'deleted' && <span style={{ fontSize: 9, color: 'var(--c-ink-faint)', flexShrink: 0 }}>{view === 'feedback' ? '▾' : '▸'}</span>}
                          {cs.front}
                        </span>
                        <span onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                        {cs.rating !== 'deleted' && (<>
                          {renderMnemonicButton(cs, ci, view === 'mnemonic')}
                        </>)}
                        {cs.rating === 'deleted' ? (
                          <span style={{ fontSize: 11, fontWeight: 700, color: ratingColors.deleted }}>DELETED</span>
                        ) : cs.noSync ? (
                          // Relaxed practice — never pushed to Anki, so no dropdown and no lock.
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: ratingColors[cs.rating] || 'var(--c-ink-dim)' }}>{(cs.rating || '').toUpperCase()}</span>
                            <span title="Practice only — not recorded in Anki" style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-purple)' }}>{t('practiceBadge')}</span>
                          </span>
                        ) : cs.synced ? (
                          // Already committed to Anki — locked so a correction can't double-answer (again→easy lapse).
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: ratingColors[cs.rating] || 'var(--c-ink-dim)' }}>{(cs.rating || '').toUpperCase()}</span>
                            <span title="Synced to Anki — locked" style={{ fontSize: 10, fontWeight: 700, color: 'var(--c-success)' }}>🔒 Synced</span>
                          </span>
                        ) : (
                          // Editable rating — changing it re-answers the card in Anki with the new ease (synced:false).
                          <select value={cs.rating || ''} onChange={(e) => {
                            const newRating = e.target.value
                            const easeMap = { easy: 4, good: 3, hard: 2, again: 1 }
                            setStudyCardState(prev => {
                              const updated = [...prev]
                              const oldRating = updated[ci].rating
                              updated[ci] = { ...updated[ci], rating: newRating, ease: easeMap[newRating] || 1, synced: false }
                              setStudyStats(s => ({ ...s, [oldRating]: Math.max(0, (s[oldRating] || 0) - 1), [newRating]: (s[newRating] || 0) + 1 }))
                              return updated
                            })
                          }} className="hover-dim" style={{ background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: ratingColors[cs.rating] || 'var(--c-ink-dim)', border: `1px solid ${ratingColors[cs.rating] || 'var(--c-border)'}44`, borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', padding: '2px 6px', cursor: 'pointer' }}>
                            <option value="easy" style={{ color: 'var(--c-success)' }}>EASY</option>
                            <option value="good" style={{ color: 'var(--c-brand)' }}>GOOD</option>
                            <option value="hard" style={{ color: 'var(--c-warning)' }}>HARD</option>
                            <option value="again" style={{ color: 'var(--c-danger)' }}>AGAIN</option>
                          </select>
                        )}
                        </span>
                      </div>
                      {view === 'mnemonic' && renderMnemonic(cs, ci)}
                      {view === 'feedback' && (<>
                      {cs.questions.map((q, qi) => renderQaRow(cs, ci, qi, `batch-${ci}-${qi}`, true))}
                      <div style={{ padding: '4px 12px', borderTop: '1px solid var(--c-border)', fontSize: 10, color: 'var(--c-ink-faint)' }}>
                        {cs.back}
                      </div>
                      {/* Feedback chat — ask follow-up questions about this card */}
                      <div style={{ padding: '6px 12px', borderTop: '1px solid var(--c-border)' }}>
                        {(studyFeedbackChat[ci]?.messages || []).map((m, mi) => (
                          <div key={mi} style={{
                            fontSize: 11, padding: '4px 8px', marginBottom: 4, borderRadius: 4,
                            background: m.role === 'user' ? 'rgba(223,37,64,.08)' : 'rgba(24,169,87,.05)',
                            color: m.role === 'user' ? 'var(--c-ink)' : 'var(--c-success)',
                          }}>
                            {m.text}
                          </div>
                        ))}
                        {studyFeedbackChat[ci]?.loading && (
                          <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', padding: '2px 8px' }}>Thinking...</div>
                        )}
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input
                            value={studyFeedbackChat[ci]?.input || ''}
                            onChange={(e) => setStudyFeedbackChat(prev => ({ ...prev, [ci]: { ...(prev[ci] || { messages: [], loading: false }), input: e.target.value } }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') sendStudyFeedbackChat(ci) }}
                            placeholder="Fix a typo, flag a bad question, or teach Ebi how to ask better..."
                            style={{ ...S.keyInput, flex: 1, fontSize: 10, padding: '4px 8px' }}
                          />
                          <button onClick={() => sendStudyFeedbackChat(ci)}
                            disabled={studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())}
                            style={{ ...S.ghostBtn, fontSize: 9, padding: '4px 8px', opacity: (studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())) ? 0.4 : 1 }}>
                            Reply
                          </button>
                        </div>
                      </div>
                      </>)}
                    </div>
                  )
                })}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button onClick={nextBatch} style={{ ...S.captureBtn, borderRadius: 6 }}>
                    {studyBatchIdx + (activeMode.studyRules?.cardsAtOnce || 3) >= (studyMode === 'conjugations' ? studyConjugationWords.length : studyAllCards.length) ? 'Finish Session' : 'Next Batch \u2192'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      {(activeTab === 'picture' || isOverlay) && <main style={isOverlay ? { ...S.main, padding: 0, background: 'transparent' } : (stage === 'idle' ? { ...S.main, display: 'flex', flexDirection: 'column' } : S.main)}>
        {/* Empty state (hidden in overlay) */}
        {stage === 'idle' && !isOverlay && (
          <div style={S.emptyState}>
            <img src={shrimpUrl(poseFile('camera'))} alt="Ebi" style={{ width: 84, height: 84, objectFit: 'contain', marginBottom: 12 }} />
            <h2 style={S.emptyTitle}>Capture, paste, drop, or upload</h2>
            <p style={S.emptyDesc}>
              Hit <kbd style={S.kbdInline}>Alt+Q</kbd> to screenshot your display,
              or paste / drag-drop any image. Your chosen AI ({providerConfig.label}) reads
              the image and translates each word in context. Hover any word for its meaning,
              pronunciation, and synonyms.
            </p>
            <div style={S.methods}>
              <div onClick={captureScreen} className="click-dim"
                style={{ ...S.methodCard, borderColor: 'rgba(223,37,64,0.2)', cursor: 'pointer' }}>
                <span style={{ color: 'var(--c-brand)', fontSize: 20 }}>📸</span>
                <span style={{ color: 'var(--c-brand)' }}>Capture Screen</span>
              </div>
              <div onClick={() => fileInputRef.current?.click()} className="click-dim"
                style={{ ...S.methodCard, borderColor: 'rgba(139,92,246,0.2)', cursor: 'pointer' }}>
                <span style={{ color: 'var(--c-purple)', fontSize: 20 }}>📁</span>
                <span style={{ color: 'var(--c-purple)' }}>Upload File</span>
              </div>
              <div onClick={pasteImageFromClipboard} className="click-dim"
                style={{ ...S.methodCard, borderColor: 'rgba(24,169,87,0.2)', cursor: 'pointer' }}>
                <span style={{ color: 'var(--c-success)', fontSize: 20 }}>📋</span>
                <span style={{ color: 'var(--c-success)' }}>Ctrl+V Paste</span>
              </div>
            </div>
          </div>
        )}

        {/* Error bar */}
        {error && (() => {
          const lcErr = error.toLowerCase()
          const isCredit = /credit|balance|quota|billing|rate.limit|limit.exceeded|insufficient.funds|too.low|429|402/.test(lcErr)
          return (
            <div style={S.errorBar}>
              <div>⚠ {error}</div>
              {isCredit && (
                <div style={S.errorActions}>
                  <a href={providerConfig.billingUrl} target="_blank" rel="noopener noreferrer" style={S.errorLink}>
                    Add credits for {providerConfig.label}
                  </a>
                  <span style={{ color: 'var(--c-ink-dim)', fontSize: 12 }}>or</span>
                  {Object.entries(PROVIDERS)
                    .filter(([key]) => key !== provider && apiKeys[key])
                    .map(([key, p]) => (
                      <button key={key} onClick={() => { setProvider(key); setError(null) }} style={{ ...S.errorSwitchBtn, color: p.color, borderColor: `${p.color}44` }}>
                        Switch to {p.label}
                      </button>
                    ))
                  }
                  {Object.entries(PROVIDERS).filter(([key]) => key !== provider && apiKeys[key]).length === 0 && (
                    <button onClick={() => { setSettingsCategory('models'); setSettingsOpen(true) }} style={S.errorSwitchBtn}>
                      Set up another provider
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* Image + overlays */}
        {screenshot && (
          <div style={isOverlay ? {} : { animation: 'fadeUp 0.25s ease', textAlign: 'center' }}>
            {/* Progress indicator */}
            {loading && !isOverlay && (
              <div style={{ ...S.progressBar, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={S.progressDot} />
                <span style={S.progressText}>{progress}</span>
                <button onClick={() => { cancelRef.current = true; setLoading(false); setStage('captured') }}
                  style={{ background: 'none', border: '1px solid var(--c-ink-faint)', color: 'var(--c-ink-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            )}
            {/* Overlay progress — floating bottom bar */}
            {loading && isOverlay && (
              <div style={{
                position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(22,27,34,0.95)', border: '1px solid var(--c-border)',
                borderRadius: 8, padding: '8px 16px', zIndex: 9999,
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'var(--c-ink-dim)', fontSize: 11,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-brand)', animation: 'pulse 1.5s ease infinite' }} />
                {progress}
                <span onClick={() => { cancelRef.current = true; setLoading(false); setStage('captured') }}
                  style={{ cursor: 'pointer', color: 'var(--c-danger)', marginLeft: 4 }}>Cancel</span>
              </div>
            )}

            {/* Image container */}
            {isOverlay && selectionViewport && selectionCrop && activeMode.areaSelectTransparent !== false ? (
              /* Transparent area-select mode: only show the cropped selection, rest is transparent */
              <div style={{
                position: 'fixed',
                left: selectionViewport.x, top: selectionViewport.y,
                width: selectionViewport.w, height: selectionViewport.h,
                borderRadius: 4, overflow: 'hidden',
                border: '2px solid rgba(223,37,64,0.4)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
              }}>
                <img src={selectionCrop.dataUrl} alt="Selection" style={{
                  display: 'block', width: '100%', height: '100%', objectFit: 'fill',
                }} />
                {/* Word overlays positioned within the crop */}
                {stage === 'done' && ocrWords.length > 0 && (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {renderWordOverlays(true)}
                  </div>
                )}
              </div>
            ) : (
            <div
              style={isOverlay
                ? (areaSelectBounds && pinnedIdx !== null)
                  ? { position: 'fixed', overflow: 'hidden',
                      left: areaSelectBounds.x, top: areaSelectBounds.y,
                      width: areaSelectBounds.width, height: areaSelectBounds.height,
                      background: '#000', borderRadius: 4,
                      border: '2px solid rgba(223,37,64,0.4)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.5)' }
                  : areaSelectBounds
                    ? { position: 'relative', overflow: 'hidden', width: '100%', height: '100%', background: '#000',
                        borderRadius: 4, border: '2px solid rgba(223,37,64,0.4)' }
                    : { position: 'relative', overflow: 'hidden', width: '100vw', height: '100vh', background: '#000' }
                : S.imageContainer}
              onClick={() => !isOverlay && stage === 'done' && ocrWords.length > 0 && setExpanded(true)}
            >
              <img src={screenshot} alt="Screenshot" style={isOverlay
                ? { display: 'block', width: '100%', height: '100%', objectFit: 'fill' }
                : S.mainImage} />

              {/* Word overlays */}
              {stage === 'done' && ocrWords.length > 0 && (
                <div style={S.overlayLayer}>{renderWordOverlays()}</div>
              )}

              {/* Analyze button overlay */}
              {stage === 'captured' && !loading && !isOverlay && (
                <div style={S.capturedOverlay}>
                  <button
                    data-analyze="true"
                    onClick={(e) => { e.stopPropagation(); analyzeImage(screenshot) }}
                    style={S.bigBtn}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ marginRight: 10 }}>
                      <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    Analyze & Translate
                  </button>
                </div>
              )}

            </div>
            )}
              {/* Expand hint (below image, hidden in overlay) */}
              {stage === 'done' && ocrWords.length > 0 && !isOverlay && (
                <div style={{ color: 'var(--c-ink-dim)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Click to expand & hover words
                </div>
              )}

            {/* Stats bar */}
            {stage === 'done' && !isOverlay && (
              <div style={S.stats}>
                <span style={S.stat}>{ocrWords.length} words</span>
                <span style={{ ...S.stat, color: 'var(--c-purple)' }}>
                  {ocrWords.filter((w) => !w.isEnglish).length} {LANGS.find((l) => l.code === language)?.label}
                </span>
                <span style={{ ...S.stat, color: 'var(--c-success)' }}>
                  {ocrWords.filter((w) => w.isEnglish).length} English
                </span>
                <span style={S.stat}>
                  avg confidence: {Math.round(ocrWords.reduce((a, w) => a + w.confidence, 0) / ocrWords.length)}%
                </span>
              </div>
            )}

            {/* Reading panel — transcribed lines, each word clickable for in-context meaning.
                Hover/click is shared with the image overlay (linked highlighting via hoveredIdx). */}
            {stage === 'done' && !isOverlay && ocrLines.length > 0 && (
              <div style={{
                maxWidth: 760, margin: '16px auto 0', textAlign: 'left',
                background: 'var(--c-surface)', border: '1px solid var(--c-border)',
                borderRadius: 12, padding: '14px 16px', boxShadow: SHADOW.md,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--c-ink-dim)', marginBottom: 10 }}>
                  Reading — tap a word for its meaning here
                </div>
                {ocrLines.map((ln, li) => (
                  <div key={li} style={{ marginBottom: 4, lineHeight: 2 }}>
                    {ln.idxs.map((wi) => {
                      const w = ocrWords[wi]
                      if (!w) return null
                      const isActive = hoveredIdx === wi || pinnedIdx === wi
                      const col = w.isEnglish ? CATEGORY_COLORS.target : (POS_COLORS[w.partOfSpeech] || POS_COLORS.other)
                      return (
                        <span key={wi}
                          onMouseEnter={(e) => handleWordHover(wi, e)}
                          onMouseLeave={handleWordLeave}
                          onClick={(e) => handleWordClick(wi, e)}
                          style={{
                            cursor: 'pointer', padding: '2px 5px', margin: '0 1px', borderRadius: 5,
                            background: isActive ? col.bg : 'transparent',
                            border: `1px solid ${isActive ? col.border : 'transparent'}`,
                            color: 'var(--c-ink)', transition: 'background .1s, border .1s',
                          }}>
                          {w.text}
                        </span>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>}

      {/* ── Expanded Fullscreen ───────────────────────────────────────────────── */}
      {expanded && (
        <div style={S.backdrop} onClick={() => { setExpanded(false); setHoveredIdx(null) }}>
          <div style={S.closeBadge}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ marginLeft: 6 }}>ESC to close</span>
          </div>
          <div style={S.expandedWrap} onClick={(e) => e.stopPropagation()}>
            <img src={screenshot} alt="Expanded" style={S.expandedImg} />
            <div style={S.overlayLayer}>{renderWordOverlays()}</div>
          </div>
        </div>
      )}

      {/* ── Chat Side Panel (split-screen) ──────────────────────────────────── */}
      {false && (
        <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: 380, background: 'var(--c-surface)', borderLeft: '1px solid var(--c-border)', zIndex: 9000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-ink)' }}>Chat</span>
            <button onClick={() => setChatSidePanel(false)} style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 8px' }}>&times;</button>
          </div>
          {chatTabAttachedDeck && (
            <div style={{ padding: '4px 12px', borderBottom: '1px solid var(--c-border)', fontSize: 10, color: 'var(--c-brand)', display: 'flex', alignItems: 'center', gap: 4 }}>
              Attached: {chatTabAttachedDeck.name} ({chatTabAttachedDeck.cards.length} cards)
              <span onClick={() => setChatTabAttachedDeck(null)} style={{ cursor: 'pointer', color: 'var(--c-ink-dim)' }}>&times;</span>
            </div>
          )}
          <div ref={chatTabScrollRef} style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
            {chatTabMsgs.length === 0 && <div style={{ textAlign: 'center', color: 'var(--c-ink-faint)', fontSize: 11, padding: 20 }}>Start a conversation...</div>}
            {chatTabMsgs.map((m, i) => (
              <div key={i} style={{ marginBottom: 8, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ maxWidth: '90%', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4, background: m.role === 'user' ? 'rgba(223,37,64,.12)' : 'var(--c-surface-alt)', border: `1px solid ${m.role === 'user' ? 'rgba(223,37,64,.2)' : 'var(--c-border)'}`, color: 'var(--c-ink)', ...(m.role === 'user' ? { whiteSpace: 'pre-wrap' } : {}) }}>
                  {m.role === 'user' ? m.content : <Markdown text={m.content} />}
                </div>
                {m.cards?.map((card, ci) => (
                  <div key={ci} style={{ maxWidth: '90%', marginTop: 4, padding: '8px 10px', borderRadius: 6, background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', fontSize: 11 }}>
                    <div style={{ fontWeight: 600, color: 'var(--c-ink)', marginBottom: 2 }}>
                      {card.front}
                      {activeMode.type === 'language' && (
                        <Pronunciation word={pronWord(card.front)} lang={learnLangName()} region={pronRegion()} config={pronunciationCfg} t={t} compact />
                      )}
                    </div>
                    <div style={{ color: 'var(--c-ink)', whiteSpace: 'pre-line', marginBottom: 4 }}>{card.back}</div>
                    {card.synced ? <span style={{ fontSize: 9, color: 'var(--c-success)' }}>✓ Added to “{chatCardDeck()}”</span> : (
                      <button onClick={() => chatTabSyncCard(card, i)} disabled={!ankiConnected}
                        style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, border: 'none', background: ankiConnected ? 'var(--c-success)' : 'var(--c-surface-sunken)', color: ankiConnected ? '#fff' : 'var(--c-ink-dim)', cursor: ankiConnected ? 'pointer' : 'not-allowed' }}>
                        + Add to “{chatCardDeck()}”
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ))}
            {chatTabLoading && <div style={{ fontSize: 11, color: chatTabStatus === 'searching' ? 'var(--c-brand)' : 'var(--c-ink-dim)', padding: '4px 0' }}>
              {chatTabStatus === 'searching' ? 'Searching the web...' : chatTabStatus === 'search-done' ? 'Analyzing results...' : 'Thinking...'}
            </div>}
          </div>
          <div style={{ padding: '8px 12px', borderTop: '1px solid var(--c-border)' }}>
            {!chatTabAttachedDeck && ankiConnected && (
              <select value="" onChange={(e) => { if (e.target.value) chatTabAttachDeck(e.target.value) }} style={{ ...S.select, fontSize: 9, padding: '2px 4px', marginBottom: 4, width: '100%' }}>
                <option value="">Attach deck...</option>
                {ankiDecks.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
            <div style={{ display: 'flex', gap: 4 }}>
              <input value={chatTabInput} onChange={(e) => setChatTabInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatTabMessage() } }} placeholder="Ask anything..." style={{ ...S.keyInput, flex: 1, fontSize: 11, padding: '8px 10px' }} disabled={chatTabLoading} />
              <button onClick={sendChatTabMessage} disabled={chatTabLoading || !chatTabInput.trim()} style={{ ...S.captureBtn, borderRadius: 4, fontSize: 10, opacity: chatTabLoading || !chatTabInput.trim() ? 0.5 : 1 }}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tooltip ──────────────────────────────────────────────────────────── */}
      {activeWord && (() => {
        const hasExpanded = isPinned && (deepExplanation || wordStudy || chatMessages.length > 0)
        const hoverTransform = tooltipPos.anchor === 'below'
          ? 'translate(-50%, 0)' // tooltip below word
          : 'translate(-50%, -100%)' // tooltip above word (default)
        // Keep the pinned popup fully on-screen: clamp its top-left to the viewport (in layout
        // px, accounting for body zoom) and let it scroll if the content is taller than the screen.
        const ttZoom = getZoom()
        const estW = hasExpanded ? 520 : 340
        const estH = hasExpanded ? 580 : 460
        const vw = (typeof window !== 'undefined' ? window.innerWidth : 1280) / ttZoom
        const vh = (typeof window !== 'undefined' ? window.innerHeight : 800) / ttZoom
        const maxH = Math.round(vh - 20)
        // estH is only a guess — the real content (explanation + generated card) can be much
        // taller. So besides clamping the top, cap maxHeight to the space BELOW the clamped top:
        // the popup then always ends ≥10px above the screen edge and scrolls internally instead
        // of getting cut off at the bottom.
        const clampedTop = Math.max(10, Math.min(pinnedTooltipPos?.y ?? 10, vh - estH - 10))
        const pinnedStyle = isPinned && pinnedTooltipPos
          ? { ...S.tooltip, ...S.tooltipExpanded,
              left: Math.max(10, Math.min(pinnedTooltipPos.x, vw - estW - 10)),
              top: clampedTop,
              transform: 'none', maxHeight: Math.min(maxH, Math.round(vh - clampedTop - 10)), overflowY: 'auto',
              ...(hasExpanded ? { maxWidth: 900, width: 500 } : { maxWidth: 400, width: 'auto', minWidth: 300 }),
            }
          : isPinned
            ? { ...S.tooltip, ...S.tooltipExpanded, maxHeight: maxH, overflowY: 'auto', ...(hasExpanded ? { maxWidth: 900, width: '92vw' } : { maxWidth: 400, width: 'auto' }) }
            : null
        const tooltipStyle = pinnedStyle || { ...S.tooltip, left: tooltipPos.x, top: tooltipPos.y, transform: hoverTransform }
        return (
        <>
        {isPinned && !isOverlay && (
          <div style={S.tooltipBackdrop} onClick={dismissPin} />
        )}
        <div data-tooltip-pinned={isPinned || undefined} style={tooltipStyle} onClick={(e) => e.stopPropagation()}>
          {/* Drag handle for pinned tooltip */}
          {isPinned && (
            <div
              onMouseDown={handleTooltipDragStart}
              style={{ cursor: 'grab', padding: '2px 0 4px', display: 'flex', justifyContent: 'center', userSelect: 'none' }}
            >
              <div style={{ width: 32, height: 4, borderRadius: 2, background: '#3a4050' }} />
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={S.ttWord}>{activeWord.text}</div>
              {activeWord.pronunciation && (
                <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', fontStyle: 'italic', marginBottom: 2 }}>/{activeWord.pronunciation}/</div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {(() => {
                const posColor = POS_COLORS[activeWord.partOfSpeech] || POS_COLORS.other
                const catColor = CATEGORY_COLORS[activeWord.category]
                const showCat = activeWord.category === 'name'
                const tagColor = showCat ? catColor : posColor
                const tagLabel = showCat ? 'Name' : posColor.label
                return tagLabel ? (
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: tagColor.text, background: tagColor.bg, border: `1px solid ${tagColor.border}`, padding: '2px 6px', borderRadius: 3 }}>
                    {tagLabel}
                  </span>
                ) : null
              })()}
              {isPinned && (
                <span onClick={dismissPin} style={S.ttClose}>&times;</span>
              )}
            </div>
          </div>
          {activeWord.translation && (
            <div style={S.ttTrans}>→ {activeWord.translation}</div>
          )}
          {/* In-context meaning (green) + other senses (purple), like the Study legend */}
          {activeWord.sense && (
            <div style={{ fontSize: 12, color: 'var(--c-success)', fontWeight: 600, marginBottom: activeWord.alts?.length ? 2 : 6 }}>
              {activeWord.sense}
            </div>
          )}
          {activeWord.alts?.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--c-purple)', marginBottom: 6 }}>
              also: {activeWord.alts.join(' · ')}
            </div>
          )}
          {activeWord.category === 'name' && (
            <div style={{ fontSize: 11, color: 'var(--c-success)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>Name / Proper Noun</div>
          )}
          {activeWord.category === 'target' && (
            <div style={S.ttEng}>{LANGS.find((l) => l.code === targetLang)?.label || 'Target Language'}</div>
          )}
          {activeWord.synonyms?.length > 0 && (
            <div style={S.ttSynWrap}>
              <div style={S.ttSynLabel}>Synonyms</div>
              <div style={S.ttSynList}>
                {activeWord.synonyms.map((s, i) => (
                  <span key={i} style={S.ttSynChip}>{s}</span>
                ))}
              </div>
            </div>
          )}
          {activeWord.confidence < 100 && (
            <div style={S.ttConf}>OCR confidence: {Math.round(activeWord.confidence)}%</div>
          )}

          {/* Pinned: actions */}
          {isPinned && (
            <div style={S.ttActions}>
              {/* Primary button row — always visible when pinned */}
              <div style={S.ttBtnRow}>
                {!explanation && (
                  <button
                    onClick={() => autoExplain(activeWord)}
                    disabled={explaining}
                    style={{ ...S.ttDeepBtn, opacity: explaining ? 0.5 : 1 }}
                  >
                    {explaining ? 'Thinking...' : 'Explain'}
                  </button>
                )}
                {!ankiCard && !ankiSynced[activeIdx] && (
                  <button
                    onClick={() => generateAnkiCard(activeWord)}
                    disabled={ankiGenerating}
                    style={{ ...S.ttAnkiBtn, opacity: ankiGenerating ? 0.5 : 1 }}
                  >
                    {ankiGenerating ? 'Generating...' : 'Generate Anki Card'}
                  </button>
                )}
              </div>

              {/* Explanation result */}
              {explaining && !explanation && (
                <div style={S.ttExplaining}>
                  <div style={S.ttExplainingDot} />
                  Thinking...
                </div>
              )}
              {explanation && (
                <div style={S.ttExplanation}>{explanation}</div>
              )}

              {/* Secondary buttons — after explanation */}
              {explanation && (
                <div style={S.ttBtnRow}>
                  {!deepExplanation && (
                    <button
                      onClick={() => deepExplain(activeWord)}
                      disabled={deepExplaining}
                      style={{ ...S.ttDeepBtn, opacity: deepExplaining ? 0.5 : 1 }}
                    >
                      {deepExplaining ? 'Thinking...' : `Explain further (${modelNick(resolveModel('picture'))})`}
                    </button>
                  )}
                  {!wordStudy && (
                    <button
                      onClick={() => fetchWordStudy(activeWord)}
                      disabled={wordStudyLoading}
                      style={{ ...S.ttStudyBtn, opacity: wordStudyLoading ? 0.5 : 1 }}
                    >
                      {wordStudyLoading ? 'Loading...' : `Study "${activeWord.text}"`}
                    </button>
                  )}
                  {!conjugation && (activeWord.partOfSpeech === 'verb' || activeWord.partOfSpeech === 'noun' || activeWord.partOfSpeech === 'adj') && (
                    <button
                      onClick={() => fetchConjugation(activeWord)}
                      disabled={conjugationLoading}
                      style={{ ...S.ttDeepBtn, opacity: conjugationLoading ? 0.5 : 1, background: 'rgba(17,168,160,.12)', color: 'var(--c-teal)', borderColor: 'rgba(17,168,160,.25)' }}
                    >
                      {conjugationLoading ? 'Loading...' : 'Conjugate'}
                    </button>
                  )}
                </div>
              )}

              {/* Anki generating spinner */}
              {ankiGenerating && (
                <div style={S.ttExplaining}>
                  <div style={S.ttExplainingDot} />
                  Generating Anki card...
                </div>
              )}

              {/* Anki card preview */}
              {ankiCard && !ankiSynced[activeIdx] && (
                <div style={S.ttAnkiCard}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={S.ttAnkiCardLabel}>Front</div>
                    <button
                      onClick={() => {
                        if (ankiEditing) {
                          setAnkiCard({ ...ankiCard, front: ankiEditFront, back: ankiEditBack })
                          setAnkiEditing(false)
                        } else {
                          setAnkiEditFront(ankiCard.front)
                          setAnkiEditBack(ankiCard.back)
                          setAnkiEditing(true)
                        }
                      }}
                      style={{ background: 'none', border: '1px solid var(--c-border)', color: ankiEditing ? 'var(--c-success)' : 'var(--c-ink-dim)', borderRadius: 4, padding: '2px 8px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {ankiEditing ? 'Save' : 'Edit'}
                    </button>
                  </div>
                  {ankiEditing ? (
                    <textarea
                      value={ankiEditFront}
                      onChange={(e) => setAnkiEditFront(e.target.value)}
                      style={{ ...S.ttAnkiCardContent, width: '100%', minHeight: 36, resize: 'vertical', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: 'var(--c-ink)', border: '1px solid var(--c-border)', borderRadius: 4, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <div style={S.ttAnkiCardContent}>{ankiCard.front}</div>
                  )}
                  <div style={S.ttAnkiCardLabel}>Back</div>
                  {ankiEditing ? (
                    <textarea
                      value={ankiEditBack}
                      onChange={(e) => setAnkiEditBack(e.target.value)}
                      style={{ ...S.ttAnkiCardContent, width: '100%', minHeight: 80, resize: 'vertical', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: 'var(--c-ink)', border: '1px solid var(--c-border)', borderRadius: 4, padding: '6px 8px', fontSize: 12, fontFamily: 'inherit', whiteSpace: 'pre-line', boxSizing: 'border-box' }}
                    />
                  ) : (
                    <div style={{ ...S.ttAnkiCardContent, whiteSpace: 'pre-line', marginBottom: 4 }}>{ankiCard.back}</div>
                  )}
                  {ankiCard.tags?.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={S.ttAnkiCardLabel}>Tags</div>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {ankiCard.tags.map((tag, i) => (
                          <span key={i} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'rgba(125,133,144,.15)', color: 'var(--c-ink)', border: '1px solid rgba(125,133,144,.2)' }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* AI refine input */}
                  <div style={{ marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={ankiRefineInput}
                        onChange={(e) => setAnkiRefineInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') refineAnkiCard() }}
                        placeholder='e.g. "Say football instead of soccer"'
                        style={{ flex: 1, background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: 'var(--c-ink)', border: '1px solid var(--c-border)', borderRadius: 4, padding: '4px 8px', fontSize: 11, fontFamily: 'inherit', outline: 'none' }}
                      />
                      <button
                        onClick={refineAnkiCard}
                        disabled={ankiRefining || !ankiRefineInput.trim()}
                        style={{ background: 'rgba(139,92,246,.15)', color: 'var(--c-purple)', border: '1px solid rgba(139,92,246,.3)', borderRadius: 4, padding: '4px 10px', fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', opacity: (ankiRefining || !ankiRefineInput.trim()) ? 0.4 : 1 }}
                      >
                        {ankiRefining ? 'Refining...' : 'Refine'}
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>Deck:</span>
                    {ankiDecks.length > 0 ? (
                      <select
                        value={ankiDeck}
                        onChange={(e) => setAnkiDeck(e.target.value)}
                        style={{ background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: 'var(--c-brand)', border: '1px solid rgba(223,37,64,.3)', borderRadius: 4, padding: '2px 4px', fontSize: 10, fontFamily: 'inherit' }}
                      >
                        {ankiDecks.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <strong style={{ color: 'var(--c-brand)' }}>{ankiDeck}</strong>
                    )}
                    {ankiConnected === false && <span style={{ color: 'var(--c-warning)' }}>(offline)</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => syncToAnki(activeIdx)}
                      disabled={ankiSyncing || ankiConnected === false}
                      style={{ ...S.ttAnkiSyncBtn, opacity: (ankiSyncing || ankiConnected === false) ? 0.4 : 1 }}
                    >
                      {ankiSyncing ? 'Syncing...' : 'Sync to Anki'}
                    </button>
                    {ankiConnected === false && (
                      <span style={{ fontSize: 10, color: 'var(--c-warning)' }}>Start Anki to sync</span>
                    )}
                  </div>
                  {ankiError && (
                    <div style={S.ttAnkiWarning}>{ankiError}</div>
                  )}
                </div>
              )}
              {ankiSynced[activeIdx] && (
                <div style={{ ...S.ttAnkiCard, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={S.ttAnkiSynced}>Synced to Anki ({ankiDeck})</span>
                </div>
              )}

              {/* Deep explanation */}
              {deepExplaining && !deepExplanation && (
                <div style={{ ...S.ttExplaining, marginTop: 8 }}>
                  <div style={S.ttExplainingDot} />
                  {modelNick(resolveModel('picture'))} is thinking...
                </div>
              )}
              {deepExplanation && (
                <div style={S.ttDeepExplanation}>{deepExplanation}</div>
              )}

              {/* Word study */}
              {wordStudyLoading && !wordStudy && (
                <div style={{ ...S.ttExplaining, marginTop: 8 }}>
                  <div style={S.ttExplainingDot} />
                  Loading word study...
                </div>
              )}
              {wordStudy && (
                <div style={S.ttWordStudy}>
                  <div style={S.ttWordStudyHeader}>
                    Word Study: {activeWord.text}
                  </div>
                  <div style={S.ttWordStudyBody}>
                    <FormattedText text={wordStudy} accentColor="var(--c-success)" />
                  </div>
                </div>
              )}

              {/* Conjugation */}
              {conjugationLoading && !conjugation && (
                <div style={{ ...S.ttExplaining, marginTop: 8 }}>
                  <div style={S.ttExplainingDot} />
                  Loading conjugations...
                </div>
              )}
              {conjugation && (
                <div style={{ marginTop: 8, border: '1px solid rgba(17,168,160,.2)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-teal)', background: 'rgba(17,168,160,.08)', padding: '8px 10px', borderBottom: '1px solid rgba(17,168,160,.15)' }}>
                    Conjugations: {activeWord.text}
                  </div>
                  <div style={{ padding: '14px 16px', background: 'rgba(17,168,160,.03)' }}>
                    <FormattedText text={conjugation} accentColor="var(--c-teal)" />
                  </div>
                </div>
              )}

              {/* Chat section */}
              {explanation && (
                <div style={S.ttChatSection}>
                  <div style={S.ttChatLabel}>Ask about this word</div>
                  {chatMessages.map((m, i) => (
                    <div key={i} style={m.role === 'user' ? S.ttChatUser : S.ttChatAssistant}>
                      {m.text}
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ ...S.ttExplaining, marginTop: 4 }}>
                      <div style={S.ttExplainingDot} />
                      Typing...
                    </div>
                  )}
                  <div style={S.ttChatInputRow}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendChat(activeWord) }}
                      placeholder="e.g. How do I conjugate this?"
                      style={S.ttChatInput}
                    />
                    <button
                      onClick={() => sendChat(activeWord)}
                      disabled={chatLoading || !chatInput.trim()}
                      style={{ ...S.ttChatSend, opacity: chatLoading || !chatInput.trim() ? 0.4 : 1 }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!isPinned && (
            <div style={S.ttClickHint}>Click to pin & explore</div>
          )}
        </div>
        </>
        )
      })()}

      {/* ── Global Styles ────────────────────────────────────────────────────── */}
      <style>{`
        /* ── Theme palettes (flip via <html data-theme="dark">) ───────── */
        :root {
          color-scheme: light; /* native controls (select popups, scrollbars) match light theme */
          --c-brand: #DF2540; --c-brand-dark: #C00A29; --c-brand-soft: #FF5468;
          --c-bg: #F2F5F8; --c-bg-grad1: rgba(223,37,64,.05); --c-bg-grad2: rgba(17,168,160,.045);
          --c-surface: #FFFFFF; --c-surface-alt: #EAEEF2; --c-surface-sunken: #F5F8FA;
          --c-border: #E2E8ED; --c-border-strong: #CDD7DE;
          --c-ink: #16242C; --c-ink-dim: #51626C; --c-ink-faint: #8A99A3;
          --c-on-brand: #FFFFFF;
          --c-glass: rgba(255,255,255,.82); --c-glass-strong: rgba(255,255,255,.97);
          --c-teal: #11A8A0; --c-teal-dark: #0C857F;
          /* Light-mode semantic colors run DEEPER than dark mode's: at small sizes on the light
             background, #18A957 green and #E8930C amber shared the same luminance and blended. */
          --c-success: #0E8746; --c-warning: #B36A00; --c-danger: #D32F24; --c-info: #2D86C9; --c-purple: #7C4DEF;
          --sh-sm: 0 1px 2px rgba(16,36,44,.06); --sh-md: 0 4px 14px rgba(16,36,44,.08);
          --sh-lg: 0 12px 32px rgba(16,36,44,.10); --sh-xl: 0 24px 60px rgba(16,36,44,.16);
          --sh-brand: 0 6px 18px rgba(223,37,64,.28);
        }
        [data-theme="dark"] {
          color-scheme: dark; /* dark native select popups + scrollbars */
          --c-brand: #FF4D63; --c-brand-dark: #C81F38; --c-brand-soft: #FF6F80;
          --c-bg: #0E1419; --c-bg-grad1: rgba(255,77,99,.07); --c-bg-grad2: rgba(17,168,160,.06);
          --c-surface: #18222B; --c-surface-alt: #202C36; --c-surface-sunken: #131C24;
          --c-border: #2A3742; --c-border-strong: #3A4955;
          --c-ink: #E8EEF2; --c-ink-dim: #A2B0BB; --c-ink-faint: #6E808C;
          --c-on-brand: #FFFFFF;
          --c-glass: rgba(20,28,35,.78); --c-glass-strong: rgba(22,30,38,.96);
          --c-teal: #2BC4BB; --c-teal-dark: #17A8A0;
          --c-success: #3BC873; --c-warning: #F2A93A; --c-danger: #FF5A4E; --c-info: #4FA3E0; --c-purple: #A684F7;
          --sh-sm: 0 1px 2px rgba(0,0,0,.4); --sh-md: 0 4px 14px rgba(0,0,0,.5);
          --sh-lg: 0 12px 32px rgba(0,0,0,.55); --sh-xl: 0 24px 60px rgba(0,0,0,.65);
          --sh-brand: 0 6px 18px rgba(255,77,99,.35);
        }
        html, body { background: var(--c-bg); }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pop {
          0% { opacity: 0; transform: scale(.85); }
          60% { transform: scale(1.04); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes floaty {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(223,37,64,0); }
          50% { box-shadow: 0 0 18px 2px rgba(223,37,64,.28); }
        }
        @keyframes spin360 { to { transform: rotate(360deg); } }

        /* ── Ocean Light scrollbars ──────────────────────────────────── */
        * { scrollbar-width: thin; scrollbar-color: var(--c-border-strong) transparent; }
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: var(--c-border-strong);
          border-radius: 8px; border: 2px solid transparent; background-clip: padding-box;
        }
        ::-webkit-scrollbar-thumb:hover { background: var(--c-border-strong); background-clip: padding-box; }

        ::selection { background: rgba(223,37,64,.20); color: var(--c-ink); }

        /* ── Interactive polish — geometry-safe (no transform on click) ─ */
        button { transition: box-shadow .18s ease, filter .18s ease, background .18s ease, border-color .18s ease, color .18s ease, transform .08s ease; }
        button:hover:not(:disabled) { filter: brightness(1.04) saturate(1.03); }
        button:active:not(:disabled) { filter: brightness(.97); }
        button:disabled { cursor: not-allowed; opacity: .55; }

        /* Images are decorative (mascot, icons) — never let them start a native drag, which would
           otherwise trip the "Drop image here" file-drop overlay. The overlay is for OS file drags. */
        img { -webkit-user-drag: none; -khtml-user-drag: none; user-select: none; }

        /* Duolingo-style 3D press: add className "btn-press" to primary CTAs */
        .btn-press:active:not(:disabled) { transform: translateY(2px); box-shadow: none !important; }

        /* GLOBAL: every selectable control darkens slightly on hover — the standard "this is
           clickable" cue — in BOTH themes, every panel. An inset overlay darkens whatever
           background the control has. Controls with an intentional inline box-shadow (solid
           CTAs) keep it (inline wins), and the active nav tab is exempt (already selected).
           Dark surfaces need a stronger black to register. */
        button:not(:disabled):not(.ui-tab-current):hover,
        select:not(:disabled):hover,
        input[type="checkbox"]:not(:disabled):hover {
          box-shadow: inset 0 0 0 999px rgba(0, 0, 0, .08);
          filter: brightness(.97);
        }
        [data-theme="dark"] button:not(:disabled):not(.ui-tab-current):hover,
        [data-theme="dark"] select:not(:disabled):hover,
        [data-theme="dark"] input[type="checkbox"]:not(:disabled):hover {
          box-shadow: inset 0 0 0 999px rgba(0, 0, 0, .26);
          filter: brightness(.92);
        }

        /* Ghost/action buttons: SUBTLE hover — the border gently deepens toward the button's own
           accent color (half strength). No ring, no brightness, no movement. */
        .ui-btn { transition: border-color .15s ease; }
        .ui-btn:not(:disabled):hover {
          border-color: color-mix(in srgb, currentColor 55%, transparent) !important;
        }

        /* Wrong typed answer (hint retry) — the input row shakes once */
        @keyframes shake { 0%,100% { transform: translateX(0) } 20% { transform: translateX(-6px) } 40% { transform: translateX(6px) } 60% { transform: translateX(-4px) } 80% { transform: translateX(4px) } }
        .study-shake { animation: shake .35s ease; }

        /* Instant hover tooltip (the native title attribute has a ~1s delay and reads as dead).
           Usage: <span className="tip" data-tip="explanation">ⓘ</span> */
        .tip { position: relative; cursor: help; }
        .tip:hover::after {
          content: attr(data-tip);
          position: absolute; left: 50%; bottom: calc(100% + 7px); transform: translateX(-50%);
          width: max-content; max-width: 240px; padding: 7px 10px; border-radius: 8px;
          background: var(--c-ink); color: var(--c-bg);
          font-size: 10.5px; font-weight: 600; line-height: 1.45;
          text-transform: none; letter-spacing: 0; white-space: normal; text-align: left;
          box-shadow: 0 4px 14px rgba(0,0,0,.35); z-index: 80; pointer-events: none;
          animation: fadeIn .12s ease;
        }
        .tip:hover::before {
          content: ''; position: absolute; left: 50%; bottom: calc(100% + 2px); transform: translateX(-50%);
          border: 5px solid transparent; border-top-color: var(--c-ink); z-index: 80; pointer-events: none;
        }

        /* Top navigation tabs: gentle float-up on hover (vertical only, no click shrink).
           The lift is on an INNER span, not the button, so the button's hover hit-box never
           moves out from under the cursor — otherwise the lift triggers mouseleave→enter shake. */
        .ui-tab { transition: color .18s ease, background .18s ease, box-shadow .18s ease; }
        .ui-tab-inner { display: inline-block; transition: transform .16s cubic-bezier(.34,1.56,.64,1); }
        .ui-tab:hover .ui-tab-inner { transform: translateY(-2px); }
        /* The ACTIVE tab is already "chosen" — it must not invite a click by lifting on hover */
        .ui-tab-current:hover .ui-tab-inner { transform: none; }
        .ui-tab-current { cursor: default; }

        input, select, textarea { transition: border-color .16s ease, box-shadow .16s ease, background .16s ease; }
        input:focus, select:focus, textarea:focus {
          border-color: var(--c-brand) !important;
          box-shadow: 0 0 0 3px rgba(223,37,64,.18);
        }
        input::placeholder, textarea::placeholder { color: var(--c-ink-faint); }

        a { transition: color .15s ease, filter .15s ease; color: var(--c-brand); }
        a:hover { filter: brightness(1.08); }

        /* Tappable words in study questions — lift + highlight on hover. The lift lives on an
           inner span so the outer hit-box stays put (no mouseleave→enter shake at the edges). */
        .study-word-inner { transition: transform .14s cubic-bezier(.34,1.56,.64,1), color .14s ease, border-color .14s ease; }
        /* Tappable words carry NO resting underline (a page of dotted red read like a spellchecker
           meltdown) — the affordance appears on hover: lift, brand color, and the underline. */
        .study-word:hover .study-word-inner {
          transform: translateY(-3px);
          color: var(--c-brand);
          border-bottom: 1px dotted rgba(223,37,64,.85);
          margin-bottom: -1px; /* the border must not shift the line's layout */
        }

        /* Deck browser rows — highlight on hover */
        .deck-row:hover { border-color: rgba(223,37,64,.35) !important; background: rgba(223,37,64,.05) !important; }

        /* Same darken for clickable NON-button elements (divs with onClick, e.g. the Picture
           entry tiles) — opt in with this class. */
        .click-dim { transition: box-shadow .15s ease; }
        .click-dim:hover { box-shadow: inset 0 0 0 999px rgba(0, 0, 0, .08); }
        [data-theme="dark"] .click-dim:hover { box-shadow: inset 0 0 0 999px rgba(0, 0, 0, .26); }

        /* Graded-card TOP header only: slightly darker on hover (settings-style, theme-tuned).
           NOT while hovering a control inside it (memory hook / sound / rating select) — those
           must never sit on a darkened backdrop — and the question rows inside never darken. */
        .card-head { transition: box-shadow .15s ease; }
        .card-head:hover:not(:has(button:hover, select:hover)) { box-shadow: inset 0 0 0 999px rgba(0, 0, 0, .08); }
        [data-theme="dark"] .card-head:hover:not(:has(button:hover, select:hover)) { box-shadow: inset 0 0 0 999px rgba(0, 0, 0, .26); }

        /* Chat session sidebar items — highlight on hover */
        .chat-session:hover { background: rgba(223,37,64,.06) !important; }

        /* Suggestion / pill chips — lift + glow on hover (lift on inner span; see .ui-tab note) */
        .chip:hover { border-color: rgba(223,37,64,.45) !important; color: var(--c-brand) !important; }
        .chip { transition: border-color .16s ease, color .16s ease, background .16s ease; }
        .chip-inner { display: inline-block; transition: transform .14s ease; }
        .chip:hover .chip-inner { transform: translateY(-1px); }

        /* Rendered markdown (chat + help messages). Themed via CSS vars so it flips with the theme. */
        .md-body { color: var(--c-ink); word-break: break-word; }
        .md-body > :first-child { margin-top: 0; }
        .md-body > :last-child { margin-bottom: 0; }
        .md-body p { margin: 0 0 8px; }
        .md-body h1, .md-body h2, .md-body h3, .md-body h4 { margin: 10px 0 6px; line-height: 1.25; font-family: ${FONT.display}; font-weight: 700; }
        .md-body h1 { font-size: 1.3em; }
        .md-body h2 { font-size: 1.18em; }
        .md-body h3 { font-size: 1.06em; }
        .md-body h4 { font-size: 1em; }
        .md-body ul, .md-body ol { margin: 4px 0 8px; padding-left: 1.3em; }
        .md-body li { margin: 2px 0; }
        .md-body li > p { margin: 0; }
        .md-body a { color: var(--c-brand); text-decoration: underline; }
        .md-body strong { font-weight: 700; }
        .md-body em { font-style: italic; }
        .md-body code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .9em; background: var(--c-surface-sunken); border: 1px solid var(--c-border); border-radius: 4px; padding: 1px 4px; }
        .md-body pre { background: var(--c-surface-sunken); border: 1px solid var(--c-border); border-radius: 8px; padding: 10px 12px; overflow: auto; margin: 6px 0 8px; }
        .md-body pre code { background: none; border: none; padding: 0; }
        .md-body blockquote { margin: 6px 0; padding: 2px 0 2px 12px; border-left: 3px solid var(--c-border); color: var(--c-ink-dim); }
        .md-body hr { border: none; border-top: 1px solid var(--c-border); margin: 10px 0; }
        .md-body table { border-collapse: collapse; margin: 6px 0; }
        .md-body th, .md-body td { border: 1px solid var(--c-border); padding: 4px 8px; }
      `}</style>

      {/* Floating AI Help Button */}
      {modelHealNotice && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10001,
          background: C.surface, border: `1px solid ${C.successTint}`, borderRadius: RADIUS.md,
          padding: '10px 14px', fontSize: 12, color: C.success, maxWidth: 420, fontWeight: 600,
          boxShadow: SHADOW.lg, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ flex: 1 }}>🔧 {modelHealNotice}</span>
          <span onClick={() => setModelHealNotice(null)} style={{ cursor: 'pointer', color: C.inkFaint }}>×</span>
        </div>
      )}

      {/* AI request error (out of credits / rate limit / bad key) — stays until dismissed */}
      {aiErrorNotice && (
        <div style={{
          position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10001,
          background: C.surface, border: `1px solid ${C.danger}`, borderRadius: RADIUS.md,
          padding: '12px 16px', fontSize: 13, color: C.danger, maxWidth: 460, fontWeight: 600,
          boxShadow: SHADOW.lg, display: 'flex', alignItems: 'center', gap: 10,
          animation: 'slideUp .25s ease',
        }}>
          <span style={{ fontSize: 15 }}>⚠️</span>
          <span style={{ flex: 1, lineHeight: 1.45 }}>{aiErrorNotice}</span>
          <span onClick={() => setAiErrorNotice(null)} style={{ cursor: 'pointer', color: C.danger, fontSize: 15, lineHeight: 1 }}>×</span>
        </div>
      )}

      {!isOverlay && configLoaded && onboarded && <HelpChat
        apiKey={apiKey}
        provider={provider}
        mascotFile={helpMascot}
        onAiReply={(text) => choosePose(text, setHelpMascot)}
        askEbiSignal={askEbiSignal}
        hideButton={true}
        model={resolveModel('help')}
        askAI={(sys, content) => aiCall(apiKey, sys, content, resolveModel('help'), { maxTokens: 600 })}
        onAction={(action) => {
          // Ebi's Help can make real adjustments: save a question-style preference to the mode.
          if (action?.type === 'question_preference' && action.preference) {
            const modeId = activeModeIdRef.current
            const pref = String(action.preference).trim().slice(0, 300)
            const targetMode = modesRef.current.find((mm) => mm.id === modeId)
            const sr = targetMode?.studyRules || {}
            const prevPrefs = Array.isArray(sr.questionPreferences) ? sr.questionPreferences : []
            if (pref && !prevPrefs.includes(pref)) {
              updateModeById(modeId, { studyRules: { ...sr, questionPreferences: [...prevPrefs, pref].slice(-12) } })
              console.log('[Help] saved question-style preference:', pref)
            }
          }
        }}
        appContext={{
        activeTab,
        activeMode: { name: activeMode.name, type: activeMode.type, ankiDeck: activeMode.ankiDeck },
        ocrWords: ocrWords.map(w => ({ text: w.text, translation: w.translation })),
        activeWord: activeWord ? { text: activeWord.text, translation: activeWord.translation, pronunciation: activeWord.pronunciation, definition: activeWord.definition, synonyms: activeWord.synonyms, example: activeWord.example } : null,
        explanation,
        deepExplanation,
        ankiConnected,
        ankiDecks,
        ankiCard,
        studyActive,
        studyDeck,
        studyPhase,
        studyStats,
        studyDeckStats,
        // The LIVE question (the old lookup used the legacy studyQueue, which is always empty in
        // the continuous system — Ebi's Help never saw what was on screen).
        currentQuestion: (() => {
          if (!studyActive || !currentQuestion) return null
          const cs = studyCardState[currentQuestion.cardIdx]
          const q = cs?.questions?.[currentQuestion.questionIdx]
          if (!q) return null
          return {
            question: getQuestionText(q), type: q.type,
            number: currentQuestion.questionIdx + 1, of: cs.questions.length,
            cardFront: cs.front, cardBack: String(cs.back || '').slice(0, 300),
            acceptedAnswers: q.acceptedAnswers || [],
            choices: Array.isArray(q.choices) ? q.choices : undefined,
          }
        })(),
        studySession: studyActive ? {
          studyMode, answerStyle: studyAnswerStyle,
          completed: studyCardState.filter((c) => c.done).length,
          activeCards: studyCardState.filter((c) => !c.done).length,
          poolRemaining: Math.max(0, (studyMode === 'conjugations' ? studyConjugationWords.length : studyAllCards.length) - studyBatchIdx),
          learning: activeMode.studyRules?.studyLanguage || null,
          ebiSpeaks: activeMode.studyRules?.quizLanguage || null,
          questionPreferences: activeMode.studyRules?.questionPreferences || [],
          gradedRecent: studyCardState.filter((c) => c.done && c.rating).slice(-5).map((c) => ({ front: c.front, rating: c.rating })),
        } : null,
        deckBrowser: deckBrowserActive ? { deck: deckBrowserDeck, cards: deckBrowserNotes.length } : null,
        discover: activeTab === 'discover' ? { started: discoverStarted, level: discoverProfile?.level?.estimate || null, deck: discoverDeck || ankiDeck } : null,
        chatTabMsgs: chatTabMsgs.slice(-5).map(m => ({ role: m.role, content: m.content?.slice(0, 200) })),
        language,
        targetLang,
        screenshot: !!screenshot,
        stage,
        // Smaller cap than elsewhere: help replies are capped at 600 tokens and fire often.
        // Big books contribute their TOC so Ebi still knows what the material covers.
        knowledge: knowledgeRaw(12000),
      }} />}
    </div>
  )
}

