// One question at a time, Duolingo style: progress bar, the question, answer tiles or a text box, a CHECK
// button, then a green or red strip with the explanation and CONTINUE. Used by every quiz-like feature.
//
// questions: [{ kind: 'choice'|'typed', prompt, choices?, answerIdx?, accepted?, open?, explanation?, target?,
//               audio?: { text, lang }  heard, not shown (auto-plays once; needs `ctx`)
//               speak?: true            answered out loud (tap to talk fills the box; typing still works) }]
// ctx: the feature context, only needed for audio and speaking
// feedbackExtra(question, correct, answer): optional node under the explanation (e.g. a rule-card button)
// onAnswer(question, correct, answerText)  after each check (features award XP, log mistakes, ...)
// onFinish(results)                         results: [{ question, correct, answer }] (first attempts only)
// retryMisses: a question answered wrong comes back ONCE at the end (Duolingo style). The retry is practice: it
//              never changes the score, and onAnswer gets the question with `_retry: true`.
// FIGHT OPTIONS (Legends bosses and raids; all optional):
// judge(q, answer, mode)   async grader for typed answers → { correct, partial?, note?, title?, info? }
// canUseChoices(q)         a typed question with `alt` choices may be answered with them instead (a safe strike)
// header(q, mode)          a node above the question (the attack banner, the strike label)
// tools(q, api)            a node beside Skip; api = { hint(text), phase, asChoice, showChoices({ choices, answerIdx }) }
//                          (showChoices: the question is answered with THESE choices, e.g. a raid's 50:50; no way back to typing)
// onQuestion(q, idx)       a new question is on screen (the raid arena fast-fades an effect still playing)
// onAnswer's return value  { insert: question | [questions], at: index } puts questions into the run (the boss's attack); an
//                          inserted question is marked `_extra` and, like a retry, never changes the score.
// onAnswer(q, correct, answer, info)  info = { mode: 'typed'|'choice', at (the question's index in the run), skipped?,
//                          accent?, partial?, ...the judge's info }
// judge's `later`          a promise of { note } (the explanation, written in the background): the note fills into
//                          the feedback when it arrives, only while the same answer's feedback is on screen
// resolveQuestion(q)       asked when the run moves on to a question: the question itself, a replacement (a boss's
//                          follow-up whose text arrived later), or null to skip it (an attack that was not ready in
//                          time, or one a re-check cancelled). Skipped questions record nothing.
// startChoices(q)          a typed question with `alt` choices opens on its choices (the fight's "choices first" style);
//                          the learner can still switch to typing.
// overturnedFor(q)         true once a later check (a re-check or an Appeal) found this answer RIGHT after all: the
//                          feedback strip turns green and drops the grader's old note (it said "wrong").
// WORDS (with `ctx.words`): Study's question formatting everywhere. "(...)" sense cues render muted italic, word hints
// (the mode's Word hints setting, language modes) sit above the words, and every word of the question, its choices,
// the hint, the feedback and the explanation is tappable for a lookup when the text is not in the app language
// (language modes always). Each surface has its own popup source. While a question waits for its answer, its own
// surfaces are GUARDED with its answers and correct choice (questionAnswersOf): a lookup that would give one away says
// so instead. Once the feedback shows the answer, nothing is guarded.
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { ChunkyButton, ProgressBar, depthBorder, UI } from '../ui'
import { useFocusHold } from '../registry'
import { matchTyped } from './grade'
import { judgeAnswer } from './judge'
import { questionAnswersOf, ensureLetterCue, stripLetterSkeleton } from './fightSettings'
import TalkButton from './TalkButton'
import { speak } from '../../speech'
import { imeActive, choiceIndex } from '../../utils/keys'

const MAX_W = 640
const POSE = { right: 'happy', wrong: 'confused', done: 'party' }
const CHOICE_KEYS = ['1', '2', '3', '4', '5', '6']
// A spoken line that never reports its end (a voice that silently fails) must not lock the replay button:
// the button frees itself after a generous reading time.
const PLAY_BASE_MS = 2500
const PLAY_PER_CHAR_MS = 110
const PLAY_MAX_MS = 20000

