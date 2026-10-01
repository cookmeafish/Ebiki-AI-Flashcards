// First visit per mode: four quick questions, one per screen, Ebi asking in a speech bubble (the onboarding
// look). Why you're learning, how much you know, a daily goal, then "I'm new" or "Find my level".
import { useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile } from '../../config/shrimp'
import { ChunkyButton, EbiSays, ProgressBar, depthBorder } from '../ui'
import { EVIDENCE } from '../kit/evidence'

export const REASON_KEYS = [
  { key: 'work', icon: '💼' }, { key: 'school', icon: '🎓' }, { key: 'travel', icon: '✈️' },
  { key: 'fun', icon: '🎉' }, { key: 'person', icon: '💞' }, { key: 'other', icon: '✨' },
]
export const GOAL_KEYS = [{ key: 'relaxed', icon: '🐢' }, { key: 'normal', icon: '🚶' }, { key: 'serious', icon: '🏃' }, { key: 'intense', icon: '🚀' }]
const KNOW_LEVELS = [1, 2, 3, 4, 5]
const STEPS = ['reason', 'know', 'goal', 'style', 'start']
const POSE = { reason: 'happy', know: 'book', goal: 'work', style: 'weapon', start: 'cool' }

function Tile({ selected, onClick, children, style, disabled = false }) {
  const edge = selected ? C.info : C.border
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={disabled ? undefined : 'btn-press'} aria-pressed={selected} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: RADIUS.md, textAlign: 'left',
      ...depthBorder(edge, { bottomColor: edge }), background: selected ? `color-mix(in srgb, ${C.info} 12%, ${C.surface})` : C.surface,
      color: C.ink, fontFamily: FONT.body, fontSize: 15.5, fontWeight: 800, cursor: 'pointer', flex: '1 1 200px', minWidth: 0, ...style,
      ...(disabled ? { opacity: 0.5, cursor: 'default' } : {}),
    }}>{children}</button>
  )
}

