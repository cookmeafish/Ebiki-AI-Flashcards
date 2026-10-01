// Scenes: a short story (or case study) made from your cards, told line by line with two voices, then a few
// questions on what happened. Never touches the review schedule.
import { useEffect, useRef, useState } from 'react'
import { useHelpEntry } from '../kit/useHelp'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { platform } from '../../platform'
import { speak } from '../../speech'
import { useFeatureCtx, useFocusHold } from '../registry'
import { EVENTS } from '../events'
import { ChunkyButton, EbiSays, ProgressBar } from '../ui'
import { QuizRunner, pickCardItems, buildScenePrompt, parseScene, voiceFor, SCENE_ROLE, SCENE_MAX_TOKENS, readPracticeLog, recordPractice, recentTopics, missesFromResults } from '../kit'
import { learnerLevelLine } from '../kit/learnerStore'

export const SCENES_FEATURE_ID = 'scenes'
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
  const audioRef = useRef(null)
  const listRef = useRef(null)
  useFocusHold(phase === 'story')
  // aliveRef: set on mount too (StrictMode mounts twice). A reply landing after the screen closed is never spoken.
  const aliveRef = useRef(false)
  useEffect(() => { aliveRef.current = true; return () => { aliveRef.current = false; audioRef.current?.stop() } }, [])
  useEffect(() => { listRef.current?.scrollTo?.({ top: 1e9, behavior: 'smooth' }) }, [shown])
  // What Ebi's Help knows: the story's lines revealed so far (they are read, not asked). The quiz reports itself.
  useHelpEntry(ctx, 'scenes', !scene ? '' : [
    `Activity open: Scenes. Story: "${scene.title || theme || ''}" (${phase === 'quiz' ? 'the quiz about it is running' : 'being read'}).`,
    phase === 'quiz' ? 'The story lines are the answers to the quiz on screen: do not quote or retell them until it is over.' : scene.lines?.slice(0, shown).map((l) => `${l.speaker === 'N' ? '' : `${scene.cast?.[l.speaker] || l.speaker}: `}${String(l.text || '').slice(0, 200)}`).join('\n'),
  ].filter(Boolean).join('\n'))
  if (!ctx) return null
  const { t, ai, subject } = ctx
  const lang = subject.isLanguage ? subject.learnLangIso : ctx.lang

  const say = (line) => {
    audioRef.current?.stop()
    audioRef.current = speak(ctx, line.text, { lang, voice: voiceFor(line.speaker) })
  }

  const start = async () => {
    setError(''); setPhase('loading')
    try {
      const items = await pickCardItems(ctx, ITEMS, { due: DUE_ITEMS })
      const avoid = recentTopics(await readPracticeLog(ctx))
      const { system, user } = buildScenePrompt(subject, items, { knowledge: subject.knowledge(KNOWLEDGE_CAP), theme: theme.trim(), avoid, level: await learnerLevelLine(ctx), slips: subject.isLanguage ? subject.grammarSlips(8) : '' })
      const s = parseScene(ai.json(await ai.call(system, user, { role: SCENE_ROLE, maxTokens: SCENE_MAX_TOKENS })), ai.clean)
      if (!s || s.lines.length < MIN_LINES) throw new Error(t('sc_bad'))
      setScene(s); setShown(1); setPhase('story')
      recordPractice(ctx, SCENES_FEATURE_ID, [...items.map((it) => ({ kind: 'card', label: it.front })), { kind: 'topic', label: s.title || theme.trim() }])
      if (readAloud && aliveRef.current) say(s.lines[0])
    } catch (e) { setError(String(e.message || e)); setPhase('intro') }
  }

  const next = () => {
    if (shown < scene.lines.length) {
      const line = scene.lines[shown]
      setShown(shown + 1)
      if (readAloud) say(line)
      return
    }
    audioRef.current?.stop()
    if (scene.questions.length) setPhase('quiz')
    else { done([]); setPhase('intro') }
  }
  const done = (res) => {
    ctx.emit(EVENTS.PRACTICE_DONE, { source: SCENES_FEATURE_ID, mode: subject.modeId, total: res.length, correct: res.filter((r) => r.correct).length })
    const misses = missesFromResults(res, scene?.title || '')
    if (misses.length) ctx.emit(EVENTS.PRACTICE_MISSED, { source: SCENES_FEATURE_ID, mode: subject.modeId, misses })
  }

  if (phase === 'quiz' && scene) {
    return (
      <QuizRunner questions={scene.questions} t={t} ai={ai} subject={subject} ctx={ctx} confirm={ctx.confirm} title={scene.title || t('sc_title')}
        onAnswer={(q, correct, a, info) => { if (!info?.skipped) ctx.emit(EVENTS.PRACTICE_ANSWERED, { source: SCENES_FEATURE_ID, correct, mode: subject.modeId }) }} // a Skip earns no answer XP
        onFinish={done}
        onExit={() => { setPhase('intro'); setScene(null) }} />
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
        <ProgressBar value={shown} max={scene.lines.length} color={C.success} style={{ height: 12 }} />
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: 4 }}>
          {scene.lines.slice(0, shown).map((l, i) => (
            <div key={i} style={{ alignSelf: SIDE[l.speaker], maxWidth: l.speaker === 'N' ? '90%' : '80%', textAlign: l.speaker === 'N' ? 'center' : 'left' }}>
              {who(l.speaker) && <div style={{ fontSize: 11.5, fontWeight: 800, color: l.speaker === 'A' ? C.info : C.purple, margin: '0 4px 2px' }}>{who(l.speaker)}</div>}
              <button onClick={() => say(l)} data-tip={t('sc_replay')} className="tip" style={{
                textAlign: 'inherit', padding: l.speaker === 'N' ? '4px 8px' : '10px 14px', borderRadius: RADIUS.lg, cursor: 'pointer',
                background: l.speaker === 'N' ? 'transparent' : C.surface, border: l.speaker === 'N' ? 'none' : `2px solid ${C.border}`,
                color: l.speaker === 'N' ? C.inkDim : C.ink, fontStyle: l.speaker === 'N' ? 'italic' : 'normal', fontSize: 15.5, lineHeight: 1.45,
              }}>
                {l.text}
                {gloss && l.gloss && <div style={{ fontSize: 12.5, color: C.inkFaint, marginTop: 4, fontStyle: 'normal' }}>{l.gloss}</div>}
              </button>
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
      {error && <div style={{ color: C.danger, fontSize: 13, marginTop: 10 }}>{error}</div>}
      <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder={t('sc_themePlaceholder')}
        style={{ width: '100%', boxSizing: 'border-box', margin: '16px 0 10px', padding: '11px 13px', fontSize: 14, borderRadius: RADIUS.md, border: `2px solid ${C.border}`, background: C.surfaceAlt, color: C.ink }} />
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: C.ink, marginBottom: 16, cursor: 'pointer' }}>
        <input type="checkbox" checked={readAloud} onChange={(e) => { setReadAloud(e.target.checked); platform.kv.set(AUTO_READ_KEY, e.target.checked ? '1' : '0') }} style={{ accentColor: C.brand }} />
        🔊 {t('sc_readAloud')}
      </label>
      <ChunkyButton onClick={start} disabled={phase === 'loading' || !ai.hasKey} color={C.success}>📖 {phase === 'loading' ? t('sc_loading') : t('sc_start')}</ChunkyButton>
    </div>
  )
}
