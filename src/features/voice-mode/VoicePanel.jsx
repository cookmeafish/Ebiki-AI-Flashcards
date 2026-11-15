// Chat's VOICE MODE panel (./index.js): talk with Ebi like with a person. One loop, every step guarded by a run token so
// a closed, paused or interrupted conversation never speaks or sends anything late:
//   listen (mic level → turnDetector ends the turn, or "I'm done" in push to talk) → transcribe → a spoken command is
//   handled here (voiceCommands.js: repeat, slower, pause, end, recap) and an empty or noise turn is dropped, else
//   ctx.chat.send (the REAL Chat, with the spoken-turn rule) → speak the reply sentence by sentence (speakable.js) at the
//   chosen speed → listen again.
// Ebi never listens while talking (no echo): tap the ring, Interrupt, Esc or Space to cut in.
// Design and the user angle behind each part: docs/plans/2026-11-15-voice-conversation.md.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { platform } from '../../platform'
import { C, FONT, RADIUS } from '../../config/tokens'
import { shrimpUrl, poseFile } from '../../config/shrimp'
import { useFeatureCtx } from '../registry'
import { ChunkyButton, Modal } from '../ui'
import { listen, speak, prepare, speechEngines, COSTS } from '../../speech'
import { voicePanelOpen, setVoicePanel, onVoicePanel } from './store'
import { createTurnDetector } from './turnDetector'
import { hearingLang } from '../../utils/voiceStyle'
import { speakableText, speechChunks, chunkLang, speechCostPerHour } from './speakable'
import { voiceCommand, isEmptyTurn, nextSpeed, SPEEDS } from './voiceCommands'

const ENGINE_NAME = { local: 'speech_local', browser: 'speech_browser', device: 'speech_device', gemini: 'Gemini', grok: 'Grok', openai: 'OpenAI' }
const SPEED_KEY = 'ebiki-voice-speed'
const TURN_KEY = 'ebiki-voice-turn' // 'auto' (hands-free) | 'push' (the turn ends only on "I'm done")
const EMPTY_LIMIT = 3 // noise-only turns in a row before the session pauses itself (a TV can never spend money)
const LEARNER_PAUSE_MS = 1800 // quiet before a turn ends while speaking the learned language (learners pause to think)
const STATUS_ICON = { starting: '🎙️', listening: '🎙️', hearing: '👂', transcribing: '✍️', thinking: '💭', speaking: '🔊', paused: '⏸', idle: '⏸' }

export default function VoiceMount() {
  const open = useSyncExternalStore(onVoicePanel, voicePanelOpen, voicePanelOpen)
  return open ? <VoicePanel /> : null
}

const readSpeed = () => { const v = Number(platform.kv.get(SPEED_KEY)); return SPEEDS.includes(v) ? v : 1 }
const readTurnMode = () => (platform.kv.get(TURN_KEY) === 'push' ? 'push' : 'auto')

