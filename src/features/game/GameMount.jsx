// App-wide part of the game feature: loads the player, keeps today's quests ready across midnight, and
// shows the modals (streak celebration, streak details, "who is studying?").
import { useEffect, useMemo, useRef, useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { useFeatureCtx, useFocusHeld } from '../registry'
import { Modal, ChunkyButton, tCount, depthBorder } from '../ui'
import { useGame, initGame, configureGame, ensureToday, closeGamePanel, choosePlayer, createPlayer, streakOf } from './store'
import { dateKey } from './engine'
import { WeekDots } from './Rail'
import StreakFlame, { StreakFxStyle } from './StreakFlame'
import { celebrateWait } from './celebrate'
import { gameHelpText } from './helpText'
import { useHelpEntry } from '../kit/useHelp'

const DAY_CHECK_MS = 60000        // how often to notice that the date changed
const CELEBRATE_POSE = 'party'
const CHOOSER_POSE = 'happy'

// `celebrate`: the day's first XP just extended the streak, so the flame, the number and today's dot play their show.
function StreakScreen({ player, t, lang, onClose, celebrate }) {
  const s = streakOf(player)
  const rise = (delay) => (celebrate ? { animation: `gmRise .45s ease-out ${delay}s both` } : {})
  return (
    <div className="gm-fx" style={{ textAlign: 'center' }}>
      <StreakFxStyle />
      <StreakFlame streak={s.streak} lit={s.todayDone} celebrate={celebrate} />
      <div style={{ fontFamily: FONT.display, fontWeight: 900, fontSize: 26, color: C.warning, marginBottom: 16, ...rise(1.05) }}>
        {s.streak === 1 ? t('game_streakBig') : t('game_streakBigMany')}
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderRadius: RADIUS.lg, padding: '14px 12px', ...rise(1.2) }}>
        <WeekDots player={player} lang={lang} popToday={celebrate ? 1.5 : 0} />
        <div style={{ borderTop: `1px solid ${C.border}`, margin: '14px -12px 12px' }} />
        <div style={{ fontSize: 14, fontWeight: 700, color: C.inkDim, lineHeight: 1.5 }}>{t('game_streakKeep')}</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, margin: '12px 2px 18px', color: C.inkDim, ...rise(1.35) }}>
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
  const [failed, setFailed] = useState(false)
  // A choice that could not be saved (the local server gone a moment) says so: the click did nothing visible, in a
  // dialog that cannot be closed, and the rejection went unhandled.
  const run = async (fn) => { if (busy) return; setBusy(true); setFailed(false); try { await fn() } catch { setFailed(true) } finally { setBusy(false); onDone?.() } }
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
          ...depthBorder(C.border, { bottomColor: C.border }), borderRadius: RADIUS.md, background: C.surface, cursor: busy ? 'default' : 'pointer',
          fontSize: 15, fontWeight: 800, color: C.ink, opacity: busy ? 0.5 : 1,
        }}>🦐 {p.name || t('game_unnamed')} <span style={{ marginLeft: 'auto', color: C.warning }}>🔥 {streakOf(p).streak}</span></button>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('game_namePlaceholder')} maxLength={40}
          style={{ flex: 1, padding: '10px 12px', borderRadius: RADIUS.md, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, fontSize: 14 }} />
        <ChunkyButton disabled={busy} onClick={() => run(() => createPlayer(name))}>{t('game_chooseNew')}</ChunkyButton>
      </div>
      {failed && <div role="alert" style={{ color: C.danger, fontSize: 12.5, marginTop: 10 }}>{t('game_chooseFailed')}</div>}
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
  // Ebi's Help knows the game on every screen (XP, goal, streak, quests, league): "how much XP until my goal?"
  // Built once per player change (and day), not on every app render: it walks the whole streak and league.
  const helpDay = dateKey()
  const helpText = useMemo(() => { try { return gameHelpText(g.player, g.others) } catch { return '' } }, [g.player, g.others, helpDay])
  useHelpEntry(ctx, 'game', helpText, '')

  // Load once; the store honors the data-folder switch and knows which features exist (for quests).
  const featureIds = ctx?.registry?.features?.filter((f) => ctx.registry.isActive(f.id)).map((f) => f.id).join(',') || ''
  const onboarded = !!ctx?.onboarded
  // What today's quests may ask for (engine QUESTS `needs`), read live when the day's quests are picked: an activity
  // that needs an AI key or the card store is not set as a quest while it is known to be unavailable.
  const needsRef = useRef({})
  needsRef.current = {
    ai: !!ctx?.ai?.hasKey,
    ...(ctx?.ankiConnected === false ? { cards: false } : ctx?.ankiConnected === true ? { cards: true } : {}),
  }
  useEffect(() => {
    if (!ctx || !onboarded) return // no chooser or loading while onboarding is on screen
    configureGame({
      isBlocked: () => !!ctx.isDataSwitching?.(),
      features: () => ({ ...Object.fromEntries((featureIds ? featureIds.split(',') : []).map((id) => [id, true])), ...needsRef.current }),
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
  const done = g.player ? streakOf(g.player).todayDone : null
  const playerIdRef = useRef(null)
  const doneDayRef = useRef(dateKey()) // the day `lastDone` describes
  useEffect(() => {
    // Another player ("Switch player"): what the previous one had done today says nothing about this one (a player who
    // already played today got a false "streak extended" celebration).
    if (g.player?.id !== playerIdRef.current) { playerIdRef.current = g.player?.id ?? null; lastDone.current = null }
    if (done == null) return
    // A new day since `lastDone` was seen (the first XP after midnight can land before the minute check, or right
    // after waking from sleep): yesterday's "done" says nothing about today, else that day's celebration was skipped.
    const today = dateKey()
    if (doneDayRef.current !== today) { doneDayRef.current = today; if (lastDone.current != null) lastDone.current = false }
    if (lastDone.current === false && done) owed.current = true
    lastDone.current = done
  }, [done, g.player])
  const held = useFocusHeld()
  const busy = !!ctx?.busy || held
  // Shown only after the user has been free for a moment (celebrate.js): a gap between two questions or batches
  // is not "finished".
  const freeSince = useRef(Date.now())
  useEffect(() => { if (busy) freeSince.current = NaN; else if (!Number.isFinite(freeSince.current)) freeSince.current = Date.now() }, [busy])
  useEffect(() => {
    const wait = celebrateWait({ owed: owed.current, busy, freeSince: freeSince.current, now: Date.now() })
    if (wait < 0) return
    const id = setTimeout(() => {
      if (!owed.current) return
      owed.current = false
      setCelebrate(true)
    }, wait)
    return () => clearTimeout(id)
  }, [busy, done])

  if (!ctx || !onboarded) return null
  const { t, lang } = ctx
  const zoom = ctx.getZoom?.() || 1
  return (
    <>
      <Modal open={g.status === 'choose'} dismissable={false} zoom={zoom} label={t('game_chooseTitle')}>
        <Chooser g={g} t={t} />
      </Modal>
      <Modal open={!!g.player && (celebrate || g.panel === 'streak')} zoom={zoom} onClose={() => { setCelebrate(false); closeGamePanel() }}>
        {celebrate && <img className="gm-fx" src={shrimpUrl(poseFile(CELEBRATE_POSE))} alt="" width={80} style={{ display: 'block', margin: '0 auto -10px', animation: 'gmHop .9s ease-in-out .5s 2 both' }} />}
        {g.player && <StreakScreen player={g.player} t={t} lang={lang} celebrate={celebrate} onClose={() => { setCelebrate(false); closeGamePanel() }} />}
      </Modal>
    </>
  )
}

