// Roleplay: pick (or invent, or photograph) a scene, play it with Ebi in character, get a scorecard with tips
// and cards worth adding. Any subject. Never touches the review schedule; new cards go to the mode's deck.
// With the optional Voice chat feature on, the learner talks and Ebi's lines are spoken.
import { useEffect, useRef, useState } from 'react'
import { useHelpEntry } from '../kit/useHelp'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { downscaleDataUrl, dataUrlToImagePart } from '../../utils/image'
import { speak } from '../../speech'
import { useFeatureCtx, useFocusHold, useActivityBusy } from '../registry'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays, depthBorder } from '../ui'
import { TalkButton, voiceChatOn, readPracticeLog, recordPractice, recentTopics } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'
import { parseScenarios, cleanScenario, normalizeScorecard, axesFor, scoreAsPractice, mistakesAsMisses, SCORE_MAX, MIN_TURNS_TO_SCORE } from './scoring'
import {
  buildScenarioPrompt, buildImageScenarioPrompt, buildCustomScenarioPrompt, buildSceneSystem, buildSceneTurn,
  buildScorecardPrompt, splitSceneReply, RP_ROLE, RP_MAX_TOKENS, RP_SETUP_ROLE, RP_SETUP_MAX_TOKENS, RP_SCORE_MAX_TOKENS,
} from './prompt'

export const ROLEPLAY_FEATURE_ID = 'roleplay'
const SLIPS = 8
const KNOWLEDGE_CAP = 3000
const IMAGE_EDGE = 1200
// What a vision call accepts after downscaleDataUrl (it returns an image it could not decode, HEIC/TIFF, unchanged).
const PORTABLE_IMAGE = /^data:image\/(jpeg|jpg|png)[;,]/i
const CARD_TAGS = ['ebiki', 'roleplay']
// Suggestions are cached per mode for this app session, so going back to the list doesn't spend another call.
const ideasCache = new Map()

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(String(r.result || ''))
  r.onerror = () => reject(r.error)
  r.readAsDataURL(file)
})

