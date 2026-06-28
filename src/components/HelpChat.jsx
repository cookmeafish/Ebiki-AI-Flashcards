import { useState, useRef, useEffect } from 'react'
import { shrimpUrl, DEFAULT_SHRIMP, IDLE_SHRIMP } from '../config/shrimp'
import { FONT } from '../config/tokens'
import Markdown from './Markdown'

const HELP_BASE = `You are Ebi, the friendly helper inside the Ebiki study app — a cheerful little red shrimp. Speak naturally in first person as Ebi. Do NOT call yourself a "mascot" or break character; you're just Ebi, here to help. If asked who you are, say you're Ebi and you help with their studies. You are context-aware: you can answer questions about the app AND about whatever the user is currently working on (screenshots, translations, study sessions, Anki cards, etc). Answer briefly and conversationally, 2-3 sentences max unless the user asks for details. NEVER use em-dashes (—) or en-dashes (–); they read as fake/AI. Use commas, periods, or parentheses instead. You may use light markdown (bold, bullet lists) when it genuinely helps readability, but keep it minimal. The user can ask follow-up questions.

About Ebiki:
Ebiki is an AI-powered screen translation and learning app whose mascot is Ebi, a red shrimp. It captures screenshots, detects text via OCR, translates it, and integrates with Anki for flashcard study.

Key features:
Capture button / Ctrl+Shift+S: takes a screenshot to analyze.
Upload / paste / drag-drop: alternative ways to load images.
Mode button (toolbar): switch or create learning modes like "Language Learning" or "Security+". Each mode has its own settings.
Gear icon: opens settings for the current mode (Anki deck, card format, tags, study rules, knowledge base).
Study button: starts a quiz session using your Anki flashcards with AI-generated questions.
Deck button: browse, edit, search, and delete Anki flashcards.
Overlay button: launches an Electron overlay for translating game/app screens. Press Ctrl+Shift+S in-game, ESC to dismiss.
Key Set: configure your AI provider API key.
Knowledge Base (in settings): upload reference materials (.txt/.md) for smarter study questions.
Grammar feedback: optional toggle in study settings for grammar correction during quizzes.
Anki integration requires the AnkiConnect addon (code 2055492159) running in Anki desktop.`

function buildSystemPrompt(appContext) {
  if (!appContext) return HELP_BASE
  const parts = [HELP_BASE, '\n--- CURRENT APP STATE ---']

  parts.push(`Active tab: ${appContext.activeTab || 'unknown'}`)
  parts.push(`Mode: ${appContext.activeMode?.name || 'unknown'} (${appContext.activeMode?.type || ''})`)
  parts.push(`Anki deck: ${appContext.activeMode?.ankiDeck || 'none set'}`)
  parts.push(`Anki connected: ${appContext.ankiConnected ? 'yes' : 'no'}`)
  if (appContext.ankiDecks?.length) parts.push(`Available Anki decks: ${appContext.ankiDecks.join(', ')}`)
  parts.push(`Source language: ${appContext.language || 'auto'}, Target language: ${appContext.targetLang || 'eng'}`)
  parts.push(`Screenshot loaded: ${appContext.screenshot ? 'yes' : 'no'}, Stage: ${appContext.stage || 'idle'}`)

  if (appContext.ocrWords?.length) {
    const words = appContext.ocrWords.filter(w => w.text).slice(0, 40)
    parts.push(`\nDetected words (${appContext.ocrWords.length} total, showing up to 40):`)
    parts.push(words.map(w => w.translation ? `${w.text} → ${w.translation}` : w.text).join(', '))
  }

  if (appContext.activeWord) {
    const w = appContext.activeWord
    parts.push(`\nCurrently selected word: "${w.text}"`)
    if (w.translation) parts.push(`  Translation: ${w.translation}`)
    if (w.pronunciation) parts.push(`  Pronunciation: ${w.pronunciation}`)
    if (w.definition) parts.push(`  Definition: ${w.definition}`)
    if (w.synonyms) parts.push(`  Synonyms: ${w.synonyms}`)
    if (w.example) parts.push(`  Example: ${w.example}`)
  }

  if (appContext.explanation) parts.push(`\nWord explanation: ${appContext.explanation.slice(0, 300)}`)
  if (appContext.deepExplanation) parts.push(`Deep explanation: ${appContext.deepExplanation.slice(0, 500)}`)

  if (appContext.ankiCard) {
    parts.push(`\nAnki card ready: Front="${appContext.ankiCard.front}", Back="${appContext.ankiCard.back?.slice(0, 200)}"`)
  }

  if (appContext.studyActive) {
    parts.push(`\nStudy session active: deck="${appContext.studyDeck}", phase=${appContext.studyPhase}`)
    parts.push(`Study stats: easy=${appContext.studyStats?.easy}, good=${appContext.studyStats?.good}, hard=${appContext.studyStats?.hard}, again=${appContext.studyStats?.again}`)
    if (appContext.studyDeckStats) parts.push(`Deck stats: new=${appContext.studyDeckStats.new_count}, learning=${appContext.studyDeckStats.learn_count}, review=${appContext.studyDeckStats.review_count}`)
    if (appContext.currentQuestion) parts.push(`Current question: "${appContext.currentQuestion.question}" (card: "${appContext.currentQuestion.cardFront}")`)
  }

  if (appContext.chatTabMsgs?.length) {
    parts.push(`\nRecent Chat tab messages:`)
    appContext.chatTabMsgs.forEach(m => parts.push(`  [${m.role}]: ${m.content}`))
  }

  parts.push('\nUse this context to give informed, specific answers. If the user asks about a word, translation, or card on screen, reference the actual data above.')
  return parts.join('\n')
}

