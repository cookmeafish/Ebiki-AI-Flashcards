// Right-rail cards: streak week, daily goal, quests, league, friends. Each is its own slot entry, so any
// one can be dropped from ./index.js without touching the others.
import { C, FONT, RADIUS } from '../../config/tokens'
import { poseFile, shrimpUrl } from '../../config/shrimp'
import { useFeatureCtx } from '../registry'
import { Card, ProgressBar, tCount } from '../ui'
import { useGame, openGamePanel, todayTotals, updateProfile } from './store'
import { computeStreak, weekRow, questProgress, leagueBoard, friendStreak, isRestDay, TIERS, GOALS, DEFAULT_GOAL, MAX_FREEZES, dateKey, dayTotals, dayMeta } from './engine'

const DOT = 26                    // weekday circle size
const LEAGUE_ROWS = 6             // board rows shown
const TIER_POSE = ['cute', 'chill', 'happy', 'cool', 'rockstar', 'king', 'angel'] // Ebi per league tier
const STATUS_COLOR = { done: C.warning, frozen: C.info, rest: `color-mix(in srgb, ${C.purple} 30%, ${C.surfaceSunken})`, missed: C.surfaceSunken, today: C.surfaceSunken, future: C.surfaceSunken, none: C.surfaceSunken }

// Weekday initials (or full names: width 'long') in the app language, Monday first.
export function weekdayLetters(lang, width = 'narrow') {
  const monday = new Date(2024, 0, 1) // a Monday
  const fmt = new Intl.DateTimeFormat(lang || 'en', { weekday: width })
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(monday.getFullYear(), 0, 1 + i)))
}

// popToday: seconds after which today's dot pops in (the streak celebration), 0 = no animation.
export function WeekDots({ player, lang, popToday = 0 }) {
  const row = weekRow(player)
  const letters = weekdayLetters(lang)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
      {row.map((d, i) => (
        <div key={d.date}>
          <div style={{ fontSize: 12, fontWeight: 800, color: d.status === 'today' || d.date === dateKey() ? C.warning : C.inkFaint, marginBottom: 4 }}>{letters[i]}</div>
          <div style={{
            width: DOT, height: DOT, margin: '0 auto', borderRadius: '50%', background: STATUS_COLOR[d.status],
            display: 'grid', placeItems: 'center', color: C.white, fontSize: 13, fontWeight: 900,
            outline: d.status === 'today' ? `2px dashed ${C.warning}` : 'none', outlineOffset: 1,
            ...(popToday && d.date === dateKey() && d.status === 'done' ? { animation: `gmDotPop .5s cubic-bezier(.3,1.6,.5,1) ${popToday}s both` } : {}),
          }}>{d.status === 'done' ? '✓' : d.status === 'frozen' ? '❄' : d.status === 'rest' ? '🌙' : ''}</div>
        </div>
      ))}
    </div>
  )
}

export function StreakCard() {
  const ctx = useFeatureCtx()
  const g = useGame()
  if (!ctx || !g.player) return null
  const { t } = ctx
  const s = computeStreak(g.player)
  return (
    <Card onClick={() => openGamePanel('streak')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 30, filter: s.todayDone ? 'none' : 'grayscale(1)' }}>🔥</span>
        <div>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 18, color: s.todayDone ? C.warning : C.ink }}>{tCount(t, 'game_streakChip', s.streak)}</div>
          <div style={{ fontSize: 12, color: C.inkDim }}>{s.streak === 0 ? t('game_streakStart') : s.todayDone ? t('game_streakTodayDone') : isRestDay(g.player, dateKey()) ? t('game_streakTodayRest') : t('game_streakTodayOpen')}</div>
        </div>
      </div>
      <WeekDots player={g.player} lang={ctx.lang} />
      <div style={{ marginTop: 10, fontSize: 12, color: C.info, fontWeight: 700 }}>
        ❄ {s.freezes ? tCount(t, 'game_freezes', s.freezes) : t('game_freezesNone')}
      </div>
    </Card>
  )
}

