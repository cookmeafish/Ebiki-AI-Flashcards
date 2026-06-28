import { useState, useRef, useEffect } from 'react'
import { shrimpUrl, DEFAULT_SHRIMP } from '../config/shrimp'
import { FONT } from '../config/tokens'

const HELP_BASE = `You are Ebi — the friendly mascot and built-in assistant of the Ebiki app. Ebi is a little red shrimp (Ebiki is a play on "ebi", the Japanese word for shrimp, and "Anki"). If the user asks who or what you (Ebi) are, tell them you're Ebiki's shrimp mascot and helper. You are context-aware: you can answer questions about the app AND about whatever the user is currently working on (screenshots, translations, study sessions, Anki cards, etc). Answer briefly and conversationally — 2-3 sentences max unless the user asks for details. Never use markdown formatting (no **, ##, -, etc). Just plain text. The user can ask follow-up questions.

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

export default function HelpChat({ apiKey, appContext, model = 'claude-sonnet-4-6', onModelRetired, mascotFile = DEFAULT_SHRIMP, onAiReply, askEbiSignal }) {
  const [open, setOpen] = useState(false)
  const [docked, setDocked] = useState(false) // side panel mode
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
  const msgTopRef = useRef(null)
  const btnRef = useRef(null)
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

  // Draggable. The page uses `body { zoom }`, so getBoundingClientRect/clientX are in
  // VISUAL px while CSS left/top are in pre-zoom LAYOUT px. We measure the live zoom from
  // the button itself (rect.width / offsetWidth) and convert, then clamp on-screen.
  const getZoom = () => {
    const btn = btnRef.current
    if (!btn || !btn.offsetWidth) return 1
    return btn.getBoundingClientRect().width / btn.offsetWidth || 1
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

  // Call Sonnet directly for better quality
  const sendMessage = async () => {
    if (!input.trim() || loading || !apiKey) return
    const userMsg = input.trim()
    setInput('')
    const newMsgs = [...messages, { role: 'user', text: userMsg }]
    setMessages(newMsgs)
    setLoading(true)

    try {
      const apiMessages = newMsgs.map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }))
      const callModel = async (mdl) => {
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
          },
          body: JSON.stringify({
            model: mdl,
            max_tokens: 300,
            system: buildSystemPrompt(appContext),
            messages: apiMessages,
          }),
        })
        if (!resp.ok) throw new Error('API ' + resp.status)
        return resp.json()
      }
      let data
      try {
        data = await callModel(model)
      } catch (err) {
        // Retired/invalid model → ask the host to find a current one, then retry once.
        const healed = (err.message.includes('404') && onModelRetired) ? await onModelRetired(model) : null
        if (!healed) throw err
        data = await callModel(healed)
      }
      const replyText = data.content[0].text
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
    if (!rect) return {}
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
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, background: 'linear-gradient(90deg, var(--c-brand), var(--c-purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Ebi's Help</span>
          {messages.length > 0 && (
            <span
              onClick={newChat}
              title="New chat"
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 11, padding: '1px 6px', border: '1px solid var(--c-border)', borderRadius: 4, lineHeight: '16px' }}
            >+</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isSidePanel ? (
            <span
              onClick={() => { setDocked(false); setOpen(false) }}
              title="Pop out to floating button"
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1 }}
            >&#8599;</span>
          ) : (
            <span
              onClick={() => { setOpen(false); setDocked(true) }}
              title="Dock to side panel"
              style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 13, lineHeight: 1 }}
            >&#9699;</span>
          )}
          <span onClick={() => { setOpen(false); setDocked(false) }} style={{ cursor: 'pointer', color: 'var(--c-ink-dim)', fontSize: 16, lineHeight: 1 }}>&times;</span>
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
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {m.text}
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
      {/* Floating help button — hidden when docked */}
      {!docked && (
        <button
          ref={btnRef}
          onMouseDown={handleMouseDown}
          onClick={() => { if (!didDrag.current) setOpen(!open) }}
          style={{
            position: 'fixed', left: pos.x,
            ...(pos.y !== null ? { top: pos.y } : { bottom: 20 }),
            width: 58, height: 58, borderRadius: '50%',
            background: 'radial-gradient(circle at 38% 30%, var(--c-surface), var(--c-surface-alt))',
            border: open ? '2px solid var(--c-brand)' : '2px solid rgba(223,37,64,.45)',
            padding: 0, overflow: 'hidden',
            cursor: dragging ? 'grabbing' : 'grab',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000,
            boxShadow: open
              ? '0 0 0 4px rgba(223,37,64,.18), 0 10px 26px rgba(223,37,64,.4)'
              : '0 6px 20px rgba(16,36,44,.18)',
            fontFamily: 'inherit', transition: 'box-shadow .2s ease, border-color .2s ease',
          }}
          title="Ebi's Help — ask anything about Ebiki"
        >
          <img
            src={shrimpUrl(buttonMascot)}
            alt="Ebi, the Ebiki mascot"
            draggable={false}
            style={{ width: '82%', height: '82%', objectFit: 'contain', pointerEvents: 'none', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,.4))' }}
          />
        </button>
      )}

      {/* Floating popup */}
      {open && !docked && (() => {
        const chatStyle = getChatStyle()
        return (
          <div style={{
            ...chatStyle,
            background: 'rgba(255,255,255,.98)',
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

      {/* Docked side panel */}
      {docked && (
        <div style={{
          position: 'fixed', right: 0, top: 0, bottom: 0, width: 380,
          background: 'rgba(255,255,255,.98)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderLeft: '1px solid var(--c-border)',
          display: 'flex', flexDirection: 'column',
          zIndex: 10000, boxShadow: '-12px 0 40px rgba(16,36,44,.14)',
          fontFamily: FONT.body,
        }}>
          {chatContent(true)}
        </div>
      )}
    </>
  )
}
