import { useState, useRef, useEffect } from 'react'
import { shrimpUrl, DEFAULT_SHRIMP, IDLE_SHRIMP } from '../config/shrimp'
import { FONT } from '../config/tokens'
import Markdown from './Markdown'
import { apiFetch } from '../platform'

const HELP_BASE = `You are Ebi, the friendly helper inside the Ebiki study app, a cheerful little red shrimp. Speak naturally in first person as Ebi. Do NOT call yourself a "mascot" or break character; you're just Ebi, here to help. If asked who you are, say you're Ebi and you help with their studies. LORE: Ebi is a shrimp and is completely at peace with being eaten. Ebi knows shrimp are nutritious, delicious, and healthy, so if it ever comes up, Ebi cheerfully reassures the user it's totally fine and even encourages them to enjoy eating shrimp. You are context-aware: you can answer questions about the app AND about whatever the user is currently working on (screenshots, translations, study sessions, Anki cards, etc). Answer briefly and conversationally, 2-3 sentences max unless the user asks for details. NEVER use em-dashes (—) or en-dashes (–); they read as fake/AI. Use commas, periods, or parentheses instead. HARD RULE: NEVER put a shrimp emoji (🦐) or any shrimp/prawn/crustacean emoji in your text, not even to sign off or refer to yourself. Ebi's shrimp presence is shown by the app's mascot art, never by an emoji in the message. Other emoji are fine in moderation. You may use light markdown (bold, bullet lists) when it genuinely helps readability, but keep it minimal. The user can ask follow-up questions.

About Ebiki:
Ebiki is an AI-powered study app whose mascot is Ebi, a red shrimp. It turns what you study into Anki flashcards, quizzes you on them with AI-written questions, and can read and translate text in any picture or on screen.

Where things are (describe ONLY these; never invent a button):
- Screens in the sidebar on the left (the exact list the user has is given below as SIDEBAR SCREENS): Chat (talk with Ebi, make cards, attach a deck), Study (AI quiz sessions on your Anki cards), Deck (browse, edit, search, add, Quick Add, copy/move, check card quality, scan for duplicates, Ebi bulk edit), Discover (AI suggestions for new cards at your level), Picture (capture, upload, paste or drop an image to translate its words), Stats (Anki review streak, cards today, accuracy, 14-day chart), and the feature screens such as Legends (an adventure map with lessons, bosses and the daily raid) and Practice (a hub of activities, listed below as PRACTICE ACTIVITIES).
- The header also shows the Ebiki streak and today's XP toward the daily goal (the game).
- "Talk to Ebi" button in the header: opens this help chat.
- Mode switcher in the header: switch between learning modes like "Spanish" or "Security+". Each mode has its own deck, card format and study rules.
- Settings (the gear button, top right). App settings: General (theme, app language, translation languages, how Ebiki opens, run setup again), AI & cost (provider, API key, intelligence preset, "Save tokens: reuse questions" which is off unless the user turns it on and is cleared per deck, per-feature models under "Choose a model per feature"), Anki & audio (Anki auto-sync and its grace window, pronunciation audio), Data & updates (shared data folder, updates and restart). Mode settings: Learning modes (create, rename, delete, or design one with Ebi), Study (session size, languages, feedback, how Ebi asks questions, and an Advanced section), Cards & Anki (deck, card format, tags), Knowledge base (upload .txt, .md or .pdf reference material).
- Alt+Q: screen capture; with the overlay running it works over games and other apps. ESC dismisses it.
- Cards live in the card store. With the default Anki store, it needs Anki desktop running with the AnkiConnect add-on (code 2055492159); if it is missing, the app offers to install it.`

// What part of the screen is shown right now, as the features name it (kit/useHelp.js `where`): of the entries for this
// screen that name one, the deepest (`depth`) wins (a raid inside Legends over the Legends map). '' = none.
export function screenWhere(featureContext, tab) {
  const on = (featureContext || []).filter((f) => f?.text && f.where && f.screen === tab)
  on.sort((a, b) => (Number(b.depth) || 0) - (Number(a.depth) || 0))
  return on[0] ? String(on[0].where) : ''
}

