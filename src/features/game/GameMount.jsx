// App-wide part of the game feature: loads the player, keeps today's quests ready across midnight, and
// shows the modals (streak celebration, streak details, "who is studying?").
import { useEffect, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { useFeatureCtx, useFocusHeld } from '../registry'
import { Modal, ChunkyButton, tCount, depthBorder } from '../ui'
import { useGame, initGame, configureGame, ensureToday, closeGamePanel, choosePlayer, createPlayer } from './store'
import { computeStreak, dateKey } from './engine'
import { WeekDots } from './Rail'

const DAY_CHECK_MS = 60000        // how often to notice that the date changed
const CELEBRATE_POSE = 'party'
const CHOOSER_POSE = 'happy'

function StreakScreen({ player, t, lang, onClose }) {
  const s = computeStreak(player)
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 150, height: 150, margin: '6px auto 4px' }}>
        <div style={{ fontSize: 120, lineHeight: '150px', filter: s.todayDone ? 'none' : 'grayscale(1)' }}>🔥</div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, fontFamily: FONT.display, fontWeight: 900, fontSize: 40, color: C.white, WebkitTextStroke: `2px ${C.warning}` }}>{s.streak}</div>
      </div>
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: C.warning, marginBottom: 16 }}>
        {s.streak === 1 ? t('game_streakBig') : t('game_streakBigMany')}
      </div>
      <div style={{ border: `2px solid ${C.border}`, borderRadius: RADIUS.lg, padding: '14px 12px' }}>
        <WeekDots player={player} lang={lang} />
        <div style={{ borderTop: `2px solid ${C.border}`, margin: '14px -12px 12px' }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.inkDim, lineHeight: 1.5 }}>{t('game_streakKeep')}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, margin: '12px 2px 18px', color: C.inkDim }}>
        <span style={{ color: C.info }}>❄ {s.freezes ? tCount(t, 'game_freezes', s.freezes) : t('game_freezesNone')}</span>
        <span>{t('game_longest', { n: s.longest })}</span>
      </div>
      <ChunkyButton onClick={onClose} color={C.info} style={{ width: '100%' }}>{t('game_continue')}</ChunkyButton>
    </div>
  )
}

function Chooser({ g, t, onDone }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const run = async (fn) => { if (busy) return; setBusy(true); try { await fn() } finally { setBusy(false); onDone?.() } }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <img src={shrimpUrl(poseFile(CHOOSER_POSE))} alt="" width={72} />
        <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 18, color: C.ink }}>{t('game_chooseTitle')}</div>
      </div>
      <div style={{ fontSize: 12.5, color: C.inkDim, marginBottom: 12, lineHeight: 1.45 }}>{t('game_chooseHint')}</div>
      {g.others.map((p) => (
        <button key={p.id} disabled={busy} onClick={() => run(() => choosePlayer(p.id))} className="btn-press" style={{
          display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', marginBottom: 8, textAlign: 'left',
          ...depthBorder(C.border, { bottomColor: C.border }), borderRadius: RADIUS.md, background: C.surface, cursor: 'pointer',
          fontSize: 15, fontWeight: 800, color: C.ink,
        }}>🦐 {p.name || t('game_unnamed')} <span style={{ marginLeft: 'auto', color: C.warning }}>🔥 {computeStreak(p).streak}</span></button>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('game_namePlaceholder')} maxLength={40}
          style={{ flex: 1, padding: '10px 12px', borderRadius: RADIUS.md, border: `2px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontSize: 14 }} />
        <ChunkyButton disabled={busy} onClick={() => run(() => createPlayer(name))}>{t('game_chooseNew')}</ChunkyButton>
      </div>
    </div>
  )
}

export default function GameMount() {
  const ctx = useFeatureCtx()
  const g = useGame()
  const [celebrate, setCelebrate] = useState(false)
  const lastDone = useRef(null)     // today's "streak extended" state as last seen (null = not loaded yet)
  const owed = useRef(false)        // a celebration waiting for the user to finish what they're doing
  const dayRef = useRef(dateKey())

  // Load once; the store honors the data-folder switch and knows which features exist (for quests).
  const featureIds = ctx?.registry?.features?.filter((f) => ctx.registry.isActive(f.id)).map((f) => f.id).join(',') || ''
  const onboarded = !!ctx?.onboarded
  useEffect(() => {
    if (!ctx || !onboarded) return // no chooser or loading while onboarding is on screen
    configureGame({
      isBlocked: () => !!ctx.isDataSwitching?.(),
      features: () => Object.fromEntries((featureIds ? featureIds.split(',') : []).map((id) => [id, true])),
    })
    initGame()
  }, [!!ctx, onboarded, featureIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Today's quests exist as soon as the player does, and again after midnight.
  useEffect(() => {
    if (g.status !== 'ready') return
    ensureToday()
    const id = setInterval(() => {
      const d = dateKey()
      if (d !== dayRef.current) { dayRef.current = d; lastDone.current = false; ensureToday() }
    }, DAY_CHECK_MS)
    return () => clearInterval(id)
  }, [g.status])

  // The first XP of the day extends the streak: celebrate, but never in the middle of a question.
  const done = g.player ? computeStreak(g.player).todayDone : null
  useEffect(() => {
    if (done == null) return
    if (lastDone.current === false && done) owed.current = true
    lastDone.current = done
  }, [done])
  const held = useFocusHeld()
  const busy = !!ctx?.busy || held
  useEffect(() => {
    if (owed.current && !busy) { owed.current = false; setCelebrate(true) }
  }, [busy, done])

  if (!ctx || !onboarded) return null
  const { t, lang } = ctx
  const zoom = ctx.getZoom?.() || 1
  return (
    <>
      <Modal open={g.status === 'choose'} dismissable={false} zoom={zoom}>
        <Chooser g={g} t={t} />
      </Modal>
      <Modal open={!!g.player && (celebrate || g.panel === 'streak')} zoom={zoom} onClose={() => { setCelebrate(false); closeGamePanel() }}>
        {celebrate && <img src={shrimpUrl(poseFile(CELEBRATE_POSE))} alt="" width={80} style={{ display: 'block', margin: '0 auto -10px' }} />}
        {g.player && <StreakScreen player={g.player} t={t} lang={lang} onClose={() => { setCelebrate(false); closeGamePanel() }} />}
      </Modal>
    </>
  )
}

