// FIGHT SETTINGS: one compact row under a fight's intro card (a raid, a Legends boss or Legendary). Closed, it reads
// like a caption ("Spanish · Ebi speaks English · Word hints"); open, it shows the few controls a fight uses. Every
// value is the MODE's own study setting (ctx.study.rules / setRules, kit/fightSettings.js), so Study and fights stay
// ONE setting; the deck is the mode deck (ctx.cards.setModeDeck). Language-only controls hide in general modes.
// `ctx` must be a fight ctx (kit fightCtx). `allowStyle`: the fight can open questions on their choices.
import { useState } from 'react'
import { C, FONT, RADIUS } from '../../config/tokens'
import { LANGS, isDistinctSpoken, langFromName } from '../../config/languages'
import { isImmersive } from '../kit/fightSettings'
import { sameLanguage } from '../../utils/tapTokens'

const asOption = (name) => (isDistinctSpoken(name) ? name : (langFromName(name)?.label || name))
const LANG_OPTIONS = LANGS.filter((l) => l.code !== 'auto').map((l) => l.label)

// `runSize` (raids): { value, options, onChange } = questions per run (a features.legends setting, not a study rule).
export default function FightSettings({ ctx, allowStyle = false, busy = false, deckLocked = false, runSize = null }) {
  const { t, subject, cards } = ctx
  const f = ctx.fight
  const [open, setOpen] = useState(false)
  if (!f || !ctx.study?.setRules) return null
  const r = f.rules
  const isLang = !!subject.isLanguage
  const appLang = subject.appLang || subject.userLang
  const set = (change) => { if (!busy) f.set(change) }
  const decks = cards?.decks || []
  const deck = subject.modeDeck || ''
  const learned = isLang ? asOption(r.learnLang) : ''
  const speaks = r.speaks ? asOption(r.speaks) : ''
  const immersive = isImmersive(subject, r)
  const otherLang = !!speaks && !immersive && !sameLanguage(speaks, appLang) // Ebi speaks neither the app's nor the learned language
  const withCur = (v) => (v && !LANG_OPTIONS.includes(v) ? [v, ...LANG_OPTIONS] : LANG_OPTIONS)

  // The closed caption: what the fight will be like.
  const summary = [
    deck,
    isLang && learned,
    immersive ? `🌊 ${t('lg_fsImmersive')}` : t('lg_fsSpeaksShort', { lang: speaks || appLang }),
    isLang && r.wordHints && t('lg_fsHints'),
    isLang && r.grammarFeedback && t('lg_fsGrammar'),
    allowStyle && r.answerStyle === 'choices' && t('lg_fsChoices'),
    runSize && t('lg_fsRunSizeShort', { n: runSize.value }),
  ].filter(Boolean)

  const field = { display: 'grid', gap: 4, minWidth: 0 }
  const label = { fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: C.inkDim }
  const select = { fontFamily: FONT.body, fontSize: 13, fontWeight: 700, padding: '6px 8px', borderRadius: RADIUS.sm, border: `1px solid ${C.border}`, background: C.surfaceAlt, color: C.ink, minWidth: 0, width: '100%' }
  const toggle = (key, on, tipKey, labelKey) => (
    <label key={key} className="tip tip-r" data-tip={t(tipKey)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: C.ink, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.5 : 1 }}>
      <input type="checkbox" checked={!!on} disabled={busy} onChange={(e) => set({ [key]: e.target.checked })} />
      {t(labelKey)}
    </label>
  )
  return (
    <div data-fight-settings="" style={{ maxWidth: 640, width: '100%', margin: '0 auto', boxSizing: 'border-box', borderRadius: RADIUS.lg, border: `1.5px solid ${C.border}`, background: C.surface }}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="card-head"
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: FONT.body, textAlign: 'left', borderRadius: RADIUS.lg }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: C.ink, whiteSpace: 'nowrap' }}>⚙ {t('lg_fsTitle')}</span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: C.inkDim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary.join(' · ')}</span>
        <span aria-hidden="true" style={{ fontSize: 11, color: C.inkFaint }}>{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div style={{ padding: '4px 14px 14px', display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            <label style={field}>
              <span style={label}>{t('lg_fsDeck')}</span>
              {decks.length && ctx.ankiConnected !== false ? (
                <select value={decks.includes(deck) ? deck : ''} disabled={busy || deckLocked} onChange={(e) => { if (e.target.value) cards.setModeDeck(e.target.value) }} style={select}>
                  {!decks.includes(deck) && <option value="">{deck ? `${deck} (?)` : t('lg_deckChoose')}</option>}
                  {decks.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : <span style={{ fontSize: 12.5, color: C.warning, fontWeight: 700 }}>{deck || t('lg_noDeck')}</span>}
            </label>
            {isLang && (
              <label style={field}>
                <span style={label}>{t('lg_fsLearn')}</span>
                <select value={learned} disabled={busy} onChange={(e) => set({ learnLang: e.target.value })} style={select}>
                  {withCur(learned).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
            )}
            <label style={field}>
              <span style={label}>{t('lg_fsSpeaks')}</span>
              <select value={speaks} disabled={busy} onChange={(e) => set({ speaks: e.target.value })} style={select}>
                <option value="">{t('lg_fsSpeaksApp', { lang: appLang })}</option>
                {withCur(speaks).filter(Boolean).map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </label>
          </div>
          {(immersive || otherLang) && (
            <div role="note" style={{ fontSize: 12.5, fontWeight: 700, lineHeight: 1.45, color: C.info, background: `color-mix(in srgb, ${C.info} 8%, ${C.surface})`, border: `1px solid color-mix(in srgb, ${C.info} 30%, transparent)`, borderRadius: RADIUS.md, padding: '7px 10px' }}>
              {immersive ? `🌊 ${t('lg_fsImmersionNote', { lang: learned })}` : `🗣 ${t('lg_fsOtherNote', { lang: speaks })}`}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {isLang && toggle('wordHints', r.wordHints, 'lg_fsHintsTip', 'lg_fsHints')}
            {isLang && toggle('grammarFeedback', r.grammarFeedback, 'lg_fsGrammarTip', 'lg_fsGrammar')}
            {isLang && subject.accents && toggle('strictAccents', r.strictAccents, 'lg_fsAccentsTip', 'lg_fsAccents')}
            {toggle('learnMoment', r.learnMoment, 'lg_fsLearnItTip', 'lg_fsLearnIt')}
          </div>
          {allowStyle && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="tip tip-r" data-tip={t('lg_fsStyleTip')} style={label}>{t('lg_fsStyle')} ⓘ</span>
              <div role="radiogroup" style={{ display: 'inline-flex', gap: 4 }}>
                {['typed', 'choices'].map((s) => {
                  const on = r.answerStyle === s
                  return (
                    <button key={s} type="button" role="radio" aria-checked={on} disabled={busy} onClick={() => { if (!on) set({ answerStyle: s }) }}
                      className={`ui-tab${on ? ' ui-tab-current' : ''}`}
                      style={{ fontFamily: FONT.body, fontSize: 12.5, fontWeight: 800, padding: '5px 12px', borderRadius: RADIUS.pill, border: `1.5px solid ${on ? C.brand : C.border}`, background: on ? `color-mix(in srgb, ${C.brand} 10%, ${C.surface})` : 'transparent', color: on ? C.brand : C.inkDim, cursor: on ? 'default' : 'pointer' }}>
                      {s === 'typed' ? `⌨ ${t('lg_fsTyped')}` : `🛡 ${t('lg_fsChoices')}`}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {runSize && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="tip tip-r" data-tip={t('lg_fsRunSizeTip')} style={label}>{t('lg_fsRunSize')} ⓘ</span>
              <div role="radiogroup" style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                {runSize.options.map((n) => {
                  const on = runSize.value === n
                  return (
                    <button key={n} type="button" role="radio" aria-checked={on} disabled={busy} onClick={() => { if (!on) runSize.onChange(n) }}
                      className={`ui-tab${on ? ' ui-tab-current' : ''}`}
                      style={{ fontFamily: FONT.body, fontSize: 12.5, fontWeight: 800, padding: '5px 11px', borderRadius: RADIUS.pill, border: `1.5px solid ${on ? C.brand : C.border}`, background: on ? `color-mix(in srgb, ${C.brand} 10%, ${C.surface})` : 'transparent', color: on ? C.brand : C.inkDim, cursor: on ? 'default' : 'pointer' }}>
                      {n}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          <div style={{ fontSize: 11.5, color: C.inkFaint }}>{busy ? `✍ ${t('lg_fsRewriting')}` : t('lg_fsShared')}</div>
        </div>
      )}
      {!open && busy && <div role="status" style={{ padding: '0 14px 9px', fontSize: 12, fontWeight: 700, color: C.purple }}>✍ {t('lg_fsRewriting')}</div>}
    </div>
  )
}