export function buildSystemPrompt(appContext) {
  if (!appContext) return HELP_BASE
  const parts = [HELP_BASE, '\n--- CURRENT APP STATE ---']

  // === WHAT THE USER IS LOOKING AT RIGHT NOW =================================
  // Lead with the visible screen. Screen-specific detail is gated to its own tab so a paused
  // study session (studyActive stays true across tabs) can never be mistaken for what's on screen.
  const tab = appContext.activeTab || 'unknown'
  const SCREEN = {
    chat: 'the CHAT screen (a text conversation with you, Ebi)',
    study: 'the STUDY screen',
    deck: 'the DECK BROWSER (browse / edit / bulk-edit Anki cards)',
    discover: 'the DISCOVER screen (AI suggestions for new cards to add)',
    picture: 'the PICTURE screen (translate text in an image via OCR)',
    stats: 'the STATS screen (a study-statistics dashboard)',
    legends: 'the LEGENDS screen (an adventure map of areas with lessons, boss fights and daily raid bosses built from their deck)',
    practice: 'the PRACTICE screen (a hub of practice activities: Ebi Call, Roleplay, Mistake Gym and others)',
    assets: 'the BESTIARY / ASSET VIEW screen (cheat mode: every Legends boss, raid boss, boss family and Ebi draft, with abilities, effects and lore)',
  }[tab] || `the "${tab}" screen`
  const sub = screenWhere(appContext.featureContext, tab)
  parts.push(`\n>>> RIGHT NOW the user is looking at ${SCREEN}${sub ? `, and on it: ${sub}` : ''}. When they ask "what's on my screen", "what is this", or "what am I looking at", answer about THIS screen. Never describe a different screen, and never claim a study question is on screen unless the STUDY screen is the one shown below. <<<`)
  parts.push(`NOTE: the user navigates between screens as you talk, so THIS value always reflects where they are for the CURRENT message. If your earlier reply described a different screen, they simply moved, that is NOT a mistake on your part. Just answer for the current screen, do NOT apologize or say "I got that wrong."`)

  // Always-true background facts (independent of the visible screen).
  if (appContext.navScreens?.length) parts.push(`SIDEBAR SCREENS: ${appContext.navScreens.join(', ')}`)
  if (appContext.practiceActivities?.length) parts.push(`PRACTICE ACTIVITIES (tiles on the Practice screen): ${appContext.practiceActivities.join(', ')}`)
  parts.push(`Mode: ${appContext.activeMode?.name || 'unknown'} (${appContext.activeMode?.type || ''})`)
  parts.push(`Anki deck for this mode: ${appContext.activeMode?.ankiDeck || 'none set'}`)
  if (appContext.activeMode?.dialect) parts.push(`Dialect setting: ${appContext.activeMode.dialect} (all generation follows this variant)`)
  if (appContext.grammarSlips?.length) parts.push(`RECURRING GRAMMAR SLIPS (auto-collected from graded study answers: things the learner conceptually knows but keeps getting wrong, e.g. a missing tilde). Offer targeted practice on these when asked ("let's drill my weak points"), or a gentle reminder when one is relevant:\n${appContext.grammarSlips.map((s) => `- ${s}`).join('\n')}`)
  parts.push(`Learner level in this mode: ${appContext.learnerLevel || 'not measured yet (Legends can measure it: a short test, or reading what Ebiki has seen them study)'}`)
  // The shared learner context (App builds it with the secrecy guards; a function, so it is built only here). A failure
  // never costs the prompt.
  let learnerCtx = ''
  try { learnerCtx = typeof appContext.learnerContext === 'function' ? appContext.learnerContext() : String(appContext.learnerContext || '') } catch { learnerCtx = '' }
  if (learnerCtx) parts.push(`\n${learnerCtx}`)
  if (appContext.chatSettings && Object.values(appContext.chatSettings).some(Boolean)) {
    const c = appContext.chatSettings
    parts.push(`Chat tab settings for this mode: ${[c.focus && c.focus !== 'free' && `focus ${c.focus}`, c.level && `level ${c.level}`, c.explain && c.explain !== 'auto' && `explains in ${c.explain}`, c.attachedDeck && `deck attached: ${c.attachedDeck}`].filter(Boolean).join(', ') || 'defaults'}`)
  }
  parts.push(`Anki connected: ${appContext.ankiConnected ? 'yes' : 'no'}`)
  if (appContext.ankiDecks?.length) parts.push(`Available Anki decks: ${appContext.ankiDecks.join(', ')}`)

  // --- PICTURE screen ---
  if (tab === 'picture') {
    parts.push(`\nON THE PICTURE SCREEN: source language ${appContext.pictureFrom || appContext.language || 'auto'} → target ${appContext.pictureTo || appContext.targetLang || 'eng'}. Screenshot loaded: ${appContext.screenshot ? 'yes' : 'no'}. Stage: ${appContext.stage || 'idle'}.`)
    if (appContext.ocrWords?.length) {
      const words = appContext.ocrWords.filter(w => w.text).slice(0, 40)
      parts.push(`Detected words (${appContext.ocrWords.length} total, up to 40 shown): ${words.map(w => w.translation ? `${w.text} → ${w.translation}` : w.text).join(', ')}`)
    }
    if (appContext.activeWord) {
      const w = appContext.activeWord
      parts.push(`Currently selected word: "${w.text}"${w.translation ? `: ${w.translation}` : ''}${w.pronunciation ? ` (${w.pronunciation})` : ''}`)
      if (w.definition) parts.push(`  Definition: ${w.definition}`)
      if (w.example) parts.push(`  Example: ${w.example}`)
    }
    if (appContext.explanation) parts.push(`Word explanation shown: ${appContext.explanation.slice(0, 300)}`)
    if (appContext.deepExplanation) parts.push(`Deep explanation shown: ${appContext.deepExplanation.slice(0, 500)}`)
    if (appContext.ankiCard) parts.push(`Anki card being prepared: Front="${appContext.ankiCard.front}", Back="${appContext.ankiCard.back?.slice(0, 200)}"`)
  }

  // --- Features (Legends, Practice activities...): what the learner does there, as each feature reports it ---
  // Shown on every screen (Ebi knows what the learner did everywhere); an entry for the screen in view is marked as
  // what is on screen right now. A feature never puts the answer of a question on screen into its text.
  for (const f of appContext.featureContext || []) {
    if (!f?.text) continue
    const here = f.screen && f.screen === tab
    parts.push(here
      ? `\nON SCREEN NOW (${f.id}): what the user sees and does here. Answer questions about this screen from it. If a question or fight is running, do NOT give its answer unless they explicitly ask for it; guide them instead:\n${f.text}`
      : `\nBACKGROUND, ${f.id} (not on screen; what the learner has done there, use it when they ask about their progress or this part of the app):\n${f.text}`)
  }

  // --- STATS screen ---
  if (tab === 'stats' && appContext.stats) {
    const s = appContext.stats
    parts.push(`\nON THE STATS SCREEN (dashboard sourced from ${s.source}). The user is viewing their study statistics, NOT a card or question. What is shown:`)
    parts.push(`- Day streak: ${s.streak}`)
    parts.push(`- Cards studied today: ${s.cardsToday}`)
    parts.push(`- Accuracy today: ${s.accuracyToday == null ? (s.cardsToday ? 'unknown' : 'unknown (nothing answered today)') : `${s.accuracyToday}%`}`)
    parts.push(`- A "Last 14 days" reviews chart.`)
    if (s.recentSessions?.length) parts.push(`- Recent sessions:\n${s.recentSessions.map(r => `   ${r.date} · ${r.deck} · ${r.cards} cards${r.accuracy != null ? ` · ${r.accuracy}% accuracy` : ''}`).join('\n')}`)
  }

  // --- DECK browser ---
  if (tab === 'deck' && appContext.deckBrowser) {
    const d = appContext.deckBrowser
    parts.push(`\nON THE DECK BROWSER: deck "${d.deck || '(none picked)'}" with ${d.cards} cards listed${d.search ? `, filtered by the search "${d.search}"` : ''}. From here the user can add, edit, copy/move, reset, analyze, scan for duplicates, or bulk-edit cards.`)
    if (d.quickAdd) parts.push(`Quick Add tray open with cards waiting for review: ${d.quickAdd.join(' | ')}`)
    if (d.review) parts.push(`A review of ${d.review.count} suggested card changes is open (${d.review.kind === 'custom' ? `the request: "${d.review.request}"` : 'a card quality check'}); nothing is saved until the user accepts each one. First ones: ${d.review.first.map((r) => `"${r.front}": ${r.reason}`).join(' | ')}`)
    if (d.duplicates) parts.push(`${d.duplicates} duplicate group(s) found and waiting for merge decisions.`)
  }

  // --- DISCOVER screen ---
  if (tab === 'discover' && appContext.discover) {
    const dv = appContext.discover
    parts.push(`\nON THE DISCOVER SCREEN: ${dv.started ? 'actively suggesting new items to add' : 'on the setup screen'}, learner level=${dv.level || 'not analyzed yet'}, target deck="${dv.deck || 'none'}".`)
    if (dv.profile) parts.push(`Discover's profile of the learner: ${dv.profile}`)
    if (dv.suggestion) parts.push(`Suggestion on screen: "${dv.suggestion.term}"${dv.suggestion.kind ? ` (${dv.suggestion.kind})` : ''}${dv.suggestion.meaning ? `: ${dv.suggestion.meaning}` : ''}${dv.suggestion.why ? `. Why it was suggested: ${dv.suggestion.why}` : ''}`)
  }

  // Question depth (studyRules.questionDepth) and the one-answer rating, so Ebi can explain a card's one question.
  const depthLine = (x) => x.questionDepth === 'thorough'
    ? `Question depth: THOROUGH (every flashcard gets all ${x.questionsPerCard} questions; rated by how many are wrong: none Easy, one Good, more Hard, all Again).`
    : `Question depth: ADAPTIVE. A due REVIEW gets ONE production question (the learner produces the answer: the word or form in a language mode, the term, value or step otherwise); new, learning, relearning, struggling cards and relearn copies get all ${x.questionsPerCard}. A one-question card is rated: wrong or skipped Again; right with a hint, a retry or a near miss (accent slip, partial answer, a grader correction) Hard; right and clean Good; Easy only when typed and the card is mature (interval 21 days or more). Multiple choice is at most Good. A missed review is rated Again once and comes back later in the session as practice with all its questions. The setting is in Settings, Study, Session ("Question depth"), or the "One question per review" box on the start screen.`
  // --- STUDY screen: the question is "on screen" ONLY here ---
  const ss = appContext.studySession || {}
  if (tab === 'study' && appContext.studyActive) {
    parts.push(`\nON THE STUDY SCREEN: deck="${appContext.studyDeck}", phase=${appContext.studyPhase}, type=${ss.studyMode || 'flashcards'}, answer style=${ss.answerStyle || 'typed'}`)
    parts.push(`Progress: ${ss.completed ?? 0} cards done, ${ss.activeCards ?? 0} active, ${ss.poolRemaining ?? 0} still waiting in the pool`)
    if (ss.learning || ss.ebiSpeaks) parts.push(`Learning: ${ss.learning || 'not set'} · Ebi speaks: ${ss.ebiSpeaks || ss.learning || 'not set'}`)
    if (ss.questionDepth) parts.push(depthLine(ss))
    parts.push(`Session ratings so far: easy=${appContext.studyStats?.easy}, good=${appContext.studyStats?.good}, hard=${appContext.studyStats?.hard}, again=${appContext.studyStats?.again}`)
    if (appContext.studyDeckStats) parts.push(`Deck queue: new=${appContext.studyDeckStats.new_count}, learning=${appContext.studyDeckStats.learn_count}, review=${appContext.studyDeckStats.review_count}`)
    if (appContext.currentQuestion) {
      const cq = appContext.currentQuestion
      parts.push(`\nQUESTION CURRENTLY ON SCREEN (question ${cq.number}/${cq.of}, type ${cq.type}):\n"${cq.question}"`)
      if (cq.choices?.length) parts.push(`Multiple-choice options shown: ${cq.choices.join(' | ')}`)
      if (cq.acceptedAnswers?.length) parts.push(`Expected answer (SECRET): do NOT reveal it (nor spelling/letter clues) unless the user EXPLICITLY asks to be told the answer: ${cq.acceptedAnswers.join(', ')}`)
      // The FRONT is secret too: on a language card it is the headword, i.e. the answer ("which card is this?"
      // was answered with it).
      if (cq.cardFront) parts.push(`Card front (also SECRET while the question is unanswered, it may BE the answer): ${cq.cardFront}`)
      if (cq.cardBack) parts.push(`Card back (also secret while the question is unanswered): ${cq.cardBack}`)
    }
    if (appContext.learnMoment) parts.push(`\nON SCREEN: a "Learn it" lesson for the card "${appContext.learnMoment.front}" (${appContext.learnMoment.intro ? 'a NEW card, taught before its questions' : 'the learner gave up on it'}; it is being TAUGHT, so it is not secret)${appContext.learnMoment.back ? `. Card back: ${appContext.learnMoment.back}` : ''}. The learner must type it once to continue.`)
    if (ss.gradedRecent?.length) parts.push(`Recently graded this session: ${ss.gradedRecent.map((g) => `"${g.front}" → ${g.rating}`).join(', ')}`)
    if (appContext.pbqReview) parts.push(`\nON SCREEN: the result of a practice exercise (${appContext.pbqReview.format}): ${appContext.pbqReview.correct} of ${appContext.pbqReview.total} right, rated ${appContext.pbqReview.rating}. Its answers are shown, so they are not secret.`)
    if (appContext.studyPhase === 'summary') parts.push('\nON SCREEN: the session SUMMARY (the session is over; every card listed is finished, so nothing is secret).')
  } else if (tab === 'study' && appContext.studyStart) {
    const st = appContext.studyStart
    parts.push(`\nON THE STUDY START SCREEN (no session running): deck "${st.deck || 'none'}", type ${st.type}, answer style ${st.answerStyle}. The user picks a deck and options, then presses Start.`)
    if (st.questionDepth) parts.push(depthLine(st))
  } else if (appContext.studyActive) {
    // A session exists but the user has navigated AWAY from the study screen. Do NOT present its
    // question as on-screen — this is exactly the "Ebi answered about a study question while on Stats" bug.
    parts.push(`\n(Background only, NOT on screen: a study session is paused on the Study tab: deck="${appContext.studyDeck}", ${ss.completed ?? 0} done / ${ss.activeCards ?? 0} active. The user is NOT looking at it right now. You may summarize it if asked, but do not say a question is currently on screen.)`)
  }
  // What this session got wrong (finished cards only): shown on every screen so "what did I get wrong?" works anywhere.
  if (appContext.studyReview) {
    const r = appContext.studyReview
    const counts = Object.entries(r.counts || {}).map(([k, n]) => `${k} ${n}`).join(', ')
    parts.push(`\nTHIS STUDY SESSION SO FAR (finished cards; ${counts}).`)
    if (r.wrong?.length) parts.push(`Questions answered WRONG (finished cards, safe to discuss):\n${r.wrong.map((c) => `- "${c.front}" (${c.rating}): ${c.wrong.map((w) => `asked "${w.q}", answered "${w.answer || '(skipped)'}"${w.expected ? `, expected "${w.expected}"` : ''}${w.note ? ` [${w.note}]` : ''}`).join('; ')}`).join('\n')}`)
    if (r.insights) parts.push(`Session insights shown to the user: ${r.insights}`)
  }
  const prefs = appContext.questionPreferences || ss.questionPreferences
  if (prefs?.length) parts.push(`Saved question-style preferences for this mode:\n${prefs.map((p) => `- ${p}`).join('\n')}`)

  if (appContext.progressObservations) {
    parts.push(`\nLEARNER PROGRESS NOTES (AI-maintained memory across sessions: the user's struggles, improvements, goals and interests; use them to personalize your help):\n${appContext.progressObservations}`)
  }

  parts.push(`\nCAPABILITIES: you can make REAL adjustments, not just explain:
- If the user asks to change HOW study questions are formed (style, wording, format, phrasing), include <action>{"type":"question_preference","preference":"<ONE concise imperative rule in English, generalized beyond a single card>"}</action> anywhere in your reply. It is saved to the current mode's settings and shapes every future question. Confirm in your reply what you saved.
- If the user asks to change MANY EXISTING CARDS at once (e.g. "rewrite all my pronunciation lines as Latin American Spanish", "add an example sentence to every card"), first make sure the request is specific enough to act on, then include <action>{"type":"deck_edit","instruction":"<ONE clear imperative instruction: exactly what to change and what to leave untouched>"}</action>. The app opens the Deck tab and builds a before/after preview of every affected card: tell the user NOTHING is saved until they review and accept each change there. If the request is vague ("make my cards better"), ask what specifically to change instead of emitting the action.
- If the user wants FUTURE generation geared to a regional language variant (e.g. "all new Spanish cards should use Latin American pronunciation"), include <action>{"type":"set_dialect","dialect":"<the variant, e.g. Latin American Spanish>"}</action>. This sets the mode's Dialect setting (Settings → Study → "Dialect / variant") and steers ALL generation from then on: new cards' pronunciation lines, memory hooks, tapped-word phonetics, and questions. Confirm what you set. It does NOT rewrite existing cards: offer the bulk edit (previous bullet) for those.
${appContext.legendsAvailable ? `- If the user asks to change their LEGENDS adventure map (new topics or areas, a different order, a new look for the area art), include <action>{"type":"legends_edit","request":"<the change, one clear sentence>"}</action>. The app opens Legends > Change my map with a before/after preview: tell the user NOTHING changes until they accept it there, and areas they already started never change.
` : ''}${tab === 'study' && appContext.currentQuestion ? '- To fix the QUESTION CURRENTLY ON SCREEN in place, tell them about the "✎ Fix question" button under the answer box: it regenerates that question and also remembers the preference.\n' : tab === 'legends' ? '- A Legends question that is badly worded: there is no Fix button there; the "🔄 New questions" button writes a fresh set for that step.\n' : ''}- Other study settings (deck, learning language, questions per card, saved preferences) live in ⚙ Settings → Study: direct them precisely.
- AFTER ANY ACTION: the app automatically appends a verified "Checked by the app" list to your reply that states exactly what was changed and which systems it affects, so the user KNOWS it truly happened. So keep your own confirmation short and natural ("Done!") and NEVER claim you changed something you did not emit an action for. If you only explained something and changed nothing, do not imply anything was saved.`)

  if (appContext.chatTabMsgs?.length) {
    parts.push(`\nRecent Chat tab messages:`)
    appContext.chatTabMsgs.forEach(m => parts.push(`  [${m.role}]: ${m.content}`))
  }

  if (appContext.knowledge) {
    parts.push(`\nKnowledge base for this mode (the user's own reference material: use it when answering subject questions):\n${appContext.knowledge}`)
  }

  parts.push('\nUse this context to give informed, specific answers. If the user asks about a word, translation, or card on screen, reference the actual data above.')
  return parts.join('\n')
}