function VoicePanel() {
  const ctx = useFeatureCtx()
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const t = ctx?.t || ((k) => k)
  const [phase, setPhase] = useState('starting') // starting listening hearing transcribing thinking speaking paused idle noengine nokey error
  const phaseRef = useRef('starting')
  phaseRef.current = phase
  const [level, setLevel] = useState(0)
  const [heard, setHeard] = useState('')
  const [said, setSaid] = useState('')
  const [note, setNote] = useState('') // problems the learner must see (announced)
  const [info, setInfo] = useState('') // quiet progress (the model download: never announced per percent)
  const [levels, setLevels] = useState(true) // false: the engine ends its own turns, or no level meter (tap "I'm done")
  // "I'm speaking": the language the recognizer expects ('' = the mode's default, see hearingLang). Read live by the
  // next turn (a ref), so switching mid-session takes effect on the next thing you say.
  const [speakChoice, setSpeakChoice] = useState('')
  const speakChoiceRef = useRef('')
  speakChoiceRef.current = speakChoice
  const [speed, setSpeedState] = useState(readSpeed)
  const speedRef = useRef(speed)
  speedRef.current = speed
  const [turnMode, setTurnModeState] = useState(readTurnMode)
  const turnModeRef = useRef(turnMode)
  turnModeRef.current = turnMode
  const [typed, setTyped] = useState('')
  const [typing, setTyping] = useState(false) // the text box is shown (a "Type instead" tap; it stays once used)
  const ringRef = useRef(null)
  const [cards, setCards] = useState([]) // [{ card, state: 'idle' | 'adding' | 'added' | 'failed' }]
  const [replies, setReplies] = useState(0)
  const [retryText, setRetryText] = useState('')
  const run = useRef(0)
  const mic = useRef(null)
  const line = useRef(null)
  const alive = useRef(false)
  const lastReply = useRef(null)
  const empties = useRef(0)
  const chan = useRef(null)
  const me = useRef(Math.random().toString(36).slice(2))

  const setSpeed = (v) => { setSpeedState(v); speedRef.current = v; platform.kv.set(SPEED_KEY, v) }
  const setTurnMode = (v) => { setTurnModeState(v); turnModeRef.current = v; platform.kv.set(TURN_KEY, v) }

  const live = (token) => alive.current && token === run.current
  const stopAll = () => {
    run.current++
    try { mic.current?.cancel?.() } catch { /* already closed */ }
    mic.current = null
    try { line.current?.stop?.() } catch { /* already stopped */ }
    line.current = null
  }
  // Every way out releases everything, in this order, each step on its own (one failing step never keeps the rest
  // running): the on-device recognizer, the mic, the voice.
  const release = () => { try { platform.speech.releaseLocal?.() } catch { /* nothing loaded */ } try { stopAll() } catch { /* closed */ } }
  const close = () => { alive.current = false; release(); setVoicePanel(false) }
  // This window holds the mic: another window's voice panel pauses (the same turn is never heard twice).
  const claim = () => { try { chan.current?.postMessage({ type: 'open', id: me.current }) } catch { /* no channel */ } }

  const micProblem = (e) => {
    const n = e?.name || ''
    if (n === 'NotAllowedError' || n === 'SecurityError' || e?.code === 'nomic') return t('vm_micDenied')
    if (n === 'NotFoundError' || n === 'OverconstrainedError') return t('vm_micMissing')
    if (n === 'NotReadableError' || n === 'AbortError') return t('vm_micBusy')
    return ''
  }

  const listenTurn = async (token, keepNote = false) => {
    const c = ctxRef.current
    if (!c?.chat?.hasKey) { setPhase('nokey'); return }
    setHeard(''); if (!keepNote) setNote(''); setLevel(0); setPhase('listening'); setRetryText('')
    const isLang = !!c.subject?.isLanguage
    // Every recognizer is told the language to expect (utils/voiceStyle.js hearingLang): left to guess, short phrases
    // spoken with a learner's accent came out as English (translated), so practice in the learned language was lost.
    const langFor = () => hearingLang({ isLanguage: isLang, learnIso: c.subject?.learnLangIso || '', appIso: c.lang || '', choice: speakChoiceRef.current })
    const sttLang = langFor()
    const push = turnModeRef.current === 'push'
    const learning = isLang && sttLang && sttLang === c.subject?.learnLangIso
    const det = createTurnDetector(push ? { silenceMs: Infinity, noSpeechMs: Infinity, maxSpeechMs: 120000 } : learning ? { silenceMs: LEARNER_PAUSE_MS } : {})
    let ended = false
    // No sound at all for a few seconds = the mic is muted, the wrong device or blocked: say so (a silent mic once
    // looked like the app not hearing).
    let loudest = 0
    const silentCheck = setTimeout(() => { if (live(token) && !ended && loudest < 0.008 && mic.current?.levels) setNote(t('vm_cantHear')) }, 4000)
    try {
      const h = await listen(c, {
        lang: langFor, // read again when the turn is transcribed: a switch made while talking counts
        onFail: (code) => { if (live(token)) { setNote(code === 'nomic' ? t('vm_micDenied') : t('vm_heardNothing')); setPhase('idle') } },
        onProgress: (p) => {
          if (!live(token) || !p?.total) return
          const mb = (b) => Math.round(b / 1e6)
          setInfo(p.loaded >= p.total ? '' : t('vm_downloadingMb', { mb: mb(p.loaded), total: mb(p.total) }))
        },
        onLevel: (lv, ms) => {
          if (!live(token) || ended) { clearTimeout(silentCheck); return }
          loudest = Math.max(loudest, lv)
          if (lv > 0.02) setNote((n) => (n === t('vm_cantHear') ? '' : n))
          setLevel(lv)
          const r = det.feed(lv, ms)
          if (r === 'start') setPhase('hearing')
          if (r === 'end') { ended = true; finishTurn(token) }
          // A long silence: no nagging, no speech. It stops listening and waits for a tap.
          if (r === 'timeout') { ended = true; try { mic.current?.cancel?.() } catch { /* closed */ } mic.current = null; setNote(t('vm_stillThere')); setPhase('idle') }
        },
      })
      if (!live(token)) { try { h.cancel() } catch { /* closed */ } return }
      mic.current = h
      setLevels(!!h.levels)
    } catch (e) {
      clearTimeout(silentCheck)
      if (!live(token)) return
      if (e?.message === 'no-engine') { setPhase('noengine'); return }
      setNote(micProblem(e) || t('vm_error', { msg: String(e?.message || e).slice(0, 120) }))
      setPhase('idle')
    }
  }

  const finishTurn = async (token) => {
    const h = mic.current
    mic.current = null
    if (!h || !live(token)) return
    setPhase('transcribing'); setLevel(0)
    let text = ''
    try { text = String((await h.stop({ keep: () => live(token) })) || '').trim() } catch (e) {
      if (!live(token)) return
      setNote(micProblem(e) || t('vm_error', { msg: String(e?.message || e).slice(0, 120) })); setPhase('idle'); return
    }
    if (!live(token)) return
    setInfo('') // the recognizer answered, so its download is over
    handleText(token, text)
  }

  // One turn's words (spoken or typed): a command, an empty turn, or a message to Ebi.
  const handleText = async (token, text) => {
    if (isEmptyTurn(text)) {
      empties.current++
      if (empties.current >= EMPTY_LIMIT) { empties.current = 0; stopAll(); setNote(t('vm_emptyPaused')); setPhase('paused'); return }
      setNote(t('vm_heardNothing')); listenTurn(token, true); return
    }
    empties.current = 0
    setHeard(text); setNote('')
    const cmd = voiceCommand(text)
    if (cmd === 'end') { close(); return }
    if (cmd === 'pause') { pause(); return }
    if (cmd === 'slower' || cmd === 'faster') {
      const v = nextSpeed(speedRef.current, cmd)
      setSpeed(v); setNote(t('vm_speedSet', { s: v }))
      // Slower: say the last line again at the new speed (that is why they asked).
      if (cmd === 'slower' && lastReply.current) { await speakReply(lastReply.current, token, { again: true }); return }
      listenTurn(token, true); return
    }
    if (cmd === 'repeat') { if (lastReply.current) await speakReply(lastReply.current, token, { again: true }); else listenTurn(token); return }
    await sendTurn(token, cmd === 'recap' ? recapAsk() : text)
  }

  const sendTurn = async (token, text) => {
    setSaid(''); setPhase('thinking'); setRetryText('')
    // A reply still on its way (a paused turn, another send): wait for it (capped) instead of dropping what was said.
    const until = Date.now() + 30000
    while (ctxRef.current?.chat?.loading && Date.now() < until) { await new Promise((r) => setTimeout(r, 200)); if (!live(token)) return }
    let reply = null
    try { reply = await ctxRef.current.chat.send(text) } catch { reply = null }
    if (!live(token)) return
    if (!reply) { if (ctxRef.current?.chat?.hasKey) { setNote(t('vm_busy')); setRetryText(text); setPhase('idle') } else setPhase('nokey'); return }
    // A failed reply (no credit, network, refused key) is shown with Retry, never read aloud as if Ebi said it.
    if (reply.error) { setNote(String(reply.content || '').slice(0, 300)); setRetryText(text); setPhase('idle'); return }
    setReplies((n) => n + 1)
    if (reply.cards?.length) setCards((cs) => [...cs, ...reply.cards.filter((c) => !cs.some((x) => x.card === c)).map((card) => ({ card, state: card.synced ? 'added' : 'idle' }))])
    await speakReply(reply, token)
  }

  const speakReply = async (reply, token, { again = false } = {}) => {
    lastReply.current = reply
    const c = ctxRef.current
    const words = speakableText(reply.content, {
      codePhrase: t('vm_codeOnScreen'),
      // No app sentence about cards appended to Ebi's words (it came out in the app language in the middle of a Spanish
      // talk): the cards show as chips to tap, and Ebi mentions them himself.
      cards: [],
      cardsPhrase: (fronts) => t('vm_cardsMade', { list: fronts.slice(0, 4).join(', ') }),
    })
    const chunks = speechChunks(words)
    // The device voice needs each piece's language (AI voices hear it); a Spanish line in an English voice is noise.
    const device = speechEngines(c).tts === 'device'
    const langOf = (chunk) => (device ? chunkLang(chunk, { learnIso: c.subject?.isLanguage ? c.subject.learnLangIso : '', userIso: c.lang || '' }) : '')
    setPhase('speaking'); setSaid('')
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (!live(token)) return
      setSaid((s) => (s ? `${s} ${chunk}` : chunk))
      // The next sentence is made while this one plays (no gap between sentences).
      if (chunks[i + 1]) prepare(c, chunks[i + 1], { lang: langOf(chunks[i + 1]) })
      const l = speak(c, chunk, { lang: langOf(chunk), rate: speedRef.current })
      line.current = l
      await l.done
      if (line.current === l) line.current = null
    }
    if (live(token)) listenTurn(token, again)
  }

  // Opening starts listening; leaving stops everything (mic released, voice cut, the on-device recognizer unloaded),
  // whatever was running. ONLY WHILE THE SESSION IS ACTIVE (the owner: never "bugged and running in background and
  // costing me performance or tokens"): a reply still on its way when the panel closes is never spoken and starts no
  // new turn (`live(token)`), and nothing listens again until the panel is opened again.
  useEffect(() => {
    alive.current = true
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        chan.current = new BroadcastChannel('ebiki-voice')
        chan.current.onmessage = (e) => { if (e?.data?.type === 'open' && e.data.id !== me.current && alive.current) { stopAll(); setLevel(0); setNote(t('vm_otherWindow')); setPhase('paused') } }
      }
    } catch { chan.current = null }
    claim()
    const token = ++run.current
    listenTurn(token)
    // Focus starts on the main action (the ring), not a text box: the dialog picks the first field by default.
    const f = setTimeout(() => { try { ringRef.current?.focus({ preventScroll: true }) } catch { /* gone */ } }, 60)
    return () => {
      clearTimeout(f); alive.current = false; release(); try { chan.current?.close() } catch { /* closed */ } }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  // Leaving Chat (another tab), switching mode, or the app going away closes the session.
  const modeId = ctx?.activeMode?.id
  const startMode = useRef(modeId)
  useEffect(() => { if ((ctx?.activeTab && ctx.activeTab !== 'chat') || modeId !== startMode.current) close() }, [ctx?.activeTab, modeId]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => platform.onPageHide?.(() => close()), []) // eslint-disable-line react-hooks/exhaustive-deps
  // The window hidden or minimized PAUSES it (mic off, voice cut); the learner taps to continue when back.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const onVis = () => { if (document.hidden && alive.current && phaseRef.current !== 'paused') { pause(); setNote(t('vm_hiddenPaused')) } }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => { stopAll(); claim(); setNote(''); listenTurn(run.current) }
  const interrupt = () => { stopAll(); setNote(''); listenTurn(run.current) }
  const pause = () => { stopAll(); setLevel(0); setPhase('paused') }
  const doneTalking = () => finishTurn(run.current)
  // "That's not what I said": the reply on its way is never spoken (the turn stays in the chat), and it listens again.
  const notWhatISaid = () => { stopAll(); setHeard(''); listenTurn(run.current) }
  const retry = () => { const text = retryText; if (!text) return; stopAll(); setNote(''); setHeard(text); sendTurn(run.current, text) }
  // The recap names its language (the one being practiced in a language mode) and the whole talk: asked in the app
  // language it came back in English in the middle of a Spanish talk, about the last two greetings only (a judge).
  function recapAsk() {
    const c = ctxRef.current
    const iso = c?.subject?.isLanguage && c.subject.learnLangIso ? c.subject.learnLangIso : (c?.lang || 'en')
    let lang = iso
    try { lang = new Intl.DisplayNames([c?.lang || 'en'], { type: 'language' }).of(iso) || iso } catch { /* the code */ }
    return t('vm_recapAsk', { lang })
  }
  const recap = () => { stopAll(); setNote(''); const ask = recapAsk(); setHeard(ask); sendTurn(run.current, ask) }
  const sendTyped = (e) => {
    e?.preventDefault?.()
    const text = typed.trim()
    if (!text) return
    setTyped(''); stopAll(); claim(); handleText(run.current, text)
  }
  const addCard = async (card) => {
    setCards((cs) => cs.map((x) => (x.card === card ? { ...x, state: 'adding' } : x)))
    let ok = false
    try { ok = await ctxRef.current?.chat?.addCard?.(card) } catch { ok = false }
    setCards((cs) => cs.map((x) => (x.card === card ? { ...x, state: ok ? 'added' : 'failed' } : x)))
  }

  // Keys: Esc while Ebi talks interrupts (a second Esc closes, through the dialog); Space ends a turn, interrupts or
  // starts one when the focus is not on a text box or a button. A LAYOUT effect so it runs before the dialog's own Esc.
  useLayoutEffect(() => {
    const onKey = (e) => {
      if (e.isComposing || e.keyCode === 229) return
      const p = phaseRef.current
      const tag = String(e.target?.tagName || '').toLowerCase()
      if (e.key === 'Escape' && !e.defaultPrevented && p === 'speaking' && !document.querySelector('[data-app-dialog]')) { e.preventDefault(); interrupt(); return }
      if ((e.key === ' ' || e.code === 'Space') && !['input', 'textarea', 'button', 'select'].includes(tag) && !e.target?.isContentEditable) {
        if (p === 'listening' || p === 'hearing') { e.preventDefault(); doneTalking() } else if (p === 'speaking') { e.preventDefault(); interrupt() } else if (p === 'paused' || p === 'idle') { e.preventDefault(); restart() }
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ctx) return null
  const eng = speechEngines(ctx)
  const nameOf = (e) => (!e ? t('speech_none') : String(ENGINE_NAME[e] || e).startsWith('speech_') ? t(ENGINE_NAME[e]) : ENGINE_NAME[e])
  const perHour = speechCostPerHour(COSTS, eng.stt, eng.tts)
  const cost = perHour > 0 ? t('vm_cost', { stt: nameOf(eng.stt), tts: nameOf(eng.tts), p: `$${perHour.toFixed(2)}` }) : t('vm_costFree', { stt: nameOf(eng.stt), tts: nameOf(eng.tts) })
  const last = [...(ctx.chat?.messages || [])].reverse().find((m) => m.role === 'assistant' && m.mascot)
  const pose = last?.mascot ? shrimpUrl(last.mascot) : shrimpUrl(poseFile('happy'))
  const ring = { listening: C.info, hearing: C.success, transcribing: C.purple, thinking: C.purple, speaking: C.brand, paused: C.inkFaint, idle: C.inkFaint }[phase] || C.border
  const status = {
    starting: t('vm_listening'), listening: t(turnMode === 'push' ? 'vm_listeningPush' : 'vm_listening'), hearing: t('vm_hearing'), transcribing: t('vm_transcribing'),
    thinking: t('vm_thinking'), speaking: t('vm_speaking'), paused: t('vm_paused'), idle: t('vm_tapToTalk'),
  }[phase] || ''
  // The big ring does what the main button does: interrupt, talk again, or end the turn (nothing while working).
  const ringAction = phase === 'speaking' ? interrupt : phase === 'paused' || phase === 'idle' ? restart : (phase === 'listening' || phase === 'hearing') ? doneTalking : null
  const grow = phase === 'hearing' || phase === 'listening' ? Math.min(0.22, level * 3) : 0
  const tapWords = !!(ctx.subject?.isLanguage && ctx.words?.tappable)
  const seg = (on) => ({ minHeight: 32, padding: '4px 10px', borderRadius: 99, border: `1px solid ${on ? C.info : C.border}`, background: on ? `color-mix(in srgb, ${C.info} 14%, ${C.surface})` : 'transparent', color: on ? C.ink : C.inkDim, fontWeight: 800, fontSize: 12.5, cursor: on ? 'default' : 'pointer' })
  const segRow = { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', fontSize: 12.5, color: C.inkDim }
  const btnRow = { display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }

  return (
    <Modal open onClose={close} label={t('vm_title')} width={520}>
      <div data-voice-panel={phase} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '4px 2px', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: C.ink }}>🎙️ {t('vm_title')}</div>
        {phase === 'noengine' || phase === 'nokey' ? (
          <>
            <img src={shrimpUrl(poseFile('confused'))} alt="" style={{ width: 110, height: 110, objectFit: 'contain' }} />
            <div style={{ fontSize: 14.5, color: C.ink, lineHeight: 1.5, maxWidth: 400 }}>{t(phase === 'nokey' ? 'vm_noKey' : 'vm_noEngine')}</div>
            <div style={btnRow}>
              <ChunkyButton color={C.success} onClick={() => { close(); ctx.openSettings?.(phase === 'nokey' ? 'models' : 'general') }}>⚙️ {t(phase === 'nokey' ? 'vm_openAi' : 'vm_openSettings')}</ChunkyButton>
              <ChunkyButton variant="ghost" color={C.inkDim} onClick={close}>{t('vm_end')}</ChunkyButton>
            </div>
          </>
        ) : (
          <>
            <button ref={ringRef} type="button" onClick={ringAction || undefined} disabled={!ringAction}
              aria-label={phase === 'speaking' ? t('vm_interrupt') : phase === 'paused' || phase === 'idle' ? t('vm_tapToTalk') : ringAction ? t('vm_doneTalking') : status}
              style={{ cursor: ringAction ? 'pointer' : 'default', position: 'relative', width: 'min(150px, calc(15vh / var(--app-zoom, 1)))', height: 'min(150px, calc(15vh / var(--app-zoom, 1)))', flexShrink: 0, borderRadius: '50%', border: 'none', padding: 0, background: 'transparent' }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `6px solid ${ring}`, transform: `scale(${1 + grow})`, transition: 'transform 90ms linear, border-color .2s',
                boxShadow: `0 0 0 ${phase === 'hearing' ? 8 : 0}px color-mix(in srgb, ${ring} 18%, transparent)`, animation: phase === 'thinking' || phase === 'transcribing' ? 'vmSpin 1.1s linear infinite' : phase === 'speaking' ? 'vmPulse 1.2s ease-in-out infinite' : 'none',
                borderTopColor: phase === 'thinking' || phase === 'transcribing' ? 'transparent' : ring }} />
              <img src={pose} alt="" style={{ position: 'absolute', inset: '11%', width: '78%', height: '78%', objectFit: 'contain' }} />
            </button>
            {/* The live mic level: proof the mic hears you (decorative for screen readers: the status says it). */}
            {levels && (phase === 'listening' || phase === 'hearing') && (
              <div data-mic-level={Math.round(level * 1000)} aria-hidden="true" style={{ width: 220, height: 10, marginTop: 10, borderRadius: 99, background: C.surfaceSunken, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, Math.round(level * 400))}%`, height: '100%', background: phase === 'hearing' ? C.success : C.info, transition: 'width 60ms linear' }} />
              </div>
            )}
            {/* The one live region: the state, with an icon (never colour alone). */}
            <div role="status" aria-live="polite" style={{ fontWeight: 800, fontSize: 15, color: C.ink, minHeight: 22 }}>{STATUS_ICON[phase] ? `${STATUS_ICON[phase]} ` : ''}{status}</div>
            {heard && <div data-voice-heard style={{ fontSize: 13.5, color: C.inkDim, maxWidth: 440 }}><b>{t('vm_you')}:</b> {heard}</div>}
            {phase === 'thinking' && heard && <button type="button" onClick={notWhatISaid} className="ui-btn" style={{ minHeight: 32, padding: '4px 12px', borderRadius: 99, border: `1px solid ${C.border}`, background: 'transparent', color: C.inkDim, fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>↩ {t('vm_notWhatISaid')}</button>}
            {said && (
              <div data-voice-said style={{ fontSize: 15, color: C.ink, lineHeight: 1.5, width: '100%', maxWidth: 460, maxHeight: 130, overflowY: 'auto', padding: '8px 12px', borderRadius: RADIUS.md, background: C.surfaceSunken, textAlign: 'left', boxSizing: 'border-box' }}>
                {tapWords ? ctx.words.tappable(said, 'voice-said') : said}
                {tapWords && ctx.words.popup?.('voice-said')}
              </div>
            )}
            {cards.length > 0 && (
              <div data-voice-cards style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 460 }}>
                {cards.map(({ card, state }, i) => (
                  <button key={i} type="button" disabled={state !== 'idle' && state !== 'failed' || !ctx.chat?.canAddCards} onClick={() => addCard(card)}
                    style={{ minHeight: 32, padding: '4px 10px', borderRadius: 99, border: `1px solid ${state === 'added' ? C.success : C.border}`, background: 'transparent', color: state === 'added' ? C.success : C.ink, fontWeight: 800, fontSize: 12.5, cursor: state === 'idle' || state === 'failed' ? 'pointer' : 'default', opacity: state === 'adding' ? 0.6 : 1 }}>
                    {state === 'added' ? '✓' : state === 'failed' ? '⚠' : '+'} {String(card.front || '').replace(/<[^>]*>/g, '').slice(0, 40)}
                  </button>
                ))}
              </div>
            )}
            {note && <div role="alert" style={{ fontSize: 13, color: C.warning, fontWeight: 700, maxWidth: 440 }}>{note}</div>}
            {info && <div data-voice-info style={{ fontSize: 12.5, color: C.inkDim }}>{info}</div>}
            <div style={btnRow}>
              {(phase === 'listening' || phase === 'hearing') && <ChunkyButton color={C.success} onClick={doneTalking}>✅ {t('vm_doneTalking')}</ChunkyButton>}
              {phase === 'speaking' && <ChunkyButton color={C.brand} onClick={interrupt}>✋ {t('vm_interrupt')}</ChunkyButton>}
              {(phase === 'paused' || phase === 'idle') && <ChunkyButton color={C.success} onClick={restart}>🎙️ {t('vm_tapToTalk')}</ChunkyButton>}
              {retryText && (phase === 'paused' || phase === 'idle') && <ChunkyButton variant="ghost" color={C.brand} onClick={retry}>↻ {t('vm_retry')}</ChunkyButton>}
              {replies >= 2 && phase !== 'thinking' && phase !== 'transcribing' && <ChunkyButton variant="ghost" color={C.purple} onClick={recap}>📝 {t('vm_recap')}</ChunkyButton>}
            </div>
            {!levels && turnMode !== 'push' && (phase === 'listening' || phase === 'hearing') && <div style={{ fontSize: 12, color: C.inkDim }}>{t('vm_tapWhenDone')}</div>}
            {/* Typing is always there: the same conversation, for when speaking is not possible. */}
            {!typing && <button type="button" onClick={() => setTyping(true)} data-voice-type-open style={{ minHeight: 32, padding: '4px 12px', borderRadius: 99, border: `1px solid ${C.border}`, background: 'transparent', color: C.inkDim, fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>⌨ {t('vm_typeInstead')}</button>}
            {typing && <form onSubmit={sendTyped} style={{ display: 'flex', gap: 6, width: '100%', maxWidth: 440 }}>
              <input autoFocus data-no-voice value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={t('vm_typeHere')} aria-label={t('vm_typeHere')}
                style={{ flex: 1, minWidth: 0, minHeight: 40, padding: '6px 12px', borderRadius: RADIUS.md, border: `1px solid ${C.border}`, background: C.surface, color: C.ink, fontSize: 14 }} />
              <button type="submit" disabled={!typed.trim()} style={{ minHeight: 40, minWidth: 64, padding: '6px 12px', borderRadius: RADIUS.md, border: `1px solid ${C.border}`, background: 'transparent', color: C.ink, fontWeight: 800, cursor: typed.trim() ? 'pointer' : 'default', opacity: typed.trim() ? 1 : 0.5 }}>{t('vm_send')}</button>
            </form>}
            {/* "I'm speaking": in a language mode, the learned language or your own (the recognizer is told which). */}
            {ctx?.subject?.isLanguage && ctx.subject.learnLangIso && ctx.subject.learnLangIso !== ctx.lang && (() => {
              const learn = ctx.subject.learnLangIso; const own = ctx.lang || 'en'
              const name = (iso) => { try { return new Intl.DisplayNames([ctx.lang || 'en'], { type: 'language' }).of(iso) || iso } catch { return iso } }
              const cur = speakChoice || learn
              return (
                <div role="radiogroup" aria-label={t('vm_speakLang')} data-speak-lang={cur} style={segRow}>
                  <span>{t('vm_speakLang')}</span>
                  {[learn, own].map((iso) => (
                    <button key={iso} type="button" role="radio" aria-checked={cur === iso} className={cur === iso ? 'ui-tab ui-tab-current' : 'ui-tab'} onClick={() => setSpeakChoice(iso === learn ? '' : iso)} style={seg(cur === iso)}>{name(iso)}</button>
                  ))}
                </div>
              )
            })()}
            {/* Speed and how a turn ends: remembered on this device, folded away so the panel fits a phone. */}
            <details data-voice-options style={{ width: '100%', maxWidth: 440, fontSize: 12.5, color: C.inkDim }}>
              <summary style={{ cursor: 'pointer', fontWeight: 800, minHeight: 28, lineHeight: 1.4, padding: '4px 0' }}>⚙ {t('vm_options', { s: speed, mode: t(turnMode === 'push' ? 'vm_pushToTalk' : 'vm_handsFree') })}</summary>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6 }}>
            <div role="radiogroup" aria-label={t('vm_speed')} data-voice-speed={speed} style={segRow}>
              <span>{t('vm_speed')}</span>
              {SPEEDS.map((v) => <button key={v} type="button" role="radio" aria-checked={speed === v} className={speed === v ? 'ui-tab ui-tab-current' : 'ui-tab'} onClick={() => setSpeed(v)} style={seg(speed === v)}>{v}x</button>)}
            </div>
            <div role="radiogroup" aria-label={t('vm_turnMode')} data-voice-turn={turnMode} style={segRow}>
              <span>{t('vm_turnMode')}</span>
              {[['auto', 'vm_handsFree'], ['push', 'vm_pushToTalk']].map(([v, k]) => <button key={v} type="button" role="radio" aria-checked={turnMode === v} className={turnMode === v ? 'ui-tab ui-tab-current' : 'ui-tab'} onClick={() => setTurnMode(v)} style={seg(turnMode === v)}>{t(k)}</button>)}
            </div>
                <div style={{ fontSize: 12, color: C.inkDim, lineHeight: 1.4, textAlign: 'center' }}>{t('vm_hint')} {cost}</div>
              </div>
            </details>
            {/* Pause and End sit apart from the turn buttons, in their own row: a mis-tap can't end the talk. */}
            {/* Pinned to the dialog's bottom: a note, a card chip or Options open never push it out of view (a judge found
                End below the screen on a phone). */}
            <div data-voice-end-row style={{ position: 'sticky', bottom: 0, zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center', gap: 16, marginTop: 4, padding: '8px 0 4px', borderTop: `1px solid ${C.border}`, background: C.surface }}>
              {phase !== 'paused' && phase !== 'idle' && <ChunkyButton variant="ghost" color={C.inkDim} onClick={pause}>⏸ {t('vm_pause')}</ChunkyButton>}
              <ChunkyButton variant="ghost" color={C.danger} onClick={close}>⏹ {t('vm_end')}</ChunkyButton>
            </div>
          </>
        )}
        <style>{'@keyframes vmSpin{to{transform:rotate(360deg)}}@keyframes vmPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@media (prefers-reduced-motion: reduce){[data-voice-panel] span{animation:none!important}}'}</style>
      </div>
    </Modal>
  )
}
