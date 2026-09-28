// One question at a time, Duolingo style: progress bar, the question, answer tiles or a text box, a CHECK
// button, then a green or red strip with the explanation and CONTINUE. Used by every quiz-like feature.
//
// questions: [{ kind: 'choice'|'typed', prompt, choices?, answerIdx?, accepted?, open?, explanation?, target?,
//               audio?: { text, lang }  heard, not shown (auto-plays once; needs `ctx`)
//               speak?: true            answered out loud (tap to talk fills the box; typing still works) }]
// ctx: the feature context, only needed for audio and speaking
// feedbackExtra(question, correct, answer): optional node under the explanation (e.g. a rule-card button)
// onAnswer(question, correct, answerText)  after each check (features award XP, log mistakes, ...)
// onFinish(results)                         results: [{ question, correct, answer }]
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { ChunkyButton, ProgressBar, depthBorder, UI } from '../ui'
import { useFocusHold } from '../registry'
import { matchTyped } from './grade'
import { judgeAnswer } from './judge'
import TalkButton from './TalkButton'
import { speak } from '../../speech'

const MAX_W = 640
const POSE = { right: 'happy', wrong: 'confused', done: 'party' }
const CHOICE_KEYS = ['1', '2', '3', '4', '5', '6']
// A spoken line that never reports its end (a voice that silently fails) must not lock the replay button:
// the button frees itself after a generous reading time.
const PLAY_BASE_MS = 2500
const PLAY_PER_CHAR_MS = 110
const PLAY_MAX_MS = 20000

