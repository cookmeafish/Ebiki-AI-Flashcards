// Chat's VOICE MODE panel (./index.js): hands-free talk with Ebi. One loop, every step guarded by a run token so a
// closed, paused or interrupted conversation never speaks or sends anything late:
//   listen (mic level → turnDetector ends the turn) → transcribe → ctx.chat.send (the REAL Chat) → speak the reply
//   sentence by sentence (speakable.js) → listen again.
// Ebi never listens while talking (no echo): tap Interrupt to cut him off and speak.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { shrimpUrl, poseFile } from '../../config/shrimp'
import { useFeatureCtx } from '../registry'
import { ChunkyButton, Modal } from '../ui'
import { listen, speak, prepare, speechEngines, COSTS } from '../../speech'
import { voicePanelOpen, setVoicePanel, onVoicePanel } from './store'
import { createTurnDetector } from './turnDetector'
import { speakableText, speechChunks, chunkLang, speechCostPerHour } from './speakable'

const ENGINE_NAME = { browser: 'speech_browser', device: 'speech_device', gemini: 'Gemini', grok: 'Grok', openai: 'OpenAI' }

export default function VoiceMount() {
  const open = useSyncExternalStore(onVoicePanel, voicePanelOpen, voicePanelOpen)
  return open ? <VoicePanel /> : null
}

