import { useState, useEffect, useMemo, useRef } from 'react'
import { S } from '../styles/theme'
import { C, RADIUS, SHADOW, FONT } from '../config/tokens'
import { PROVIDERS } from '../config/providers'
import { APP_LANGUAGES } from '../i18n'
import { shrimpUrl, poseFile, DEFAULT_SHRIMP } from '../config/shrimp'
import { LaunchModeOptions } from './LaunchModeChoice'

// First-run, Ebi-guided onboarding. Hand-holds a new user through:
// language → appearance → AI provider+key → first study mode → done.
// Themed (light/dark via CSS vars); each setter writes straight to App state/config.
export default function OnboardingWizard(p) {
  const {
    t, onFinish,
    appLanguage, setAppLanguage, appTheme, setAppTheme,
    provider, setProvider, apiKeys, apiKey, setCurrentKey, providerConfig, presetModel, validateKey,
    createMode, modeCreating,
    aiModels, setAiModels,
    intelligence, setIntelligence,
  } = p

  const [step, setStep] = useState(0)
  const [modeInput, setModeInput] = useState('')
  const [creatingFirst, setCreatingFirst] = useState(false)
  const [advanced, setAdvanced] = useState(false) // emergency: custom model entry

  // ── Is the key any good? ────────────────────────────────────────────────────
  // Onboarding used to accept whatever was pasted without a word, so a typo, a
  // half-copied key or a key from the wrong provider sailed through - and the
  // first sign of trouble was the NEXT step failing to build the user's first
  // study mode, which reads as "the app is broken" rather than "that key is
  // wrong". Settings has checked keys for real for a while; this is the same
  // check (prefix first, then a real one-token call via validateKey) at the
  // moment the key is actually entered.
  const [keyCheck, setKeyCheck] = useState(null)   // { state: 'checking'|'valid'|'invalid'|'unknown' }
  const keyCheckSeq = useRef(0)                    // a stale result must never overwrite a newer paste
  useEffect(() => {
    const key = (apiKey || '').trim()
    const seq = ++keyCheckSeq.current
    if (!key) { setKeyCheck(null); return }
    // Free and instant: the wrong provider's key can be rejected without a call.
    if (providerConfig?.keyPrefix && !key.startsWith(providerConfig.keyPrefix)) { setKeyCheck({ state: 'invalid' }); return }
    if (!validateKey) { setKeyCheck(null); return }
    setKeyCheck({ state: 'checking' })
    // Debounced, because this input is bound on every keystroke: someone typing a
    // key by hand must not fire a request per character.
    const timer = setTimeout(async () => {
      let r = null
      try { r = await validateKey(provider, key) } catch { r = null }
      if (seq !== keyCheckSeq.current) return   // a newer key was entered while this was in flight
      setKeyCheck(r === true ? { state: 'valid' } : r === false ? { state: 'invalid' } : { state: 'unknown' })
    }, 700)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, provider])
  // 'unknown' means the check itself could not run (offline, a provider hiccup), so it must never
  // read as a verdict on the key.
  const keyStateColor = keyCheck?.state === 'valid' ? C.success
    : keyCheck?.state === 'invalid' ? C.danger
      : keyCheck?.state === 'unknown' ? C.warning : null

  // ONE pose per step, and the list must stay the same length as `steps` below: it used to be
  // one entry SHORT, so the final screen asked for poseUrls[7] === undefined and the <img> kept
  // painting the previous step's pose.
  const poses = ['default', 'book', 'artist', 'science', 'science', 'book', 'artist', 'party']
  const poseUrls = useMemo(() => poses.map((n) => shrimpUrl(poseFile(n) || DEFAULT_SHRIMP)), [])

  const steps = ['welcome', 'language', 'appearance', 'launch', 'provider', 'intelligence', 'mode', 'finish']
  const last = steps.length - 1
  const next = () => setStep((s) => Math.min(s + 1, last))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const heading = { fontSize: 26, fontWeight: 800, fontFamily: FONT.display, color: C.ink, margin: '14px 0 6px' }
  const sub = { fontSize: 14, color: C.inkDim, maxWidth: 460, lineHeight: 1.6, margin: '0 auto' }
  const bigBtn = { ...S.keyDone, fontSize: 15, padding: '11px 26px', borderRadius: RADIUS.pill }
  const choiceCard = (active) => ({
    cursor: 'pointer', padding: '14px 18px', borderRadius: RADIUS.md, fontWeight: 700, fontSize: 14,
    border: `2px solid ${active ? C.brand : C.border}`, background: active ? C.brandTint : C.surface,
    color: active ? C.brand : C.ink, transition: 'all .15s ease',
  })

  // How Ebiki opens on this computer. Machine-local (launchmode.json via /api/launchmode), NOT part
  // of config.json - see LaunchModeChoice.jsx. Asked here because it is a screen-layout decision a
  // new user can answer immediately, and the one they are most likely to regret discovering late.
  // Nothing is switched live during onboarding; the choice applies from the next launch on.
  const [launchMode, setLaunchMode] = useState('app')
  const [launchElectron, setLaunchElectron] = useState(true)
  useEffect(() => {
    fetch('/api/launchmode').then((r) => r.json()).then((d) => {
      setLaunchMode(d.mode || 'app'); setLaunchElectron(d.electronAvailable !== false)
    }).catch(() => {})
  }, [])
  const pickLaunchMode = (m) => {
    setLaunchMode(m)
    fetch('/api/launchmode', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode: m }),
    }).catch(() => {})   // fail-soft: a lost write just leaves the default, changeable in Settings
  }

  const createFirstMode = async () => {
    if (!modeInput.trim()) { next(); return }
    setCreatingFirst(true)
    try { await createMode(modeInput.trim()) } catch {}
    setCreatingFirst(false)
    next()
  }

  const Body = () => {
    switch (steps[step]) {
      case 'welcome':
        return (<>
          <div style={heading}>{t('obWelcomeTitle')}</div>
          <div style={sub}>{t('obWelcomeBody')}</div>
          <div style={{ marginTop: 26 }}><button className="btn-press" style={bigBtn} onClick={next}>{t('obStart')}</button></div>
        </>)
      case 'language':
        return (<>
          <div style={heading}>{t('obLanguageTitle')}</div>
          <div style={sub}>{t('obLanguageBody')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 22, maxWidth: 420, marginInline: 'auto' }}>
            {APP_LANGUAGES.map((l) => (
              <div key={l.code} onClick={() => setAppLanguage(l.code)} style={choiceCard(appLanguage === l.code)}>{l.label}</div>
            ))}
          </div>
        </>)
      case 'appearance':
        return (<>
          <div style={heading}>{t('obThemeTitle')}</div>
          <div style={sub}>{t('obThemeBody')}</div>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 22 }}>
            {[['light', '☀️', t('themeLight')], ['dark', '🌙', t('themeDark')]].map(([val, ic, label]) => (
              <div key={val} onClick={() => setAppTheme(val)} style={{ ...choiceCard(appTheme === val), width: 150, textAlign: 'center' }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>{ic}</div>{label}
              </div>
            ))}
          </div>
        </>)
      case 'launch':
        return (<>
          <div style={heading}>{t('obLaunchTitle')}</div>
          <div style={sub}>{t('obLaunchBody')}</div>
          <div style={{ marginTop: 22 }}>
            <LaunchModeOptions t={t} mode={launchMode} onPick={pickLaunchMode} electronAvailable={launchElectron} />
          </div>
          {!launchElectron && <div style={{ fontSize: 11.5, color: C.inkDim, marginTop: 14 }}>{t('lm_noElectron')}</div>}
        </>)
      case 'provider':
        return (<>
          <div style={heading}>{t('obProviderTitle')}</div>
          <div style={sub}>{t('obProviderBody')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 18 }}>
            {Object.entries(PROVIDERS).map(([key, pr]) => (
              <button key={key} onClick={() => setProvider(key)} style={{
                ...S.ghostBtn, fontSize: 13, padding: '7px 14px',
                color: provider === key ? pr.color : C.inkDim,
                borderColor: provider === key ? `${pr.color}66` : C.border,
                background: provider === key ? `${pr.color}14` : C.surface,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: apiKeys[key] ? C.success : C.inkFaint, display: 'inline-block', marginRight: 6 }} />
                {pr.label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', maxWidth: 460, margin: '16px auto 0' }}>
            <input type="password" value={apiKey} onChange={(e) => setCurrentKey(e.target.value)} placeholder={providerConfig.placeholder}
              style={{ ...S.keyInput, flex: 1, ...(keyStateColor ? { borderColor: keyStateColor } : {}) }} />
            <a href={providerConfig.url} target="_blank" rel="noopener noreferrer" style={S.getKeyLink}>{t('getKey')}</a>
          </div>
          {/* The verdict sits where the reassurance used to, so it cannot be missed. */}
          {keyCheck?.state === 'checking' ? <div style={{ fontSize: 12, color: C.inkDim, marginTop: 8 }}>{t('keyChecking')}</div>
            : keyCheck?.state === 'valid' ? <div style={{ fontSize: 12, color: C.success, fontWeight: 700, marginTop: 8 }}>{t('keyValid')}</div>
              : keyCheck?.state === 'invalid' ? <div style={{ fontSize: 12, color: C.danger, fontWeight: 700, marginTop: 8 }}>{t('keyInvalid')}</div>
                : keyCheck?.state === 'unknown' ? <div style={{ fontSize: 12, color: C.warning, marginTop: 8 }}>{t('keyCheckUnknown')}</div>
                  : <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 8 }}>{t('obProviderNote')}</div>}
          <div style={{ marginTop: 10 }}>
            <span onClick={() => setAdvanced((a) => !a)} style={{ fontSize: 11, color: C.brand, cursor: 'pointer' }}>{advanced ? '▾' : '▸'} {t('obAdvanced')}</span>
            {advanced && (
              <div style={{ maxWidth: 460, margin: '8px auto 0', textAlign: 'left' }}>
                <div style={{ fontSize: 11, color: C.inkDim, marginBottom: 5 }}>{t('obCustomModelBody')} <a href={providerConfig.modelsUrl || providerConfig.url} target="_blank" rel="noopener noreferrer" style={{ color: C.brand }}>{providerConfig.label} ↗</a></div>
                <input value={aiModels[provider]?.general || ''} onChange={(e) => setAiModels((prev) => ({ ...prev, [provider]: { ...(prev[provider] || {}), general: e.target.value } }))}
                  placeholder={t('obCustomModelPlaceholder')} spellCheck={false} style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', fontSize: 12 }} />
              </div>
            )}
          </div>
        </>)
      case 'intelligence':
        return (<>
          <div style={heading}>{t('obIntelTitle')}</div>
          <div style={sub}>{t('obIntelBody')} ({providerConfig.label})</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
            {[
              // presetModel resolves to the newest model in the tier's family (adopted silently as
              // soon as the key was entered on the previous step), so a new user is shown and put on
              // current models instead of whatever constant providers.js shipped with.
              { key: 'optimized', title: t('obIntelOptimized'), model: t('obIntelOptimizedModel'), desc: t('obIntelOptimizedDesc') },
              { key: 'normal', title: t('obIntelNormal'), model: presetModel?.('normal') || providerConfig.presets?.normal || providerConfig.questionModel, desc: t('obIntelNormalDesc') },
              { key: 'max', title: t('obIntelMax'), model: presetModel?.('max') || providerConfig.presets?.max || providerConfig.questionModel, desc: t('obIntelMaxDesc') },
            ].map((opt) => {
              const active = (intelligence || 'normal') === opt.key
              return (
                <button key={opt.key} onClick={() => setIntelligence(opt.key)} style={{
                  width: 240, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                  padding: '14px 16px', borderRadius: RADIUS.md,
                  border: `2px solid ${active ? C.brand : C.border}`, background: active ? C.brandTint : C.surface,
                  transition: 'all .15s ease',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: active ? C.brand : C.ink }}>{active ? '● ' : '○ '}{opt.title}</div>
                  <div style={{ fontSize: 12, color: C.inkDim, margin: '6px 0' }}>{opt.desc}</div>
                  <div style={{ fontSize: 10, color: C.inkFaint, fontFamily: 'monospace' }}>{opt.model}</div>
                </button>
              )
            })}
          </div>
          <div style={{ fontSize: 12, color: C.inkFaint, marginTop: 16 }}>{t('obIntelNote')}</div>
          <div style={{ marginTop: 16 }}><button className="btn-press" style={bigBtn} onClick={next}>{t('obContinue')}</button></div>
        </>)
      case 'mode':
        return (<>
          <div style={heading}>{t('obModeTitle')}</div>
          <div style={sub}>{t('obModeBody')}</div>
          <div style={{ display: 'flex', gap: 8, maxWidth: 480, margin: '20px auto 0' }}>
            <input value={modeInput} onChange={(e) => setModeInput(e.target.value)} autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter' && modeInput.trim() && apiKey && !creatingFirst) createFirstMode() }}
              placeholder={t('createModePlaceholder')} style={{ ...S.keyInput, flex: 1 }} disabled={creatingFirst || modeCreating} />
          </div>
          {!apiKey && <div style={{ fontSize: 12, color: C.warning, marginTop: 10 }}>{t('obModeNeedsKey')}</div>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 18 }}>
            <button className="btn-press" style={{ ...bigBtn, opacity: (!modeInput.trim() || !apiKey || creatingFirst) ? 0.5 : 1 }}
              disabled={!modeInput.trim() || !apiKey || creatingFirst} onClick={createFirstMode}>
              {creatingFirst ? t('creating') : t('obCreateMode')}
            </button>
            <button style={{ ...S.ghostBtn, fontSize: 13, padding: '10px 18px' }} onClick={next}>{t('obSkip')}</button>
          </div>
        </>)
      case 'finish':
        return (<>
          <div style={heading}>{t('obDoneTitle')}</div>
          <div style={sub}>{t('obDoneBody')}</div>
          <div style={{ marginTop: 26 }}><button className="btn-press" style={bigBtn} onClick={onFinish}>{t('obFinish')}</button></div>
        </>)
      default: return null
    }
  }

  return (
    <div style={{ ...S.backdrop, cursor: 'default' }}>
      <div style={{
        width: 'min(620px, 94vw)', maxHeight: '90vh', overflowY: 'auto', textAlign: 'center',
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg,
        boxShadow: SHADOW.xl, padding: '34px 30px 26px', animation: 'pop .2s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* EVERY pose is mounted at once and only its visibility flips, so Ebi changes in the SAME
            paint as the step's text. Swapping a single <img src> could not do that even with the
            file preloaded: the new bitmap still has to be decoded for THAT element, so the old
            pose stayed on screen for a frame or two after the copy had already changed. Mounted
            images are decoded and painted once, up front, and `visibility` costs no decode at all.
            The floaty animation lives on the wrapper so it never restarts mid-swap. */}
        <div style={{ position: 'relative', width: 96, height: 96, margin: '0 auto', animation: 'floaty 4s ease-in-out infinite' }}>
          {poseUrls.map((u, i) => (
            <img key={u + i} src={u} alt={i === step ? 'Ebi' : ''} decoding="sync" aria-hidden={i !== step}
              style={{ position: 'absolute', inset: 0, width: 96, height: 96, objectFit: 'contain', visibility: i === step ? 'visible' : 'hidden' }} />
          ))}
        </div>
        <Body />
        {/* Footer nav (hidden on welcome/finish which have their own primary button) */}
        {step > 0 && step < last && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 26 }}>
            <button style={{ ...S.ghostBtn, fontSize: 13 }} onClick={back}>{t('back')}</button>
            <div style={{ display: 'flex', gap: 6 }}>
              {steps.map((_, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: i === step ? C.brand : C.border }} />)}
            </div>
            {steps[step] === 'mode'
              ? <span style={{ width: 60 }} />
              : <button className="btn-press" style={{ ...S.keyDone, fontSize: 13, padding: '8px 20px' }} onClick={next}>{t('obNext')}</button>}
          </div>
        )}
      </div>
    </div>
  )
}