// `focus`: the current focus-mode setting (the style step starts on it). The style step also asks about accents
// when the learned language writes them (subject.accents); both are saved as settings by the caller.
// `evidence`: what Ebiki has already seen (LegendsScreen reads it): { status, ok, sum }. Enough of it offers a third
// start, "Use what Ebiki knows", which reads the level from it instead of the exam.
export default function Questionnaire({ t, subject, onDone, onBack, focus = false, evidence = null }) {
  const [step, setStep] = useState(0)
  // One start only: a double click ran two starts (two paid level reads; "I'm new" landing over the exam).
  const startedRef = useRef(false)
  const finish = (a) => { if (startedRef.current) return; startedRef.current = true; onDone(a) }
  const [answers, setAnswers] = useState({ reason: '', selfRating: 0, goal: '', style: focus ? 'focus' : 'game', accents: subject.strictAccents !== false })
  const name = STEPS[step]
  const set = (patch) => setAnswers((a) => ({ ...a, ...patch }))
  const ready = name === 'reason' ? !!answers.reason : name === 'know' ? answers.selfRating > 0 : name === 'goal' ? !!answers.goal : true
  const question = {
    reason: t('lg_qReason', { subject: subject.name }),
    know: t('lg_qKnow', { subject: subject.name }),
    goal: t('lg_qGoal'),
    style: t('lg_qStyle'),
    start: t('lg_qStart'),
  }[name]

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => (step ? setStep(step - 1) : onBack?.())} aria-label={t('lg_back')}
          style={{ border: 'none', background: 'transparent', color: C.inkFaint, fontSize: 22, cursor: 'pointer', padding: 4 }}>←</button>
        <ProgressBar value={step + 1} max={STEPS.length} color={C.success} style={{ flex: 1, height: 14 }} />
      </div>
      <EbiSays pose={poseFile(POSE[name])}>{question}</EbiSays>

      {name === 'reason' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {REASON_KEYS.map((r) => (
            <Tile key={r.key} selected={answers.reason === r.key} onClick={() => set({ reason: r.key })}>
              <span style={{ fontSize: 26 }}>{r.icon}</span>{t(`lg_reason_${r.key}`)}
            </Tile>
          ))}
        </div>
      )}

      {name === 'know' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {KNOW_LEVELS.map((n) => (
            <Tile key={n} selected={answers.selfRating === n} onClick={() => set({ selfRating: n })}>
              <span aria-hidden="true" style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 22 }}>
                {KNOW_LEVELS.map((b) => <span key={b} style={{ width: 6, height: 6 + b * 3, borderRadius: 2, background: b <= n ? C.info : C.surfaceSunken }} />)}
              </span>
              {t(`lg_know_${n}`)}
            </Tile>
          ))}
        </div>
      )}

      {name === 'goal' && (
        <div style={{ display: 'grid', gap: 10 }}>
          {GOAL_KEYS.map((g) => (
            <Tile key={g.key} selected={answers.goal === g.key} onClick={() => set({ goal: g.key })}>
              <span style={{ fontSize: 24 }}>{g.icon}</span>
              <span style={{ flex: 1 }}>{t(`game_goal_${g.key}`)}</span>
              <span style={{ fontSize: 13, color: C.inkDim, fontWeight: 700 }}>{t(`lg_goalDesc_${g.key}`)}</span>
            </Tile>
          ))}
        </div>
      )}

      {name === 'style' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {[['game', '⚔️'], ['focus', '🧘']].map(([k, icon]) => (
              <Tile key={k} selected={answers.style === k} onClick={() => set({ style: k })} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ fontSize: 28 }}>{icon}</span>
                <span style={{ fontFamily: FONT.display, fontSize: 18 }}>{t(`lg_style_${k}`)}</span>
                <span style={{ fontSize: 13, color: C.inkDim, fontWeight: 600 }}>{t(`lg_style_${k}Desc`)}</span>
              </Tile>
            ))}
          </div>
          {subject.accents && (
            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 16, color: C.ink }}>{t('lg_qAccents', { lang: subject.learnLang })}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                <Tile selected={answers.accents} onClick={() => set({ accents: true })}>🎯 {t('lg_accentsStrict')}</Tile>
                <Tile selected={!answers.accents} onClick={() => set({ accents: false })}>🌿 {t('lg_accentsRelaxed')}</Tile>
              </div>
            </div>
          )}
        </div>
      )}

      {name === 'start' && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Tile onClick={() => finish({ ...answers, path: 'new' })} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ fontSize: 30 }}>🌱</span>
            <span style={{ fontFamily: FONT.display, fontSize: 18 }}>{t('lg_startNew')}</span>
            <span style={{ fontSize: 13, color: C.inkDim, fontWeight: 600 }}>{t('lg_startNewDesc')}</span>
          </Tile>
          <Tile onClick={() => finish({ ...answers, path: 'place' })} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <span style={{ fontSize: 30 }}>🧭</span>
            <span style={{ fontFamily: FONT.display, fontSize: 18 }}>{t('lg_startPlace')}</span>
            <span style={{ fontSize: 13, color: C.inkDim, fontWeight: 600 }}>{t('lg_startPlaceDesc')}</span>
          </Tile>
          {(() => {
            const sum = evidence?.sum
            const ok = evidence?.status === 'ready' && evidence.ok && sum?.enough
            const desc = !evidence || evidence.status === 'loading' ? t('lg_startKnownChecking')
              : !evidence.ok ? t('lg_startKnownNoAnki')
              : ok ? t('lg_startKnownDesc', { n: sum.reviewed })
              : !sum?.reviewed ? t('lg_startKnownNone')
              : sum.reviewed === 1 ? t('lg_startKnownThinOne', { need: EVIDENCE.minReviewed })
              : t('lg_startKnownThin', { n: sum.reviewed, need: EVIDENCE.minReviewed })
            return (
              <Tile disabled={!ok} onClick={() => ok && finish({ ...answers, path: 'known' })} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
                <span style={{ fontSize: 30 }}>🧠</span>
                <span style={{ fontFamily: FONT.display, fontSize: 18 }}>{t('lg_startKnown')}</span>
                <span style={{ fontSize: 13, color: C.inkDim, fontWeight: 600 }}>{desc}</span>
              </Tile>
            )
          })()}
        </div>
      )}

      {name !== 'start' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <ChunkyButton onClick={() => setStep(step + 1)} disabled={!ready} color={C.success}>{t('lg_continue')}</ChunkyButton>
        </div>
      )}
    </div>
  )
}
