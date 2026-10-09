import { useState, useRef, useEffect } from 'react'
import { S } from '../styles/theme'
import Markdown from './Markdown'
import { C, RADIUS, SHADOW, FONT } from '../config/tokens'
import { studioReply } from './studioReply'
import { imeActive } from '../utils/keys'

// ── Ebi Studio ─────────────────────────────────────────────────────────────
// One conversational panel for THREE jobs, all with the same shape (chat with
// Ebi, expand a brief, ask follow-ups, review, then save):
//   kind='create'                     → design a brand-new learning mode
//   kind='edit',  focus='all'         → edit an existing mode conversationally
//   kind='edit',  focus='cards'       → shape the deck/card prompt (fields,
//                                       templates, tagRules) in plain language
//   kind='edit',  focus='study'       → shape how the mode quizzes you
// Ebi replies with a short human summary plus a hidden <mode>{json}</mode>
// block. When that block parses, a review card appears with an Apply button;
// `onApply(spec)` (in App) builds/persists a fully compatible mode config.
// `seed` is a brief already typed elsewhere (the Learning modes box): the panel
// opens with it sent as the first message so Ebi answers it instead of asking
// the user to type the same thing again.
export default function ModeStudio({ t, kind = 'create', focus = 'all', existing = null, seed = '', askAI, apiKey, parseAiJson, onApply, onClose, userLang = 'English', describeError }) {
  const isEdit = kind === 'edit'
  const title = isEdit
    ? (focus === 'cards' ? t('studioTitleDeck') : t('studioTitleEdit', { name: existing?.name || '' }))
    : t('studioTitleCreate')

  const intro = isEdit
    ? (focus === 'cards' ? t('studioIntroDeck') : focus === 'study' ? t('studioIntroStudy') : t('studioIntroEdit', { name: existing?.name || '' }))
    : t('studioIntroCreate')

  const [messages, setMessages] = useState([{ role: 'assistant', text: intro }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [spec, setSpec] = useState(null)      // latest parsed mode config from Ebi
  const [applied, setApplied] = useState(null) // saved mode name once applied
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    // Not an Esc a dialog above already took (declining "end study?" closed Studio too); and it is marked
    // handled, so Settings underneath stays open.
    const onKey = (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || e.isComposing || e.keyCode === 229 || document.querySelector('[data-app-dialog]')) return // an IME's Esc cancels only its candidate
      e.preventDefault()
      if (!loading) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  // Tab stays in the panel: it walked on into Settings underneath (its buttons acted unseen behind the backdrop).
  const panelRef = useRef(null)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Tab' || document.querySelector('[data-app-dialog]')) return
      const panel = panelRef.current
      if (!panel) return
      const items = [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
        .filter((el) => !el.disabled && el.offsetParent !== null)
      if (!items.length) return
      const first = items[0], last = items[items.length - 1], a = document.activeElement
      if (e.shiftKey && (!panel.contains(a) || a === first)) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && (!panel.contains(a) || a === last)) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages, spec, loading])
  useEffect(() => { inputRef.current?.focus() }, [])
  // The input is disabled while Ebi answers, which blurs it: every follow-up needed a click first.
  useEffect(() => { if (!loading && !applied) inputRef.current?.focus() }, [loading, applied])

  // A trimmed view of the current mode so the prompt stays small but complete.
  const compactExisting = () => {
    if (!existing) return null
    const { name, type, description, fields, frontTemplate, backTemplate, tagRules, studyRules, chatSuggestions, mnemonicHints, tagCategories, discoverKinds } = existing
    return { name, type, description, fields, frontTemplate, backTemplate, tagRules, studyRules, chatSuggestions, mnemonicHints, tagCategories, discoverKinds }
  }

  const systemPrompt = () => {
    const cur = compactExisting()
    const focusLine = focus === 'cards'
      ? 'FOCUS: the user mainly wants to shape how this mode MAKES FLASHCARDS (the deck/card prompt): fields, frontTemplate, backTemplate, tagRules, and the description that drives card content. You may touch other fields only if they ask.'
      : focus === 'study'
        ? 'FOCUS: the user mainly wants to shape how this mode QUIZZES them: studyRules.questionPrompt, questionPreferences, difficulty and languages.'
        : ''
    return [
      `You are Ebi, a warm, sharp learning-design partner helping the user ${isEdit ? 'refine an existing' : 'design a new'} study mode for a flashcard learning app. Ebi speaks in the first person as Ebi and never calls itself a mascot or an AI.`,
      isEdit && cur ? `CURRENT MODE CONFIG (JSON):\n${JSON.stringify(cur, null, 2)}` : '',
      // The proposal under review. Its <mode> block is stripped from the chat history, so without this a
      // revision ("just make the tags lowercase") rebuilt the whole spec blind and the rest drifted.
      spec ? `YOUR LATEST PROPOSAL, which the user is reviewing (JSON). When revising, start from THIS and keep everything the user did not ask to change exactly as it is:\n${JSON.stringify(spec, null, 2)}` : '',
      focusLine,
      `HOW TO BEHAVE:
- Expand the user's idea, then ask AT MOST 1 to 3 focused follow-up questions that genuinely change the design (their level and goal, the language they answer in for language modes, sub-topics to emphasize, how they want to be quizzed, card layout preferences). Ask only what matters. Never interrogate.
- The instant you have enough to propose something strong, or the user says just make it, STOP asking and propose.
- Keep every message short and friendly. Never use an em dash. Never use a shrimp emoji.
- Reply in the language the user writes in (the app is set to ${userLang}).`,
      // Same rule as createMode: the catered text reads in the learner's language, identifiers stay as they are.
      `Write the config's user-facing text in ${userLang} (the app language): "chatSuggestions" MUST be in ${userLang}, and "questionPrompt" / "mnemonicHints" should be phrased in ${userLang} too. Keep "name", tag tokens ("tagRules"/"tagCategories", lowercase-hyphen identifiers), template {placeholders} and proper nouns as they are.`,
      `WHEN YOU PROPOSE, and every time you revise after feedback: write 2 to 4 short plain-language lines describing the mode, THEN append the full machine config as ONE block exactly like:
<mode>{ ...json... }</mode>
Do NOT include the <mode> block while you are still asking questions. Include it every time you have a concrete proposal.`,
      `The JSON MUST use these keys:
- name (string, short; when EDITING an existing mode keep its current name exactly unless the user asks to rename it), type ("language" only when learning a human language, otherwise "general"), description (1 to 3 rich sentences capturing the subject, goal and level; this text drives card generation, so make it specific).
- fields (object of {fieldName: true}), frontTemplate (e.g. "{term}"), backTemplate (the card-back layout using {placeholders} that match the fields), tagRules (one line).
- studyRules: { questionsPerCard (1 to 5), cardsAtOnce (1 to 6), studyLanguage (the language answers are written in and content is generated in), quizLanguage ("" = same as studyLanguage, else the language Ebi phrases questions in), ${'dialect (language modes only, else omit), '}wordHints (boolean), grammarFeedback (boolean), questionPrompt (a strong, subject-appropriate instruction for how to form quiz questions), questionPreferences (array of short style rules, may be []) }.
- chatSuggestions (exactly 3 short starter prompts), mnemonicHints (short string or ""), tagCategories (lowercase array), and for GENERAL modes discoverKinds (array of 3 to 6 objects {key, label, rule}).`,
      isEdit
        ? 'Keep every current value the user did not ask to change EXACTLY as it is. Only alter what the conversation calls for.'
        : 'Choose sensible, subject-appropriate values for everything, tailored to what the user tells you.',
    ].filter(Boolean).join('\n\n')
  }

  // `override` lets the seed send itself without going through the input. Callers
  // must not hand this the click event, hence the string check.
  // A ref as well as `loading`: a double Enter read loading=false twice from one render, paid for two
  // replies, and the second (built on the same history) replaced the first.
  const sendingRef = useRef(false)
  const send = async (override) => {
    const text = (typeof override === 'string' ? override : input).trim()
    if (!text || loading || !apiKey || sendingRef.current) return
    sendingRef.current = true
    const next = [...messages, { role: 'user', text }]
    setMessages(next); setInput(''); setLoading(true); setError(null)
    try {
      const convo = next.filter((m, i) => !(i === 0 && m.role === 'assistant')) // drop the local intro
        .map((m) => `${m.role === 'user' ? 'User' : 'Ebi'}: ${m.text}`).join('\n\n')
      const raw = await askAI(systemPrompt(), convo || text)
      // A cut-off or unreadable proposal never shows its half-written JSON and never leaves the PREVIOUS
      // proposal's Apply under a reply that looks new (studioReply.js).
      const { display, spec: nextSpec, cutOff } = studioReply(raw, parseAiJson, { edit: isEdit })
      if (nextSpec) { setSpec(nextSpec); setApplied(null) }
      else if (cutOff) { setSpec(null); setError(t('studioCutOff')) }
      // An empty reply around a cut-off block adds no bubble (the error says it); "here's my proposal below" with
      // nothing below read as a bug.
      setMessages(display || !cutOff ? [...next, { role: 'assistant', text: display || t('studioProposed') }] : next)
    } catch (e) {
      // In words ("out of credits", "the key was refused"), not the provider's raw "API 429: {...}" body.
      setError((describeError && describeError(e)) || String(e?.message || e))
      // The unanswered message goes back into the composer (Enter retries it as is) instead of staying in the
      // history, where the next message was sent after it and Ebi answered both at once.
      setMessages(next.slice(0, -1))
      setInput((cur) => cur || text)
    } finally { sendingRef.current = false; setLoading(false) }
  }

  // Send the seeded brief once, on open. Without a key nothing can be sent, so the
  // brief goes into the composer instead of being silently dropped.
  const seededRef = useRef(false)
  useEffect(() => {
    const s = String(seed || '').trim()
    if (!s || seededRef.current) return
    seededRef.current = true
    if (apiKey) send(s)
    else setInput(s)
  }, [seed, apiKey])

  // A ref, not `loading`: two quick clicks both read loading=false from the same render and a
  // create ran twice (two modes with one name).
  const applyingRef = useRef(false)
  const apply = async () => {
    if (!spec || applyingRef.current) return
    applyingRef.current = true
    setLoading(true); setError(null)
    try {
      const name = await onApply(spec)
      setApplied(name || asText(spec.name) || existing?.name || '')
    } catch (e) { setError(String(e?.message || e)) }
    finally { applyingRef.current = false; setLoading(false) }
  }

  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '12px 14px', boxShadow: SHADOW.sm }
  // The review card renders the model's proposal BEFORE Apply shapes it: a list or object value (tagRules
  // as a list, name as an object) threw "Objects are not valid as a React child" and took the app down.
  const asText = (v) => (v == null ? '' : typeof v === 'string' ? v : Array.isArray(v) ? v.map(asText).filter(Boolean).join('\n')
    : typeof v === 'object' ? Object.entries(v).map(([k, x]) => `${k}: ${asText(x)}`).join('\n') : String(v))
  const specLine = (label, val) => asText(val) ? (
    <div style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4, whiteSpace: 'pre-wrap' }}><span style={{ color: C.inkDim, fontWeight: 700 }}>{label}: </span><span style={{ color: C.ink }}>{asText(val)}</span></div>
  ) : null

  return (
    // The body has CSS zoom (the app zoom, --app-zoom), which also scales this fixed backdrop, so inset:0 covers zoom x 100%
    // of the visual viewport and the flex-centered panel lands down and to the right, off-screen.
    // Cancel the zoom on the backdrop and divide the panel's viewport cap by var(--app-zoom), the same
    // convention SettingsModal and the app root use.
    // A click outside closes only while nothing has been said yet: a stray click beside the panel threw away
    // the whole design conversation (Close and Esc still leave at any time).
    <div data-top-overlay="1" onMouseDown={(e) => { if (e.target === e.currentTarget && !loading && !messages.some((m) => m.role === 'user')) onClose() }}
      style={{ position: 'fixed', top: 0, left: 0, width: 'calc(100vw / var(--app-zoom))', height: 'calc(100vh / var(--app-zoom))', zIndex: 12000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-label={title} style={{ width: 'min(560px, 100%)', maxHeight: '100%', display: 'flex', flexDirection: 'column', background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.lg, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: `1px solid ${C.border}` }}>
          <span style={{ fontSize: 16 }}>{'✨'}</span>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: FONT.display, color: C.ink, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
          <button onClick={onClose} className="ui-btn" style={{ ...S.ghostBtn, fontSize: 12, padding: '4px 10px', color: C.inkDim }}>{t('close')}</button>
        </div>

        {/* Conversation */}
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%',
              background: m.role === 'user' ? C.brandTint : C.surfaceAlt, color: C.ink,
              border: `1px solid ${m.role === 'user' ? C.brandRing : C.border}`, borderRadius: RADIUS.md,
              padding: '9px 12px', fontSize: 12.5, lineHeight: 1.55, overflowWrap: 'anywhere',
              ...(m.role === 'user' ? { whiteSpace: 'pre-wrap' } : {}) }}>
              {/* Only Ebi's side is parsed as markdown (same split as Chat and Help): the
                  user's text stays literal so asterisks they typed are not eaten. */}
              {m.role === 'user' ? m.text : <Markdown text={m.text} />}
            </div>
          ))}
          {loading && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: C.inkFaint, fontStyle: 'italic' }}>{t('studioThinking')}</div>}

          {/* Review card once Ebi has a concrete proposal */}
          {spec && !applied && (
            <div style={{ ...card, borderColor: C.brandRing, background: C.brandTint2 || C.surface }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.brandText, letterSpacing: '.03em', marginBottom: 6 }}>{t('studioPlan')}</div>
              {/* An edit never changes the mode's type (buildModeFromSpec keeps it), so the icon follows the mode,
                  not the proposal: a language mode showed the book icon whenever the model wrote "general". */}
              <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{((isEdit && existing?.type) || spec.type) === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {isEdit && focus !== 'all' ? (existing?.name || '') : (asText(spec.name) || existing?.name || '')}</div>
              {specLine(t('studioLblGoal'), spec.description)}
              {focus !== 'study' && specLine(t('studioLblBack'), spec.backTemplate)}
              {focus !== 'study' && specLine(t('studioLblTags'), spec.tagRules)}
              {focus !== 'cards' && specLine(t('studioLblQuiz'), spec.studyRules?.questionPrompt)}
              {focus !== 'cards' && specLine(t('studioLblLang'), spec.studyRules?.studyLanguage)}
              <button onClick={apply} disabled={loading} className="btn-press"
                style={{ ...S.keyDone, marginTop: 12, width: '100%', opacity: loading ? 0.6 : 1 }}>
                {isEdit ? t('studioApply') : t('studioCreateBtn')}
              </button>
            </div>
          )}

          {applied && (
            <div style={{ ...card, borderColor: C.successRing || C.border, textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.success }}>{'✓'} {isEdit ? t('studioApplied', { name: applied }) : t('studioCreated', { name: applied })}</div>
              <button onClick={onClose} className="btn-press" style={{ ...S.keyDone, marginTop: 10 }}>{t('done')}</button>
            </div>
          )}

          {error && <div style={{ fontSize: 11, color: C.danger, lineHeight: 1.5 }}>{'⚠'} {error}</div>}
        </div>

        {/* Composer */}
        {!applied && (
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${C.border}` }}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !imeActive(e)) send() }}
              placeholder={apiKey ? t('studioPlaceholder') : t('studioNeedKey')} disabled={loading || !apiKey}
              /* minWidth 0: the key-input style's minimum pushed Send off the panel at phone width. */
              style={{ ...S.keyInput, flex: 1, minWidth: 0, fontSize: 12.5 }} />
            <button onClick={() => send()} disabled={loading || !apiKey || !input.trim()} className="btn-press"
              style={{ ...S.keyDone, flex: 'none', opacity: (loading || !apiKey || !input.trim()) ? 0.5 : 1 }}>{t('studioSend')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