export default function QuizRunner({ questions, t, ai, subject, onAnswer, onFinish, onExit, title, confirm, ctx, feedbackExtra }) {
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState(null)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('answer')    // answer | checking | feedback | done
  const [verdict, setVerdict] = useState(null)     // { correct, note, accent }
  const results = useRef([])
  const inputRef = useRef(null)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const q = questions[idx]
  const total = questions.length
  useFocusHold(phase !== 'done') // no pop-ups while answering
  // The pose pictures are big: load them up front so the feedback strip never shows an empty gap.
  useEffect(() => { for (const p of Object.values(POSE)) { const f = poseFile(p); if (f) { const im = new Image(); im.src = shrimpUrl(f) } } }, [])
  const playCapRef = useRef(null)
  useEffect(() => () => clearTimeout(playCapRef.current), [])

  const play = () => {
    if (!q?.audio?.text || !ctx) return
    audioRef.current?.stop()
    const h = speak(ctx, q.audio.text, { lang: q.audio.lang || '' })
    audioRef.current = h
    setPlaying(true)
    const release = () => { if (audioRef.current === h) setPlaying(false) }
    clearTimeout(playCapRef.current)
    playCapRef.current = setTimeout(release, Math.min(PLAY_MAX_MS, PLAY_BASE_MS + q.audio.text.length * PLAY_PER_CHAR_MS))
    Promise.resolve(h.done).catch(() => {}).finally(release)
  }
  useEffect(() => {
    setPicked(null); setText(''); setVerdict(null); setPhase('answer'); setTimeout(() => inputRef.current?.focus(), 30)
    play() // a listening question plays once by itself
    return () => audioRef.current?.stop()
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const record = (correct, answer, extra = {}) => {
    results.current = [...results.current, { question: q, correct, answer }]
    setVerdict({ correct, ...extra })
    setPhase('feedback')
    try { onAnswer?.(q, correct, answer) } catch { /* the feature's problem */ }
  }

  const check = async (skip = false) => {
    if (!q || phase !== 'answer') return
    if (skip) return record(false, '')
    if (q.kind === 'choice') {
      if (picked == null) return
      return record(picked === q.answerIdx, q.choices[picked])
    }
    const ans = text.trim()
    if (!ans) return
    const local = q.open ? null : matchTyped(ans, q.accepted)
    if (local) return record(true, ans, local === 'accent' ? { accent: true } : {})
    setPhase('checking')
    const j = await judgeAnswer(ai, subject, q, ans)
    setPhase('answer') // record() moves on
    record(!!j?.correct, ans, { note: j?.note || '' })
  }

  const next = () => {
    if (idx + 1 < total) setIdx(idx + 1)
    else { setPhase('done'); onFinish?.(results.current) }
  }

  // Keys: 1-6 pick a tile, Enter checks / continues.
  useEffect(() => {
    const onKey = (e) => {
      if (e.isComposing) return
      if (phase === 'answer' && q?.kind === 'choice') {
        const n = CHOICE_KEYS.indexOf(e.key)
        if (n >= 0 && n < q.choices.length) { setPicked(n); return }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        if (phase === 'feedback') { e.preventDefault(); next() }
        else if (phase === 'answer' && (q?.kind === 'choice' || document.activeElement === inputRef.current)) { e.preventDefault(); check() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (phase === 'done') {
    const right = results.current.filter((r) => r.correct).length
    return (
      <div style={{ maxWidth: MAX_W, margin: '40px auto', textAlign: 'center' }}>
        <img src={shrimpUrl(poseFile(POSE.done))} alt="" width={120} />
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 28, color: C.ink, margin: '8px 0 4px' }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.success, marginBottom: 20 }}>{t('kit_score', { c: right, n: total })}</div>
        <ChunkyButton onClick={onExit} color={C.success}>{t('kit_finish')}</ChunkyButton>
      </div>
    )
  }
  if (!q) return null

  const quit = async () => {
    if (!results.current.length || !confirm || (await confirm(t('kit_quitConfirm')))) onExit?.(results.current)
  }
  const good = verdict?.correct
  const reveal = q.kind === 'choice' ? q.choices[q.answerIdx] : (q.accepted || [])[0]
  return (
    <div style={{ maxWidth: MAX_W, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={quit} aria-label={t('kit_quit')} data-tip={t('kit_quit')} className="tip tip-b"
          style={{ border: 'none', background: 'transparent', color: C.inkFaint, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        <ProgressBar value={idx + (phase === 'feedback' ? 1 : 0)} max={total} color={C.success} style={{ flex: 1, height: 16 }} />
      </div>
      {title && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.purple }}>{title} · {t('kit_progress', { i: idx + 1, n: total })}</div>}
      <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 22, color: C.ink, lineHeight: 1.35, whiteSpace: 'pre-wrap' }}>{q.prompt}</div>
      {q.audio?.text && ctx && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ChunkyButton onClick={play} color={C.info} disabled={playing}>🔊 {playing ? t('kit_playing') : t('kit_play')}</ChunkyButton>
          {phase === 'feedback' && <span style={{ fontSize: 15, color: C.inkDim, fontStyle: 'italic' }}>{q.audio.text}</span>}
        </div>
      )}
      {q.speak && ctx && q.kind !== 'choice' && phase === 'answer' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <TalkButton ctx={ctx} lang={q.speakLang || ''} onStart={() => audioRef.current?.stop()} onText={(said) => setText((cur) => (cur.trim() ? `${cur.trim()} ${said}` : said))} />
          <span style={{ fontSize: 13, color: C.inkDim }}>{t('kit_speakHint')}</span>
        </div>
      )}

      {q.kind === 'choice' ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {q.choices.map((c, i) => {
            const isPick = picked === i
            const showRight = phase === 'feedback' && i === q.answerIdx
            const showWrong = phase === 'feedback' && isPick && i !== q.answerIdx
            const edge = showRight ? C.success : showWrong ? C.danger : isPick ? C.info : C.border
            return (
              <button key={i} disabled={phase !== 'answer'} onClick={() => setPicked(i)} className="btn-press" style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left', borderRadius: RADIUS.md,
                ...depthBorder(edge, { bottomColor: edge }), background: isPick || showRight ? `color-mix(in srgb, ${edge} 12%, ${C.surface})` : C.surface,
                color: C.ink, fontSize: 16, fontWeight: 700, cursor: phase === 'answer' ? 'pointer' : 'default',
              }}>
                <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: RADIUS.sm, border: `2px solid ${C.border}`, display: 'grid', placeItems: 'center', fontSize: 13, color: C.inkFaint }}>{i + 1}</span>
                <span>{c}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <textarea ref={inputRef} value={text} disabled={phase !== 'answer'} onChange={(e) => setText(e.target.value)}
          placeholder={q.open ? t('kit_writePlaceholder') : t('kit_typePlaceholder')} rows={q.open ? 4 : 2}
          style={{
            width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '12px 14px', fontSize: 16, fontFamily: FONT.body,
            borderRadius: RADIUS.md, border: `${UI.cardBorder}px solid ${C.border}`, background: C.surfaceAlt, color: C.ink,
          }} />
      )}

      <div style={{ marginTop: 'auto' }}>
        {phase === 'feedback' ? (
          <div style={{
            borderRadius: RADIUS.lg, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
            background: good ? C.successTint : C.dangerTint, border: `2px solid ${good ? C.success : C.danger}`,
          }}>
            <img src={shrimpUrl(poseFile(good ? POSE.right : POSE.wrong))} alt="" width={54} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: good ? C.success : C.danger }}>{good ? t('kit_correct') : t('kit_wrong')}</div>
              {verdict?.accent && <div style={{ fontSize: 14, color: C.ink, fontWeight: 700 }}>{t('kit_accent', { a: reveal })}</div>}
              {!good && reveal && !q.open && <div style={{ fontSize: 14, color: C.ink, fontWeight: 700 }}>{t('kit_answerWas', { a: reveal })}</div>}
              {verdict?.note && <div style={{ fontSize: 13.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>{verdict.note}</div>}
              {q.explanation && <div style={{ fontSize: 13.5, color: C.inkDim, marginTop: 4, lineHeight: 1.45 }}>{q.explanation}</div>}
              {feedbackExtra && <div key={idx} style={{ marginTop: 6 }}>{feedbackExtra(q, !!good, results.current[results.current.length - 1]?.answer || '')}</div>}
            </div>
            <ChunkyButton onClick={next} color={good ? C.success : C.danger}>{t('kit_continue')}</ChunkyButton>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center' }}>
            <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => check(true)} disabled={phase !== 'answer'}>{t('kit_skip')}</ChunkyButton>
            <ChunkyButton onClick={() => check()} color={C.success}
              disabled={phase !== 'answer' || (q.kind === 'choice' ? picked == null : !text.trim())}>
              {phase === 'checking' ? t('kit_checking') : t('kit_check')}
            </ChunkyButton>
          </div>
        )}
      </div>
    </div>
  )
}