export default function HelpChat({ t = (k) => k, apiKey, appContext, model = 'claude-sonnet-4-6', askAI, parseAiObject, mascotFile = DEFAULT_SHRIMP, onAiReply, onAction, askEbiSignal, hideButton, onOpenSettings, canSave }) {
  const [open, setOpen] = useState(false)
  // The LIVE handler: a reply lands seconds after Send, and the send-time render's onAction judged Anki,
  // the open deck and a running check from before the wait (its receipt could say the opposite of what happened).
  const onActionRef = useRef(onAction)
  onActionRef.current = onAction
  // FancyZones-style snapping. null = floating popup anchored to the button.
  // 'left'|'right'|'top'|'bottom' = snapped to that screen edge ('bottom' sits under the question).
  // 'free' = detached panel at chatPos.
  // Remembered (per browser): the dock choice was thrown away on every close and reload.
  const [snapZone, setSnapZone] = useState(() => { try { const z = localStorage.getItem('ebiki-help-dock'); return ['left', 'right', 'bottom', 'free'].includes(z) ? z : null } catch { return null } })
  const [chatPos, setChatPos] = useState(() => { try { const p = JSON.parse(localStorage.getItem('ebiki-help-pos') || 'null'); return p && Number.isFinite(p.x) && Number.isFinite(p.y) ? p : { x: 80, y: 80 } } catch { return { x: 80, y: 80 } } }) // free-float position (layout px)
  useEffect(() => { try { if (snapZone) localStorage.setItem('ebiki-help-dock', snapZone); else localStorage.removeItem('ebiki-help-dock') } catch { /* private window */ } }, [snapZone])
  useEffect(() => { try { localStorage.setItem('ebiki-help-pos', JSON.stringify(chatPos)) } catch { /* private window */ } }, [chatPos])
  const [snapDragging, setSnapDragging] = useState(false)
  const [choosingZone, setChoosingZone] = useState(false) // dock button → pick a zone by clicking
  const [hoverZone, setHoverZone] = useState(null) // zone highlighted under the cursor while dragging/choosing
  const [messages, setMessages] = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [pos, setPos] = useState({ x: 20, y: null })
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const dragStart = useRef({ x: 0, y: 0 })
  const wasOpenBeforeDrag = useRef(false)
  const didDrag = useRef(false)
  const snapDragOffset = useRef({ x: 0, y: 0 })
  const hoverZoneRef = useRef(null)
  const msgTopRef = useRef(null)
  const btnRef = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)

  // Open the chat when the host fires the "Ask Ebi" signal (e.g. the study companion button).
  // Only a NEW signal: remounted (after Run setup again) with the old count, the panel popped open by itself.
  const askSeenRef = useRef(askEbiSignal)
  useEffect(() => {
    if (askEbiSignal === askSeenRef.current) return
    askSeenRef.current = askEbiSignal
    if (askEbiSignal) { setOpen(true); setTimeout(() => inputRef.current?.focus(), 80) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askEbiSignal])

  // Load the most recent help session on mount. The session id is adopted only TOGETHER with its
  // messages: adopting it when the load failed (share down, a damaged file) made the next message
  // save a 2-message chat over that id, erasing the stored conversation. Skipped once the user has
  // already started typing a conversation (the late load would replace it on screen).
  const userStartedRef = useRef(false)
  useEffect(() => {
    apiFetch('/api/chats').then(r => (r.ok ? r.json() : [])).then(sessions => {
      const helpSessions = (Array.isArray(sessions) ? sessions : []).filter(s => s.type === 'help')
      if (helpSessions.length > 0) {
        const latest = helpSessions[0] // already sorted by mtime desc
        apiFetch(`/api/chat-load?id=${encodeURIComponent(latest.id)}`).then(r => (r.ok ? r.json() : null)).then(data => {
          if (!Array.isArray(data?.messages) || userStartedRef.current) return
          setSessionId(latest.id)
          // Normalize: a Help chat continued from the Chat tab stores `content`, never `text`, and those
          // messages rendered as blank bubbles and reached the model as "undefined".
          setMessages(data.messages.map((m) => ({ ...m, text: m.text ?? m.content ?? '' })))
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  // Save help chat to disk
  // Did the LAST save reach disk? "New chat" re-saves only then (a failed save, e.g. a 503 while the
  // share is down, left the latest turn only in this panel).
  const lastSaveOkRef = useRef(true)
  const saveMessages = async (msgsIn, sid) => {
    const msgs = (msgsIn || []).filter((m) => !m.error) // the app's error bubbles are never saved (see sendMessage)
    if (!msgs || msgs.length === 0) return sid
    // Frozen while the data folder switches (or the share just came back): the server already points at the
    // OTHER folder, so this chat would be written there under its old id. Kept unsaved (lastSaveOkRef).
    if (canSave && !canSave()) { lastSaveOkRef.current = false; return sid }
    const title = msgs[0]?.text?.slice(0, 40) || 'Help Chat'
    try {
      const res = await apiFetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // keepTitle: a Help chat renamed from the Chat tab's list keeps its name (see /api/chats POST).
        body: JSON.stringify({ id: sid || undefined, title, messages: msgs, type: 'help', keepTitle: true }),
      })
      const data = await res.json().catch(() => null)
      lastSaveOkRef.current = !!(res.ok && data?.id)
      return (res.ok && data?.id) || sid
    } catch { lastSaveOkRef.current = false; return sid }
  }

  // New chat — save current, start fresh
  const newChat = async () => {
    // A reply in flight lands in the conversation it was asked in; starting a new chat under it put
    // the old conversation back on screen with no id, so the next message duplicated it.
    // sendingRef is held across the save: a double click saved a never-saved chat twice (two copies), and a
    // message sent during the await was wiped by the reset below.
    if (loading || sendingRef.current) return
    sendingRef.current = true
    userStartedRef.current = true // a slow history load must not bring the old chat back over the new one
    try {
      // A chat with an id is already saved (every reply saves it). Re-posting the panel's copy made a
      // truncated duplicate when the chat had been continued in the Chat tab (the server forks a save
      // that is not a prefix of the file). Only a never-saved chat is saved here.
      if (messages.length > 0 && (!sessionId || !lastSaveOkRef.current)) {
        await saveMessages(messages, sessionId)
        // Still not saved (share down, server gone, folder switching): the chat stays on screen rather than vanish.
        if (!lastSaveOkRef.current) return
      }
      setMessages([])
      setSessionId(null)
    } finally { sendingRef.current = false }
  }

  // Scroll: user messages → scroll to bottom; assistant messages → scroll to start of reply
  useEffect(() => {
    if (!msgTopRef.current || messages.length === 0) return
    const last = messages[messages.length - 1]
    setTimeout(() => {
      if (!msgTopRef.current) return
      if (last.role === 'user') {
        // User sent a message — scroll to bottom so they see their message
        msgTopRef.current.scrollTop = msgTopRef.current.scrollHeight
      } else {
        // AI replied — scroll so the START of the reply is visible
        const els = msgTopRef.current.querySelectorAll('[data-msg]')
        if (els.length > 0) {
          els[els.length - 1].scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }, 50)
  }, [messages])

  // While choosing a dock spot, Esc cancels.
  useEffect(() => {
    if (!choosingZone) return
    // Capture phase + preventDefault: this Esc is used up here (App's Esc handler skips a handled Esc,
    // which otherwise also threw away a finished Picture analysis).
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); setChoosingZone(false); setHoverZone(null) } }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [choosingZone])

  // Docking / undocking renders another panel element, which started scrolled to the OLDEST message.
  useEffect(() => {
    if (!open) return
    setTimeout(() => { if (msgTopRef.current) msgTopRef.current.scrollTop = msgTopRef.current.scrollHeight }, 60)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!snapZone])
  // Esc closes the panel (not while its dock chooser, a dialog or another overlay has it).
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || choosingZone || e.isComposing || e.keyCode === 229) return // an IME composition's Esc cancels only that
      if (document.querySelector('[data-app-dialog],[data-top-overlay]')) return
      if (!panelRef.current?.contains(document.activeElement)) return // only when the user is IN the panel
      e.preventDefault(); setOpen(false)
    }
    window.addEventListener('keydown', onKey, true) // capture: first, so the Picture tab's Esc sees it handled
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, choosingZone])
  // On open, jump to the bottom so the most recent message is visible (history loads scrolled up).
  useEffect(() => {
    if (!open) return
    setTimeout(() => { if (msgTopRef.current) msgTopRef.current.scrollTop = msgTopRef.current.scrollHeight }, 60)
  }, [open])

  // Draggable. The page uses `body { zoom }`, so getBoundingClientRect/clientX are in
  // VISUAL px while CSS left/top are in pre-zoom LAYOUT px. We measure the live zoom from
  // the button itself (rect.width / offsetWidth) and convert, then clamp on-screen.
  const getZoom = () => {
    const el = btnRef.current || panelRef.current
    // Closed panel, no button: the BODY's zoom (1 here put a restored position off a smaller window).
    if (!el || !el.offsetWidth) { try { return parseFloat(getComputedStyle(document.body).zoom) || 1 } catch { return 1 } }
    return el.getBoundingClientRect().width / el.offsetWidth || 1
  }
  const handleMouseDown = (e) => {
    wasOpenBeforeDrag.current = open
    didDrag.current = false
    const btn = btnRef.current
    const rect = btn.getBoundingClientRect()
    const zoom = getZoom()
    // cursor position within the button, expressed in layout px
    dragOffset.current = { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
    dragStart.current = { x: e.clientX, y: e.clientY }
    setDragging(true)
    e.preventDefault()
  }
  useEffect(() => {
    if (!dragging) return
    const move = (e) => {
      const btn = btnRef.current
      if (!btn) return
      // Require real movement before treating as a drag — so clicks / spam-clicks never fling it.
      if (!didDrag.current) {
        if (Math.hypot(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y) < 5) return
        didDrag.current = true
        if (wasOpenBeforeDrag.current) setOpen(false)
      }
      const zoom = getZoom()
      const size = btn.offsetWidth
      const vw = window.innerWidth / zoom, vh = window.innerHeight / zoom
      let x = e.clientX / zoom - dragOffset.current.x
      let y = e.clientY / zoom - dragOffset.current.y
      // Clamp so it can never leave the viewport
      x = Math.max(4, Math.min(x, vw - size - 4))
      y = Math.max(4, Math.min(y, vh - size - 4))
      setPos({ x, y })
    }
    const up = () => {
      setDragging(false)
      if (didDrag.current && wasOpenBeforeDrag.current) setOpen(true)
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [dragging])

  // ─── FancyZones-style chat snapping ──────────────────────────────────────
  // Grab the chat header and drag: edge zones light up, the panel previews into the
  // hovered zone, and dropping commits it (or 'free' if dropped in open space).
  // Docked panel size is VIEWPORT-RELATIVE (with px clamps) so it takes the same SHARE of the
  // screen on a laptop as on a big monitor — a fixed 360px dock ate half a small display. The
  // /1.35 divides out the body zoom (same convention as the app root / settings modal).
  const ZONE_W = 'clamp(250px, calc(24vw / 1.35), 380px)'
  const ZONE_H = 'clamp(220px, calc(38vh / 1.35), 340px)'
  const FREE_W = 340, FREE_H = 440
  // The exact docked rectangle for each zone. Shared by the live panel AND the drop-zone preview
  // overlays so the preview outlines precisely where Ebi's Help will land.
  const ZONE_RECTS = {
    left: { left: 0, top: 0, bottom: 0, width: ZONE_W },
    right: { right: 0, top: 0, bottom: 0, width: ZONE_W },
    bottom: { bottom: 0, left: 0, right: 0, height: ZONE_H },
  }
  // Keeps the WHOLE free panel on screen: only its top 60px were kept in view, so a drop low on a short
  // window hid the composer below the edge. Height mirrors panelStyle's min(FREE_H, 80vh / 1.35).
  const clampFree = (x, y) => {
    const zoom = getZoom()
    const vw = window.innerWidth / zoom, vh = window.innerHeight / zoom
    const h = Math.min(FREE_H, (window.innerHeight * 0.8) / 1.35)
    return { x: Math.max(5, Math.min(x, vw - FREE_W - 5)), y: Math.max(5, Math.min(y, vh - h - 5)) }
  }
  // A window made smaller later (or a laptop screen after an external monitor) re-clamps it too.
  useEffect(() => {
    if (snapZone !== 'free') return
    const onResize = () => setChatPos((p) => { const c = clampFree(p.x, p.y); return c.x === p.x && c.y === p.y ? p : c })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapZone, open]) // open: measured again once the panel exists
  const snapDragStart = useRef({ x: 0, y: 0 })
  const didSnapDrag = useRef(false)
  const startSnapDrag = (e) => {
    e.preventDefault()
    const rect = panelRef.current?.getBoundingClientRect()
    const zoom = getZoom()
    snapDragOffset.current = rect
      ? { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
      : { x: 40, y: 16 }
    // From an edge zone the panel shrinks to the free size: an offset measured on the wide docked rect put the
    // floating panel far from the cursor (a Bottom dock grabbed on the right landed at the left edge).
    if (snapZone && snapZone !== 'free') snapDragOffset.current = { x: Math.min(snapDragOffset.current.x, FREE_W - 40), y: Math.min(snapDragOffset.current.y, 40) }
    snapDragStart.current = { x: e.clientX, y: e.clientY }
    didSnapDrag.current = false
    setSnapDragging(true)
  }
  useEffect(() => {
    if (!snapDragging) return
    const move = (e) => {
      // Require real movement before snapping, so clicking the header never yanks the panel.
      if (!didSnapDrag.current) {
        if (Math.hypot(e.clientX - snapDragStart.current.x, e.clientY - snapDragStart.current.y) < 5) return
        didSnapDrag.current = true
      }
      // Three intuitive targets: drag low → dock UNDER the question; drag to a side → dock there;
      // anywhere in the middle → free-float. (Big, sensible regions — no thin edge strips.)
      const fx = e.clientX / window.innerWidth, fy = e.clientY / window.innerHeight
      let zone = null
      if (fy > 0.62) zone = 'bottom'
      else if (fx < 0.26) zone = 'left'
      else if (fx > 0.74) zone = 'right'
      hoverZoneRef.current = zone
      setHoverZone(zone)
      const zoom = getZoom()
      const x = e.clientX / zoom - snapDragOffset.current.x
      const y = e.clientY / zoom - snapDragOffset.current.y
      setChatPos(clampFree(x, y))
      setSnapZone(zone || 'free') // live preview
    }
    const up = () => {
      setSnapDragging(false)
      if (didSnapDrag.current) setSnapZone(hoverZoneRef.current || 'free') // only commit on a real drag
      setHoverZone(null)
      hoverZoneRef.current = null
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [snapDragging])

  // Fixed-position style for the panel given its current snap zone.
  const panelStyle = () => {
    if (ZONE_RECTS[snapZone]) return { position: 'fixed', ...ZONE_RECTS[snapZone] }
    // FIXED height (viewport-capped), not maxHeight — the panel must open at full size, not
    // start tiny and grow as the conversation lengthens.
    return { position: 'fixed', left: chatPos.x, top: chatPos.y, width: FREE_W, height: `min(${FREE_H}px, calc(80vh / 1.35))` } // 'free'
  }
  const isEdgeZone = !!ZONE_RECTS[snapZone]

  // Routed through the host's aiCall (askAI) so Help works on ANY provider, not just Anthropic.
  // A ref as well as `loading`: a double Enter read loading=false twice (the chat re-read below awaits), and
  // both sends ran on the same history.
  const sendingRef = useRef(false)
  const sendMessage = async () => {
    if (!input.trim() || loading || !apiKey || !askAI || sendingRef.current) return
    sendingRef.current = true
    const userMsg = input.trim()
    userStartedRef.current = true
    setInput('')
    setLoading(true)
    // The same Help chat can be opened and continued in the Chat tab, so what is on disk may be
    // NEWER than this panel's copy: saving the panel's copy erased the Chat-tab turns (and a chat
    // deleted from the Chat list came back). Re-read it first and build on the disk version; a chat
    // that no longer exists starts a new one. A failed read (network) keeps the panel's copy.
    let sid = sessionId
    let base = messages
    // Frozen (data folder switching): the re-read would come from the new folder, where a 404 says nothing.
    if (sid && (!canSave || canSave())) {
      try {
        const r = await apiFetch(`/api/chat-load?id=${encodeURIComponent(sid)}`)
        // While OFFLINE the server reads the local copy (last backup), which may predate this chat: that
        // 404 does not mean "deleted", and treating it so wiped the conversation from the panel.
        if (r.status === 404 && !r.headers.get('X-Ebiki-Offline')) { sid = null; base = []; setSessionId(null) }
        else if (r.ok) {
          const data = await r.json()
          if (Array.isArray(data?.messages)) {
            const disk = data.messages.map((m) => ({ ...m, text: m.text ?? m.content ?? '' }))
            // The panel's last save FAILED and the disk copy is just its older prefix: the panel holds turns that
            // never reached disk, and adopting the disk copy threw them away for good.
            const key = (m) => `${m.role}\u0000${m.text ?? m.content ?? ''}`
            const saved = messages.filter((m) => !m.error) // error bubbles are never saved
            const isPrefix = disk.length <= saved.length && disk.every((m, i) => key(m) === key(saved[i]))
            if (!(lastSaveOkRef.current === false && isPrefix)) base = disk
          }
        }
      } catch { /* keep the panel's copy */ }
    }
    const newMsgs = [...base, { role: 'user', text: userMsg }]
    setMessages(newMsgs)

    // The mode this question was ASKED in: the panel stays open across mode switches, and an action
    // in the reply ("use Latin American Spanish") belongs to the mode the conversation was about.
    const modeIdAtSend = appContext?.activeMode?.id
    try {
      const sys = buildSystemPrompt(appContext) + `\n\nYou run on the model "${model}". If the user asks what AI model powers you, just tell them: it's not a secret.`
      // Bounded history (see the Chat tab): newest turns up to ~60k characters plus the opening message,
      // so a long Help chat can't grow past the model's context and fail on every later message.
      const convoLines = newMsgs.filter((m) => !m.error).map(m => `${m.role === 'user' ? 'User' : 'Ebi'}: ${m.text}`)
      let kept = [], used = 0
      for (let i = convoLines.length - 1; i >= 0; i--) {
        if (kept.length && used + convoLines[i].length > 60000) break
        kept.unshift(convoLines[i]); used += convoLines[i].length
      }
      // The opening message comes back capped (see the Chat tab's boundChatHistory): a huge first paste
      // rode along in full on every send and kept the chat over the model's limit.
      const first = convoLines[0] && convoLines[0].length > 4000 ? convoLines[0].slice(0, 4000) + ' …(cut)' : convoLines[0]
      if (kept.length < convoLines.length) kept = [first, '(earlier messages omitted)', ...kept]
      const convo = kept.join('\n\n')
      const raw = (await askAI(sys, convo) || '')
      // Execute any adjustment actions Ebi emitted, and collect an APP-GENERATED receipt for each
      // (onAction returns a factual "what changed + what it affects" string ONLY when the change
      // truly applied). These are the ground truth the user can trust — not the model's own claim.
      const receipts = []
      for (const am of raw.matchAll(/<action>(.*?)<\/action>/gs)) {
        let r = null
        try {
          // Tolerant parse (the host's parseAiObject when given): a stray character inside the tag
          // used to drop the action silently while Ebi's reply claimed the change was made.
          const action = parseAiObject ? parseAiObject(am[1]) : JSON.parse(am[1])
          r = action ? onActionRef.current?.(action, { modeId: modeIdAtSend }) : null
        } catch { r = null }
        // Unreadable, unknown or missing its value: nothing changed, and the reply's own claim must not stand alone.
        receipts.push(r || t('hr_notApplied'))
      }
      // Strip shrimp/crustacean emoji as a hard guarantee (the prompt forbids them, but prompts leak):
      // Ebi's shrimp-ness is the mascot art, never an emoji in the text.
      // A reply cut off inside an <action> tag (the 600-token cap) showed the raw JSON, and the change it
      // described never ran: strip it and say so.
      const cutAction = /<action>(?![\s\S]*<\/action>)[\s\S]*$/.test(raw)
      if (cutAction) receipts.push(t('hr_cutOff'))
      let replyText = raw.replace(/<action>.*?<\/action>/gs, '').replace(/<action>[\s\S]*$/, '').replace(/(\d)[ \t]*[—–][ \t]*(\d)/g, '$1-$2').replace(/(^|\n)[ \t]*[—–][ \t]*/g, '$1').replace(/[ \t]*[—–][ \t]*(?=\n|$)/g, '').replace(/[ \t]*[—–][ \t]*/g, ', ').replace(/([ \t]?)(?:[🦐🦞🦀]️?)+([ \t]?)/gu, (m, a, b) => (a || b ? ' ' : '')).trim() || '…' // line-aware; indentation kept (nested list items, code)
      // Append the verified change log so the user can confirm, for a fact, what the app actually did.
      if (receipts.length) replyText += `\n\n**${t('hr_header')}**\n` + receipts.map((r) => `- ${r}`).join('\n')
      const updatedMsgs = [...newMsgs, { role: 'assistant', text: replyText }]
      // Pick Ebi's pose FIRST (awaited) so his face changes WITH the reply, not a beat after it. The
      // Mascot model resolves the pose, then the message + new pose land together (Chat-tab parity).
      await onAiReply?.(replyText)
      setMessages(updatedMsgs)
      const savedId = await saveMessages(updatedMsgs, sid)
      if (savedId !== sid) setSessionId(savedId) // new, or a copy the server made (changed on another computer)
    } catch (err) {
      // Shown, translated, but NOT saved as Ebi's turn: a saved "Error: ..." went back to the model as
      // something Ebi had said, in every later message of that chat. The question itself is saved.
      setMessages([...newMsgs, { role: 'assistant', text: t('chat_replyError', { msg: String(err?.message || '').slice(0, 160) }), error: true }])
      const savedId = await saveMessages(newMsgs, sid)
      if (savedId !== sid) setSessionId(savedId)
    } finally {
      sendingRef.current = false
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  // Position chat snug to button, opening toward available space. All math is done in
  // layout px (rect/innerWidth are visual → divide by zoom) since the popup uses CSS left/top.
  const getChatStyle = () => {
    const btn = btnRef.current
    const rect = btn?.getBoundingClientRect()
    // No floating button to anchor to (e.g. opened via "Ask Ebi" during study): show a
    // normal chat panel docked to the bottom-left corner instead of filling the screen.
    if (!rect) return { position: 'fixed', left: 20, bottom: 20, width: 360, height: 'min(460px, calc(80vh / 1.35))' }
    const zoom = getZoom()
    const left = rect.left / zoom, right = rect.right / zoom
    const top = rect.top / zoom, bottom = rect.bottom / zoom
    const vw = window.innerWidth / zoom, vh = window.innerHeight / zoom
    const chatW = 340, chatH = 400
    const btnCX = (left + right) / 2
    const btnCY = (top + bottom) / 2
    const style = { position: 'fixed', width: chatW, height: `min(${chatH}px, calc(80vh / 1.35))` }

    // Horizontal: align left edge with button, or right-align if near right edge
    style.left = btnCX < vw / 2 ? left : right - chatW
    style.left = Math.max(5, Math.min(style.left, vw - chatW - 5))

    // Vertical: open above button if in bottom half, below if in top half
    if (btnCY > vh / 2) {
      style.bottom = vh - top + 8
    } else {
      style.top = bottom + 8
    }
    return style
  }

  const chatContent = (isSidePanel) => (
    <>
      {/* Header */}
      <div
        onMouseDown={startSnapDrag}
        style={{ padding: '10px 14px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, cursor: snapDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
        title={t('help_dragTip')}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--c-ink-faint)', fontSize: 12, lineHeight: 1, letterSpacing: -1 }}>⠿</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: 'linear-gradient(90deg, var(--c-brand), var(--c-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('help_title')}</span>
          {messages.length > 0 && (
            <span
              onMouseDown={(e) => e.stopPropagation()}
              onClick={newChat}
              title={t('help_newChat')}
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 11, padding: '1px 6px', border: '1px solid var(--c-border)', borderRadius: 4, lineHeight: '16px' }}
            >+</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Ebi on the right of the title line — reflects the context-aware pose (mascotFile).
              Sized up but with negative vertical margins so it doesn't bloat the header height. */}
          <img src={shrimpUrl(mascotFile || IDLE_SHRIMP)} alt="Ebi" draggable={false} style={{ width: 46, height: 46, objectFit: 'contain', pointerEvents: 'none', margin: '-10px 0', transition: 'opacity .2s' }} />
          {isSidePanel ? (
            <span
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setSnapZone(null) }}
              title={t('help_popOut')}
              className="click-dim"
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1, padding: '3px 5px', borderRadius: 5 }}
            >&#8599;</span>
          ) : (
            <span
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setChoosingZone(true) }}
              title={t('help_dockPick')}
              className="click-dim"
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1, padding: '3px 5px', borderRadius: 5 }}
            >&#9699;</span>
          )}
          <span onMouseDown={(e) => e.stopPropagation()} onClick={() => { setOpen(false); setChoosingZone(false); setHoverZone(null) }} role="button" tabIndex={0} aria-label={t('close')} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(false); setChoosingZone(false); setHoverZone(null) } }} className="click-dim" style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 16, lineHeight: 1, padding: '2px 5px', borderRadius: 5 }}>&times;</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={msgTopRef} style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
        {messages.length === 0 && !apiKey && (
          // No API key: Ebi can't answer, so point the user straight at where to add one.
          <div style={{ color: 'var(--c-ink-dim)', fontSize: 12, textAlign: 'center', padding: '28px 12px', lineHeight: 1.6 }}>
            <div style={{ marginBottom: 12 }}>{t('help_noKeyLine')}</div>
            <button onClick={() => onOpenSettings?.()} className="btn-press" style={{
              border: 'none', background: 'var(--c-brand)', color: '#fff', fontWeight: 700, fontSize: 12,
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
            }}>{t('help_addKey')}</button>
          </div>
        )}
        {messages.length === 0 && apiKey && (
          <div style={{ color: 'var(--c-ink-faint)', fontSize: 11, textAlign: 'center', padding: '30px 10px', lineHeight: 1.6 }}>
            {t('help_emptyLine1')}<br />
            {t('help_emptyEx1')}<br />
            {t('help_emptyEx2')}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} data-msg style={{
            // Second pass: the same bubbles as the Chat tab (your words in solid ink, Ebi's on a calm card).
            marginBottom: 8, padding: m.role === 'user' ? '8px 12px' : '10px 12px',
            borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
            background: m.role === 'user' ? 'var(--c-ink-solid)' : 'var(--c-surface)',
            border: m.role === 'user' ? '1px solid var(--c-ink-solid)' : '1px solid var(--c-border)',
            fontSize: 12.5, color: m.role === 'user' ? 'var(--c-on-ink)' : 'var(--c-ink)', lineHeight: 1.6,
            wordBreak: 'break-word', boxShadow: 'var(--sh-sm)',
            ...(m.role === 'user' ? { whiteSpace: 'pre-wrap', width: 'fit-content', maxWidth: '88%', marginLeft: 'auto', fontWeight: 600 } : {}),
          }}>
            {m.role === 'user' ? m.text : <Markdown text={m.text} />}
          </div>
        ))}
        {loading && (
          <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', padding: '4px 10px' }}>{t('help_thinking')}</div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 6, flexShrink: 0 }}>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) sendMessage() }}
          placeholder={apiKey ? (loading ? t('help_thinking') : t('help_placeholder')) : t('help_placeholderNoKey')}
          disabled={!apiKey}
          style={{
            flex: 1, padding: '7px 11px', background: 'var(--c-surface)', color: 'var(--c-ink)',
            border: '1px solid rgba(255,255,255,.1)', borderRadius: 8, fontSize: 11,
            fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!apiKey || loading || !input.trim()}
          style={{
            padding: '7px 14px', background: 'linear-gradient(135deg, var(--c-brand), var(--c-purple))', color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 11,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(223,37,64,.35)',
            opacity: !apiKey || loading || !input.trim() ? 0.4 : 1,
          }}
        >
          {t('help_send')}
        </button>
      </div>
    </>
  )

  // The button always shows the global Ebi pose (set by the Mascot model via the host).
  const buttonMascot = mascotFile

  return (
    <>
      {/* Ebi help button: always flipped to face right (.flipped), with a little pop (scale up) on
          hover. Every state uses the SAME transform function list (scale + scaleX) so transitions
          interpolate per-function — otherwise mismatched lists fall back to matrix interpolation,
          which makes the mirror pass through scaleX=0 and collapse to a 1px line. */}
      <style>{`
        .ebi-fab-img { transition: transform .22s cubic-bezier(.34,1.56,.64,1), filter .25s ease; transform-origin: 50% 70%; transform: scale(1) scaleX(1); }
        .ebi-fab-img.flipped { transform: scale(1) scaleX(-1); }
        .ebi-fab:hover .ebi-fab-img { transform: scale(1.14) scaleX(1); }
        .ebi-fab:hover .ebi-fab-img.flipped { transform: scale(1.14) scaleX(-1); }
      `}</style>
      {/* Floating help button — hidden when the chat is snapped/detached, or when the host hides it (e.g. study Ebi is shown) */}
      {!snapZone && !hideButton && (
        <button
          ref={btnRef}
          className="ebi-fab"
          onMouseDown={handleMouseDown}
          onClick={() => { if (!didDrag.current) setOpen(!open) }}
          style={{
            position: 'fixed', left: pos.x,
            ...(pos.y !== null ? { top: pos.y } : { bottom: 20 }),
            width: 80, height: 80,
            // No circle, no background — just the transparent PNG. The glow lives on the image's
            // drop-shadow (below), which traces the shrimp's silhouette instead of a disc.
            background: 'transparent', border: 'none', boxShadow: 'none', borderRadius: 0,
            padding: 0, overflow: 'visible',
            cursor: dragging ? 'grabbing' : 'grab',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000,
            fontFamily: 'inherit',
          }}
          title={t('help_fabTip')}
        >
          {/* Transparent PNG with a soft red glow that hugs the shrimp's shape (drop-shadow follows
              the alpha channel), so there's no circle — just Ebi with a slight glow around it. */}
          <img
            src={shrimpUrl(buttonMascot)}
            alt="Ebi"
            draggable={false}
            className="ebi-fab-img flipped"
            style={{
              width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 3px rgba(0,0,0,.3))', // no red glow around Ebi (the owner)
            }}
          />
        </button>
      )}

      {/* Floating popup — anchored to the button (no snap zone) */}
      {open && !snapZone && (() => {
        const chatStyle = getChatStyle()
        return (
          <div ref={panelRef} data-help-panel="" style={{
            ...chatStyle,
            background: 'color-mix(in srgb, var(--c-surface) 94%, transparent)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--c-border)',
            borderRadius: 16, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            zIndex: 10000, boxShadow: 'var(--sh-xl)',
            fontFamily: FONT.body,
            animation: 'pop .18s cubic-bezier(.34,1.56,.64,1)',
          }}>
            {chatContent(false)}
          </div>
        )
      })()}

      {/* Snapped / detached panel (left·right·top·bottom edge zones, or free-floating) */}
      {open && snapZone && (
        <div ref={panelRef} data-help-panel="" style={{
          ...panelStyle(),
          background: 'color-mix(in srgb, var(--c-surface) 94%, transparent)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--c-border)',
          borderRadius: isEdgeZone ? 0 : 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          zIndex: 10000, boxShadow: 'var(--sh-xl)',
          fontFamily: FONT.body,
          transition: snapDragging ? 'none' : 'left .14s ease, top .14s ease, width .14s ease, height .14s ease',
        }}>
          {chatContent(true)}
        </div>
      )}

      {/* Drop-zone overlays. Shown while DRAGGING the header (drop to snap) OR after clicking the
          dock button (CHOOSING — click a zone to dock). Each overlay uses the SAME rectangle the
          panel docks into (ZONE_RECTS) so the preview is exactly where it lands. */}
      {(snapDragging || choosingZone) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: choosingZone ? 10001 : 9998, pointerEvents: choosingZone ? 'auto' : 'none' }}>
          {/* Dimmed backdrop + instruction when choosing (clicking it cancels). */}
          {choosingZone && (
            <div
              onClick={() => { setChoosingZone(false); setHoverZone(null) }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(16,36,44,.28)', backdropFilter: 'blur(1px)' }}
            >
              <div style={{
                position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
                background: 'var(--c-brand)', color: '#fff', fontFamily: FONT.body, fontSize: 13, fontWeight: 700,
                padding: '8px 16px', borderRadius: 999, boxShadow: '0 8px 22px rgba(223,37,64,.35)',
              }}>{t('help_dockPrompt')}</div>
            </div>
          )}
          {[
            { id: 'left', label: t('help_dockLeft') },
            { id: 'right', label: t('help_dockRight') },
            { id: 'bottom', label: t('help_dockUnder') },
          ].map(z => (
            <div key={z.id}
              onMouseEnter={() => choosingZone && setHoverZone(z.id)}
              onMouseLeave={() => choosingZone && setHoverZone(null)}
              onClick={choosingZone ? () => { setSnapZone(z.id); setChoosingZone(false); setHoverZone(null) } : undefined}
              style={{
                position: 'fixed', ...ZONE_RECTS[z.id],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: FONT.body, fontSize: 14, fontWeight: 700,
                cursor: choosingZone ? 'pointer' : 'default',
                color: hoverZone === z.id ? 'var(--c-brand)' : 'rgba(223,37,64,.6)',
                background: hoverZone === z.id ? 'rgba(223,37,64,.18)' : 'color-mix(in srgb, var(--c-surface) 70%, transparent)',
                border: hoverZone === z.id ? '2px solid rgba(223,37,64,.7)' : '2px dashed rgba(223,37,64,.4)',
                transition: 'background .12s ease, border-color .12s ease, color .12s ease',
              }}>{z.label}</div>
          ))}
        </div>
      )}
    </>
  )
}