export default function HelpChat({ apiKey, appContext, model = 'claude-sonnet-4-6', askAI, mascotFile = DEFAULT_SHRIMP, onAiReply, askEbiSignal, hideButton }) {
  const [open, setOpen] = useState(false)
  // FancyZones-style snapping. null = floating popup anchored to the button.
  // 'left'|'right'|'top'|'bottom' = snapped to that screen edge ('bottom' sits under the question).
  // 'free' = detached panel at chatPos.
  const [snapZone, setSnapZone] = useState(null)
  const [chatPos, setChatPos] = useState({ x: 80, y: 80 }) // free-float position (layout px)
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
  useEffect(() => {
    if (askEbiSignal) { setOpen(true); setTimeout(() => inputRef.current?.focus(), 80) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [askEbiSignal])

  // Load the most recent help session on mount
  useEffect(() => {
    fetch('/api/chats').then(r => r.json()).then(sessions => {
      const helpSessions = sessions.filter(s => s.type === 'help')
      if (helpSessions.length > 0) {
        const latest = helpSessions[0] // already sorted by mtime desc
        setSessionId(latest.id)
        fetch(`/api/chat-load?id=${encodeURIComponent(latest.id)}`).then(r => r.json()).then(data => {
          if (data?.messages?.length) setMessages(data.messages)
        }).catch(() => {})
      }
    }).catch(() => {})
  }, [])

  // Save help chat to disk
  const saveMessages = async (msgs, sid) => {
    if (!msgs || msgs.length === 0) return sid
    const title = msgs[0]?.text?.slice(0, 40) || 'Help Chat'
    try {
      const res = await fetch('/api/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sid || undefined, title, messages: msgs, type: 'help' }),
      })
      const data = await res.json()
      return data.id
    } catch { return sid }
  }

  // New chat — save current, start fresh
  const newChat = async () => {
    if (messages.length > 0) {
      await saveMessages(messages, sessionId)
    }
    setMessages([])
    setSessionId(null)
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
    const onKey = (e) => { if (e.key === 'Escape') { setChoosingZone(false); setHoverZone(null) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choosingZone])

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
    if (!el || !el.offsetWidth) return 1
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
  const ZONE_W = 360, ZONE_H = 320, FREE_W = 340, FREE_H = 440
  // The exact docked rectangle for each zone. Shared by the live panel AND the drop-zone preview
  // overlays so the preview outlines precisely where Ebi's Help will land.
  const ZONE_RECTS = {
    left: { left: 0, top: 0, bottom: 0, width: ZONE_W },
    right: { right: 0, top: 0, bottom: 0, width: ZONE_W },
    bottom: { bottom: 0, left: 0, right: 0, height: ZONE_H },
  }
  const snapDragStart = useRef({ x: 0, y: 0 })
  const didSnapDrag = useRef(false)
  const startSnapDrag = (e) => {
    e.preventDefault()
    const rect = panelRef.current?.getBoundingClientRect()
    const zoom = getZoom()
    snapDragOffset.current = rect
      ? { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom }
      : { x: 40, y: 16 }
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
      const vw = window.innerWidth / zoom, vh = window.innerHeight / zoom
      let x = e.clientX / zoom - snapDragOffset.current.x
      let y = e.clientY / zoom - snapDragOffset.current.y
      x = Math.max(5, Math.min(x, vw - FREE_W - 5))
      y = Math.max(5, Math.min(y, vh - 60))
      setChatPos({ x, y })
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
    return { position: 'fixed', left: chatPos.x, top: chatPos.y, width: FREE_W, maxHeight: FREE_H } // 'free'
  }
  const isEdgeZone = !!ZONE_RECTS[snapZone]

  // Routed through the host's aiCall (askAI) so Help works on ANY provider, not just Anthropic.
  const sendMessage = async () => {
    if (!input.trim() || loading || !apiKey || !askAI) return
    const userMsg = input.trim()
    setInput('')
    const newMsgs = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMsgs)
    setLoading(true)

    try {
      const sys = buildSystemPrompt(appContext) + `\n\nYou run on the model "${model}". If the user asks what AI model powers you, just tell them — it's not a secret.`
      const convo = newMsgs.map(m => `${m.role === 'user' ? 'User' : 'Ebi'}: ${m.text}`).join('\n\n')
      const replyText = (await askAI(sys, convo) || '').replace(/\s*[—–]\s*/g, ', ').trim() || '…'
      const updatedMsgs = [...newMsgs, { role: 'assistant', text: replyText }]
      setMessages(updatedMsgs)
      onAiReply?.(replyText) // let the host pick Ebi's pose via the Mascot model
      const savedId = await saveMessages(updatedMsgs, sessionId)
      if (!sessionId) setSessionId(savedId)
    } catch (err) {
      const updatedMsgs = [...newMsgs, { role: 'assistant', text: 'Error: ' + err.message }]
      setMessages(updatedMsgs)
      const savedId = await saveMessages(updatedMsgs, sessionId)
      if (!sessionId) setSessionId(savedId)
    } finally {
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
    if (!rect) return { position: 'fixed', left: 20, bottom: 20, width: 360, maxHeight: 460 }
    const zoom = getZoom()
    const left = rect.left / zoom, right = rect.right / zoom
    const top = rect.top / zoom, bottom = rect.bottom / zoom
    const vw = window.innerWidth / zoom, vh = window.innerHeight / zoom
    const chatW = 340, chatH = 400
    const btnCX = (left + right) / 2
    const btnCY = (top + bottom) / 2
    const style = { position: 'fixed', width: chatW, maxHeight: chatH }

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
        title="Drag to move or snap the chat to a screen edge"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--c-ink-faint)', fontSize: 12, lineHeight: 1, letterSpacing: -1 }}>⠿</span>
          <span style={{ fontSize: 12, fontWeight: 700, background: 'linear-gradient(90deg, var(--c-brand), var(--c-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Ebi's Help</span>
          {messages.length > 0 && (
            <span
              onMouseDown={(e) => e.stopPropagation()}
              onClick={newChat}
              title="New chat"
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
              title="Pop out to floating button"
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1 }}
            >&#8599;</span>
          ) : (
            <span
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => { setChoosingZone(true) }}
              title="Dock… pick a spot"
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1 }}
            >&#9699;</span>
          )}
          <span onMouseDown={(e) => e.stopPropagation()} onClick={() => { setOpen(false); setSnapZone(null) }} style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 16, lineHeight: 1 }}>&times;</span>
        </div>
      </div>

      {/* Messages */}
      <div ref={msgTopRef} style={{ flex: 1, overflow: 'auto', padding: '10px 14px' }}>
        {messages.length === 0 && (
          <div style={{ color: 'var(--c-ink-faint)', fontSize: 11, textAlign: 'center', padding: '30px 10px', lineHeight: 1.6 }}>
            Ask Ebi anything about Ebiki!<br />
            "What does Study do?"<br />
            "How do I use the overlay?"
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} data-msg style={{
            marginBottom: 8, padding: '8px 10px', borderRadius: 6,
            background: m.role === 'user' ? 'rgba(223,37,64,.1)' : 'rgba(24,169,87,.05)',
            border: m.role === 'user' ? '1px solid rgba(223,37,64,.15)' : '1px solid rgba(24,169,87,.1)',
            fontSize: 12, color: 'var(--c-ink)', lineHeight: 1.6,
            wordBreak: 'break-word',
            ...(m.role === 'user' ? { whiteSpace: 'pre-wrap' } : {}),
          }}>
            {m.role === 'user' ? m.text : <Markdown text={m.text} />}
          </div>
        ))}
        {loading && (
          <div style={{ fontSize: 11, color: 'var(--c-ink-dim)', padding: '4px 10px' }}>Thinking...</div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--c-border)', display: 'flex', gap: 6, flexShrink: 0 }}>
        <input
          ref={inputRef}
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
          placeholder={apiKey ? (loading ? 'Thinking...' : 'Ask a question...') : 'Set API key first'}
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
          Ask
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
          title="Ebi's Help — ask anything about Ebiki"
        >
          {/* Transparent PNG with a soft red glow that hugs the shrimp's shape (drop-shadow follows
              the alpha channel), so there's no circle — just Ebi with a slight glow around it. */}
          <img
            src={shrimpUrl(buttonMascot)}
            alt="Ebi, the Ebiki mascot"
            draggable={false}
            className="ebi-fab-img flipped"
            style={{
              width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center',
              pointerEvents: 'none',
              filter: open
                ? 'drop-shadow(0 0 6px rgba(223,37,64,.7)) drop-shadow(0 0 16px rgba(223,37,64,.5)) drop-shadow(0 2px 3px rgba(0,0,0,.3))'
                : 'drop-shadow(0 0 5px rgba(223,37,64,.55)) drop-shadow(0 0 13px rgba(223,37,64,.38)) drop-shadow(0 2px 3px rgba(0,0,0,.3))',
            }}
          />
        </button>
      )}

      {/* Floating popup — anchored to the button (no snap zone) */}
      {open && !snapZone && (() => {
        const chatStyle = getChatStyle()
        return (
          <div ref={panelRef} style={{
            ...chatStyle,
            background: 'color-mix(in srgb, var(--c-surface) 94%, transparent)',
            backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--c-border)',
            borderRadius: 16, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            zIndex: 10000, boxShadow: '0 24px 60px rgba(16,36,44,.18)',
            fontFamily: FONT.body,
            animation: 'pop .18s cubic-bezier(.34,1.56,.64,1)',
          }}>
            {chatContent(false)}
          </div>
        )
      })()}

      {/* Snapped / detached panel (left·right·top·bottom edge zones, or free-floating) */}
      {open && snapZone && (
        <div ref={panelRef} style={{
          ...panelStyle(),
          background: 'color-mix(in srgb, var(--c-surface) 94%, transparent)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--c-border)',
          borderRadius: isEdgeZone ? 0 : 16, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          zIndex: 10000, boxShadow: '0 24px 60px rgba(16,36,44,.18)',
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
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: choosingZone ? 'auto' : 'none' }}>
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
              }}>Where should Ebi's Help dock? Click a zone — Esc to cancel</div>
            </div>
          )}
          {[
            { id: 'left', label: 'Dock left' },
            { id: 'right', label: 'Dock right' },
            { id: 'bottom', label: 'Under the question' },
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
