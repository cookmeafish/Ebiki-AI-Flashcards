// Scenes: a short story (or case study) made from your cards, told line by line with two voices, then a few
// questions on what happened. Never touches the review schedule.
import { useEffect, useRef, useState } from 'react'
import { useHelpEntry } from '../kit/useHelp'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { platform } from '../../platform'
import { speak } from '../../speech'
import { useFeatureCtx, useFocusHold, useActivityBusy } from '../registry'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays, ProgressBar } from '../ui'
import { QuizRunner, pickCardItems, buildScenePrompt, parseScene, voiceFor, SCENE_ROLE, SCENE_MAX_TOKENS, readPracticeLog, recordPractice, recentTopics } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'
import { settlePracticeRun } from '../kit/practiceRun'

import { SCENES_FEATURE_ID } from './featureId'
import { aiErrorText } from '../kit/aiError'
import { imeActive } from '../../utils/keys'
export { SCENES_FEATURE_ID }
const ITEMS = 8
const DUE_ITEMS = 2
const KNOWLEDGE_CAP = 3000
const MIN_LINES = 3
const AUTO_READ_KEY = 'ebiki-scenes-read-aloud'
const GLOSS_KEY = 'ebiki-scenes-gloss'
const SIDE = { A: 'flex-start', B: 'flex-end', N: 'center' }

