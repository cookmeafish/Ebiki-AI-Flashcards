import { useState, useRef, useCallback, useEffect } from 'react'
import Tesseract from 'tesseract.js'
import { TRANSLATE_PROMPT, POS_COLORS, CATEGORY_COLORS } from './config/prompts'
import { PROVIDERS } from './config/providers'
import { LANGS } from './config/languages'
import { makeT, APP_LANGUAGES } from './i18n'
import { pickShrimp, shrimpUrl, DEFAULT_SHRIMP, IDLE_SHRIMP, POSE_NAMES, poseFile } from './config/shrimp'
import { C, RADIUS, SHADOW, FONT } from './config/tokens'
import FormattedText from './components/FormattedText'
import HelpChat from './components/HelpChat'
import DiscoverPanel from './components/DiscoverPanel'
import SettingsModal from './components/SettingsModal'
import OnboardingWizard from './components/OnboardingWizard'
import { S } from './styles/theme'
import { ocrLog, ocrLogTable, ocrLogFlush } from './utils/logger'
import { ankiPing, ankiGetDecks, ankiCreateDeck, ankiAddNote, ankiFindCards, ankiCardsInfo, ankiAnswerCards, ankiGetDeckStats, ankiFindNotes, ankiNotesInfo, ankiUpdateNote, ankiDeleteNotes, ankiSync } from './utils/anki'
import { readBlob, writeBlob, DEFAULT_LEDGER } from './discover/storage'
import { buildProfilePrompt, buildSuggestionPrompt, buildVerifyPrompt } from './discover/prompts'