export function GoalCard() {
  const ctx = useFeatureCtx()
  const g = useGame()
  if (!ctx || !g.player) return null
  const { t } = ctx
  const goal = g.player.goalXp || DEFAULT_GOAL
  const xp = todayTotals(g.player).xp
  return (
    <Card title={t('game_goalTitle')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: C.inkDim, marginBottom: 6 }}>
        <span>{xp >= goal ? `🎉 ${t('game_goalDone')}` : t('game_goalProgress', { xp, goal })}</span>
      </div>
      <ProgressBar value={xp} max={goal} color={xp >= goal ? C.success : C.warning} label={t('game_goalTitle')} />
      {/* Two per row: four in a row did not fit the rail, and flex items allowed to shrink to 0 never wrapped,
          so the labels spilled past their boxes. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 6, marginTop: 12 }}>
        {GOALS.map((opt) => (
          <button key={opt.key} type="button" aria-pressed={goal === opt.xp} onClick={() => updateProfile({ goalXp: opt.xp })} className={goal === opt.xp ? 'tip ui-tab-current' : 'tip'}
            data-tip={t('game_goalMinutes', { m: opt.minutes })}
            style={{
              minWidth: 0, padding: '6px 4px', borderRadius: RADIUS.sm, fontSize: 11, fontWeight: 800,
              border: `2px solid ${goal === opt.xp ? C.brand : C.border}`, background: goal === opt.xp ? C.brandTint : C.surface,
              color: goal === opt.xp ? C.brandText : C.inkDim, cursor: goal === opt.xp ? 'default' : 'pointer',
            }}>{t(`game_goal_${opt.key}`)}</button>
        ))}
      </div>
    </Card>
  )
}

export function QuestsCard() {
  const ctx = useFeatureCtx()
  const g = useGame()
  if (!ctx || !g.player) return null
  const { t } = ctx
  const key = dateKey()
  const quests = dayMeta(g.player, key).quests || [] // the SAME list computeStreak judges the freeze on
  if (!quests.length) return null
  const totals = dayTotals(g.player, key)
  const prog = quests.map((q) => questProgress(q, totals)).filter((p) => !p.unknown)
  if (!prog.length) return null
  const all = prog.every((p) => p.done)
  const s = computeStreak(g.player)
  return (
    <Card title={t('game_questsTitle')}>
      {prog.map((p) => (
        <div key={p.id} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, fontWeight: 700, color: C.ink, marginBottom: 5 }}>
            <span>{p.done ? '✅ ' : '⚡ '}{tCount(t, `game_q_${p.kind}`, p.target)}</span>
            <span style={{ color: C.inkFaint, fontSize: 12 }}>{p.value}/{p.target}</span>
          </div>
          <ProgressBar value={p.value} max={p.target} color={p.done ? C.success : C.warning} label={tCount(t, `game_q_${p.kind}`, p.target)} />
        </div>
      ))}
      <div style={{ fontSize: 12, color: all ? C.success : C.inkDim, fontWeight: all ? 800 : 600, lineHeight: 1.4 }}>
        {all ? (s.freezes >= MAX_FREEZES ? t('game_questsAllFull') : t('game_questsAll')) : `❄ ${t('game_freezeHow', { max: MAX_FREEZES })}`}
      </div>
    </Card>
  )
}

export function LeagueCard() {
  const ctx = useFeatureCtx()
  const g = useGame()
  if (!ctx || !g.player) return null
  const { t } = ctx
  const b = leagueBoard(g.player, g.others, dateKey(), g.player.goalXp || DEFAULT_GOAL)
  const tierName = t(`game_tier_${TIERS[b.tier]}`)
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <img src={shrimpUrl(poseFile(TIER_POSE[b.tier]))} alt="" width={44} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FONT.display, fontWeight: 800, fontSize: 16, color: C.ink }}>{t('game_leagueTitle', { tier: tierName })}</div>
          <div style={{ fontSize: 12, color: C.inkDim }}>{b.daysLeft === 0 ? t('game_daysLeftNone') : tCount(t, 'game_daysLeft', b.daysLeft)}</div>
        </div>
      </div>
      {/* Your own row is always shown: cut at LEAGUE_ROWS, a slow start behind two friends hid you from the board. */}
      {(() => { const all = b.rows.map((r, i) => ({ r, rank: i + 1 })); const mine = all.findIndex((x) => x.r.kind === 'me'); return mine >= LEAGUE_ROWS ? [...all.slice(0, LEAGUE_ROWS - 1), all[mine]] : all.slice(0, LEAGUE_ROWS) })().map(({ r, rank }) => {
        const me = r.kind === 'me'
        const label = me ? (g.player.name || t('game_you')) : r.kind === 'ghost' ? tCount(t, 'game_ghost', r.weeksAgo) : (r.name || t('game_unnamed'))
        return (
          <div key={`${r.kind}${r.id || r.weeksAgo}`} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: RADIUS.sm, marginBottom: 2,
            background: me ? C.brandTint : 'transparent', fontSize: 13, fontWeight: me ? 800 : 600, color: C.ink,
          }}>
            <span style={{ width: 18, color: C.inkFaint, fontWeight: 800 }}>{rank}</span>
            <span style={{ width: 20 }}>{me ? '⭐' : r.kind === 'ghost' ? '👻' : '🦐'}</span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: r.kind === 'ghost' ? 0.75 : 1 }}>{label}</span>
            {/* A ghost races by the same weekday; its whole week's total is the bar to clear by Sunday. */}
            <span className={r.kind === 'ghost' ? 'tip tip-l' : undefined} data-tip={r.kind === 'ghost' ? t('game_ghostFinal', { xp: `${r.finalXp} XP` }) : undefined}
              style={{ color: C.inkDim, fontWeight: 800 }}>{r.xp} XP</span>
          </div>
        )
      })}
      <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 8, lineHeight: 1.4 }}>{t('game_leagueHow')}</div>
    </Card>
  )
}

export function FriendsCard() {
  const ctx = useFeatureCtx()
  const g = useGame()
  if (!ctx || !g.player || !g.others.length) return null
  const { t } = ctx
  const today = dateKey()
  return (
    <Card title={t('game_friendsTitle')}>
      {g.others.map((f) => {
        const fs = computeStreak(f)
        const together = friendStreak(g.player, f)
        const studied = dayTotals(f, today).xp > 0
        return (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderTop: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 20 }}>🦐</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>{f.name || t('game_unnamed')}</div>
              <div style={{ fontSize: 11.5, color: studied ? C.success : C.inkFaint }}>{studied ? t('game_friendToday') : t('game_friendNotToday')}</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 800 }}>
              <div style={{ color: C.warning }}>🔥 {fs.streak}</div>
              {together > 0 && <div style={{ color: C.purple }}>{tCount(t, 'game_friendStreak', together)}</div>}
            </div>
          </div>
        )
      })}
      <div style={{ fontSize: 11.5, color: C.inkFaint, marginTop: 6 }}>{t('game_friendsHow')}</div>
    </Card>
  )
}