export default function SceneScreen({ onExit }) {
  const ctx = useFeatureCtx()
  const [phase, setPhase] = useState('intro') // intro | loading | story | quiz
  const [theme, setTheme] = useState('')
  const [scene, setScene] = useState(null)
  const [shown, setShown] = useState(0)       // lines revealed
  const [error, setError] = useState('')
  const [readAloud, setReadAloud] = useState(() => platform.kv.get(AUTO_READ_KEY) !== '0')
  const [gloss, setGloss] = useState(() => platform.kv.get(GLOSS_KEY) === '1')
  const [quizDone, setQuizDone] = useState(false) // QuizRunner shows its results: nothing left to lose
  // The running quiz, settled ONCE (finished, quit midway or closed under it), under the mode it started in.
  const runRef = useRef(null)
  const audioRef = useRef(null)
  const listRef = useRef(null)
  const sidRef = useRef('') // tapped-word popups belong to one story (a new story gets new sources)
  const startingRef = useRef(false)
  useFocusHold(phase === 'story')
  useActivityBusy(phase !== 'intro' && !(phase === 'quiz' && quizDone)) // a story being written, read or quizzed would be lost
  // aliveRef: set on mount too (StrictMode mounts twice). A reply landing after the screen closed is never spoken.
  const aliveRef = useRef(false)
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; audioRef.current?.stop(); settleRun(runRef.current, runRef.current?.answers) } }, [])
  useEffect(() => { listRef.current?.scrollTo?.({ top: 1e9, behavior: 'smooth' }) }, [shown])
  // What Ebi's Help knows: the story's lines revealed so far (they are read, not asked). The quiz reports itself.
  useHelpEntry(ctx, 'scenes', !scene ? '' : [
    `Activity open: Scenes. Story: "${scene.title || theme || ''}" (${phase === 'quiz' ? 'the quiz about it is running' : 'being read'}).`,
    phase === 'quiz' ? 'The story lines are the answers to the quiz on screen: do not quote or retell them until it is over.' : scene.lines?.slice(0, shown).map((l) => `${l.speaker === 'N' ? '' : `${scene.cast?.[l.speaker] || l.speaker}: `}${String(l.text || '').slice(0, 200)}`).join('\n'),
  ].filter(Boolean).join('\n'))
  if (!ctx) return null
  const { t, ai, subject } = ctx
  const lang = subject.isLanguage ? subject.learnLangIso : ctx.lang
  const tappable = subject.isLanguage && !!ctx.words

  const say = (line) => {
    audioRef.current?.stop()
    audioRef.current = speak(ctx, line.text, { lang, voice: voiceFor(line.speaker) })
  }

  const start = async () => {
    // Claimed at once: a double click (or Enter, then a click) before the 'loading' render wrote two stories.
    if (startingRef.current) return
    startingRef.current = true
    setError(''); setPhase('loading')
    try {
      const items = await pickCardItems(ctx, ITEMS, { due: DUE_ITEMS })
      const avoid = recentTopics(await readPracticeLog(ctx))
      const { system, user } = buildScenePrompt(subject, items, { knowledge: subject.knowledge(KNOWLEDGE_CAP), theme: theme.trim(), avoid, level: await learnerLevelLine(ctx, { context: true }), slips: subject.isLanguage ? subject.grammarSlips(8) : '' })
      const s = parseScene(ai.json(await ai.call(system, user, { role: SCENE_ROLE, maxTokens: SCENE_MAX_TOKENS })), ai.clean)
      if (!s || s.lines.length < MIN_LINES) throw new Error(t('sc_bad'))
      if (!aliveRef.current) return // left while it was written: nothing shown, nothing logged as practiced
      sidRef.current = `sc-${Date.now().toString(36)}`
      setScene(s); setShown(1); setPhase('story')
      recordPractice(ctx, SCENES_FEATURE_ID, [...items.map((it) => ({ kind: 'card', label: it.front })), { kind: 'topic', label: s.title || theme.trim() }])
      if (readAloud && aliveRef.current) say(s.lines[0])
    } catch (e) { if (aliveRef.current) { setError(aiErrorText(t, e)); setPhase('intro') } } finally { startingRef.current = false }
  }

  const next = () => {
    if (shown < scene.lines.length) {
      const line = scene.lines[shown]
      setShown(shown + 1)
      if (readAloud) say(line)
      return
    }
    audioRef.current?.stop()
    if (scene.questions.length) {
      runRef.current = { source: SCENES_FEATURE_ID, modeId: subject.modeId, front: scene.title || '', ctx, answers: [], settled: false }
      setQuizDone(false); setPhase('quiz')
    } else {
      ctx.emit(EVENTS.PRACTICE_DONE, { source: SCENES_FEATURE_ID, mode: subject.modeId, total: 0, correct: 0 }) // a story with no questions, read to the end
      setPhase('intro'); setScene(null)
    }
  }

  if (phase === 'quiz' && scene) {
    return (
      <QuizRunner questions={scene.questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm} title={scene.title || t('sc_title')}
        onAnswer={(q, correct, a, info) => {
          if (runRef.current && !q?._retry) runRef.current.answers.push({ question: q, correct, answer: a })
          if (!info?.skipped) ctx.emit(EVENTS.PRACTICE_ANSWERED, { source: SCENES_FEATURE_ID, correct, mode: subject.modeId }) // a Skip earns no answer XP
        }}
        onFinish={(res) => { settleRun(runRef.current, res, true); setQuizDone(true) }}
        onExit={(partial) => { settleRun(runRef.current, Array.isArray(partial) ? partial : runRef.current?.answers); runRef.current = null; setQuizDone(false); setPhase('intro'); setScene(null) }} />
    )
  }

  if (phase === 'story' && scene) {
    const who = (sp) => (sp === 'N' ? '' : scene.cast[sp])
    const last = shown >= scene.lines.length
    return (
      <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 420, gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: C.ink }}>📖 {scene.title}</div>
          {subject.isLanguage && (
            <label style={{ fontSize: 12.5, color: C.inkDim, display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer' }}>
              <input type="checkbox" checked={gloss} onChange={(e) => { setGloss(e.target.checked); platform.kv.set(GLOSS_KEY, e.target.checked ? '1' : '0') }} style={{ accentColor: C.brand }} />
              {t('sc_gloss')}
            </label>
          )}
        </div>
        <ProgressBar value={shown} max={scene.lines.length} color={C.success} style={{ height: 12 }} label={t('ui_progress')} />
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
          {scene.lines.slice(0, shown).map((l, i) => (
            <div key={i} style={{ alignSelf: SIDE[l.speaker], maxWidth: l.speaker === 'N' ? '90%' : '80%', textAlign: l.speaker === 'N' ? 'center' : 'left' }}>
              {who(l.speaker) && <div style={{ fontSize: 11.5, fontWeight: 800, color: l.speaker === 'A' ? C.info : C.purple, margin: '0 4px 2px' }}>{who(l.speaker)}</div>}
              {/* In a language mode the line's words are tappable like Study's (ctx.words), so the replay is its own button. */}
              <div style={{
                fontFamily: FONT.body, textAlign: 'inherit', padding: l.speaker === 'N' ? '4px 8px' : '10px 14px', borderRadius: RADIUS.lg,
                background: l.speaker === 'N' ? 'transparent' : C.surface, border: l.speaker === 'N' ? 'none' : `1px solid ${C.border}`,
                color: l.speaker === 'N' ? C.inkDim : C.ink, fontStyle: l.speaker === 'N' ? 'italic' : 'normal', fontSize: 15.5, lineHeight: 1.45,
              }}>
                {tappable ? ctx.words.tappable(l.text, `${sidRef.current}-${i}`) : l.text}
                <button type="button" onClick={() => say(l)} aria-label={t('sc_replay')} data-tip={t('sc_replay')} className="tip"
                  style={{ marginLeft: 6, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, padding: 0, verticalAlign: 'middle' }}>🔊</button>
                {gloss && l.gloss && <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 4, fontStyle: 'normal' }}>{l.gloss}</div>}
              </div>
              {tappable && ctx.words.popup(`${sidRef.current}-${i}`)}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => { audioRef.current?.stop(); setPhase('intro'); setScene(null) }}>{t('sc_stop')}</ChunkyButton>
          <ChunkyButton onClick={next} color={C.success}>{last ? (scene.questions.length ? t('sc_toQuestions') : t('sc_finish')) : t('sc_continue')}</ChunkyButton>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button onClick={onExit} style={{ border: 'none', background: 'transparent', color: C.inkDim, fontWeight: 800, cursor: 'pointer', marginBottom: 12, fontSize: 13 }}>← {t('sc_back')}</button>
      <EbiSays pose={poseFile('book')}>{subject.isLanguage ? t('sc_introLang', { lang: subject.learnLang }) : t('sc_introGeneral', { subject: subject.name })}</EbiSays>
      {!ai.hasKey && <div style={{ color: C.warning, fontSize: 13, marginTop: 12 }}>{t('sc_needKey')}</div>}
      {error && <div role="alert" style={{ color: C.danger, fontSize: 13, marginTop: 10 }}>{error}</div>}
      <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder={t('sc_themePlaceholder')}
        onKeyDown={(e) => { if (e.key === 'Enter' && phase !== 'loading' && ai.hasKey && !imeActive(e)) start() }}
        style={{ width: '100%', boxSizing: 'border-box', margin: '16px 0 10px', padding: '11px 13px', fontSize: 14, borderRadius: RADIUS.md, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: C.ink, marginBottom: 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={readAloud} onChange={(e) => { setReadAloud(e.target.checked); platform.kv.set(AUTO_READ_KEY, e.target.checked ? '1' : '0') }} style={{ accentColor: C.brand }} />
        🔊 {t('sc_readAloud')}
      </label>
      <ChunkyButton onClick={start} disabled={phase === 'loading' || !ai.hasKey} color={C.success}>📖 {phase === 'loading' ? t('sc_loading') : t('sc_start')}</ChunkyButton>
    </div>
  )
}

// A quiz run settled once: misses to the Mistake Gym always, PRACTICE_DONE only when finished (kit/practiceRun.js).
function settleRun(run, results, done = false) {
  const r = settlePracticeRun(run, results, { done })
  if (r) for (const [event, payload] of r.events) run.ctx.emit(event, payload)
}