// App-language code → English name, for prompting the AI to reply in the user's language.
const APP_LANG_NAME = { en: 'English', es: 'Spanish', zh: 'Chinese', ja: 'Japanese' }

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
  const [selectionMode, setSelectionMode] = useState(false)
  const [selRect, setSelRect] = useState(null) // { x1, y1, x2, y2 } in viewport coords
  const [selectionOffset, setSelectionOffset] = useState(null) // { x, y } in full-image pixels
  const [selectionViewport, setSelectionViewport] = useState(null) // { x, y, w, h } in viewport px
  const [selectionCrop, setSelectionCrop] = useState(null) // { dataUrl, w, h } for transparent mode
  const [areaSelectBounds, setAreaSelectBounds] = useState(null) // original small window bounds to restore on dismiss
  const selStartRef = useRef(null)
  const [ankiConnected, setAnkiConnected] = useState(null)
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
    studyLanguage: 'English',
    grammarFeedback: false,
    questionPrompt: 'You are quizzing a language learner on a flashcard.\n\nGenerate clear, specific questions that test whether the student truly knows this word/phrase. Mix question types:\n- Meaning and translation questions\n- Usage in context (give a scenario, ask them to fill in the word)\n- Synonyms, antonyms, or related words\n- Grammar questions (part of speech, conjugation, gender)\n\nRULES:\n- Questions must be precise and have ONE clear correct answer based on the card content\n- Never ask "what is the primary purpose" or "what is the main reason" — these are ambiguous\n- Never ask questions where multiple answers from the card could be valid\n- Each question must stand on its own — do not reference other questions\n- If the card has a list of points, ask about specific items, not "what is the primary one"',
    ratingRules: 'All correct = Easy, 1 wrong = AI judges Good or Hard based on answer quality, 2 wrong = Hard, All wrong = Again',
  }
  const defaultGeneralStudyRules = {
    questionsPerCard: 3,
    cardsAtOnce: 3,
    studyLanguage: 'English',
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

  // Deck browser
  const [deckBrowserActive, setDeckBrowserActive] = useState(false)
  const [deckBrowserAddPanel, setDeckBrowserAddPanel] = useState(false)
  const [deckBrowserAddName, setDeckBrowserAddName] = useState('')
  const [deckBrowserAddPurpose, setDeckBrowserAddPurpose] = useState('')
  const [deckBrowserAddLoading, setDeckBrowserAddLoading] = useState(false)
  const [deckBrowserDeck, setDeckBrowserDeck] = useState('')
  const [deckBrowserNotes, setDeckBrowserNotes] = useState([])
  const [deckBrowserLoading, setDeckBrowserLoading] = useState(false)
  const [deckBrowserEditing, setDeckBrowserEditing] = useState(null) // noteId being edited
  const [deckBrowserEditFields, setDeckBrowserEditFields] = useState({})
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
  const [discoverConfig, setDiscoverConfig] = useState({ itemType: 'both', focus: '' }) // itemType: word|phrase|both
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
  const [chatTabStatus, setChatTabStatus] = useState(null) // null | 'searching' | 'thinking' | 'search-done' | 'search-empty' | 'search-failed'
  const chatTabScrollRef = useRef(null)

  // Load chat sessions from disk on mount
  useEffect(() => {
    fetch('/api/chats').then(r => r.json()).then(sessions => {
      setChatTabSessions(sessions)
    }).catch(() => {})
  }, [])

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
  aiStateRef.current = { provider, aiModels, apiKeys }
  // Per-feature model roles. Each app area can run its own model (and provider).
  // Defaults: cheap/fast model for high-volume areas, stronger model where quality matters.
  const ROLE_DEFAULTS = (pc) => ({
    general: pc.model,        // fallback + mode config generation
    picture: pc.model,        // OCR translation, word explain, tooltip lookups
    deck: pc.model,           // Anki card generation, editing, analysis, dedup
    study: pc.questionModel,  // study question gen, evaluation, hints, insights, feedback
    discover: pc.questionModel, // learner profiling, suggestions, fact-checking
    chat: pc.model,           // the chat tab assistant
    help: pc.questionModel,   // Ebi's Help assistant
    pose: pc.questionModel,   // picks Ebi's mascot pose from context — stronger model for better fit
  })
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
    return (overrides && overrides[role]) || ROLE_DEFAULTS(pc)[role]
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
    try {
      if (prov === 'anthropic') {
        const resp = await fetch('https://api.anthropic.com/v1/models?limit=100', {
          headers: { 'x-api-key': aiStateRef.current.apiKeys[prov] || '', 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
        })
        if (!resp.ok) return null
        const data = await resp.json()
        const ids = (data.data || []).map((m) => m.id)
        const prefer = role === 'general' ? ['haiku', 'sonnet', 'opus'] : ['sonnet', 'opus', 'haiku']
        for (const fam of prefer) { const hit = ids.find((id) => id.includes(fam)); if (hit) return hit }
        return ids[0] || null
      }
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
    try {
      const out = await PROVIDERS[prov].call(key, systemPrompt, userContent, model)
      setAiErrorNotice((prev) => prev ? null : prev) // clear a stale error toast on success
      return out
    } catch (e) {
      const healed = await healRetiredModel(e?.message || '', model, role)
      if (healed) {
        try { return await PROVIDERS[prov].call(key, systemPrompt, userContent, healed) }
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

    // Full-screen capture (Ctrl+Shift+S)
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
      body: JSON.stringify({ provider, aiModels, availableModels, appLanguage, appTheme, language, targetLang, showHighlights, onboarded, ...(activeTab ? { activeTab } : {}) }),
    }).catch(() => {})
  }, [provider, aiModels, availableModels, appLanguage, appTheme, language, targetLang, showHighlights, onboarded, activeTab, configLoaded])

  const setCurrentKey = (key) => {
    setApiKeys((prev) => ({ ...prev, [provider]: key }))
    if (key) setError(null)
  }

  // Open Settings → AI models if the current provider has no key stored
  useEffect(() => {
    if (keysLoaded && !apiKeys[provider]) { setSettingsCategory('models'); setSettingsOpen(true) }
  }, [provider, keysLoaded])

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
  const analyzeImage = useCallback(async (dataUrl) => {
    if (!dataUrl) return
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

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+Shift+S → Screen capture
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 's') {
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
        } else {
          setExpanded(false)
          setHoveredIdx(null)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [captureScreen])

  // ─── Paste Handler ──────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      // Don't capture paste if typing in input
      if (e.target.tagName === 'INPUT') return
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          loadImageFromFile(item.getAsFile())
          return
        }
      }
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [loadImageFromFile])

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
    // Don't handle text files at app level — they're for knowledge base
    if (file.name.match(/\.(txt|md)$/i)) {
      // If knowledge section is open, forward the file there
      if (knowledgeOpen) {
        console.log('[App] forwarding text file to knowledge upload')
        uploadKnowledgeFile(file)
      }
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

  // ─── Hover & Pin Handlers ───────────────────────────────────────────────────
  const handleWordHover = (idx, e) => {
    if (pinnedIdx !== null) return // don't override pinned tooltip
    setHoveredIdx(idx)
    const rect = e.currentTarget.getBoundingClientRect()
    const vw = window.innerWidth
    const ttHalf = 160 // ~half of tooltip maxWidth (300/2 + margin)
    let x = rect.left + rect.width / 2
    let y = rect.top - 6
    let anchor = 'above'
    // If not enough room above the word, show below
    if (rect.top < 180) {
      y = rect.bottom + 6
      anchor = 'below'
    }
    // Clamp horizontal so tooltip doesn't clip left/right edges
    x = Math.max(ttHalf, Math.min(vw - ttHalf, x))
    setTooltipPos({ x, y, anchor })
    if (ocrWords[idx]?._untranslated) lazyTranslate(idx)
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
      const rect = e.currentTarget.getBoundingClientRect()
      setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top - 6 })
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
        setPinnedTooltipPos({ x: Math.max(10, rect.left - 100), y: Math.max(10, rect.bottom + 10) })
      }
      // Lazy translate if in click mode and word hasn't been translated yet
      if (ocrWords[idx]?._untranslated) lazyTranslate(idx)
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
    tooltipDragRef.current = { offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top }
    const onMove = (ev) => {
      if (!tooltipDragRef.current) return
      const x = ev.clientX - tooltipDragRef.current.offsetX
      const y = ev.clientY - tooltipDragRef.current.offsetY
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
Study subject: ${activeMode.description || activeMode.name}

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
      if (decks.length > 0 && !decks.includes(ankiDeck)) {
        console.log('[Anki] saved deck not found, defaulting to:', decks[0])
        setAnkiDeck(decks[0])
      }
    } else {
      console.log('[Anki] not connected')
    }
  }

  // Shared card builder — turns a term into templated { front, back, tags } using the
  // active mode's format. Used by both the Picture-tab flow and Discover Mode. Pure: it
  // does not touch UI state, so callers control loading/preview/error handling.
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

  const saveModes = (modeList, activeId) => {
    const id = activeId || activeModeId
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

  const updateActiveMode = (updates) => {
    const updated = modes.map((m) =>
      m.id === activeModeId ? { ...m, ...updates } : m
    )
    saveModes(updated)
  }

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
      const prompt = `You are analyzing flashcards in a ${studyLang} learning deck. Find cards where the ${studyLang} word/phrase has MULTIPLE distinct everyday meanings that the card's current content does NOT disambiguate.\n\nFor each ambiguous card, propose updated field content that clarifies the intended meaning — e.g. specify the domain, add a usage example, or list the senses with a short note for each.\n\nDO NOT flag cards where:\n- The word has only one common meaning\n- The current content already disambiguates well\n- A learner would clearly understand from common usage\n\nCards (JSON):\n${JSON.stringify(cards)}\n\nReturn a JSON array — ONLY include cards that need fixing (skip the rest):\n[\n  {\n    "noteId": <number>,\n    "front": "<exact verbatim value of the card's "${frontFieldName}" field, copied character-for-character>",\n    "reason": "<one short sentence: what is ambiguous>",\n    "recommendedFields": { "<fieldName>": "<new content>", ... }\n  }\n]\n\nCRITICAL: "noteId" and "front" MUST identify the SAME card. Copy the "front" value verbatim from that exact card's data above — never paraphrase it, never use a different card's word, and double-check that the recommendedFields you write are for that same word. If you cannot be certain a noteId and its word match, omit that card.\n\nIn recommendedFields, include ONLY fields you're changing (typically just the back). Match each field's language (replace a ${studyLang} field with ${studyLang} content; replace an English field with English content). Use plain text with newlines for line breaks (no HTML, no <br>).\n\nOutput ONLY raw JSON. No markdown, no commentary.`

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
          const prompt = `These are flashcard headwords that look similar (possible spelling/accent/typo variants of the SAME word). For each cluster, identify which cards are truly the SAME word and should be merged. Different words that merely look alike (e.g. "casa" vs "caza", "pero" vs "perro") must NOT be grouped.\n\nClusters (JSON):\n${JSON.stringify(forAI)}\n\nReturn ONLY a JSON array of the duplicate sets you confirm (omit anything that isn't a real duplicate):\n[ { "merge": [<noteId>, <noteId>, ...] }, ... ]\n\nEach "merge" set must have 2+ noteIds that are the same word. Output ONLY raw JSON, no markdown.`
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
  const buildLearnerProfile = async () => {
    if (!apiKey) { setDiscoverError('API key required'); return null }
    setDiscoverProfileLoading(true)
    setDiscoverError(null)
    try {
      const deck = ankiDeck
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
        if (names.length) knowledgeSummary = `Knowledge base files: ${names.join(', ')}`
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
      if (ankiDeck && !(await ankiGetDecks().catch(() => [])).includes(ankiDeck)) {
        await ankiCreateDeck(ankiDeck)
      }
      const ankiBack = card.back.split('\n').map((line) => {
        const m = line.match(/^([A-Za-zÁÉÍÓÚáéíóúñÑ\s]+):(.*)$/)
        return m ? `<b>${m[1]}:</b>${m[2]}` : line
      }).join('<br>')
      const noteId = await ankiAddNote(ankiDeck, card.front, ankiBack, card.tags)
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

  // Initialize Discover when the user switches to it: load ledger + profile, then STOP
  // at the setup screen (no suggestion yet — the user picks options and clicks Start).
  const initDiscover = async () => {
    if (discoverInitRef.current || !apiKey) return
    discoverInitRef.current = true
    try {
      const ledger = (await readBlob('ledger', activeMode.name)) || DEFAULT_LEDGER
      setDiscoverLedger(ledger)
      let profile = await readBlob('profile', activeMode.name)
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
  useEffect(() => {
    discoverInitRef.current = false
    discoverDeckTermsRef.current = []
    setDiscoverProfile(null)
    setDiscoverSuggestion(null)
    setDiscoverLedger(DEFAULT_LEDGER)
    setDiscoverCard(null)
    setDiscoverError(null)
    setDiscoverSources(null)
    setDiscoverStarted(false)
    setDiscoverConfig({ itemType: 'both', focus: '' })
  }, [activeModeId])

  useEffect(() => {
    if (activeTab === 'discover' && ankiConnected && apiKey && !discoverInitRef.current) {
      initDiscover()
    }
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

  const uploadKnowledgeFile = async (file) => {
    console.log('[Knowledge] uploading file:', file.name, 'size:', file.size, 'type:', file.type)
    try {
      const text = await file.text()
      console.log('[Knowledge] file content length:', text.length)
      const res = await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, content: text }),
      })
      const data = await res.json()
      console.log('[Knowledge] upload result:', data)
      await loadKnowledgeFiles()
    } catch (err) {
      console.error('[Knowledge] upload failed:', err.message)
    }
  }

  const deleteKnowledgeFile = async (fileName) => {
    await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}&file=${encodeURIComponent(fileName)}`, { method: 'DELETE' })
    loadKnowledgeFiles()
  }

  const toggleKnowledgeFile = async (fileName) => {
    await fetch(`/api/modes/knowledge?mode=${encodeURIComponent(activeMode.name)}&file=${encodeURIComponent(fileName)}`, { method: 'PATCH' })
    loadKnowledgeFiles()
  }

  const handleKnowledgeDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setKnowledgeDragging(false)
    setDragging(false)
    const allFiles = Array.from(e.dataTransfer.files)
    console.log('[Knowledge] drop event, files:', allFiles.map(f => f.name))
    const textFiles = allFiles.filter(f => f.name.match(/\.(txt|md)$/i))
    if (textFiles.length === 0) {
      console.log('[Knowledge] no .txt/.md files in drop')
      return
    }
    textFiles.forEach(uploadKnowledgeFile)
  }

  const handleKnowledgeFileInput = (e) => {
    const files = Array.from(e.target.files).filter(f => f.name.match(/\.(txt|md)$/i))
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
  const renderFeedbackNotes = (r) => {
    const notes = [
      ...(Array.isArray(r?.notes) ? r.notes : []),
      ...(r?.grammarNote ? [{ type: 'grammar', text: r.grammarNote }] : []),
    ]
    return notes.map((n, i) => {
      const cat = FEEDBACK_CATS[n.type] || FEEDBACK_CATS.tip
      return (
        <div key={i} style={{ color: cat.color, fontSize: 10, marginTop: 2 }}>
          <span style={{ fontWeight: 700 }}>{cat.icon}</span> {n.text}
        </div>
      )
    })
  }

  // Small legend popover explaining the feedback colors.
  const FeedbackLegend = () => (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setStudyLegendOpen(o => !o)}
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
  const generateQuestionsForCard = async (card, rules, studyLang, knowledgeContext) => {
    const front = getCardFront(card)
    const back = getCardBack(card)
    const n = rules.questionsPerCard || 3
    const questionPrompt = rules.questionPrompt || defaultStudyRules.questionPrompt
    const isLanguage = activeMode.type === 'language'

    const deepQ = isLanguage
      ? `Q${n} (USAGE/DEPTH): Test deeper knowledge of the ${studyLang} word — usage in a short sentence, register (formal/informal), gender/conjugation, or distinguishing it from a close synonym. Stay within the everyday/general meaning unless the card explicitly indicates a specialized domain.`
      : `Q${n} (DEEP UNDERSTANDING): May freely name the subject. Test HOW, WHY, WHEN, or process. E.g. "Explain how X works" or "What distinguishes X from Y?" Open-ended — student demonstrates conceptual depth.`

    const q1Language = `Q1 (TRANSLATION PRODUCTION): Ask the student to translate the non-${studyLang} text on the card INTO ${studyLang}. Phrase it cleanly, e.g. "Translate to ${studyLang}: '<the non-${studyLang} text>'" or "How do you say '<the non-${studyLang} text>' in ${studyLang}?". The expected answer is the ${studyLang} word/phrase on the card. acceptedAnswers MUST be the ${studyLang} word(s), lowercase, with and without accents. Type MUST be "recall".
  TRANSLATION AMBIGUITY CHECK (apply before finalizing Q1): does the source text have MULTIPLE common ${studyLang} translations, with the card's target word being only one of several synonyms? E.g. English "favorable" → "favorable", "propicio", "auspicioso"; "happy" → "feliz", "contento", "alegre". If YES, a bare translation prompt is UNFAIR — the student cannot know which synonym you want. You MUST add a disambiguating cue INSIDE the question that singles out the target word WITHOUT stating it: a sense/nuance gloss in ${studyLang} (e.g. "(en el sentido de 'que augura algo bueno')"), a register note (formal / literario / coloquial), a domain, and/or the first letter ("empieza con 'a'"). Only when the translation is genuinely one-to-one may you leave it as a plain translation prompt.`
    const q1General = `Q1 (BLIND RECALL): Never name or hint at the target word/answer. Present a scenario, definition, or usage context that forces the student to produce the exact word. Example: "You need to X in situation Y — what word/tool/concept applies?"`
    const q2Language = `Q2–Q${n - 1} (CONTEXTUAL USAGE): A fill-in-the-blank or short scenario where the target ${studyLang} word fits AND no other plausible ${studyLang} word fits. If the card has an example/usage field, PREFER using that exact sentence (with the target word blanked) — it was authored for this word and is guaranteed unambiguous. If you must invent a context, apply the AMBIGUITY SELF-CHECK below rigorously. Each from a DIFFERENT angle.`
    const q2General = `Q2–Q${n - 1} (GUIDED RECALL): May reference related concepts, synonyms as contrast, or fill-in-the-blank. Must still require the EXACT target word. E.g. "Instead of [synonym], what [N]-letter word means...?" Each from a DIFFERENT angle.`

    const orderRules = n === 1
      ? (isLanguage ? q1Language : `Generate 1 question. It must be BLIND RECALL — never mention the target word/answer.`)
      : [
          `Generate exactly ${n} questions in this STRICT ORDER:`,
          isLanguage ? q1Language : q1General,
          n >= 3 ? (isLanguage ? q2Language : q2General) : null,
          deepQ,
        ].filter(Boolean).join('\n')

    const languageBlock = isLanguage ? `\nLANGUAGE MODE — REQUIRED:\n- The student is learning ${studyLang}. The EXPECTED ANSWER is ALWAYS the ${studyLang} word/phrase on the card, regardless of which side it's on.\n- Identify which side (front or back) is written in ${studyLang} — that side is the answer. The other side is just the translation/hint.\n- "acceptedAnswers" MUST contain the ${studyLang} word (lowercase, plus close variants with/without accents). NEVER put the translation/non-${studyLang} word in acceptedAnswers.\n- Treat the word in its BROADEST everyday meaning. If the card text doesn't pin down a specific domain, do NOT restrict questions to specialized contexts (programming, medicine, law, military, etc.). Example: "puntero" alone could be a clock hand, laser pointer, finger, or mouse cursor — don't assume programming.\n- BUT if the card text explicitly indicates a domain (e.g. back says "Pointer (C/C++)", "syringe (medical)", tag mentions a field), quiz within that domain.\n` : ''

    const prompt = `Card front: "${front}"\nCard back: "${back}"\n${languageBlock}\n${orderRules}\n\nCRITICAL RULES:\n- Questions must require the SPECIFIC answer on this card — synonyms are NOT acceptable for recall/fill_blank questions\n- NEVER construct a question whose only purpose is to directly name the answer (e.g. "what noun corresponds to adjective X?" when that noun IS the answer)\n- Each question must test a DIFFERENT angle\n- AMBIGUITY SELF-CHECK (apply to EVERY recall/fill_blank question before finalizing): mentally substitute 2–3 plausible alternative ${studyLang} words into the question. If ANY of them fit the sentence/scenario as naturally as the target word, the question is too vague — REWRITE it with more specific cues that exclude the alternatives. Hints (letter count, first letter) DO NOT make an ambiguous question valid; the question itself must point at the target word.\n  - BAD example: "Necesito ir a ___ para tomar mi vuelo a Madrid." Target answer "terminal" — but "aeropuerto" fits just as well. Rewrite needed.\n  - GOOD example: "El edificio específico dentro del aeropuerto donde se abordan los aviones se llama la ___" — now only "terminal" fits because "aeropuerto" is excluded by being named in the question itself.\n- For language cards: test usage in sentences, grammatical properties, contextual usage\n- For conceptual cards: test application, process, comparison\n\n${questionPrompt}\n\nGenerate all questions in ${studyLang}.${knowledgeContext}\n\nReturn a JSON array of exactly ${n} objects:\n[\n  {\n    "question": "the question text",\n    "type": "recall" | "fill_blank" | "explanation",\n    "hint1": "N letters" (letter count of primary answer, null for explanation),\n    "hint2": "starts with 'X'" (first letter of primary answer, null for explanation),\n    "acceptedAnswers": ["answer1", "answer2"] (lowercase; exact words that are correct; empty for explanation),\n    "pose": one mascot pose name that best fits this question's topic, chosen ONLY from: ${POSE_NAMES.join(', ')} (use "default" if none fit)\n  }\n]\nOutput ONLY raw JSON array. No markdown, no backticks.`

    try {
      const text = await aiCall(apiKey, 'You generate structured flashcard quiz questions. Always respond with a valid JSON array of objects.', prompt, resolveModel('study'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      if (!Array.isArray(parsed)) throw new Error('not array')
      return parsed.slice(0, n).map(q => ({
        question: typeof q === 'string' ? q : (q.question || ''),
        type: q.type || 'recall',
        hint1: q.hint1 || null,
        hint2: q.hint2 || null,
        acceptedAnswers: Array.isArray(q.acceptedAnswers) ? q.acceptedAnswers.map(a => String(a).toLowerCase().trim()) : [],
        pose: (typeof q === 'object' && q.pose) ? String(q.pose).toLowerCase().trim() : null, // precomputed mascot pose
      }))
    } catch {
      const fallback = [
        { question: `What concept relates to: ${back.slice(0, 30)}...?`, type: 'recall', hint1: `${back.split(/\s+/)[0].length} letters`, hint2: `starts with '${back[0]?.toUpperCase() || '?'}'`, acceptedAnswers: [back.toLowerCase().trim()] },
        { question: `Explain this in your own words.`, type: 'explanation', hint1: null, hint2: null, acceptedAnswers: [] },
        { question: `Why is this important?`, type: 'explanation', hint1: null, hint2: null, acceptedAnswers: [] },
      ]
      return fallback.slice(0, n)
    }
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

  const beginStudy = async (deck, mode = 'flashcards') => {
    setStudyMode(mode)
    setStudyLoading(true)
    setAnkiError(null)
    try {
      let cardIds = await ankiFindCards(`deck:"${deck}" is:due`)
      if (!cardIds || cardIds.length === 0) cardIds = await ankiFindCards(`deck:"${deck}"`)
      if (!cardIds || cardIds.length === 0) { setAnkiError('No cards found in this deck'); setStudyLoading(false); return }

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
      const studyLang = rules.studyLanguage || 'English'
      const knowledgeContext = knowledgeRes.content ? `\n\nReference material:\n${knowledgeRes.content.substring(0, 4000)}\n\nUse this context to create more specific, contextual questions.` : ''

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
      } else {
        // Generate card 0 first so the session starts immediately
        const firstCard = cards[0]
        const firstQuestions = await generateQuestionsForCard(firstCard, rules, studyLang, knowledgeContext)
        const firstCardState = {
          cardId: firstCard.cardId, front: getCardFront(firstCard), back: getCardBack(firstCard),
          questions: firstQuestions, answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [],
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
          const questions = await generateQuestionsForCard(card, rules, studyLang, knowledgeContext)
          if (studyWrappingUpRef.current) return
          setStudyCardState(prev => [...prev, {
            cardId: card.cardId, front: getCardFront(card), back: getCardBack(card),
            questions, answers: [], results: [], done: false, questionIdx: 0, questionAttempts: [],
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

  // Pick first question when entering question phase
  useEffect(() => {
    if (studyPhase === 'question' && !currentQuestion && studyCardState.length > 0) {
      setCurrentQuestion(getNextStudyQuestion())
    }
  }, [studyPhase, studyCardState])

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
        return
      }
      // All remaining hints already satisfied — fall through and advance
    }

    // Advance — correct, explanation type, or max hints exhausted
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
      evaluateCardAnswers(cardIdx, newStates[cardIdx])
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
    if (!window.confirm(cs.isConjugation
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
    evaluateCardAnswers(cardIdx, newStates[cardIdx])
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
    const studyLang = rules.studyLanguage || 'English'
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
      const text = await aiCall(apiKey, `You give concise flashcard study hints written entirely in ${studyLang}. Never reveal the answer word or any of its forms.`, prompt, resolveModel('study'))
      setStudyMeaningHint(text.trim())
    } catch {
      setStudyMeaningHint(null); setStudyWordLookup(null)
    } finally {
      setStudyMeaningHintLoading(false)
    }
  }

  // Language study: look up what a single word in the question sentence means, in the
  // quiz language. Lets a learner decode an unfamiliar word without revealing the answer.
  const lookupStudyWord = async (word, sentence) => {
    if (!apiKey || !word) return
    // Explain in the USER's language (= the app language), since that's the language they
    // speak and are learning from — not the quiz/study language.
    const explainLang = APP_LANG_NAME[appLanguage] || 'English'
    const studyLang = (activeMode.studyRules || defaultStudyRules).studyLanguage || 'English'
    setStudyWordLookup({ word, primary: null, alternatives: [], loading: true })
    try {
      // Disambiguate by the WHOLE question — the same word can mean different things in different
      // contexts. Return the in-context meaning (shown in the legend's "correct" green) plus other
      // common senses (shown in the legend's "word choice" purple).
      const prompt = `A learner tapped the word "${word}" in this ${studyLang} study question. Read the ENTIRE question for context — the same word can have different meanings depending on context.

Question: "${sentence}"

Reply in ${explainLang} as JSON ONLY (no markdown, no extra text):
{
  "primary": "the meaning/translation of \\"${word}\\" AS USED in THIS question — the single best fit, a few words only",
  "alternatives": ["up to 3 other common meanings the word can have in OTHER contexts, a few words each; use [] if it really only has one meaning"]
}`
      const text = await aiCall(apiKey, `You are a concise bilingual dictionary that disambiguates words by context. Output JSON only, written in ${explainLang}.`, prompt, resolveModel('study'))
      const parsed = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
      setStudyWordLookup({
        word,
        primary: String(parsed.primary || '').trim() || '—',
        alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.filter(Boolean).map(String).slice(0, 3) : [],
        loading: false,
      })
    } catch {
      setStudyWordLookup({ word, primary: 'Lookup failed — try again.', alternatives: [], loading: false })
    }
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
  const evaluateCardAnswers = async (cardIdx, cs) => {
    try {
      const rules = activeMode.studyRules || defaultStudyRules
      const studyLang = rules.studyLanguage || 'English'
      const grammarOn = rules.grammarFeedback || false
      const isLanguage = activeMode.type === 'language'
      const modeType = isLanguage ? `The student is learning a FOREIGN LANGUAGE (${activeMode.name}). Typos in ${studyLang} should be marked CORRECT if the concept is understood.` : `The student is studying ${activeMode.name}. They answer in their own words to explain topics/situations.`
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
        ? `Grading rules by question type:\n- recall / fill_blank: mark CORRECT if the student's answer CONTAINS one of the "Accepted answers" — ignore a leading article (e.g. "una", "el") and extra function words, so "una huelga" is CORRECT for "huelga". Normalize for case, accents, and minor typos. Synonyms, related words, or different words with the same meaning are INCORRECT — mark them wrong and note the specific word this card tests. If no "Accepted answers" line is given, fall back to the ${studyLang} side of the card.\n- explanation: grade on conceptual understanding — accept any answer that correctly addresses the question.\nALWAYS note any grammar, spelling, or accent issues in the feedback (e.g. missing accent mark on brújula). These notes are educational, not penalizing.`
        : `Grading rules:\n- This is NOT a vocabulary test. The student answers in their own words to explain concepts or situations. Grade EVERY question on conceptual understanding: mark CORRECT if the answer demonstrates correct understanding of the topic, even when phrased differently, with extra words, or not matching the reference answer exactly. Only mark WRONG if the answer is factually incorrect, off-topic, or empty. When useful, add a brief note in the feedback about anything they missed.`

      const prompt = `Evaluate ALL answers for this flashcard at once.\n\nCard front: "${cs.front}"\nCard back: "${cs.back}"\n\n${modeType}\n\n${questionsAndAnswers}\n\n${gradingRules}${notesInstruction}\n\nWrite ALL feedback text in ${studyLang}.\n\nReturn a JSON array of ${cs.questions.length} objects: [{"correct": true/false, "feedback": "one short summary sentence", "notes": [{"type": "praise|correction|grammar|terminology|detail|tip", "text": "...", "penalize": true/false}]}]\n\nOutput ONLY raw JSON. No markdown, no backticks.`

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

      setStudyCardState(prev => {
        const updated = [...prev]
        updated[cardIdx] = { ...updated[cardIdx], results, rating: label, ease, evaluating: false }
        return updated
      })
      setStudyStats(prev => ({ ...prev, [label]: prev[label] + 1 }))

      // Check if all cards are done and evaluated
      setStudyCardState(prev => {
        const allDone = prev.every(cs => cs.done)
        const allEvaluated = prev.every(cs => !cs.evaluating)
        if (allDone && allEvaluated && !studyWrappingUpRef.current) {
          // All cards done — if no more in pool, go to summary
          const poolExhausted = studyMode === 'conjugations'
            ? studyBatchIdx >= studyConjugationWords.length
            : studyBatchIdx >= studyAllCards.length
          if (poolExhausted) {
            setTimeout(() => setStudyPhase('summary'), 100)
          }
        }
        return prev
      })

      console.log('[Study] card evaluated:', cs.front, '→', label)
    } catch (err) {
      console.error('[Study] evaluation failed:', err.message)
      setStudyCardState(prev => {
        const updated = [...prev]
        updated[cardIdx] = { ...updated[cardIdx], evaluating: false, results: cs.questions.map(() => ({ correct: false, feedback: 'Evaluation failed' })), rating: 'again', ease: 1 }
        return updated
      })
    }
  }

  // Pull a new card/word from the pool to replace a completed one
  const pullNewCard = async () => {
    if (studyWrappingUpRef.current) return

    const rules = activeMode.studyRules || defaultStudyRules
    const studyLang = rules.studyLanguage || 'English'
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
    } else {
      if (studyBatchIdx >= studyAllCards.length) return
      const card = studyAllCards[studyBatchIdx]
      if (!card) return
      setStudyBatchIdx(prev => prev + 1)
      const knowledgeContext = studyKnowledge ? `\n\nReference material:\n${studyKnowledge.substring(0, 2000)}` : ''
      const questions = await generateQuestionsForCard(card, rules, studyLang, knowledgeContext)
      if (studyWrappingUpRef.current) return
      setStudyCardState(prev => [...prev, {
        cardId: card.cardId, front: getCardFront(card), back: getCardBack(card),
        questions, answers: [], results: [], done: false, questionIdx: 0,
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
  const syncingRef = useRef(false)
  const syncRatingsToAnki = async () => {
    if (syncingRef.current) return { synced: 0, failed: 0, skipped: true }
    const ratingsToSync = studyCardState.filter(cs => cs.done && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation)
    if (ratingsToSync.length === 0) return { synced: 0, failed: 0 }
    syncingRef.current = true

    // Try each card individually so one bad card doesn't block the rest
    const synced = []
    const failed = []
    try {
      for (const cs of ratingsToSync) {
        try {
          console.log('[Anki sync] answering card', cs.cardId, 'ease', cs.ease, 'rating', cs.rating)
          const result = await ankiAnswerCards([{ cardId: cs.cardId, ease: cs.ease }])
          if (result === false) {
            // answerCards returns false when ease is out of range for the card's current state
            // (e.g. new card only has 3 buttons but we sent ease=4). Retry with capped ease.
            console.warn('[Anki sync] answerCards returned false for card', cs.cardId, '— retrying with ease 3')
            const retry = await ankiAnswerCards([{ cardId: cs.cardId, ease: Math.min(cs.ease, 3) }])
            if (retry === false) {
              console.error('[Anki sync] retry also failed for card', cs.cardId)
              failed.push(cs)
            } else {
              console.log('[Anki sync] retry succeeded for card', cs.cardId)
              synced.push(cs)
            }
          } else {
            synced.push(cs)
          }
        } catch (err) {
          console.error('[Anki sync] error for card', cs.cardId, err.message)
          failed.push(cs)
        }
      }
    } finally {
      syncingRef.current = false
    }

    if (synced.length > 0) {
      const syncedIds = new Set(synced.map(cs => cs.cardId))
      setStudyCardState(prev => prev.map(cs => syncedIds.has(cs.cardId) ? { ...cs, synced: true } : cs))
      ankiSync().catch(() => {})
      ankiGetDeckStats([studyDeck]).then(s => {
        const ds = Object.values(s)[0]
        if (ds) setStudyDeckStats(ds)
      }).catch(() => {})
      console.log('[Anki sync] synced', synced.length, 'cards. Failed:', failed.length)
    }
    return { synced: synced.length, failed: failed.length, ...(failed.length > 0 ? { error: `${failed.length} card(s) failed` } : {}) }
  }

  // Auto-sync: push newly-evaluated card ratings to Anki so partial progress is
  // preserved if the tab closes, the browser crashes, or AnkiConnect disconnects.
  // Debounced 15s so that if the user corrects a rating (e.g. AGAIN → EASY) shortly
  // after, only the FINAL rating is sent — avoiding a stacked AGAIN+EASY review.
  // A later correction re-marks the card unsynced and re-syncs (Anki's last answer wins).
  useEffect(() => {
    if (!studyActive) return
    const hasUnsynced = studyCardState.some(cs => cs.done && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation)
    if (!hasUnsynced) return
    const t = setTimeout(() => {
      syncRatingsToAnki().then(result => {
        if (result?.failed > 0) console.error('[Anki auto-sync] failed cards:', result.failed, result.error)
      })
    }, 15000)
    return () => clearTimeout(t)
  }, [studyCardState, studyActive])

  const nextBatch = async () => {
    await syncRatingsToAnki()
    setStudyPhase('summary')
  }

  const exitStudy = async () => {
    // Last-line defense: try to flush any unsynced ratings before tearing down state.
    // If Anki is unreachable, ask the user whether to exit anyway (losing those ratings)
    // or stay so they can fix the connection and retry.
    const unsynced = studyCardState.filter(cs => cs.done && cs.ease && cs.rating !== 'deleted' && !cs.synced && !cs.isConjugation)
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
    const studyLang = (activeMode.studyRules || defaultStudyRules).studyLanguage || 'English'
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
    ;(async () => {
      try {
        const prompt = `Generate exactly 3 short example chat prompts (3-6 words each) a user could tap to start chatting with an AI tutor about this study mode. Mix a concept question, a "make a flashcard" request, and a "quiz me" request — all specific to the subject.\nMode name: "${activeMode.name}"\nSubject/description: "${activeMode.description || activeMode.name}"\nType: ${activeMode.type}\nOutput ONLY a raw JSON array of 3 strings. No markdown, no backticks.`
        const text = await aiCall(apiKey, 'You suggest example chat prompts. Respond with valid JSON only.', prompt, resolveModel('general'), { silent: true })
        const arr = JSON.parse(text.trim().replace(/^```json?\s*/i, '').replace(/```\s*$/, ''))
        if (Array.isArray(arr) && arr.length) updateActiveMode({ chatSuggestions: arr.filter(Boolean).slice(0, 3).map(String) })
      } catch { /* keep the generic defaults */ }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, activeModeId, apiKey])

  const sendChatTabMessage = async () => {
    const q = chatTabInput.trim()
    if (!q || !apiKey || chatTabLoading) return
    const newMsgs = [...chatTabMsgs, { role: 'user', content: q }]
    setChatTabMsgs(newMsgs)
    setChatTabInput('')
    setChatTabLoading(true)
    setTimeout(() => chatTabScrollRef.current?.scrollTo({ top: chatTabScrollRef.current.scrollHeight, behavior: 'smooth' }), 50)
    try {
      let systemPrompt = `You are a helpful study assistant. The user is studying with mode "${activeMode.name}".

IMPORTANT BEHAVIOR RULES:
1. When the user asks you to "make a deck" or "create cards" for a topic:
   - DO NOT immediately generate cards
   - Instead, ASK the user: "I can help with that! Would you like me to: (1) Search for top-rated existing Anki decks for this topic online, or (2) Generate custom cards based on specific objectives or materials you provide?"
   - If they want to search: suggest they use the "Find Decks" feature (coming soon), or recommend searching AnkiWeb at ankiweb.net/shared/decks for "[topic]" and advise what to look for (high ratings, recent updates, comprehensive coverage)
   - If they want custom cards: ask what specific topics, chapters, or objectives to cover. Ask if they have materials in their Knowledge Base. Then generate cards systematically by topic.

2. When creating flashcards (after the user confirms what they want):
   - Generate cards one topic at a time, not all at once
   - Use this JSON format wrapped in <anki-card> tags:
   {"front": "...", "back": "...", "tags": [...]}
   - Make cards high quality: clear fronts, comprehensive backs, relevant tags
   - Ask if they want more cards on the same topic or move to the next

3. For general questions: be concise and helpful. Explain concepts clearly.

4. NEVER dump a wall of cards without asking first. Quality over quantity.`

      // Web search if enabled
      let searchSources = null
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

      const convo = newMsgs.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
      const text = await aiCall(apiKey, systemPrompt, convo, resolveModel('chat'))

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

      const cleanText = text.replace(/<anki-card>.*?<\/anki-card>/gs, '').replace(/<progress-update>[\s\S]*?<\/progress-update>/g, '').replace(/<sources>[\s\S]*?<\/sources>/g, '').trim()
      const msgIdx = newMsgs.length // index of the assistant message we're appending
      const assistantMsg = { role: 'assistant', content: cleanText, cards: parsedCards.length > 0 ? parsedCards : undefined, sources: sources || undefined }
      const updatedMsgs = [...newMsgs, assistantMsg]
      setChatTabMsgs(updatedMsgs)
      // Pipe the reply into the Mascot model to pick Ebi's pose; tag this message with it.
      choosePose(cleanText).then((file) => {
        if (file) setChatTabMsgs((prev) => prev.map((m, i) => i === msgIdx ? { ...m, mascot: file } : m))
      })
      setTimeout(() => chatTabScrollRef.current?.scrollTo({ top: chatTabScrollRef.current.scrollHeight, behavior: 'smooth' }), 50)
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

  const chatTabSyncCard = async (card, msgIdx) => {
    if (!ankiConnected) return
    const deck = ankiDeck || ankiDecks[0] || 'Default'
    try {
      await ankiAddNote(deck, card.front, card.back, card.tags || ['screenlens'])
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
    setScreenshot(null); setOcrWords([]); setStage('idle')
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
                className="ui-tab"
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

          {/* Mode quick-switcher (fast switch without opening Settings) */}
          <select
            value={activeModeId}
            onChange={(e) => { const id = parseInt(e.target.value); setActiveModeId(id); saveModes(modes, id); const nm = modes.find((m) => m.id === id); if (nm?.ankiDeck) setStudyDeck(nm.ankiDeck) }}
            title={t('settingsMode')}
            style={{ ...S.select, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.3)', background: 'rgba(223,37,64,.08)', fontWeight: 700 }}
          >
            {modes.map((m) => <option key={m.id} value={m.id}>{m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {m.name}</option>)}
          </select>

          {/* Single Settings entry — opens the unified modal */}
          <button onClick={() => setSettingsOpen(true)} title={t('settingsTitle')} style={{ ...S.ghostBtn, position: 'relative', padding: '6px 10px' }}>
            {'⚙️'} {t('settingsTitle')}
            {!apiKey && <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: 'var(--c-danger)' }} />}
          </button>

          {/* Picture tab: Capture, Upload, Overlay */}
          {activeTab === 'picture' && (
            <>
              <div style={S.captureGroup}>
                <button onClick={captureScreen} disabled={loading} style={S.captureBtn}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ marginRight: 7 }}>
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                      stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Capture
                </button>
                <button onClick={() => fileInputRef.current?.click()} disabled={loading} style={S.uploadBtn}>
                  Upload
                </button>
              </div>

              <button onClick={async () => {
                if (overlayRunning) {
                  try { await fetch('/api/launch-overlay', { method: 'DELETE' }); setOverlayRunning(false) } catch {}
                } else {
                  try {
                    const r = await fetch('/api/launch-overlay', { method: 'POST' })
                    const d = await r.json()
                    if (d.error) { alert(d.error) } else { setOverlayRunning(true) }
                  } catch (err) { alert('Failed to launch overlay: ' + err.message) }
                }
              }} style={{
                ...S.ghostBtn,
                color: overlayRunning ? 'var(--c-success)' : 'var(--c-ink-dim)',
                borderColor: overlayRunning ? 'rgba(24,169,87,0.3)' : 'var(--c-border)',
                background: overlayRunning ? 'rgba(24,169,87,0.08)' : 'transparent',
              }}>
                {overlayRunning ? '\u25CF' : '\u25CB'} Overlay
              </button>

              <kbd style={S.kbd}>Ctrl+Shift+S</kbd>
            </>
          )}
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
                    const back = stripHtml(fields[1]?.[1]?.value || '')
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
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-ink)' }}>{front}</span>
                              <span style={{ fontSize: 11, color: 'var(--c-ink-dim)', marginLeft: 8 }}>{back.slice(0, 80)}{back.length > 80 ? '...' : ''}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                              <button onClick={() => startEditNote(note)} style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px' }}>Edit</button>
                              <button onClick={() => { if (confirm(`Delete "${front}"?`)) deleteNote(note.noteId) }}
                                style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px', color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}>Del</button>
                            </div>
                          </div>
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
              deck={ankiDeck}
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
            <div ref={chatTabScrollRef} style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
              {chatTabMsgs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '52px 20px' }}>
                  <img src={shrimpUrl(poseFile('singer'))} alt="Ebi" style={{ width: 76, height: 76, objectFit: 'contain', marginBottom: 10, filter: 'drop-shadow(0 6px 14px rgba(223,37,64,.28))' }} />
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
              {chatTabMsgs.map((m, i) => (
                <div key={i} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {/* Ebi reacts on ASSISTANT messages only — Ebi is the AI, not the user.
                      Render once the Mascot-model pose (m.mascot) resolves, so it appears a single
                      time with the chosen pose (no keyword→AI swap). */}
                  {m.role !== 'user' && m.mascot && (
                    <img src={shrimpUrl(m.mascot)} alt="Ebi" title="Ebi" style={{ width: 34, height: 34, objectFit: 'contain', marginBottom: 4, animation: 'pop .3s cubic-bezier(.34,1.56,.64,1)', filter: 'drop-shadow(var(--sh-sm))' }} />
                  )}
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
                    background: m.role === 'user' ? 'linear-gradient(135deg, rgba(223,37,64,.2), rgba(223,37,64,.12))' : 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
                    border: `1px solid ${m.role === 'user' ? 'rgba(223,37,64,.28)' : 'var(--c-border)'}`,
                    color: 'var(--c-ink)', whiteSpace: 'pre-wrap',
                  }}>
                    {m.content}
                  </div>
                  {/* Inline Anki card previews */}
                  {m.cards?.map((card, ci) => (
                    <div key={ci} style={{
                      maxWidth: '80%', marginTop: 6, padding: '10px 14px', borderRadius: 8,
                      background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)',
                    }}>
                      <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', fontWeight: 600, marginBottom: 4 }}>ANKI CARD</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--c-ink)', marginBottom: 4 }}>{card.front}</div>
                      <div style={{ fontSize: 11, color: 'var(--c-ink)', whiteSpace: 'pre-line', marginBottom: 6 }}>{card.back}</div>
                      {card.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
                          {card.tags.map((t, ti) => <span key={ti} style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'rgba(125,133,144,.15)', color: 'var(--c-ink-dim)' }}>{t}</span>)}
                        </div>
                      )}
                      {card.synced ? (
                        <span style={{ fontSize: 10, color: 'var(--c-success)' }}>Synced to Anki</span>
                      ) : (
                        <button onClick={() => chatTabSyncCard(card, i)} disabled={!ankiConnected}
                          style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 10px', color: 'var(--c-success)', borderColor: 'rgba(24,169,87,.3)', opacity: ankiConnected ? 1 : 0.4 }}>
                          Sync to Anki
                        </button>
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
                </div>
              ))}
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
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
                  value={chatTabInput}
                  onChange={(e) => setChatTabInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatTabMessage() } }}
                  placeholder={chatTabWebSearch ? 'Search the web and ask...' : 'Ask anything, or tell me to make a flashcard...'}
                  style={{ ...S.keyInput, flex: 1, fontSize: 13, padding: '10px 14px' }}
                  disabled={chatTabLoading}
                />
                <button
                  onClick={sendChatTabMessage}
                  disabled={chatTabLoading || !chatTabInput.trim()}
                  style={{ ...S.captureBtn, borderRadius: 6, opacity: chatTabLoading || !chatTabInput.trim() ? 0.5 : 1 }}
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
        const today = new Date().toISOString().split('T')[0]
        const todayStats = history.filter(h => h.date === today)
        const todayCards = todayStats.reduce((s, h) => s + (h.cardsStudied || 0), 0)
        const todayCorrect = todayStats.reduce((s, h) => s + (h.correct || 0), 0)
        const todayTotal = todayStats.reduce((s, h) => s + (h.totalQuestions || 0), 0)

        // Streak: count consecutive days
        const dates = [...new Set(history.map(h => h.date))].sort().reverse()
        let streak = 0
        const d = new Date()
        for (let i = 0; i < 365; i++) {
          const dateStr = d.toISOString().split('T')[0]
          if (dates.includes(dateStr)) { streak++; d.setDate(d.getDate() - 1) }
          else if (i === 0) { d.setDate(d.getDate() - 1) } // allow today to not be studied yet
          else break
        }

        // Last 14 days chart
        const chartDays = []
        for (let i = 13; i >= 0; i--) {
          const dd = new Date(); dd.setDate(dd.getDate() - i)
          const ds = dd.toISOString().split('T')[0]
          const dayH = history.filter(h => h.date === ds)
          chartDays.push({ date: ds, label: dd.toLocaleDateString('en', { weekday: 'short' }), cards: dayH.reduce((s, h) => s + (h.cardsStudied || 0), 0) })
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
                { val: `${todayTotal > 0 ? Math.round(todayCorrect / todayTotal * 100) : 0}%`, color: 'var(--c-success)', label: t('accuracyToday') },
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
              {history.slice(0, 20).map((h, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--c-border)', fontSize: 11 }}>
                  <span style={{ color: 'var(--c-ink-dim)' }}>{h.date}</span>
                  <span style={{ color: 'var(--c-brand)' }}>{h.deck}</span>
                  <span style={{ color: 'var(--c-ink)' }}>{h.cardsStudied} {t('cardsLabel')}</span>
                  <span style={{ color: h.accuracy >= 80 ? 'var(--c-success)' : h.accuracy >= 50 ? 'var(--c-warning)' : 'var(--c-danger)' }}>{h.accuracy}%</span>
                </div>
              ))}
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

            {/* Study start phase */}
            {studyPhase === 'pick' && (
              <div style={{ textAlign: 'center', animation: 'slideUp .35s ease' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.ink, fontFamily: FONT.display, marginBottom: 8 }}>{t('studySession')}</div>
                {/* Mode & Deck selectors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', marginBottom: 16 }}>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                    background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--c-ink-dim)' }}>{t('mode')}:</span>
                    <select value={activeModeId} onChange={(e) => {
                      const id = parseInt(e.target.value)
                      setActiveModeId(id)
                      saveModes(modes, id)
                      // Load new mode's deck
                      const newMode = modes.find((m) => m.id === id)
                      if (newMode?.ankiDeck) setStudyDeck(newMode.ankiDeck)
                    }} style={{ ...S.select, fontSize: 12, padding: '6px 10px', color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.3)' }}>
                      {modes.map((m) => <option key={m.id} value={m.id}>{m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {m.name}</option>)}
                    </select>
                  </div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                    background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8,
                  }}>
                    <span style={{ fontSize: 12, color: 'var(--c-ink-dim)' }}>{t('deck')}:</span>
                    <select value={studyDeck} onChange={(e) => { setStudyDeck(e.target.value); setAnkiDeck(e.target.value) }}
                      style={{ ...S.select, fontSize: 12, padding: '6px 10px' }}>
                      {ankiDecks.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                {/* Language & grammar options — language modes only (general modes quiz on concepts) */}
                {activeMode.type === 'language' && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                  background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8, marginBottom: 16,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--c-ink-dim)' }}>{t('quizIn')}:</span>
                  <select value={activeMode.studyRules?.studyLanguage || 'English'}
                    onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), studyLanguage: e.target.value } })}
                    style={{ ...S.select, fontSize: 11, padding: '4px 8px' }}>
                    {LANGS.filter(l => l.code !== 'auto').map(l => (
                      <option key={l.code} value={l.label}>{l.label}</option>
                    ))}
                  </select>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--c-ink-dim)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={activeMode.studyRules?.grammarFeedback || false}
                      onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), grammarFeedback: e.target.checked } })}
                    />
                    {t('grammarFeedback')}
                  </label>
                </div>
                )}

                {/* Study type — Conjugations is language-only, so only offer it for language modes */}
                {activeMode.type === 'language' && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 20px',
                  background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', borderRadius: 8, marginTop: 8, marginBottom: 4,
                }}>
                  <span style={{ fontSize: 12, color: 'var(--c-ink-dim)' }}>{t('studyType')}:</span>
                  <select value={studyMode} onChange={(e) => setStudyMode(e.target.value)}
                    style={{ ...S.select, fontSize: 12, padding: '6px 10px' }}>
                    <option value="flashcards">{t('flashcards')}</option>
                    <option value="conjugations">{t('conjugations')}</option>
                  </select>
                </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                  <button onClick={() => beginStudy(studyDeck, activeMode.type === 'language' ? studyMode : 'flashcards')} disabled={!studyDeck || studyLoading}
                    style={{ ...S.captureBtn, borderRadius: 6, padding: '10px 24px', fontSize: 13, opacity: !studyDeck || studyLoading ? 0.5 : 1 }}>
                    {studyLoading ? t('loading') : t('start')}
                  </button>
                  <button onClick={exitStudy} style={{ ...S.ghostBtn }}>{t('cancel')}</button>
                </div>
                {ankiError && <div style={{ color: 'var(--c-danger)', fontSize: 11, marginTop: 8 }}>{ankiError}</div>}
              </div>
            )}

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

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                      <span style={{ color: 'var(--c-brand)' }}>{activeCount} <span style={{ fontSize: 10, color: 'var(--c-ink-dim)' }}>{t('active')}</span></span>
                      <span style={{ color: 'var(--c-success)' }}>{completedCount} <span style={{ fontSize: 10, color: 'var(--c-ink-dim)' }}>{t('doneCount')}</span></span>
                      <span style={{ color: 'var(--c-ink-dim)' }}>{studyDeckStats.new_count || 0} {t('new')} / {studyDeckStats.learn_count || 0} {t('learn')} / {studyDeckStats.review_count || 0} {t('due')}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <FeedbackLegend />
                      <button onClick={exitStudy} style={{ ...S.ghostBtn, fontSize: 10 }}>{t('exitStudy')}</button>
                    </div>
                  </div>

                  {/* Current question — card front is HIDDEN. Ebi studies alongside, to the right. */}
                  {question ? (
                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                      flex: '1 1 480px', maxWidth: 620, minWidth: 0,
                      background: C.surface,
                      border: `1px solid ${C.border}`, borderRadius: 16,
                      padding: '22px 24px', boxShadow: SHADOW.lg,
                    }}>
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

                      <div key={`q-${cq?.cardIdx}-${cq?.questionIdx}`} style={{ fontSize: 13, color: 'var(--c-ink)', fontWeight: 600, marginBottom: studyWordLookup ? 6 : 8, animation: 'fadeUp .25s ease' }}>
                        {activeMode.type === 'language'
                          ? question.split(/(\s+)/).map((tok, ti) => {
                              const clean = tok.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '')
                              const answers = questionObj?.acceptedAnswers || []
                              // Skip whitespace, the blank placeholder, and the answer word itself
                              const lookupable = clean.length > 1 && !/_{2,}/.test(tok) && !answers.includes(clean.toLowerCase())
                              if (!lookupable) return <span key={ti}>{tok}</span>
                              return (
                                <span key={ti} className="study-word" onClick={() => lookupStudyWord(clean, question)}
                                  title={`What does "${clean}" mean?`}
                                  style={{ cursor: 'pointer', display: 'inline-block' }}>
                                  <span className="study-word-inner" style={{ display: 'inline-block', borderBottom: '1px dotted rgba(223,37,64,.45)' }}>{tok}</span>
                                </span>
                              )
                            })
                          : question}
                      </div>

                      {activeMode.type === 'language' && studyWordLookup && (
                        <div style={{ fontSize: 11, background: 'rgba(223,37,64,.06)', border: '1px solid rgba(223,37,64,.2)', borderRadius: 5, padding: '5px 10px', marginBottom: 8, display: 'flex', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, color: 'var(--c-brand)' }}>{studyWordLookup.word}</span>
                          <span style={{ color: 'var(--c-ink-dim)' }}>—</span>
                          {studyWordLookup.loading ? (
                            <span style={{ flex: 1, color: 'var(--c-ink-dim)' }}>Looking up…</span>
                          ) : (
                            <span style={{ flex: 1 }}>
                              {/* In-context meaning in the legend's "correct" green */}
                              <span style={{ color: 'var(--c-success)', fontWeight: 700 }}>{studyWordLookup.primary}</span>
                              {/* Other senses in the legend's "word choice" purple */}
                              {studyWordLookup.alternatives?.length > 0 && (
                                <span style={{ color: 'var(--c-ink-faint)' }}> · also <span style={{ color: 'var(--c-purple)', fontWeight: 600 }}>{studyWordLookup.alternatives.join(', ')}</span></span>
                              )}
                            </span>
                          )}
                          <span onClick={() => setStudyWordLookup(null)} style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1 }}>×</span>
                        </div>
                      )}

                      {studyCurrentHint && (
                        <div style={{ fontSize: 11, color: 'var(--c-warning)', background: 'rgba(232,147,12,.08)', border: '1px solid rgba(232,147,12,.2)', borderRadius: 5, padding: '5px 10px', marginBottom: 8 }}>
                          Hint: {studyCurrentHint}
                        </div>
                      )}

                      {studyMeaningHint && (
                        <div style={{ fontSize: 11, color: 'var(--c-brand)', background: 'rgba(223,37,64,.06)', border: '1px solid rgba(223,37,64,.2)', borderRadius: 5, padding: '5px 10px', marginBottom: 8 }}>
                          💡 {studyMeaningHint}
                        </div>
                      )}
                      {studyMeaningHintLoading && (
                        <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', marginBottom: 8 }}>Loading hint...</div>
                      )}

                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          value={studyInput}
                          onChange={(e) => setStudyInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') submitStudyAnswer() }}
                          placeholder={studyCurrentHint ? t('tryAgain') + '...' : t('typeYourAnswer')}
                          style={{ ...S.keyInput, flex: 1, fontSize: 13, padding: '10px 14px' }}
                          autoFocus
                        />
                        <button onClick={submitStudyAnswer} disabled={!studyInput.trim()}
                          style={{ ...S.captureBtn, borderRadius: 6, opacity: !studyInput.trim() ? 0.5 : 1 }}>
                          {studyCurrentHint ? t('tryAgain') : t('submit')}
                        </button>
                      </div>

                      {/* Action buttons */}
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={skipStudyQuestion}
                            style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}>
                            {t('iDontKnow')}
                          </button>
                          {studyMode === 'conjugations' && (
                            <button onClick={skipConjugationWord}
                              style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-ink-dim)', borderColor: 'var(--c-border)' }}>
                              {t('skipWord')}
                            </button>
                          )}
                          <button onClick={fetchMeaningHint} disabled={studyMeaningHintLoading || !!studyMeaningHint}
                            style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-brand)', borderColor: 'rgba(223,37,64,.25)', opacity: (studyMeaningHintLoading || !!studyMeaningHint) ? 0.5 : 1 }}>
                            {studyMeaningHintLoading ? t('loading') : t('meaningHint')}
                          </button>
                          {studyMode !== 'conjugations' && (
                            <button onClick={() => setStudyDeleteConfirm(cq.cardIdx)}
                              style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-ink-dim)', borderColor: 'var(--c-border)' }}>
                              {t('iKnowThisAlready')}
                            </button>
                          )}
                          {canUndo && (
                            <button onClick={undoLastAnswer} style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-ink-dim)', borderColor: 'var(--c-border)' }}>← {t('back')}</button>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {!studyWrappingUp && (
                            <button onClick={studyWrapUp} style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-warning)', borderColor: 'rgba(232,147,12,.25)' }}>{t('wrapUp')}</button>
                          )}
                          <button onClick={studyEndNow} style={{ ...S.ghostBtn, fontSize: 10, color: 'var(--c-danger)', borderColor: 'rgba(229,57,46,.25)' }}>{t('endNow')}</button>
                        </div>
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
                    </div>
                    {/* Ebi study companion — big, circle-less, reacts to the question; Ask Ebi opens Help */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8, flexShrink: 0 }}>
                      <img src={shrimpUrl(studyMascot)} alt="Ebi" draggable={false} style={{ width: 132, height: 132, objectFit: 'contain' }} />
                      <button onClick={() => setAskEbiSignal((n) => n + 1)} style={{ ...S.ghostBtn, fontSize: 12, color: 'var(--c-brand)', borderColor: 'var(--c-brand-ring, rgba(223,37,64,.35))', fontWeight: 700, padding: '7px 16px', borderRadius: RADIUS.pill }}>
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

                  {/* Completed cards — show feedback inline as they finish */}
                  {studyCardState.filter(cs => cs.done && cs.results.length > 0 && !cs.dismissed).length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
                      <button onClick={async () => {
                        setStudySyncError(null)
                        const result = await syncRatingsToAnki()
                        setStudyCardState(prev => prev.map(cs => cs.done && cs.results.length > 0 ? { ...cs, dismissed: true } : cs))
                        if (result.failed > 0) {
                          setStudySyncError(`${result.failed} card(s) failed to sync — check browser console for details`)
                          setTimeout(() => setStudySyncError(null), 8000)
                        } else if (studyMode !== 'conjugations') {
                          setStudySyncNotification(true)
                          setTimeout(() => setStudySyncNotification(false), 3000)
                        }
                      }} style={{ ...S.ghostBtn, fontSize: 11, color: 'var(--c-success)', borderColor: 'rgba(24,169,87,.3)' }}>
                        {studyMode === 'conjugations' ? t('close') : t('doneSyncToAnki')}
                      </button>
                    </div>
                  )}
                  {studySyncNotification && (
                    <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--c-success)' }}>Synced to Anki</div>
                  )}
                  {studySyncError && (
                    <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--c-danger)', background: 'rgba(229,57,46,.06)', border: '1px solid rgba(229,57,46,.2)', borderRadius: 6, padding: '6px 12px' }}>{studySyncError}</div>
                  )}
                  {studyCardState.filter(cs => cs.done && cs.results.length > 0 && !cs.dismissed).map((cs, i) => {
                    const ci = studyCardState.indexOf(cs)
                    const ratingColors = { easy: 'var(--c-success)', good: 'var(--c-brand)', hard: 'var(--c-warning)', again: 'var(--c-danger)', deleted: 'var(--c-ink-dim)' }
                    return (
                      <div key={ci} style={{ marginTop: 16, border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden' }}>
                        <div style={{ padding: '8px 12px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink)' }}>{cs.front}</span>
                          {cs.evaluating ? (
                            <span style={{ fontSize: 11, color: 'var(--c-ink-dim)' }}>Evaluating...</span>
                          ) : (
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
                            }} style={{ background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', color: ratingColors[cs.rating] || 'var(--c-ink-dim)', border: `1px solid ${ratingColors[cs.rating] || 'var(--c-border)'}44`, borderRadius: 4, fontSize: 11, fontWeight: 700, fontFamily: 'inherit', padding: '2px 6px', cursor: 'pointer' }}>
                              <option value="easy" style={{ color: 'var(--c-success)' }}>EASY</option>
                              <option value="good" style={{ color: 'var(--c-brand)' }}>GOOD</option>
                              <option value="hard" style={{ color: 'var(--c-warning)' }}>HARD</option>
                              <option value="again" style={{ color: 'var(--c-danger)' }}>AGAIN</option>
                            </select>
                          )}
                        </div>
                        {cs.results.map((r, qi) => (
                          <div key={qi} style={{ padding: '8px 12px', borderTop: '1px solid var(--c-border)', fontSize: 12, background: r.correct ? 'rgba(24,169,87,.03)' : 'rgba(229,57,46,.03)' }}>
                            <div style={{ color: r.correct ? 'var(--c-success)' : 'var(--c-danger)', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                              {r.correct ? '\u2713 CORRECT' : '\u2717 INCORRECT'}
                            </div>
                            <div style={{ color: 'var(--c-ink-dim)', marginBottom: 3 }}><span style={{ fontWeight: 600 }}>Q:</span> {getQuestionText(cs.questions[qi])}</div>
                            <div style={{ color: 'var(--c-ink)', marginBottom: 4 }}><span style={{ fontWeight: 600 }}>Your answer:</span> {cs.answers[qi]}</div>
                            <div style={{ color: r.correct ? 'var(--c-success)' : 'var(--c-warning)', lineHeight: 1.5, fontSize: 11 }}>{r.feedback}</div>
                            {renderFeedbackNotes(r)}
                          </div>
                        ))}
                        <div style={{ padding: '4px 12px', borderTop: '1px solid var(--c-border)', fontSize: 10, color: 'var(--c-ink-faint)' }}>{cs.back}</div>
                        {/* Feedback chat */}
                        {!cs.evaluating && (
                          <div style={{ padding: '6px 12px', borderTop: '1px solid var(--c-border)' }}>
                            {(studyFeedbackChat[ci]?.messages || []).map((m, mi) => (
                              <div key={mi} style={{ fontSize: 11, padding: '4px 8px', marginBottom: 4, borderRadius: 4, background: m.role === 'user' ? 'rgba(223,37,64,.08)' : 'rgba(24,169,87,.05)', color: m.role === 'user' ? 'var(--c-ink)' : 'var(--c-success)' }}>{m.text}</div>
                            ))}
                            {studyFeedbackChat[ci]?.loading && <div style={{ fontSize: 10, color: 'var(--c-ink-dim)', padding: '2px 8px' }}>Thinking...</div>}
                            <div style={{ display: 'flex', gap: 4 }}>
                              <input value={studyFeedbackChat[ci]?.input || ''} onChange={(e) => setStudyFeedbackChat(prev => ({ ...prev, [ci]: { ...(prev[ci] || { messages: [], loading: false }), input: e.target.value } }))} onKeyDown={(e) => { if (e.key === 'Enter') sendStudyFeedbackChat(ci) }} placeholder="Fix typo, flag bad question, or ask..." style={{ ...S.keyInput, flex: 1, fontSize: 10, padding: '4px 8px' }} />
                              <button onClick={() => sendStudyFeedbackChat(ci)} disabled={studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())} style={{ ...S.ghostBtn, fontSize: 9, padding: '4px 8px', opacity: (studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())) ? 0.4 : 1 }}>Reply</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
                  return (
                    <div key={ci} style={{ marginBottom: 16, border: '1px solid var(--c-border)', borderRadius: 8, overflow: 'hidden' }}>
                      <div style={{
                        padding: '8px 12px', background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-ink)' }}>{cs.front}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: ratingColors[cs.rating] || 'var(--c-ink-dim)' }}>
                          {cs.rating?.toUpperCase()}
                        </span>
                      </div>
                      {cs.questions.map((q, qi) => (
                        <div key={qi} style={{
                          padding: '8px 12px', borderTop: '1px solid var(--c-border)', fontSize: 12,
                          background: cs.results[qi]?.correct ? 'rgba(24,169,87,.03)' : 'rgba(229,57,46,.03)',
                        }}>
                          <div style={{ color: cs.results[qi]?.correct ? 'var(--c-success)' : 'var(--c-danger)', fontSize: 10, fontWeight: 700, marginBottom: 4 }}>
                            {cs.results[qi]?.correct ? '\u2713 CORRECT' : '\u2717 INCORRECT'}
                          </div>
                          <div style={{ color: 'var(--c-ink-dim)', marginBottom: 3 }}>
                            <span style={{ fontWeight: 600 }}>Q:</span> {getQuestionText(q)}
                          </div>
                          {cs.questionAttempts?.[qi]?.length > 1 && (
                            <div style={{ color: 'var(--c-ink-faint)', fontSize: 10, marginBottom: 3 }}>
                              Previous attempts: {cs.questionAttempts[qi].slice(0, -1).join(', ')}
                            </div>
                          )}
                          <div style={{ color: 'var(--c-ink)', marginBottom: 4 }}>
                            <span style={{ fontWeight: 600 }}>Your answer:</span> {cs.answers[qi]}
                          </div>
                          <div style={{ color: cs.results[qi]?.correct ? 'var(--c-success)' : 'var(--c-warning)', lineHeight: 1.5, fontSize: 11 }}>
                            {cs.results[qi]?.feedback}
                          </div>
                          {renderFeedbackNotes(cs.results[qi])}
                        </div>
                      ))}
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
                            placeholder="Fix typo, flag bad question, or ask..."
                            style={{ ...S.keyInput, flex: 1, fontSize: 10, padding: '4px 8px' }}
                          />
                          <button onClick={() => sendStudyFeedbackChat(ci)}
                            disabled={studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())}
                            style={{ ...S.ghostBtn, fontSize: 9, padding: '4px 8px', opacity: (studyFeedbackChat[ci]?.loading || !(studyFeedbackChat[ci]?.input?.trim())) ? 0.4 : 1 }}>
                            Reply
                          </button>
                        </div>
                      </div>
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
      {(activeTab === 'picture' || isOverlay) && <main style={isOverlay ? { ...S.main, padding: 0, background: 'transparent' } : S.main}>
        {/* Empty state (hidden in overlay) */}
        {stage === 'idle' && !isOverlay && (
          <div style={S.emptyState}>
            <img src={shrimpUrl(poseFile('camera'))} alt="Ebi" style={{ width: 84, height: 84, objectFit: 'contain', marginBottom: 12 }} />
            <h2 style={S.emptyTitle}>Capture, paste, drop, or upload</h2>
            <p style={S.emptyDesc}>
              Hit <kbd style={S.kbdInline}>Ctrl+Shift+S</kbd> to screenshot your display,
              or paste / drag-drop any image. Tesseract.js pinpoints every word's exact
              pixel position. Your chosen AI ({providerConfig.label}) translates them.
              Hover any word on the image for translations and synonyms.
            </p>
            <div style={S.methods}>
              <div onClick={captureScreen}
                style={{ ...S.methodCard, borderColor: 'rgba(223,37,64,0.2)', cursor: 'pointer' }}>
                <span style={{ color: 'var(--c-brand)', fontSize: 20 }}>📸</span>
                <span style={{ color: 'var(--c-brand)' }}>Capture Screen</span>
              </div>
              <div onClick={() => fileInputRef.current?.click()}
                style={{ ...S.methodCard, borderColor: 'rgba(139,92,246,0.2)', cursor: 'pointer' }}>
                <span style={{ color: 'var(--c-purple)', fontSize: 20 }}>📁</span>
                <span style={{ color: 'var(--c-purple)' }}>Upload File</span>
              </div>
              <div style={{ ...S.methodCard, borderColor: 'rgba(24,169,87,0.2)' }}>
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
                <div style={{ maxWidth: '90%', padding: '8px 12px', borderRadius: 8, fontSize: 12, lineHeight: 1.4, background: m.role === 'user' ? 'rgba(223,37,64,.12)' : 'var(--c-surface-alt)', border: `1px solid ${m.role === 'user' ? 'rgba(223,37,64,.2)' : 'var(--c-border)'}`, color: 'var(--c-ink)', whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </div>
                {m.cards?.map((card, ci) => (
                  <div key={ci} style={{ maxWidth: '90%', marginTop: 4, padding: '8px 10px', borderRadius: 6, background: 'linear-gradient(180deg, var(--c-surface), var(--c-surface-sunken))', border: '1px solid var(--c-border)', fontSize: 11 }}>
                    <div style={{ fontWeight: 600, color: 'var(--c-ink)', marginBottom: 2 }}>{card.front}</div>
                    <div style={{ color: 'var(--c-ink)', whiteSpace: 'pre-line', marginBottom: 4 }}>{card.back}</div>
                    {card.synced ? <span style={{ fontSize: 9, color: 'var(--c-success)' }}>Synced</span> : (
                      <button onClick={() => chatTabSyncCard(card, i)} style={{ ...S.ghostBtn, fontSize: 9, padding: '2px 8px', color: 'var(--c-success)', borderColor: 'rgba(24,169,87,.3)' }}>Sync to Anki</button>
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
        const pinnedStyle = isPinned && pinnedTooltipPos
          ? { ...S.tooltip, ...S.tooltipExpanded,
              left: pinnedTooltipPos.x, top: pinnedTooltipPos.y, transform: 'none',
              ...(hasExpanded ? { maxWidth: 900, width: 500 } : { maxWidth: 400, width: 'auto', minWidth: 300 }),
            }
          : isPinned
            ? { ...S.tooltip, ...S.tooltipExpanded, ...(hasExpanded ? { maxWidth: 900, width: '92vw' } : { maxWidth: 400, width: 'auto' }) }
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
          <div style={S.ttConf}>OCR confidence: {Math.round(activeWord.confidence)}%</div>

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
                      {deepExplaining ? 'Thinking...' : 'Explain further (Sonnet)'}
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
                  Sonnet is thinking...
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
          --c-brand: #DF2540; --c-brand-dark: #C00A29; --c-brand-soft: #FF5468;
          --c-bg: #F2F5F8; --c-bg-grad1: rgba(223,37,64,.05); --c-bg-grad2: rgba(17,168,160,.045);
          --c-surface: #FFFFFF; --c-surface-alt: #EAEEF2; --c-surface-sunken: #F5F8FA;
          --c-border: #E2E8ED; --c-border-strong: #CDD7DE;
          --c-ink: #16242C; --c-ink-dim: #51626C; --c-ink-faint: #8A99A3;
          --c-on-brand: #FFFFFF;
          --c-glass: rgba(255,255,255,.82); --c-glass-strong: rgba(255,255,255,.97);
          --c-teal: #11A8A0; --c-teal-dark: #0C857F;
          --c-success: #18A957; --c-warning: #E8930C; --c-danger: #E5392E; --c-info: #2D86C9; --c-purple: #8B5CF6;
          --sh-sm: 0 1px 2px rgba(16,36,44,.06); --sh-md: 0 4px 14px rgba(16,36,44,.08);
          --sh-lg: 0 12px 32px rgba(16,36,44,.10); --sh-xl: 0 24px 60px rgba(16,36,44,.16);
          --sh-brand: 0 6px 18px rgba(223,37,64,.28);
        }
        [data-theme="dark"] {
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

        /* Top navigation tabs: gentle float-up on hover (vertical only, no click shrink).
           The lift is on an INNER span, not the button, so the button's hover hit-box never
           moves out from under the cursor — otherwise the lift triggers mouseleave→enter shake. */
        .ui-tab { transition: color .18s ease, background .18s ease, box-shadow .18s ease; }
        .ui-tab-inner { display: inline-block; transition: transform .16s cubic-bezier(.34,1.56,.64,1); }
        .ui-tab:hover .ui-tab-inner { transform: translateY(-2px); }

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
        .study-word:hover .study-word-inner {
          transform: translateY(-3px);
          color: var(--c-brand);
          border-bottom-color: rgba(223,37,64,.85) !important;
        }

        /* Deck browser rows — highlight on hover */
        .deck-row:hover { border-color: rgba(223,37,64,.35) !important; background: rgba(223,37,64,.05) !important; }

        /* Chat session sidebar items — highlight on hover */
        .chat-session:hover { background: rgba(223,37,64,.06) !important; }

        /* Suggestion / pill chips — lift + glow on hover (lift on inner span; see .ui-tab note) */
        .chip:hover { border-color: rgba(223,37,64,.45) !important; color: var(--c-brand) !important; }
        .chip { transition: border-color .16s ease, color .16s ease, background .16s ease; }
        .chip-inner { display: inline-block; transition: transform .14s ease; }
        .chip:hover .chip-inner { transform: translateY(-1px); }
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

      {!isOverlay && <HelpChat
        apiKey={apiKey}
        provider={provider}
        mascotFile={helpMascot}
        onAiReply={(text) => choosePose(text, setHelpMascot)}
        askEbiSignal={askEbiSignal}
        hideButton={activeTab === 'study' && studyActive && studyPhase === 'question'}
        model={resolveModel('help')}
        onModelRetired={async (failedModel) => {
          const healed = await healRetiredModel('404 not_found', failedModel, 'help')
          return healed
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
        currentQuestion: studyActive && studyQueue[studyQueueIdx] ? { question: studyQueue[studyQueueIdx].question, cardFront: studyCardState[studyQueue[studyQueueIdx].cardIdx]?.front } : null,
        chatTabMsgs: chatTabMsgs.slice(-5).map(m => ({ role: m.role, content: m.content?.slice(0, 200) })),
        language,
        targetLang,
        screenshot: !!screenshot,
        stage,
      }} />}
    </div>
  )
}

