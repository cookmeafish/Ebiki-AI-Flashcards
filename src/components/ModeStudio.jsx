import { useState, useRef, useEffect } from 'react'
import { S } from '../styles/theme'
import { C, RADIUS, SHADOW, FONT } from '../config/tokens'

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
export default function ModeStudio({ t, kind = 'create', focus = 'all', existing = null, askAI, apiKey, parseAiJson, onApply, onClose }) {
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
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, loading])

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages, spec, loading])
  useEffect(() => { inputRef.current?.focus() }, [])

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
        ? 'FOCUS: the user mainly wants to shape how this mode QUIZZES them: studyRules.questionPrompt, ratingRules, questionPreferences, difficulty and languages.'
        : ''
    return [
      `You are Ebi, a warm, sharp learning-design partner helping the user ${isEdit ? 'refine an existing' : 'design a new'} study mode for a flashcard learning app. Ebi speaks in the first person as Ebi and never calls itself a mascot or an AI.`,
      isEdit && cur ? `CURRENT MODE CONFIG (JSON):\n${JSON.stringify(cur, null, 2)}` : '',
      focusLine,
      `HOW TO BEHAVE:
- Expand the user's idea, then ask AT MOST 1 to 3 focused follow-up questions that genuinely change the design (their level and goal, the language they answer in for language modes, sub-topics to emphasize, how they want to be quizzed, card layout preferences). Ask only what matters. Never interrogate.
- The instant you have enough to propose something strong, or the user says just make it, STOP asking and propose.
- Keep every message short and friendly. Never use an em dash. Never use a shrimp emoji.`,
      `WHEN YOU PROPOSE, and every time you revise after feedback: write 2 to 4 short plain-language lines describing the mode, THEN append the full machine config as ONE block exactly like:
<mode>{ ...json... }</mode>
Do NOT include the <mode> block while you are still asking questions. Include it every time you have a concrete proposal.`,
      `The JSON MUST use these keys:
- name (string, 24 chars max), type ("language" only when learning a human language, otherwise "general"), description (1 to 3 rich sentences capturing the subject, goal and level; this text drives card generation, so make it specific).
- fields (object of {fieldName: true}), frontTemplate (e.g. "{term}"), backTemplate (the card-back layout using {placeholders} that match the fields), tagRules (one line).
- studyRules: { questionsPerCard (1 to 5), cardsAtOnce (1 to 6), studyLanguage (the language answers are written in and content is generated in), quizLanguage ("" = same as studyLanguage, else the language Ebi phrases questions in), ${'dialect (language modes only, else omit), '}wordHints (boolean), grammarFeedback (boolean), questionPrompt (a strong, subject-appropriate instruction for how to form quiz questions), ratingRules (string), questionPreferences (array of short style rules, may be []) }.
- chatSuggestions (exactly 3 short starter prompts), mnemonicHints (short string or ""), tagCategories (lowercase array), and for GENERAL modes discoverKinds (array of 3 to 6 objects {key, label, rule}).`,
      isEdit
        ? 'Keep every current value the user did not ask to change EXACTLY as it is. Only alter what the conversation calls for.'
        : 'Choose sensible, subject-appropriate values for everything, tailored to what the user tells you.',
    ].filter(Boolean).join('\n\n')
  }

  const send = async () => {
    const text = input.trim()
    if (!text || loading || !apiKey) return
    const next = [...messages, { role: 'user', text }]
    setMessages(next); setInput(''); setLoading(true); setError(null)
    try {
      const convo = next.filter((m, i) => !(i === 0 && m.role === 'assistant')) // drop the local intro
        .map((m) => `${m.role === 'user' ? 'User' : 'Ebi'}: ${m.text}`).join('\n\n')
      const raw = await askAI(systemPrompt(), convo || text)
      const m = String(raw || '').match(/<mode>([\s\S]*?)<\/mode>/i)
      let display = String(raw || '')
      if (m) {
        const parsed = parseAiJson(m[1])
        if (parsed && typeof parsed === 'object' && parsed.name) { setSpec(parsed); setApplied(null) }
        display = display.replace(/<mode>[\s\S]*?<\/mode>/i, '').trim()
      }
      setMessages([...next, { role: 'assistant', text: display || t('studioProposed') }])
    } catch (e) {
      setError(String(e?.message || e))
      setMessages(next)
    } finally { setLoading(false) }
  }

  const apply = async () => {
    if (!spec) return
    setLoading(true); setError(null)
    try {
      const name = await onApply(spec)
      setApplied(name || spec.name || 'mode')
    } catch (e) { setError(String(e?.message || e)) }
    finally { setLoading(false) }
  }

  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '12px 14px', boxShadow: SHADOW.sm }
  const specLine = (label, val) => val ? (
    <div style={{ fontSize: 11, lineHeight: 1.5, marginTop: 4 }}><span style={{ color: C.inkDim, fontWeight: 700 }}>{label}: </span><span style={{ color: C.ink }}>{val}</span></div>
  ) : null

  return (
    <div onMouseDown={(e) => { if (e.target === e.currentTarget && !loading) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 12000, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: 'min(560px, 100%)', maxHeight: '86vh', display: 'flex', flexDirection: 'column', background: C.bg, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, boxShadow: SHADOW.lg, overflow: 'hidden' }}>
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
              padding: '9px 12px', fontSize: 12.5, lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
              {m.text}
            </div>
          ))}
          {loading && <div style={{ alignSelf: 'flex-start', fontSize: 12, color: C.inkFaint, fontStyle: 'italic' }}>{t('studioThinking')}</div>}

          {/* Review card once Ebi has a concrete proposal */}
          {spec && !applied && (
            <div style={{ ...card, borderColor: C.brandRing, background: C.brandTint2 || C.surface }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.brand, letterSpacing: '.03em', marginBottom: 6 }}>{t('studioPlan')}</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{spec.type === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {spec.name}</div>
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
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
              placeholder={apiKey ? t('studioPlaceholder') : t('studioNeedKey')} disabled={loading || !apiKey}
              style={{ ...S.keyInput, flex: 1, fontSize: 12.5 }} />
            <button onClick={send} disabled={loading || !apiKey || !input.trim()} className="btn-press"
              style={{ ...S.keyDone, opacity: (loading || !apiKey || !input.trim()) ? 0.5 : 1 }}>{t('studioSend')}</button>
          </div>
        )}
      </div>
    </div>
  )
}