// A tool's 50:50 pops the two tiles left in; a hint slides in with a flash (none under reduced motion).
const POP_CSS = `
@keyframes kitNarrowIn { 0% { transform: scale(.6) rotate(-3deg); opacity: 0; filter: brightness(2) } 60% { transform: scale(1.05) rotate(1deg); opacity: 1 } 100% { transform: none; filter: none } }
@keyframes kitHintIn { 0% { transform: translateY(-6px) scale(.9); opacity: 0; text-shadow: 0 0 12px currentColor } 60% { transform: translateY(1px) scale(1.04); opacity: 1 } 100% { transform: none; text-shadow: none } }
@media (prefers-reduced-motion: reduce) { [data-quiz-pop] { animation: none !important } }
`

export default function QuizRunner({ questions: given, t, ai, subject, onAnswer, onFinish, onExit, title, confirm, ctx, feedbackExtra, retryMisses = false, judge, canUseChoices, header, tools, onQuestion, resolveQuestion, startChoices, overturnedFor }) {
  const [idx, setIdx] = useState(0)
  // The feature's list, plus the misses asked again at the end and anything the feature put in (attacks).
  const [retries, setRetries] = useState([])
  const [inserts, setInserts] = useState([]) // [{ at, q }]: shown at position `at` of the run
  const questions = (() => {
    const base = retries.length ? [...given, ...retries] : given
    if (!inserts.length) return base
    const out = [...base]
    for (const { at, q } of inserts) out.splice(Math.min(at, out.length), 0, q)
    return out
  })()
  const [mode, setMode] = useState('typed') // a typed question answered with its choices instead: 'choice'
  const [hintText, setHintText] = useState('')
  const [narrowed, setNarrowed] = useState(null) // { i, choices, answerIdx }: a tool's own choices for question i
  const [picked, setPicked] = useState(null)
  const [text, setText] = useState('')
  const [phase, setPhase] = useState('answer')    // answer | checking | self (no key: the learner grades) | feedback | done
  const [verdict, setVerdict] = useState(null)     // { correct, note, accent }
  const [checkErr, setCheckErr] = useState(false)  // the AI check failed: the answer was NOT graded, try again
  const results = useRef([])
  const inputRef = useRef(null)
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  // A question resolved when the run moved on to it (resolveQuestion): shown instead of the list's entry at that index.
  const [override, setOverride] = useState(null) // { i, q }
  const q = override && override.i === idx ? override.q : questions[idx]
  const total = questions.length
  const verdictSeq = useRef(0) // the answer whose feedback is on screen: a late note lands only on it
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
    let first = 'typed'
    try { if (q?.alt && q.kind !== 'choice' && startChoices?.(q) && canUseChoices?.(q)) first = 'choice' } catch { /* the feature's problem */ }
    setPicked(null); setText(''); setVerdict(null); setCheckErr(false); setPhase('answer'); setMode(first); setHintText(''); setNarrowed(null); setTimeout(() => inputRef.current?.focus(), 30)
    play() // a listening question plays once by itself
    try { onQuestion?.(q, idx) } catch { /* the feature's problem */ }
    return () => audioRef.current?.stop()
  }, [idx]) // eslint-disable-line react-hooks/exhaustive-deps

  const lastAnswer = useRef('') // the answer just checked (a retry's answer is not in `results`)
  // A typed question answered with its choices (a safe strike), or a plain choice question.
  const narrow = narrowed && narrowed.i === idx ? narrowed : null
  const asChoice = q?.kind === 'choice' || !!narrow || (mode === 'choice' && !!q?.alt)
  const view = narrow ? { ...q, choices: narrow.choices, answerIdx: narrow.answerIdx } : q?.kind === 'choice' ? q : asChoice ? { ...q, choices: q.alt.choices, answerIdx: q.alt.answerIdx } : q

  // ── Words: formatting, word hints, tap-a-word lookups (see the header) ──
  const W = ctx?.words?.canTap ? ctx.words : null
  const textLang = subject?.userLang || ''
  const tap = !!W && W.canTap(textLang)
  const hintsOn = tap && !!subject?.isLanguage && !!(ctx?.fight ? ctx.fight.rules?.wordHints : ctx?.study?.rules?.()?.wordHints)
  const sid = useRef(`quiz${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`).current
  const live = phase === 'answer' || phase === 'checking' // the answer is not on screen yet: guard its surfaces
  const guardAns = live ? questionAnswersOf(q) : []
  const [glosses, setGlosses] = useState(null) // { i, text, map }
  useEffect(() => {
    if (!hintsOn || !W?.glosses || !q?.prompt || q.audio?.text) return undefined
    let on = true
    const text = String(q.prompt)
    const ask = (tries) => Promise.resolve(W.glosses(text, { answers: questionAnswersOf(q) }))
      .then((map) => { if (on && map) setGlosses({ i: idx, text, map }) })
      .catch(() => { if (on && tries > 0) setTimeout(() => { if (on) ask(tries - 1) }, 2500) })
    ask(1)
    return () => { on = false }
  }, [idx, q?.prompt, hintsOn]) // eslint-disable-line react-hooks/exhaustive-deps
  const glossMap = glosses && glosses.i === idx && glosses.text === String(q?.prompt || '') ? glosses.map : null
  const src = (key) => `${sid}-${idx}-${key}`
  // A text surface: formatted (cues), tappable (lookups) with its own popup source; `guarded` = the live question's.
  const words = (text, key, { guarded = false, gloss = false } = {}) => (W && text
    ? W.tappable(String(text), src(key), String(text), { answers: guarded ? guardAns : [], glosses: gloss ? glossMap : null, lang: textLang })
    : text)
  const popup = (key) => (W && tap ? W.popup(src(key)) : null)
  // A translated line with a node where its {a} goes (the right answer stays tappable in any word order).
  const around = (key, node) => { const [pre, post = ''] = t(key, { a: '\u0001' }).split('\u0001'); return <>{pre}{node}{post}</> }

  // Ebi's Help sees the question on screen (any activity: Legends, raids, Mistake Gym...), never its answer while it
  // is being answered; once the feedback shows the right answer, Help may talk about it too.
  const helpSet = ctx?.help?.set
  const helpScreen = ctx?.activeTab || ''
  useEffect(() => {
    if (!helpSet) return
    if (!q || phase === 'done') { helpSet('quiz', null); return }
    const shown = asChoice && Array.isArray(view?.choices) ? `\nChoices on screen: ${view.choices.map((c, i) => `${i + 1}) ${c}`).join('  ')}` : ''
    // Only what the screen really shows: no model answer for an open question, none after a right answer (kit_answerWas).
    const key = q.open || (verdict?.correct && !verdict?.accent && !verdict?.partial) ? '' : view?.kind === 'choice' || asChoice ? view?.choices?.[view.answerIdx] : (q.accepted || [])[0]
    const fb = phase === 'feedback' && verdict
      ? `\nThey just answered${lastAnswer.current ? ` "${String(lastAnswer.current).slice(0, 120)}"` : ''}: ${verdict.correct ? 'right' : 'wrong'}${key ? `. The right answer (shown on screen): "${String(key).slice(0, 120)}"` : ''}${verdict.note ? `. Feedback shown: ${String(verdict.note).slice(0, 200)}` : ''}.`
      : '\nIt is being answered now: do NOT give the answer unless they explicitly ask for it; give a hint or explain the idea instead.'
    helpSet('quiz', { screen: helpScreen, text: `Running quiz${title ? ` "${String(title).slice(0, 80)}"` : ''}: question ${idx + 1} of ${total}${q.audio?.text ? ' (heard as audio, not shown)' : ''}.\nQuestion: ${String(q.prompt || '').slice(0, 400)}${shown}${fb}` })
  }, [helpSet, helpScreen, q, idx, total, phase, verdict, asChoice, title]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { helpSet?.('quiz', null) }, [helpSet])

  // Left with ✕ while an answer was being checked: the judge's late reply must not record it (in a boss fight it
  // spent the shield on a fight already left).
  const exited = useRef(false)
  const record = (correct, answer, extra = {}, info = {}) => {
    if (exited.current) return
    lastAnswer.current = answer
    const extraQ = q._retry || q._extra
    if (!extraQ) results.current = [...results.current, { question: q, correct, answer }]
    if (!correct && retryMisses && !extraQ) setRetries((list) => [...list, { ...q, _retry: true }])
    verdictSeq.current++
    setVerdict({ correct, ...extra, seq: verdictSeq.current })
    setPhase('feedback')
    let got = null
    // accent / partial: near misses for the shared grading rule (config/grading.js), next to the judge's own info.
    try { got = onAnswer?.(q, correct, answer, { mode: asChoice ? 'choice' : q.kind, at: idx, ...(extra.accent ? { accent: true } : {}), ...(extra.partial ? { partial: true } : {}), ...info }) } catch { /* the feature's problem */ }
    // Inserted after the question on screen (never before it: the run's position must not jump).
    if (got?.insert) {
      const at = Math.max(idx + 1, Number.isInteger(got.at) ? got.at : idx + 1)
      const add = (Array.isArray(got.insert) ? got.insert : [got.insert]).map((x, i) => ({ at: at + i, q: { ...x, _extra: true } }))
      setInserts((list) => [...list, ...add])
    }
  }

  // One answer per question, claimed SYNCHRONOUSLY (two Enters or a double click before the re-render both saw
  // phase 'answer': the judge ran twice and the answer was recorded twice, in a raid as two reviews). Freed when the
  // check could not grade (the learner tries again).
  const claimed = useRef(-1)
  const advanced = useRef(-1) // the question Continue already left (a double Enter finished the run twice)
  const check = async (skip = false) => {
    if (!q || phase !== 'answer' || claimed.current === idx) return
    setCheckErr(false)
    if (skip) { claimed.current = idx; return record(false, '', {}, { skipped: true }) }
    if (asChoice) {
      if (picked == null) return
      claimed.current = idx
      return record(picked === view.answerIdx, view.choices[picked])
    }
    const ans = text.trim()
    if (!ans) return
    claimed.current = idx
    const at = idx
    if (judge) {
      setPhase('checking')
      // A judge that THROWS (or answers nothing) is a failed check too: as "wrong" it became a real Again in a raid.
      const j = await Promise.resolve().then(() => judge(q, ans, 'typed')).catch(() => ({ error: true }))
      setPhase('answer') // record() moves on
      // Never graded: a failed check is not a wrong answer. Without a key it can never be checked: say so.
      if (!j || j.error) { if (claimed.current === at) claimed.current = -1; setCheckErr(j?.noKey || ai?.hasKey === false ? 'nokey' : true); return }
      const later = j?.later && typeof j.later.then === 'function' ? j.later : null
      record(!!j?.correct, ans, { note: j?.note || '', partial: !!j?.partial, title: j?.title || '', accent: !!j?.accent, noteLoading: !!later && !j?.note }, j?.info || {})
      if (later) {
        const seq = verdictSeq.current
        later.then((r) => setVerdict((v) => (v && v.seq === seq ? { ...v, note: v.note || String(r?.note || ''), noteLoading: false } : v)))
          .catch(() => setVerdict((v) => (v && v.seq === seq ? { ...v, noteLoading: false } : v)))
      }
      return
    }
    const local = q.open ? null : matchTyped(ans, q.accepted)
    if (local) return record(true, ans, local === 'accent' ? { accent: true } : {})
    // No key: nothing can judge a synonym or an open answer. Never a silent "wrong": show the reference answer and
    // let the learner grade themselves, like a flashcard.
    if (!ai?.hasKey) { lastAnswer.current = ans; setPhase('self'); return }
    setPhase('checking')
    const j = await judgeAnswer(ai, subject, q, ans)
    setPhase('answer') // record() moves on
    if (j == null) { if (claimed.current === at) claimed.current = -1; setCheckErr(true); return } // the check failed (a timeout, an unreadable reply): try again
    record(!!j?.correct, ans, { note: j?.note || '' })
  }
  // The learner's own grade (no key): recorded like any answer, marked `selfGraded` for the feature.
  const selfAt = useRef(-1) // claimed once, like check (a double click recorded it twice)
  const selfGrade = (right) => {
    if (phase !== 'self' || selfAt.current === idx) return
    selfAt.current = idx
    setPhase('answer') // record() moves on
    record(right, lastAnswer.current, { note: '', self: true }, { selfGraded: true })
  }

  const next = () => {
    if (advanced.current === idx) return
    advanced.current = idx
    let i = idx + 1
    let over = null
    while (i < total) {
      const raw = questions[i]
      let r = raw
      try { r = resolveQuestion ? resolveQuestion(raw) : raw } catch { r = raw }
      if (r === null) { i++; continue } // skipped: nothing recorded
      if (r && r !== raw) over = { i, q: r }
      break
    }
    if (i < total) { setOverride(over); setIdx(i) } else { setPhase('done'); onFinish?.(results.current) }
  }

  // Keys: 1-6 pick a tile, Enter checks / continues.
  useEffect(() => {
    const onKey = (e) => {
      if (imeActive(e) || e.defaultPrevented) return // Safari's committing Enter has isComposing false, keyCode 229
      // Keys meant for something else: Ebi's Help input (its "2" picked a tile, its Enter submitted the answer, in a
      // raid as a real Anki review), the rule-card editor (Enter for a new line skipped the question) and an open
      // dialog (Enter on "Quit?" submitted the picked tile, or finished the run).
      if (typeof document !== 'undefined' && document.querySelector('[data-app-dialog],[data-top-overlay]')) return
      const el = e.target
      if (el && el !== inputRef.current && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName || ''))) return
      // Enter on a focused button or link is that control's own click (Quit, Skip, the rule-card button): taking it
      // submitted the picked tile instead, in a raid as a real Anki review. The runner's own choice tiles still count.
      if (e.key === 'Enter' && el?.closest?.('button,a,[role=button]') && !el.closest('[data-quiz-choice]')) return
      if (phase === 'answer' && asChoice) {
        // Not Ctrl/Alt+digit (the browser's tab switch picked a tile too), not a held key, AZERTY's top row by e.code.
        const n = choiceIndex(e, Math.min(view.choices.length, CHOICE_KEYS.length))
        if (n >= 0) { setPicked(n); return }
      }
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
        if (phase === 'feedback') { e.preventDefault(); next() }
        else if (phase === 'answer' && (asChoice || document.activeElement === inputRef.current)) { e.preventDefault(); check() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (phase === 'done') {
    const right = results.current.filter((r) => r.correct).length
    const asked = results.current.length
    return (
      <div style={{ maxWidth: MAX_W, margin: '40px auto', textAlign: 'center' }}>
        <img src={shrimpUrl(poseFile(POSE.done))} alt="" width={120} />
        <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 28, color: C.ink, margin: '8px 0 4px' }}>{title}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.success, marginBottom: 20 }}>{t('kit_score', { c: right, n: asked })}</div>
        <ChunkyButton onClick={onExit} color={C.success}>{t('kit_finish')}</ChunkyButton>
      </div>
    )
  }
  if (!q) return null

  const quit = async () => {
    if (!results.current.length || !confirm || (await confirm(t('kit_quitConfirm')))) { exited.current = true; onExit?.(results.current) }
  }
  // Found right after all (re-check / Appeal): the strip says so instead of "Not quite" over "Appeal won".
  let overturned = false
  if (phase === 'feedback' && verdict && (!verdict.correct || verdict.partial) && overturnedFor) {
    try { overturned = !!overturnedFor(q) } catch { overturned = false }
  }
  const good = verdict?.correct || overturned
  const partial = good && verdict?.partial && !overturned // right, with something else to fix (a glancing strike)
  const note = overturned ? '' : verdict?.note // the grader's note argued the old verdict
  const tone = partial ? C.warning : good ? C.success : C.danger
  const reveal = asChoice ? view.choices[view.answerIdx] : (q.accepted || [])[0]
  const switchable = !asChoice && !!q.alt && !!canUseChoices?.(q)
  // A typed language question always shows how many letters its answer has (Study's skeleton, "(s·······)"); answered
  // with its choices the skeleton goes (its letters would pick the tile).
  const shownPrompt = asChoice ? stripLetterSkeleton(q.prompt) : ensureLetterCue(q, { isLanguage: !!subject?.isLanguage }).prompt
  // Screen readers hear the result once the feedback is on screen (never earlier: the answer is still secret before).
  const announce = phase !== 'feedback' ? '' : [
    (overturned ? '' : verdict?.title) || (partial ? t('kit_partial') : good ? t('kit_correct') : t('kit_wrong')),
    verdict?.accent && !overturned && reveal ? t('kit_accent', { a: reveal })
      : (!good || partial) && reveal && !q.open ? t('kit_answerWas', { a: reveal }) : '',
  ].filter(Boolean).join('. ')
  return (
    <div style={{ maxWidth: MAX_W, margin: '0 auto', display: 'flex', flexDirection: 'column', minHeight: '100%', gap: 18 }}>
      <div role="status" aria-live="polite" aria-atomic="true" data-quiz-announce=""
        style={{ position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }}>
        {announce}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={quit} aria-label={t('kit_quit')} data-tip={t('kit_quit')} className="tip tip-b"
          style={{ border: 'none', background: 'transparent', color: C.inkFaint, fontSize: 22, cursor: 'pointer', padding: 4 }}>✕</button>
        <ProgressBar value={idx + (phase === 'feedback' ? 1 : 0)} max={total} color={C.success} style={{ flex: 1, height: 16 }} label={t('ui_progress')} />
      </div>
      {title && <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.purple }}>{title} · {t('kit_progress', { i: idx + 1, n: total })}{q._retry ? ` · 🔁 ${t('kit_again')}` : ''}</div>}
      {header && header(q, asChoice ? 'choice' : 'typed')}
      <div dir="auto" data-quiz-prompt="" style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 22, color: C.ink, lineHeight: glossMap && Object.keys(glossMap).length ? 2.2 : 1.35, whiteSpace: 'pre-wrap' }}>{words(shownPrompt, 'q', { guarded: true, gloss: true })}</div>
      {popup('q')}
      {(narrow || hintText) && <style>{POP_CSS}</style>}
      {hintText && phase === 'answer' && <div key={hintText} role="status" dir="auto" data-quiz-pop="" style={{ fontSize: 14, fontWeight: 700, color: C.warning, animation: 'kitHintIn 520ms cubic-bezier(.2,1.2,.4,1) both' }}>{words(hintText, 'h', { guarded: true })}</div>}
      {hintText && phase === 'answer' && popup('h')}
      {q.audio?.text && ctx && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <ChunkyButton onClick={(e) => { e?.currentTarget?.blur?.(); play() }} color={C.info} disabled={playing}>🔊 {playing ? t('kit_playing') : t('kit_play')}</ChunkyButton>
          {phase === 'feedback' && <span style={{ fontSize: 15, color: C.inkDim, fontStyle: 'italic' }}>{q.audio.text}</span>}
        </div>
      )}
      {q.speak && ctx && q.kind !== 'choice' && phase === 'answer' && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <TalkButton ctx={ctx} lang={q.speakLang || ''} onStart={() => audioRef.current?.stop()} onText={(said) => setText((cur) => (cur.trim() ? `${cur.trim()} ${said}` : said))} />
          <span style={{ fontSize: 13, color: C.inkDim }}>{t('kit_speakHint')}</span>
        </div>
      )}

      {asChoice ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {view.choices.map((c, i) => {
            const isPick = picked === i
            const showRight = phase === 'feedback' && i === view.answerIdx
            const showWrong = phase === 'feedback' && isPick && i !== view.answerIdx
            const edge = showRight ? C.success : showWrong ? C.danger : isPick ? C.info : C.border
            return (
              <button key={narrow ? `n${i}` : i} data-quiz-choice="" {...(narrow ? { 'data-quiz-pop': '' } : {})} disabled={phase !== 'answer'} onClick={() => setPicked(i)} className="btn-press" style={{
                ...(narrow ? { animation: `kitNarrowIn 480ms cubic-bezier(.2,1.4,.4,1) ${i * 90}ms both` } : {}),
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', textAlign: 'left', borderRadius: RADIUS.md,
                ...depthBorder(edge, { bottomColor: edge }), background: isPick || showRight ? `color-mix(in srgb, ${edge} 12%, ${C.surface})` : C.surface,
                color: C.ink, fontFamily: FONT.body, fontSize: 16, fontWeight: 700, cursor: phase === 'answer' ? 'pointer' : 'default',
              }}>
                <span style={{ width: 26, height: 26, flexShrink: 0, borderRadius: RADIUS.sm, border: `2px solid ${C.border}`, display: 'grid', placeItems: 'center', fontSize: 13, color: C.inkFaint }}>{i + 1}</span>
                <span dir="auto">{words(c, `c${i}`, { guarded: true })}</span>
              </button>
            )
          })}
          {view.choices.map((_, i) => <span key={`p${i}`} style={{ display: 'contents' }}>{popup(`c${i}`)}</span>)}
          {q.kind !== 'choice' && !narrow && phase === 'answer' && (
            <button type="button" onClick={() => { setMode('typed'); setPicked(null); setTimeout(() => inputRef.current?.focus(), 30) }}
              style={{ justifySelf: 'start', fontFamily: FONT.body, border: `2px solid color-mix(in srgb, ${C.warning} 40%, transparent)`, background: 'transparent', color: C.warning, fontWeight: 800, fontSize: 13, borderRadius: RADIUS.pill, padding: '5px 12px', cursor: 'pointer' }}>
              ⌨ {t('kit_typeInstead')}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <textarea ref={inputRef} value={text} disabled={phase !== 'answer'} onChange={(e) => setText(e.target.value)}
            placeholder={q.open ? t('kit_writePlaceholder') : t('kit_typePlaceholder')} rows={q.open ? 4 : 2}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: '12px 14px', fontSize: 16, fontFamily: FONT.body,
              borderRadius: RADIUS.md, border: `${UI.cardBorder}px solid ${C.border}`, background: C.surfaceAlt, color: C.ink,
            }} />
          {switchable && phase === 'answer' && (
            <button type="button" onClick={() => { setMode('choice'); setPicked(null) }}
              style={{ justifySelf: 'start', fontFamily: FONT.body, border: `2px solid color-mix(in srgb, ${C.info} 40%, transparent)`, background: 'transparent', color: C.info, fontWeight: 800, fontSize: 13, borderRadius: RADIUS.pill, padding: '5px 12px', cursor: 'pointer' }}>
              🛡 {t('kit_useChoices')}
            </button>
          )}
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        {phase === 'feedback' ? (
          <div style={{
            borderRadius: RADIUS.lg, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap',
            background: partial ? `color-mix(in srgb, ${C.warning} 12%, ${C.surface})` : good ? C.successTint : C.dangerTint, border: `2px solid ${tone}`,
          }}>
            <img src={shrimpUrl(poseFile(good ? POSE.right : POSE.wrong))} alt="" width={54} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 20, color: tone }}>{(overturned ? '' : verdict?.title) || (partial ? t('kit_partial') : good ? t('kit_correct') : t('kit_wrong'))}</div>
              {verdict?.accent && !overturned && <div dir="auto" style={{ fontSize: 14, color: C.ink, fontWeight: 700 }}>{around('kit_accent', words(reveal, 'a'))}</div>}
              {(!good || partial) && reveal && !q.open && !verdict?.accent && <div dir="auto" style={{ fontSize: 14, color: C.ink, fontWeight: 700 }}>{around('kit_answerWas', words(reveal, 'a'))}</div>}
              {popup('a')}
              {note && <div dir="auto" style={{ fontSize: 13.5, color: C.ink, marginTop: 4, lineHeight: 1.45 }}>{words(note, 'n')}</div>}
              {note && popup('n')}
              {!overturned && !verdict?.note && verdict?.noteLoading && <div role="status" style={{ fontSize: 12.5, color: C.inkDim, marginTop: 4 }}>📝 {t('kit_noteLoading')}</div>}
              {q.explanation && <div dir="auto" style={{ fontSize: 13.5, color: C.inkDim, marginTop: 4, lineHeight: 1.45 }}>{words(q.explanation, 'x')}</div>}
              {q.explanation && popup('x')}
              {feedbackExtra && <div key={idx} style={{ marginTop: 6 }}>{feedbackExtra(q, !!good, lastAnswer.current || '')}</div>}
            </div>
            <ChunkyButton onClick={next} color={tone}>{t('kit_continue')}</ChunkyButton>
          </div>
        ) : phase === 'self' ? (
          <div data-quiz-self="" style={{ borderRadius: RADIUS.lg, padding: '14px 16px', display: 'grid', gap: 8, background: C.surfaceAlt, border: `2px solid ${C.border}` }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.inkDim }}>{t('kit_selfGradeWhy')}</div>
            {reveal && <div dir="auto" style={{ fontSize: 15, color: C.ink, fontWeight: 800 }}>{around('kit_answerWas', words(reveal, 'a'))}</div>}
            {reveal && popup('a')}
            {q.explanation && <div dir="auto" style={{ fontSize: 13.5, color: C.inkDim, lineHeight: 1.45 }}>{words(q.explanation, 'x')}</div>}
            {q.explanation && popup('x')}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <ChunkyButton variant="ghost" color={C.danger} onClick={() => selfGrade(false)}>{t('kit_selfWrong')}</ChunkyButton>
              <ChunkyButton color={C.success} onClick={() => selfGrade(true)}>{t('kit_selfRight')}</ChunkyButton>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <ChunkyButton variant="ghost" color={C.inkDim} onClick={() => check(true)} disabled={phase !== 'answer'}>{t('kit_skip')}</ChunkyButton>
              {tools && tools(q, { hint: setHintText, phase, asChoice, showChoices: (v) => { if (v && Array.isArray(v.choices)) { setNarrowed({ i: idx, choices: v.choices, answerIdx: v.answerIdx }); setPicked(null) } } })}
            </div>
            {checkErr && phase === 'answer' && <div role="alert" style={{ flexBasis: '100%', order: -1, fontSize: 13, fontWeight: 700, color: C.danger }}>{t(checkErr === 'nokey' ? 'kit_checkNoKey' : 'kit_checkFailed')}</div>}
            <ChunkyButton onClick={() => check()} color={C.success}
              disabled={phase !== 'answer' || (asChoice ? picked == null : !text.trim())}>
              {phase === 'checking' ? t('kit_checking') : t('kit_check')}
            </ChunkyButton>
          </div>
        )}
      </div>
    </div>
  )
}
