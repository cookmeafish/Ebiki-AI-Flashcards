// A Talk step: a short conversation with Ebi on the area's topic (typed, or out loud with the optional Voice
// chat feature), then a score. Always optional on the map (it never blocks the ladder).
import { ctxErrorText } from '../kit/aiError'
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { speak } from '../../speech'
import { useFocusHold } from '../registry'
import { ChunkyButton, EbiSays } from '../ui'
import { TalkButton, voiceChatOn, useVoiceChat } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'
import { buildTalkSystem, buildTalkTurn, buildTalkScorePrompt, buildTalkHintPrompt, hintGivesAway, parseTalkScore, parseTalkReply, ROLE, JOB, MAX_TOKENS, TALK_TURNS, ADVENTURE_TURNS } from './prompt'
import { imeActive } from '../../utils/keys'

const SCORE_SCALE = 10 // a talk counts as a 10-question step (score 0..1 → correct 0..10)

export default function Talk({ ctx, area, node, items, onFinish, onQuit }) {
  const { t, ai, subject } = ctx
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [score, setScore] = useState(null)
  const [hint, setHint] = useState('')        // the nudge on screen ('' = none)
  const [hinting, setHinting] = useState(false)
  const hintsUsed = useRef(0)
  const scene = node?.title || ''
  // An Adventure step: an open goal the learner reaches their own way; Ebi says when it is reached (GOAL_TAG).
  const goal = node?.kind === 'adventure' ? String(node.goal || '') : ''
  const maxTurns = goal ? ADVENTURE_TURNS : TALK_TURNS
  const [goalDone, setGoalDone] = useState(false)
  const levelRef = useRef('')
  const speaking = useRef(null)
  const listRef = useRef(null)
  const alive = useRef(true)
  const voiceOn = voiceChatOn(ctx)
  const voiceOnRef = useVoiceChat(voiceOn, speaking) // live: a late reply is not spoken once switched off
  const lang = subject.isLanguage ? subject.learnLangIso : ctx.lang
  const mine = messages.filter((m) => m.role === 'me').length
  // Ebi's words are tappable like Study's (ctx.words); one id per chat so an old popup never shows in a new one.
  const sid = useRef(`lg-talk-${Date.now().toString(36)}`).current
  useFocusHold(!score)
  // Set on EVERY mount: React's StrictMode mounts, unmounts and mounts again, and a flag only ever cleared left the
  // opening line (asked on the first mount, not asked again) dropped as if the screen had closed: "thinking" forever.
  useEffect(() => { alive.current = true; return () => { alive.current = false; speaking.current?.stop() } }, [])
  useEffect(() => { listRef.current?.scrollTo?.({ top: 1e9, behavior: 'smooth' }) }, [messages])

  const [turnFailed, setTurnFailed] = useState(false) // Ebi's last turn failed (not the score): offer to ask again
  const turn = async (history) => {
    setBusy(true); setError(''); setTurnFailed(false)
    try {
      if (!levelRef.current) levelRef.current = await learnerLevelLine(ctx)
      const raw = await ai.call(buildTalkSystem(subject, area, items, { level: levelRef.current, scene, goal }), buildTalkTurn(history), { role: ROLE.talk, job: JOB.talk, maxTokens: MAX_TOKENS.talk })
      if (!alive.current) return
      const reply = parseTalkReply(raw)
      if (goal && history.length > 0 && reply.reached) setGoalDone(true)
      const text = ai.clean(reply.text) || '...'
      setMessages([...history, { role: 'ebi', text }])
      if (voiceOnRef.current) { speaking.current?.stop(); speaking.current = speak(ctx, text, { lang }) }
    } catch (e) { if (alive.current) { setError(ctxErrorText(ctx, e)); setTurnFailed(true) } } finally { if (alive.current) setBusy(false) }
  }
  const opened = useRef(false)
  useEffect(() => { if (!opened.current) { opened.current = true; turn([]) } }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const send = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput(''); setHint('')
    const history = [...messages, { role: 'me', text }]
    setMessages(history)
    // An Adventure still gets Ebi's reply to the LAST message: it is where the goal tag is read, and a mission
    // finished on the final turn was scored as not reached.
    if (history.filter((m) => m.role === 'me').length < maxTurns || (goal && !goalDone)) turn(history)
  }

  // 💡 What to say next, never the words: a hint quoting a practice phrase is asked again once, then replaced by a
  // plain nudge. Counted for the score ("asked for N hints").
  const askHint = async () => {
    if (hinting || busy || !messages.length) return
    setHinting(true); setError('')
    try {
      const said = messages.filter((m) => m.role === 'me').map((m) => m.text.toLowerCase()).join(' ')
      const unused = items.map((it) => it.front).filter((f) => !said.includes(String(f).toLowerCase().replace(/\([^)]*\)/g, '').trim()))
      const { system, user } = buildTalkHintPrompt(subject, area, items, messages, { scene, unused })
      let text = ''
      for (let k = 0; k < 2 && !text; k++) {
        const got = ai.clean(String(await ai.call(system, user, { role: ROLE.hint, job: JOB.hint, maxTokens: MAX_TOKENS.hint }) || '')).replace(/^["'“”]+|["'“”]+$/g, '').trim()
        if (got && !hintGivesAway(got, subject, items, messages.filter((m) => m.role === 'ebi').map((m) => m.text))) text = got
      }
      if (!alive.current) return
      hintsUsed.current++
      setHint(text || t('lg_hintFallback'))
    } catch (e) { if (alive.current) setError(ctxErrorText(ctx, e)) } finally { if (alive.current) setHinting(false) }
  }

  // Scored once: a fast double click on Finish asked the grader twice (state flips a render later).
  const scoringRef = useRef(false)
  const end = async () => {
    if (scoringRef.current) return
    scoringRef.current = true
    setBusy(true); setError('')
    speaking.current?.stop()
    try {
      const { system, user } = buildTalkScorePrompt(subject, area, messages, { hints: hintsUsed.current, goal, goalDone })
      const s = parseTalkScore(ai.json(await ai.call(system, user, { role: ROLE.talkScore, job: JOB.talkScore, maxTokens: MAX_TOKENS.talkScore })), ai.clean)
      if (!s) throw new Error(t('lg_errTalk'))
      if (alive.current) setScore(s)
    } catch (e) { if (alive.current) setError(ctxErrorText(ctx, e)) } finally { scoringRef.current = false; if (alive.current) setBusy(false) }
  }
  // Ebi's turn failed (the opening line, or a reply): ask again for the same conversation. Without it a failed
  // opening left nothing to answer, and a failed LAST Adventure reply never read the goal tag.
  const awaitingEbi = !busy && turnFailed && (messages.length === 0 || messages[messages.length - 1].role === 'me')
  const retryTurn = () => { if (!busy) turn(messages) }

  if (score) {
    return (
      <div style={{ maxWidth: 560, width: '100%', margin: '30px auto', display: 'grid', gap: 14 }}>
        <EbiSays pose={poseFile(score.score >= 0.6 ? 'happy' : 'confused')}>{score.note || t('lg_talkDone')}</EbiSays>
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: score.score >= 0.6 ? C.success : C.warning, textAlign: 'center' }}>
          {t('lg_talkScore', { n: Math.round(score.score * 100) })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {/* Rounded DOWN: a 55% talk (shown here as not passed) rounded up to 6/10 and was recorded as cleared. */}
          <ChunkyButton color={C.success} onClick={() => onFinish({ total: SCORE_SCALE, correct: Math.floor(score.score * SCORE_SCALE + 1e-9), items: [], misses: [], strengths: score.strengths, gaps: score.gaps })}>{t('lg_continue')}</ChunkyButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 440, gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onQuit} style={{ fontFamily: FONT.body, border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>← {t('lg_toMap')}</button>
        <div style={{ flex: 1, fontFamily: FONT.display, fontWeight: 900, fontSize: 19, color: C.ink }}>{goal ? '🧭' : '💬'} {goal ? scene || area.title : area.title}</div>
        <span style={{ fontSize: 12.5, color: C.inkDim, fontWeight: 700 }}>{t('lg_talkTurns', { i: Math.min(mine, maxTurns), n: maxTurns })}</span>
      </div>
      {goal && (
        <div style={{ padding: '8px 12px', borderRadius: RADIUS.md, border: `2px solid ${goalDone ? C.success : C.purple}`, background: `color-mix(in srgb, ${goalDone ? C.success : C.purple} 10%, ${C.surface})`, fontSize: 14, fontWeight: 800, color: C.ink }}>
          {goalDone ? `✅ ${t('lg_goalReached')}` : `🎯 ${t('lg_goal')}: ${goal}`}
        </div>
      )}
      <div ref={listRef} role="log" aria-live="polite" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'me' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              {m.role === 'ebi' && <img src={shrimpUrl(poseFile('happy'))} alt="" width={34} />}
              <div style={{
                padding: '10px 14px', borderRadius: RADIUS.lg, fontSize: 15, lineHeight: 1.45, whiteSpace: 'pre-wrap',
                background: m.role === 'me' ? `color-mix(in srgb, ${C.info} 14%, ${C.surface})` : C.surface, border: `2px solid ${m.role === 'me' ? C.info : C.border}`, color: C.ink,
              }}>{m.role === 'ebi' && ctx.words ? ctx.words.tappable(m.text, `${sid}-${i}`) : m.text}</div>
            </div>
            {m.role === 'ebi' && ctx.words && <div style={{ marginLeft: 42 }}>{ctx.words.popup(`${sid}-${i}`)}</div>}
          </div>
        ))}
        {busy && <div role="status" style={{ color: C.inkFaint, fontSize: 13, fontStyle: 'italic' }}>{t('lg_thinking')}</div>}
      </div>
      {error && (
        <div role="alert" style={{ color: C.danger, fontSize: 13, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ flex: '1 1 200px' }}>{error}</span>
          {awaitingEbi && <ChunkyButton variant="ghost" color={C.danger} onClick={retryTurn} style={{ padding: '6px 12px', fontSize: 13 }}>↻ {t('lg_retry')}</ChunkyButton>}
        </div>
      )}
      {hint && mine < maxTurns && !goalDone && (
        <div role="status" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderRadius: RADIUS.md, background: `color-mix(in srgb, ${C.warning} 12%, ${C.surface})`, border: `1px dashed color-mix(in srgb, ${C.warning} 55%, transparent)`, fontSize: 14, color: C.ink }}>
          <span aria-hidden="true">💡</span><span style={{ flex: 1 }}>{hint}</span>
          <button type="button" onClick={() => setHint('')} aria-label={t('lg_hintClose')} style={{ fontFamily: FONT.body, border: 'none', background: 'transparent', color: C.inkDim, cursor: 'pointer', fontSize: 14 }}>×</button>
        </div>
      )}
      {mine < maxTurns && !goalDone ? (
        <div data-composer="" style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={2} placeholder={t('lg_talkPlaceholder')}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !imeActive(e)) { e.preventDefault(); send() } }}
            style={{ flex: '1 1 220px', minWidth: 0, resize: 'none', padding: '10px 12px', fontSize: 15, fontFamily: FONT.body, borderRadius: RADIUS.md, border: `2px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
          {voiceOn && <TalkButton ctx={ctx} lang={lang} onStart={() => speaking.current?.stop()} onText={(said) => setInput((cur) => (cur.trim() ? `${cur.trim()} ${said}` : said))} />}
          <ChunkyButton variant="ghost" onClick={askHint} disabled={busy || hinting || !messages.length} color={C.warning} style={{ padding: '10px 12px' }}>
            💡 {hinting ? t('lg_hinting') : t('lg_hint')}
          </ChunkyButton>
          <ChunkyButton onClick={send} disabled={busy || !input.trim()} color={C.info}>{t('lg_send')}</ChunkyButton>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ChunkyButton onClick={end} disabled={busy} color={C.success}>{busy ? t('lg_scoring') : t('lg_talkFinish')}</ChunkyButton>
        </div>
      )}
    </div>
  )
}