function VoicePanel() {
  const ctx = useFeatureCtx()
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const t = ctx?.t || ((k) => k)
  const [phase, setPhase] = useState('starting') // starting listening hearing transcribing thinking speaking paused idle noengine nokey error
  const [level, setLevel] = useState(0)
  const [heard, setHeard] = useState('')
  const [said, setSaid] = useState('')
  const [note, setNote] = useState('')
  const [levels, setLevels] = useState(true) // false: the engine ends its own turns, or no level meter (tap "I'm done")
  const run = useRef(0)
  const mic = useRef(null)
  const line = useRef(null)
  const alive = useRef(false)

  const live = (token) => alive.current && token === run.current
  const stopAll = () => {
    run.current++
    try { mic.current?.cancel?.() } catch { /* already closed */ }
    mic.current = null
    line.current?.stop?.()
    line.current = null
  }
  const close = () => { stopAll(); setVoicePanel(false) }

  const listenTurn = async (token, keepNote = false) => {
    const c = ctxRef.current
    if (!c?.chat?.hasKey) { setPhase('nokey'); return }
    setHeard(''); if (!keepNote) setNote(''); setLevel(0); setPhase('listening')
    const det = createTurnDetector()
    let ended = false
    try {
      // The free browser recognizer must be told the language (it assumes the page's): in a language mode, the learned
      // one. AI engines hear the language themselves.
      const sttLang = speechEngines(c).stt === 'browser' && c.subject?.isLanguage ? c.subject.learnLangIso || '' : ''
      const h = await listen(c, {
        lang: sttLang,
        onFail: (code) => { if (live(token)) { setNote(t(code === 'nomic' ? 'vm_noMic' : 'vm_heardNothing')); setPhase('idle') } },
        onLevel: (lv, ms) => {
          if (!live(token) || ended) return
          setLevel(lv)
          const r = det.feed(lv, ms)
          if (r === 'start') setPhase('hearing')
          if (r === 'end') { ended = true; finishTurn(token) }
          if (r === 'timeout') { ended = true; try { mic.current?.cancel?.() } catch { /* closed */ } mic.current = null; setPhase('idle') }
        },
      })
      if (!live(token)) { try { h.cancel() } catch { /* closed */ } return }
      mic.current = h
      setLevels(!!h.levels)
    } catch (e) {
      if (!live(token)) return
      if (e?.message === 'no-engine') { setPhase('noengine'); return }
      setNote(t(e?.code === 'nomic' || e?.name === 'NotAllowedError' || e?.name === 'NotFoundError' ? 'vm_noMic' : 'vm_error', { msg: String(e?.message || e).slice(0, 120) }))
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
      setNote(t(e?.code === 'nomic' ? 'vm_noMic' : 'vm_error', { msg: String(e?.message || e).slice(0, 120) })); setPhase('idle'); return
    }
    if (!live(token)) return
    if (!text) { setNote(t('vm_heardNothing')); listenTurn(token, true); return }
    setHeard(text); setSaid(''); setPhase('thinking')
    // A reply still on its way (a paused turn, another send): wait for it (capped) instead of dropping what was said.
    const until = Date.now() + 30000
    while (ctxRef.current?.chat?.loading && Date.now() < until) { await new Promise((r) => setTimeout(r, 200)); if (!live(token)) return }
    let reply = null
    try { reply = await ctxRef.current.chat.send(text) } catch { reply = null }
    if (!live(token)) return
    if (!reply) { if (ctxRef.current?.chat?.hasKey) { setNote(t('vm_busy')); setPhase('idle') } else setPhase('nokey'); return }
    // A failed reply (no credit, network, refused key) is shown, never read aloud as if Ebi said it.
    if (reply.error) { setNote(String(reply.content || '').slice(0, 300)); setPhase('idle'); return }
    await speakReply(reply, token)
  }

  const speakReply = async (reply, token) => {
    const c = ctxRef.current
    const words = speakableText(reply.content, {
      codePhrase: t('vm_codeOnScreen'),
      cards: reply.cards || [],
      cardsPhrase: (fronts) => t('vm_cardsMade', { list: fronts.slice(0, 4).join(', ') }),
    })
    const chunks = speechChunks(words)
    // The device voice needs each piece's language (AI voices hear it); a Spanish line in an English voice is noise.
    const device = speechEngines(c).tts === 'device'
    const langOf = (chunk) => (device ? chunkLang(chunk, { learnIso: c.subject?.isLanguage ? c.subject.learnLangIso : '', userIso: c.lang || '' }) : '')
    setPhase('speaking')
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      if (!live(token)) return
      setSaid((s) => (s ? `${s} ${chunk}` : chunk))
      // The next sentence is made while this one plays (no gap between sentences).
      if (chunks[i + 1]) prepare(c, chunks[i + 1], { lang: langOf(chunks[i + 1]) })
      const l = speak(c, chunk, { lang: langOf(chunk) })
      line.current = l
      await l.done
      if (line.current === l) line.current = null
    }
    if (live(token)) listenTurn(token)
  }

  // Opening starts listening; leaving stops everything (mic released, voice cut), whatever was running.
  useEffect(() => {
    alive.current = true
    const token = ++run.current
    listenTurn(token)
    return () => { alive.current = false; stopAll() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const restart = () => { stopAll(); listenTurn(run.current) }
  const interrupt = () => { stopAll(); setNote(''); listenTurn(run.current) }
  const pause = () => { stopAll(); setLevel(0); setPhase('paused') }
  const doneTalking = () => finishTurn(run.current)

  if (!ctx) return null
  const eng = speechEngines(ctx)
  const nameOf = (e) => (!e ? t('speech_none') : String(ENGINE_NAME[e] || e).startsWith('speech_') ? t(ENGINE_NAME[e]) : ENGINE_NAME[e])
  const perHour = speechCostPerHour(COSTS, eng.stt, eng.tts)
  const cost = perHour > 0 ? t('vm_cost', { stt: nameOf(eng.stt), tts: nameOf(eng.tts), p: `$${perHour.toFixed(2)}` }) : t('vm_costFree', { stt: nameOf(eng.stt), tts: nameOf(eng.tts) })
  const last = [...(ctx.chat?.messages || [])].reverse().find((m) => m.role === 'assistant' && m.mascot)
  const pose = last?.mascot ? shrimpUrl(last.mascot) : shrimpUrl(poseFile('happy'))
  const ring = { listening: C.info, hearing: C.success, transcribing: C.purple, thinking: C.purple, speaking: C.brand, paused: C.inkFaint, idle: C.inkFaint }[phase] || C.border
  const status = {
    starting: t('vm_listening'), listening: t('vm_listening'), hearing: t('vm_hearing'), transcribing: t('vm_transcribing'),
    thinking: t('vm_thinking'), speaking: t('vm_speaking'), paused: t('vm_paused'), idle: t('vm_tapToTalk'),
  }[phase] || ''
  // The big ring does what the main button does: interrupt, talk again, or end the turn (nothing while working).
  const ringAction = phase === 'speaking' ? interrupt : phase === 'paused' || phase === 'idle' ? restart : (phase === 'listening' || phase === 'hearing') ? doneTalking : null
  const grow = phase === 'hearing' || phase === 'listening' ? Math.min(0.22, level * 3) : 0

  return (
    <Modal open onClose={close} label={t('vm_title')} width={520}>
      <div data-voice-panel={phase} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '4px 2px', textAlign: 'center' }}>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: C.ink }}>🎙️ {t('vm_title')}</div>
        {phase === 'noengine' || phase === 'nokey' ? (
          <>
            <img src={shrimpUrl(poseFile('confused'))} alt="" style={{ width: 110, height: 110, objectFit: 'contain' }} />
            <div style={{ fontSize: 14.5, color: C.ink, lineHeight: 1.5, maxWidth: 400 }}>{t(phase === 'nokey' ? 'vm_noKey' : 'vm_noEngine')}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <ChunkyButton color={C.success} onClick={() => { close(); ctx.openSettings?.(phase === 'nokey' ? 'models' : 'general') }}>⚙️ {t(phase === 'nokey' ? 'vm_openAi' : 'vm_openSettings')}</ChunkyButton>
              <ChunkyButton variant="ghost" color={C.inkDim} onClick={close}>{t('vm_end')}</ChunkyButton>
            </div>
          </>
        ) : (
          <>
            <button type="button" onClick={ringAction || undefined} disabled={!ringAction}
              aria-label={phase === 'speaking' ? t('vm_interrupt') : phase === 'paused' || phase === 'idle' ? t('vm_tapToTalk') : ringAction ? t('vm_doneTalking') : status}
              style={{ cursor: ringAction ? 'pointer' : 'default', position: 'relative', width: 'min(168px, calc(20vh / var(--app-zoom, 1)))', height: 'min(168px, calc(20vh / var(--app-zoom, 1)))', flexShrink: 0, borderRadius: '50%', border: 'none', padding: 0, background: 'transparent' }}>
              <span aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `6px solid ${ring}`, transform: `scale(${1 + grow})`, transition: 'transform 90ms linear, border-color .2s',
                boxShadow: `0 0 0 ${phase === 'hearing' ? 8 : 0}px color-mix(in srgb, ${ring} 18%, transparent)`, animation: phase === 'thinking' || phase === 'transcribing' ? 'vmSpin 1.1s linear infinite' : phase === 'speaking' ? 'vmPulse 1.2s ease-in-out infinite' : 'none',
                borderTopColor: phase === 'thinking' || phase === 'transcribing' ? 'transparent' : ring }} />
              <img src={pose} alt="Ebi" style={{ position: 'absolute', inset: '11%', width: '78%', height: '78%', objectFit: 'contain' }} />
            </button>
            <div role="status" aria-live="polite" style={{ fontWeight: 800, fontSize: 15, color: C.ink, minHeight: 22 }}>{status}</div>
            {heard && <div style={{ fontSize: 13.5, color: C.inkDim, maxWidth: 440 }}><b>{t('vm_you')}:</b> {heard}</div>}
            {said && (
              <div style={{ fontSize: 15, color: C.ink, lineHeight: 1.5, maxWidth: 460, maxHeight: 150, overflowY: 'auto', padding: '8px 12px', borderRadius: RADIUS.md, background: C.surfaceSunken, textAlign: 'left' }}>{said}</div>
            )}
            {note && <div role="alert" style={{ fontSize: 13, color: C.warning, fontWeight: 700 }}>{note}</div>}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              {(phase === 'listening' || phase === 'hearing') && <ChunkyButton color={C.success} onClick={doneTalking}>✅ {t('vm_doneTalking')}</ChunkyButton>}
              {phase === 'speaking' && <ChunkyButton color={C.brand} onClick={interrupt}>✋ {t('vm_interrupt')}</ChunkyButton>}
              {(phase === 'paused' || phase === 'idle') && <ChunkyButton color={C.success} onClick={restart}>🎙️ {t('vm_tapToTalk')}</ChunkyButton>}
              {phase !== 'paused' && phase !== 'idle' && <ChunkyButton variant="ghost" color={C.inkDim} onClick={pause}>⏸ {t('vm_pause')}</ChunkyButton>}
              <ChunkyButton variant="ghost" color={C.danger} onClick={close}>⏹ {t('vm_end')}</ChunkyButton>
            </div>
            {!levels && (phase === 'listening' || phase === 'hearing') && <div style={{ fontSize: 12, color: C.inkDim }}>{t('vm_tapWhenDone')}</div>}
            <div style={{ fontSize: 12, color: C.inkFaint, lineHeight: 1.4, maxWidth: 440 }}>{t('vm_hint')} {cost}</div>
          </>
        )}
        <style>{'@keyframes vmSpin{to{transform:rotate(360deg)}}@keyframes vmPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@media (prefers-reduced-motion: reduce){[data-voice-panel] span{animation:none!important}}'}</style>
      </div>
    </Modal>
  )
}