export default function RoleplayScreen({ onExit, params }) {
  const ctx = useFeatureCtx()
  const [phase, setPhase] = useState('pick') // pick | play | scoring | card
  const [ideas, setIdeas] = useState(() => ideasCache.get(ctx?.subject?.modeId) || null)
  const [loadingIdeas, setLoadingIdeas] = useState(false)
  const [custom, setCustom] = useState('')
  const [making, setMaking] = useState(false)
  const [scene, setScene] = useState(null)
  const [messages, setMessages] = useState([])
  const [ended, setEnded] = useState(false)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [turnFailed, setTurnFailed] = useState(false) // Ebi's last line did not come: offer to ask again
  const [card, setCard] = useState(null)
  const [added, setAdded] = useState({}) // card index -> 'adding' | 'done' | 'failed'
  const listRef = useRef(null)
  const fileRef = useRef(null)
  const speakingRef = useRef(null)
  const sceneIdRef = useRef(0)
  const openedRef = useRef(0)
  const sid = useRef(`rp-${Date.now().toString(36)}`).current // tapped-word popups belong to this screen
  useFocusHold(phase === 'play')
  useActivityBusy(phase === 'play' || phase === 'scoring' || making) // a scene in progress (or being set up) would be lost
  // aliveRef: set on mount too (StrictMode mounts twice). A reply landing after the screen closed is never spoken.
  const aliveRef = useRef(false)
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; speakingRef.current?.stop() } }, [])
  const startedRef = useRef(false) // StrictMode runs the mount effect twice: two scenario calls, two scenes
  useEffect(() => { listRef.current?.scrollTo?.({ top: 1e9, behavior: 'smooth' }) }, [messages])
  // Opened from somewhere else with a ready scene or idea (e.g. the Chat "+" menu).
  useEffect(() => {
    if (!ctx || startedRef.current) return
    startedRef.current = true
    if (params?.idea) { setCustom(params.idea); if (ctx.ai.hasKey) makeFrom(buildCustomScenarioPrompt(ctx.subject, params.idea)) }
    else if (!ideas && ctx.ai.hasKey) loadIdeas()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Ebi opens the scene.
  useEffect(() => {
    if (!ctx || phase !== 'play' || messages.length || openedRef.current === sceneIdRef.current) return
    openedRef.current = sceneIdRef.current
    turn([])
  }, [phase, scene]) // eslint-disable-line react-hooks/exhaustive-deps
  // What Ebi's Help knows about this roleplay (open conversation: nothing secret).
  useHelpEntry(ctx, 'roleplay', phase === 'pick' || !scene ? '' : [
    `Activity open: Roleplay. Scene: ${scene.title || scene.setting || ''}${scene.role ? `; Ebi plays ${scene.role}` : ''}${scene.goal ? `; the learner's goal: ${scene.goal}` : ''}. Phase: ${phase}${ended ? ' (the scene ended)' : ''}.`,
    messages.length ? `Conversation (latest turns):\n${messages.slice(-8).map((m) => `${m.role === 'ebi' ? 'Ebi' : 'Learner'}: ${String(m.text || '').slice(0, 220)}`).join('\n')}` : '',
    card ? `Scorecard shown: overall ${card.overall} of 5${card.summary ? `. ${card.summary}` : ''}${card.strengths?.length ? `. Strengths: ${card.strengths.join('; ')}` : ''}${card.tips?.length ? `. Tips (what they said and a better version): ${card.tips.join('; ')}` : ''}` : '',
  ].filter(Boolean).join('\n'))
  if (!ctx) return null
  const { t, ai, subject } = ctx
  const voiceOn = voiceChatOn(ctx)
  // Ebi's lines in a language mode: tap a word for its meaning, like Study (the learner's own lines stay plain).
  const tappable = subject.isLanguage && !!ctx.words
  const speakLang = subject.isLanguage ? subject.learnLangIso : ctx.lang
  const canAdd = !!subject.modeDeck && ctx.ankiConnected !== false // Anki known closed: every add would fail
  const slips = subject.isLanguage ? subject.grammarSlips(SLIPS) : ''

  async function loadIdeas() {
    setLoadingIdeas(true); setError('')
    try {
      const avoid = recentTopics(await readPracticeLog(ctx))
      const { system, user } = buildScenarioPrompt(subject, { knowledge: subject.knowledge(KNOWLEDGE_CAP), avoid, level: await learnerLevelLine(ctx, { context: true }) })
      const list = parseScenarios(ai.json(await ai.call(system, user, { role: RP_SETUP_ROLE, maxTokens: RP_SETUP_MAX_TOKENS })), ai.clean)
      if (!list.length) throw new Error(t('rp_noIdeas'))
      ideasCache.set(subject.modeId, list); setIdeas(list)
    } catch (e) { setError(String(e.message || e)) } finally { setLoadingIdeas(false) }
  }

  async function makeFrom({ system, user }, images) {
    setMaking(true); setError('')
    try {
      const s = cleanScenario(ai.json(await ai.call(system, user, { role: RP_SETUP_ROLE, maxTokens: RP_SETUP_MAX_TOKENS, ...(images ? { images } : {}) })), ai.clean)
      if (!s) throw new Error(t('rp_noScene'))
      if (aliveRef.current) begin(s) // left the screen meanwhile: no scene, nothing logged as practiced
    } catch (e) { setError(String(e.message || e)) } finally { setMaking(false) }
  }

  const onPhoto = async (file) => {
    if (!file || making) return
    // Busy from the first moment: reading and shrinking a big photo takes a while, and Play or a tile clicked meanwhile
    // started a second scene.
    setMaking(true); setError('')
    try {
      const url = await downscaleDataUrl(await readFileAsDataUrl(file), IMAGE_EDGE)
      // A format the browser cannot decode comes back as is, and every provider refuses it with an unreadable 400.
      if (!PORTABLE_IMAGE.test(url)) { setError(t('chat_imageUnsupported')); setMaking(false); return }
      await makeFrom(buildImageScenarioPrompt(subject, custom.trim()), [dataUrlToImagePart(url)])
    } catch (e) { setError(String(e.message || e)); setMaking(false) }
  }

  const begin = (s) => {
    sceneIdRef.current += 1
    setScene(s); setMessages([]); setEnded(false); setCard(null); setAdded({}); setInput(''); setError(''); setTurnFailed(false)
    setPhase('play')
    recordPractice(ctx, ROLEPLAY_FEATURE_ID, [{ kind: 'topic', label: s.title }])
  }

  async function turn(history) {
    const id = sceneIdRef.current
    setBusy(true); setError(''); setTurnFailed(false)
    try {
      const system = buildSceneSystem(subject, scene, { slips, knowledge: subject.knowledge(KNOWLEDGE_CAP), level: await learnerLevelLine(ctx, { context: true }) })
      const { text, ended: done } = splitSceneReply(await ai.call(system, buildSceneTurn(history), { role: RP_ROLE, maxTokens: RP_MAX_TOKENS }))
      if (id !== sceneIdRef.current) return // the learner left this scene meanwhile
      const line = ai.clean(text) || '...'
      setMessages([...history, { role: 'ebi', text: line }])
      if (done) setEnded(true)
      if (voiceOn && aliveRef.current) { speakingRef.current?.stop(); speakingRef.current = speak(ctx, line, { lang: speakLang }) }
    } catch (e) { if (id === sceneIdRef.current) { setError(String(e.message || e)); setTurnFailed(true) } } finally { if (id === sceneIdRef.current) setBusy(false) }
  }

  const send = (spoken) => {
    speakingRef.current?.stop()
    const text = (typeof spoken === 'string' ? spoken : input).trim()
    if (!text || phase !== 'play') return // a recording finished after End: it is not part of the scored scene
    // A recording that finished while Ebi was still answering goes into the box (it used to vanish): send it after.
    if (busy) { if (typeof spoken === 'string') setInput((cur) => (cur.trim() ? `${cur.trim()} ${text}` : text)); return }
    const history = [...messages, { role: 'me', text }]
    setMessages(history); setInput('')
    ctx.emit(EVENTS.CHAT_SENT, { mode: subject.modeId })
    turn(history)
  }

  const learnerTurns = messages.filter((m) => m.role === 'me').length
  const finish = async () => {
    speakingRef.current?.stop()
    // Leaving a scene too short to score works even while Ebi is typing (a stalled reply trapped the learner): the
    // pending reply is retired with the scene.
    if (learnerTurns < MIN_TURNS_TO_SCORE) { sceneIdRef.current += 1; setBusy(false); setPhase('pick'); return }
    setPhase('scoring'); setError('')
    const axes = axesFor(subject)
    try {
      const { system, user } = buildScorecardPrompt(subject, scene, messages, axes)
      const sc = normalizeScorecard(ai.json(await ai.call(system, user, { role: RP_SETUP_ROLE, maxTokens: RP_SCORE_MAX_TOKENS })), axes, ai.clean)
      if (!sc) throw new Error(t('rp_noScore'))
      if (!aliveRef.current) return // left while scoring: a scorecard nobody saw earns nothing and moves no level
      setCard(sc); setPhase('card')
      // Its strengths feed the learner level's "strong at" (the level line every prompt reads).
      ctx.emit(EVENTS.PRACTICE_DONE, { source: ROLEPLAY_FEATURE_ID, mode: subject.modeId, ...scoreAsPractice(sc.overall), strengths: (sc.strengths || []).map((s) => String(s).slice(0, 60)).slice(0, 3) })
      // What they said wrong reaches the Mistake Gym, like the misses of every other practice activity.
      const misses = mistakesAsMisses(sc.mistakes, t('rp_missQuestion', { scene: scene.title || '' }))
      if (misses.length) ctx.emit(EVENTS.PRACTICE_MISSED, { source: ROLEPLAY_FEATURE_ID, mode: subject.modeId, misses })
    } catch (e) { if (aliveRef.current) { setError(String(e.message || e)); setPhase('play') } }
  }

  const addCard = async (i) => {
    if (added[i] === 'adding' || added[i] === 'done' || !canAdd) return
    setAdded((a) => ({ ...a, [i]: 'adding' }))
    const c = card.cards[i]
    try {
      await ctx.cards.addNew(subject.modeDeck, ctx.cards.frontHtml(c.front), ctx.cards.backHtml(c.back), CARD_TAGS)
      setAdded((a) => ({ ...a, [i]: 'done' }))
    } catch { setAdded((a) => ({ ...a, [i]: 'failed' })) }
  }

  const back = <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('rp_back')}</button>
  const errorLine = error && <div style={{ color: C.danger, fontSize: 13, margin: '8px 0' }}>{error}</div>

  if (phase === 'pick') {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {back}
        <EbiSays pose={poseFile('singer')}>{subject.isLanguage ? t('rp_introLang', { lang: subject.learnLang }) : t('rp_introGeneral', { subject: subject.name })}</EbiSays>
        {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginTop: 12 }}>{t('rp_needKey')}</div>}
        {errorLine}
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 17, color: C.ink, margin: '18px 0 8px' }}>{t('rp_pick')}</div>
        {loadingIdeas && <div style={{ color: C.inkDim, fontSize: 13 }}>{t('rp_loadingIdeas')}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {(ideas || []).map((s, i) => (
            <button key={i} onClick={() => begin(s)} disabled={making || !ai.hasKey} className="btn-press" style={{
              textAlign: 'left', padding: 14, borderRadius: RADIUS.lg, background: C.surface, cursor: making || !ai.hasKey ? 'default' : 'pointer',
              ...depthBorder(C.border, { bottomColor: C.border }), opacity: making || !ai.hasKey ? 0.5 : 1,
            }}>
              <div style={{ fontSize: 26 }}>{s.emoji}</div>
              <div style={{ fontWeight: 800, color: C.ink, fontSize: 14.5, margin: '4px 0' }}>{s.title}</div>
              <div style={{ fontSize: 12.5, color: C.inkDim, lineHeight: 1.4 }}>{s.goal || s.setting}</div>
            </button>
          ))}
        </div>
        {(ideas || !loadingIdeas) && <button onClick={loadIdeas} disabled={loadingIdeas || !ai.hasKey} style={{ marginTop: 10, border: 'none', background: 'transparent', color: C.brand, fontWeight: 800, cursor: 'pointer', fontSize: 13, opacity: loadingIdeas ? 0.5 : 1 }}>↻ {t('rp_moreIdeas')}</button>}
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 17, color: C.ink, margin: '20px 0 8px' }}>{t('rp_ownTitle')}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder={subject.isLanguage ? t('rp_ownPlaceholderLang') : t('rp_ownPlaceholderGeneral')}
            onKeyDown={(e) => { if (e.key === 'Enter' && custom.trim() && !making && ai.hasKey && !e.nativeEvent?.isComposing) makeFrom(buildCustomScenarioPrompt(subject, custom.trim())) }}
            style={{ flex: '1 1 260px', padding: '11px 13px', fontSize: 14, borderRadius: RADIUS.md, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
          <ChunkyButton onClick={() => makeFrom(buildCustomScenarioPrompt(subject, custom.trim()))} disabled={!custom.trim() || making || !ai.hasKey}>{making ? t('rp_making') : t('rp_play')}</ChunkyButton>
          <ChunkyButton onClick={() => fileRef.current?.click()} disabled={making || !ai.hasKey} variant="ghost" color={C.info}>📷 {t('rp_fromPhoto')}</ChunkyButton>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; onPhoto(f) }} />
        </div>
        <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 6 }}>{t('rp_photoHint')}</div>
      </div>
    )
  }

  if (phase === 'card' && card) {
    const axes = axesFor(subject)
    const decks = ctx.cards.decks || []
    return (
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src={shrimpUrl(poseFile(card.overall >= 4 ? 'party' : 'happy'))} alt="" width={90} />
          <div>
            <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 24, color: C.ink }}>{scene.emoji} {scene.title}</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: card.goalMet ? C.success : C.warning }}>{card.goalMet ? t('rp_goalMet') : t('rp_goalMissed')}</div>
          </div>
        </div>
        {card.summary && <div style={{ fontSize: 14, color: C.ink, lineHeight: 1.5, margin: '12px 0' }}>{card.summary}</div>}
        <div style={{ display: 'grid', gap: 8, margin: '12px 0' }}>
          {axes.filter((a) => card.scores[a]).map((a) => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 130, fontWeight: 800, fontSize: 13, color: C.inkDim }}>{t(`rp_axis_${a}`)}</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {Array.from({ length: SCORE_MAX }, (_, i) => <span key={i} style={{ width: 22, height: 10, borderRadius: 5, background: i < card.scores[a] ? C.success : C.border }} />)}
              </div>
            </div>
          ))}
        </div>
        {card.strengths.length > 0 && (<><div style={{ fontWeight: 800, color: C.success, margin: '12px 0 4px' }}>✓ {t('rp_strengths')}</div>{card.strengths.map((s, i) => <div key={i} style={{ fontSize: 13.5, color: C.ink, margin: '3px 0' }}>• {s}</div>)}</>)}
        {card.tips.length > 0 && (<><div style={{ fontWeight: 800, color: C.purple, margin: '12px 0 4px' }}>💡 {t('rp_tips')}</div>{card.tips.map((s, i) => <div key={i} style={{ fontSize: 13.5, color: C.ink, margin: '3px 0', lineHeight: 1.45 }}>• {s}</div>)}</>)}
        {card.cards.length > 0 && (
          <>
            <div style={{ fontWeight: 800, color: C.ink, margin: '16px 0 6px' }}>🃏 {t('rp_cards')}</div>
            {ctx.ankiConnected === false
              ? <div style={{ fontSize: 12.5, color: C.warning, marginBottom: 6 }}>{t('rp_ankiOff')}</div>
              : !subject.modeDeck && (
                // New cards go to the MODE's deck: pick it right here (saved on the mode, like Legends' deck picker).
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 12.5, color: C.warning, marginBottom: 6 }}>
                  {t('rp_noDeck')}
                  {decks.length > 0 && (
                    <select value="" onChange={(e) => { if (e.target.value) ctx.cards.setModeDeck(e.target.value) }}
                      style={{ padding: '4px 8px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontSize: 12.5 }}>
                      <option value="">{t('rp_pickDeck')}</option>
                      {decks.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  )}
                </div>
              )}
            <div style={{ display: 'grid', gap: 8 }}>
              {card.cards.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', borderRadius: RADIUS.md, border: `1px solid ${C.border}` }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: C.ink }}>{c.front}</div>
                    <div style={{ fontSize: 12.5, color: C.inkDim, whiteSpace: 'pre-wrap' }}>{c.back}</div>
                  </div>
                  <button onClick={() => addCard(i)} disabled={!canAdd || added[i] === 'adding' || added[i] === 'done'} style={{
                    padding: '5px 12px', borderRadius: RADIUS.sm, fontSize: 12, fontWeight: 800, border: `1px solid ${C.success}`,
                    background: added[i] === 'done' ? C.success : 'transparent', color: added[i] === 'done' ? C.white : C.success,
                    cursor: !canAdd || added[i] === 'adding' || added[i] === 'done' ? 'default' : 'pointer', opacity: canAdd || added[i] === 'done' ? 1 : 0.5, whiteSpace: 'nowrap',
                  }}>{added[i] === 'done' ? `✓ ${t('rp_added')}` : added[i] === 'adding' ? t('rp_adding') : added[i] === 'failed' ? t('rp_addFailed') : `+ ${t('rp_add')}`}</button>
                </div>
              ))}
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <ChunkyButton onClick={() => begin(scene)} color={C.info}>↻ {t('rp_again')}</ChunkyButton>
          <ChunkyButton onClick={() => setPhase('pick')} color={C.success}>{t('rp_newScene')}</ChunkyButton>
        </div>
      </div>
    )
  }

  // play | scoring
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 34 }}>{scene.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 18, color: C.ink }}>{scene.title}</div>
          <div style={{ fontSize: 12.5, color: C.inkDim }}>{t('rp_youGoal', { goal: scene.goal || scene.setting })}</div>
        </div>
        <ChunkyButton onClick={finish} color={C.danger} disabled={(busy && learnerTurns >= MIN_TURNS_TO_SCORE) || phase === 'scoring'}>
          {phase === 'scoring' ? t('rp_scoring') : learnerTurns < MIN_TURNS_TO_SCORE ? t('rp_leave') : t('rp_end')}
        </ChunkyButton>
      </div>
      <div style={{ fontSize: 12.5, color: C.inkFaint, fontStyle: 'italic' }}>{scene.setting} · {t('rp_ebiPlays', { role: scene.role })}</div>
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'me' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
            <div style={{
              padding: '10px 14px', borderRadius: RADIUS.lg,
              background: m.role === 'me' ? C.brandTint : C.surface, border: `1px solid ${m.role === 'me' ? C.brandRing : C.border}`,
              color: C.ink, fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap',
            }}>{tappable && m.role === 'ebi' ? ctx.words.tappable(m.text, `${sid}-${i}`) : m.text}</div>
            {tappable && m.role === 'ebi' && ctx.words.popup(`${sid}-${i}`)}
          </div>
        ))}
        {busy && <div style={{ color: C.inkFaint, fontSize: 14 }}>{t('rp_typing')}</div>}
        {/* Ebi's line failed (opening or reply): ask again for the same turn instead of a dead scene. */}
        {turnFailed && !busy && phase === 'play' && messages[messages.length - 1]?.role !== 'ebi' && (
          <button onClick={() => turn(messages)} style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', color: C.brand, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>↻ {t('rp_retry')}</button>
        )}
        {ended && !busy && <div style={{ alignSelf: 'center', color: C.success, fontWeight: 800, fontSize: 13.5 }}>🎬 {t('rp_sceneOver')}</div>}
      </div>
      {errorLine}
      <div style={{ display: 'flex', gap: 8 }}>
        {voiceOn && <TalkButton ctx={ctx} lang={subject.isLanguage ? subject.learnLangIso : ''} onText={send} onStart={() => speakingRef.current?.stop()} disabled={busy || phase === 'scoring'} compact />}
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t('rp_placeholder')} disabled={phase === 'scoring'}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent?.isComposing) send() }}
          style={{ flex: 1, padding: '12px 14px', fontSize: 15, borderRadius: RADIUS.md, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
        <button onClick={send} disabled={busy || !input.trim()} className="btn-press" style={{
          padding: '0 18px', borderRadius: RADIUS.md, ...depthBorder(C.success), background: C.success, color: C.white,
          fontWeight: 800, cursor: busy || !input.trim() ? 'default' : 'pointer', opacity: busy || !input.trim() ? 0.5 : 1,
        }}>{t('rp_send')}</button>
      </div>
    </div>
  )
}
