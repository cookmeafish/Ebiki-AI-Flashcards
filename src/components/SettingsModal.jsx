import { useState, useEffect } from 'react'
import { S } from '../styles/theme'
import { C, RADIUS, SHADOW, FONT } from '../config/tokens'
import { LANGS } from '../config/languages'
import { langInfo } from '../pronunciation/langcodes'
import { PROVIDERS } from '../config/providers'
import { APP_LANGUAGES } from '../i18n'

// Unified Settings modal. Left sidebar = categories grouped by scope (APP vs MODE);
// right pane = the selected category. All state/handlers come from App via `p`.
//
// SCOPE (verified against the persistence layer):
//   APP (global config.json): General (theme, app language, translation), AI Models
//   MODE (activeMode → modes/<name>): Study, Cards & Anki, Knowledge, Overlay, Manage Modes
export default function SettingsModal(p) {
  const {
    t, category, setCategory, onClose,
    // General (global)
    appTheme, setAppTheme, appLanguage, setAppLanguage,
    language, setLanguage, targetLang, setTargetLang, onRunSetup,
    // AI Models (global)
    provider, setProvider, apiKeys, apiKey, setCurrentKey, providerConfig,
    AI_ROLE_META, ROLE_DEFAULTS, aiModels, setAiModels, availableModels,
    refreshModels, modelsLoading, modelsError, intelligence, setIntelligence,
    studyAutoSync, setStudyAutoSync, studyAutoSyncMinutes, setStudyAutoSyncMinutes,
    // Modes
    modes, activeModeId, setActiveModeId, saveModes, editingModeName, setEditingModeName,
    renameMode, modeEditInput, setModeEditInput, createMode, modeCreating, addDefaultMode, deleteMode,
    // Mode config
    activeMode, updateActiveMode, defaultStudyRules, defaultGeneralStudyRules,
    ankiConnected, refreshAnkiConnection, ankiDecks, ankiDeck, setAnkiDeck, ankiFormat,
    proposeModeEdit, acceptModeEdit, denyModeEdit, modeEditProposal, modeEditBusy, diffWords,
    // Knowledge
    knowledgeFiles, knowledgeDragging, setKnowledgeDragging, handleKnowledgeDrop,
    handleKnowledgeFileInput, toggleKnowledgeFile, deleteKnowledgeFile, knowledgeStatus, knowledgeBusy,
    // Pronunciation audio (global)
    pronunciationCfg, setPronunciationCfg,
  } = p

  const isLanguage = (activeMode?.type || 'general') === 'language'
  // Per-role "type a custom model" toggles (emergency: provider list empty / future models).
  const [customRoles, setCustomRoles] = useState({})
  const [qPrefInput, setQPrefInput] = useState('') // Settings → Study: add a question-style preference

  // Esc closes the modal
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const NAV = [
    { group: t('settingsApp'), items: [
      { id: 'general', label: t('setGeneral'), icon: '⚙' },
      { id: 'models', label: t('setAIModels'), icon: '🧠' },
      { id: 'audio', label: t('setAudio'), icon: '🔊' },
    ] },
    { group: t('settingsMode'), items: [
      { id: 'study', label: t('setStudy'), icon: '📚' },
      { id: 'cards', label: t('setCards'), icon: '🗂' },
      { id: 'knowledge', label: t('setKnowledge'), icon: '📎' },
      { id: 'overlay', label: t('setOverlay'), icon: '🖥' },
      { id: 'modes', label: t('setModes'), icon: '🌐' },
    ] },
  ]

  const sectionTitle = (txt) => (
    <div style={{ fontSize: 16, fontWeight: 800, fontFamily: FONT.display, color: C.ink, marginBottom: 14 }}>{txt}</div>
  )
  const fieldLabel = (txt) => <div style={{ fontSize: 11, fontWeight: 700, color: C.inkDim, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.04em' }}>{txt}</div>
  const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.md, padding: '14px 16px', marginBottom: 12, boxShadow: SHADOW.sm }
  const hint = { fontSize: 11, color: C.inkFaint, marginTop: 6, lineHeight: 1.5 }

  // ── Mode context bar (shown atop per-mode categories) ──
  const modeBar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: C.inkDim, fontWeight: 700 }}>{t('configuring')}</span>
      <select value={activeModeId} onChange={(e) => { const id = parseInt(e.target.value); setActiveModeId(id); saveModes(modes, id) }}
        style={{ ...S.select, color: C.brand, borderColor: C.brandRing, background: C.brandTint }}>
        {modes.map((m) => <option key={m.id} value={m.id}>{m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {m.name}</option>)}
      </select>
      {editingModeName === activeModeId ? (
        <input autoFocus defaultValue={activeMode.name}
          onBlur={(e) => renameMode(activeModeId, e.target.value || activeMode.name)}
          onKeyDown={(e) => { if (e.key === 'Enter') renameMode(activeModeId, e.target.value || activeMode.name) }}
          style={{ ...S.keyInput, width: 140, fontSize: 12, padding: '4px 8px' }} />
      ) : (
        <span onClick={() => setEditingModeName(activeModeId)} style={{ cursor: 'pointer', color: C.inkFaint, fontSize: 11 }} title="Rename">{t('rename')}</span>
      )}
    </div>
  )

  // ── "Ask AI" box with a review step (propose → before/after → accept/deny/modify) ──
  const askAi = (scope, placeholder) => {
    const proposal = modeEditProposal && modeEditProposal.scope === scope ? modeEditProposal : null
    const toStr = (v) => (v && typeof v === 'object') ? Object.entries(v).filter(([, e]) => e).map(([k]) => k).join(', ') : String(v ?? '')
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={modeEditInput} onChange={(e) => setModeEditInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && modeEditInput.trim() && !modeEditBusy) { proposeModeEdit(modeEditInput.trim(), scope); } }}
            placeholder={placeholder} style={{ ...S.keyInput, flex: 1, fontSize: 12 }} disabled={modeEditBusy} />
          <button onClick={() => { if (modeEditInput.trim()) proposeModeEdit(modeEditInput.trim(), scope) }}
            disabled={modeEditBusy || !modeEditInput.trim()} style={{ ...S.getKeyLink, opacity: modeEditBusy ? 0.5 : 1 }}>
            {modeEditBusy ? '…' : t('askAi')}
          </button>
        </div>
        {proposal && (
          <div style={{ marginTop: 10, border: `1px solid ${C.brandRing}`, borderRadius: RADIUS.md, padding: '12px 14px', background: C.brandTint2 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.brand, marginBottom: 8, letterSpacing: '.03em' }}>{t('ebiSuggests')}</div>
            {proposal.changes.map((ch) => (
              <div key={ch.key} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: C.inkDim, marginBottom: 3, textTransform: 'uppercase' }}>{ch.label}</div>
                <div style={{ fontSize: 12, lineHeight: 1.55, background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.sm, padding: '8px 10px', maxHeight: 160, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                  {diffWords(toStr(ch.before), toStr(ch.after)).map((tk, i) => (
                    <span key={i} style={{
                      background: tk.type === 'add' ? C.successTint : tk.type === 'del' ? C.dangerTint : 'transparent',
                      color: tk.type === 'add' ? C.success : tk.type === 'del' ? C.danger : C.ink,
                      textDecoration: tk.type === 'del' ? 'line-through' : 'none',
                    }}>{tk.text}</span>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => { acceptModeEdit(); setModeEditInput('') }} style={{ ...S.keyDone, fontSize: 12, padding: '7px 16px' }}>✓ {t('accept')}</button>
              <button onClick={denyModeEdit} style={{ ...S.ghostBtn, fontSize: 12, padding: '7px 14px', color: C.danger, borderColor: 'rgba(229,57,46,.3)' }}>✗ {t('deny')}</button>
              <span style={{ fontSize: 11, color: C.inkFaint, marginLeft: 4 }}>{t('orModify')}</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Panes ──
  const General = (
    <div>
      {sectionTitle(t('setGeneral'))}
      <div style={card}>
        {fieldLabel(t('appearance'))}
        <div style={{ display: 'flex', gap: 4, background: C.surfaceAlt, borderRadius: RADIUS.pill, padding: 3, width: 'fit-content' }}>
          {[['light', '☀️ ' + t('themeLight')], ['dark', '🌙 ' + t('themeDark')]].map(([val, label]) => (
            <button key={val} onClick={() => setAppTheme(val)} className={appTheme === val ? 'ui-tab-current' : undefined} style={{
              border: 'none', cursor: appTheme === val ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: RADIUS.pill,
              // NOTE: no `boxShadow: 'none'` on the unselected side — an inline shadow (even
              // 'none') beats the global hover-darken rule, which is inset-shadow based.
              background: appTheme === val ? C.surface : 'transparent', color: appTheme === val ? C.brand : C.inkDim, ...(appTheme === val ? { boxShadow: SHADOW.sm } : {}),
            }}>{label}</button>
          ))}
        </div>
      </div>
      <div style={card}>
        {fieldLabel(t('appLanguage'))}
        <select value={appLanguage} onChange={(e) => setAppLanguage(e.target.value)} style={{ ...S.select, width: '100%' }}>
          {APP_LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
        </select>
        <div style={hint}>{t('appLanguageHint')}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('translation'))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: C.inkDim }}>{t('source')}</span>
          <select value={language} onChange={(e) => setLanguage(e.target.value)} style={{ ...S.select, flex: 1, minWidth: 130 }}>
            {LANGS.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <span style={{ color: C.brand, fontWeight: 700 }}>→</span>
          <span style={{ fontSize: 12, color: C.inkDim }}>{t('target')}</span>
          <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} style={{ ...S.select, flex: 1, minWidth: 130 }}>
            {LANGS.filter((l) => l.code !== 'auto').map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
        </div>
        <div style={hint}>{t('translationHint')}</div>
      </div>
      <div style={card}>
        {fieldLabel('Anki auto-sync')}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!studyAutoSync} onChange={(e) => setStudyAutoSync(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: C.brand, cursor: 'pointer' }} />
          <span style={{ fontSize: 12, color: C.ink, fontWeight: 600 }}>Auto-sync ratings to Anki after grading</span>
        </label>
        {studyAutoSync && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontSize: 12, color: C.inkDim }}>Grace window before a rating locks:</span>
            <input type="number" min={1} max={120} step={1} value={studyAutoSyncMinutes}
              onChange={(e) => { const v = Math.round(Number(e.target.value)); if (Number.isFinite(v)) setStudyAutoSyncMinutes(Math.min(120, Math.max(1, v))) }}
              style={{ ...S.keyInput, width: 70, fontSize: 12, padding: '6px 8px', textAlign: 'center' }} />
            <span style={{ fontSize: 12, color: C.inkDim }}>minutes</span>
          </div>
        )}
        <div style={hint}>
          {studyAutoSync
            ? `During study, each graded card commits to Anki ${studyAutoSyncMinutes} minute${studyAutoSyncMinutes === 1 ? '' : 's'} after the AI grades it, then locks. You can still correct a rating before it locks, or use “Sync now”.`
            : 'Off: ratings only reach Anki when you press “Sync now” during study, or when you finish / exit the session. Nothing auto-locks.'}
        </div>
      </div>
      {onRunSetup && (
        <button onClick={onRunSetup} style={{ ...S.ghostBtn, fontSize: 12 }}>↻ {t('runSetupAgain')}</button>
      )}
    </div>
  )

  const provModels = availableModels[provider] || []
  const AIModels = (
    <div>
      {sectionTitle(t('setAIModels'))}
      <div style={card}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {Object.entries(PROVIDERS).map(([key, pr]) => (
            <button key={key} onClick={() => setProvider(key)} className={provider === key ? 'ui-tab-current' : undefined} style={{
              ...S.ghostBtn, fontSize: 12, padding: '5px 12px',
              color: provider === key ? pr.color : C.inkDim,
              borderColor: provider === key ? `${pr.color}66` : C.border,
              background: provider === key ? `${pr.color}14` : C.surface,
              cursor: provider === key ? 'default' : 'pointer',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: apiKeys[key] ? C.success : C.inkFaint, display: 'inline-block', marginRight: 6 }} />
              {pr.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="password" value={apiKey} onChange={(e) => setCurrentKey(e.target.value)} placeholder={providerConfig.placeholder} style={{ ...S.keyInput, flex: 1 }} />
          <a href={providerConfig.url} target="_blank" rel="noopener noreferrer" style={S.getKeyLink}>{t('getKey')}</a>
        </div>
        <div style={hint}>{t('keysStored')}</div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8, flexWrap: 'wrap' }}>
          {fieldLabel(`${t('aiModelsFor')} ${providerConfig.label}`)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => refreshModels(provider)} disabled={modelsLoading || !apiKey} title={t('checkNewModelsHint')}
              style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 9px', color: C.brand, borderColor: C.brandRing, opacity: (modelsLoading || !apiKey) ? 0.5 : 1 }}>
              {modelsLoading ? t('checkingModels') : `↻ ${t('checkNewModels')}`}
            </button>
            {aiModels[provider] && Object.keys(aiModels[provider]).length > 0 && (
              <button onClick={() => setAiModels((prev) => { const n = { ...prev }; delete n[provider]; return n })} style={{ ...S.ghostBtn, fontSize: 10, padding: '3px 8px' }}>{t('resetToDefaults')}</button>
            )}
          </div>
        </div>
        {modelsError && <div style={{ fontSize: 10, color: C.danger, marginBottom: 6 }}>{modelsError}</div>}

        {/* Intelligence preset — one switch that sets every feature's default model tier. */}
        <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--c-surface-sunken)', border: '1px solid var(--c-border)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.ink, marginBottom: 2 }}>Intelligence preset</div>
          <div style={{ fontSize: 10, color: C.inkDim, marginBottom: 8 }}>Sets the default model for every feature at once. Per-feature overrides below still win.</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'normal', title: 'Normal', desc: `Balanced & fast (${providerConfig.presets?.normal || providerConfig.questionModel})` },
              { key: 'max', title: 'More intelligent', desc: `Most capable, slower & more tokens (${providerConfig.presets?.max || providerConfig.questionModel})` },
            ].map((opt) => {
              const active = (intelligence || 'normal') === opt.key
              return (
                <button key={opt.key} onClick={() => setIntelligence(opt.key)} className={active ? 'ui-tab-current' : undefined}
                  style={{ flex: 1, textAlign: 'left', cursor: active ? 'default' : 'pointer', fontFamily: 'inherit', padding: '8px 10px', borderRadius: 7,
                    border: `1px solid ${active ? C.brandRing : 'var(--c-border)'}`,
                    background: active ? 'rgba(223,37,64,.10)' : 'transparent' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: active ? C.brand : C.ink }}>{active ? '● ' : '○ '}{opt.title}</div>
                  <div style={{ fontSize: 9.5, color: C.inkDim, marginTop: 2 }}>{opt.desc}</div>
                </button>
              )
            })}
          </div>
        </div>

        {AI_ROLE_META.map(({ role }) => {
          const def = ROLE_DEFAULTS(providerConfig, intelligence)[role]
          const current = aiModels[provider]?.[role] || ''
          const opts = Array.from(new Set([...(provModels.length ? provModels : []), def, current].filter(Boolean)))
          const isCustom = customRoles[role]
          const setRole = (v) => setAiModels((prev) => ({ ...prev, [provider]: { ...(prev[provider] || {}), [role]: v } }))
          return (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, color: C.inkDim, width: 70, flexShrink: 0, fontWeight: 600 }}>{t('aiRole_' + role)}</span>
              {isCustom ? (
                <input value={current} onChange={(e) => setRole(e.target.value)} spellCheck={false}
                  placeholder="exact model id (e.g. claude-…)" style={{ ...S.keyInput, flex: 1, fontSize: 11, padding: '6px 9px' }} />
              ) : (
                <select value={current} onChange={(e) => { if (e.target.value === '__custom__') { setCustomRoles((c) => ({ ...c, [role]: true })) } else setRole(e.target.value) }}
                  style={{ ...S.select, flex: 1, fontSize: 11, padding: '6px 9px' }}>
                  <option value="">{t('providerDefault')} ({def})</option>
                  {opts.map((m) => <option key={m} value={m}>{m}</option>)}
                  <option value="__custom__">✏️ {t('customModel')}</option>
                </select>
              )}
              {isCustom && (
                <button onClick={() => { setCustomRoles((c) => ({ ...c, [role]: false })); setRole('') }} style={{ ...S.ghostBtn, fontSize: 9, padding: '3px 7px' }} title={t('useList')}>↩</button>
              )}
            </div>
          )
        })}
        <div style={hint}>
          {provModels.length ? t('aiModelsHintDropdown') : t('aiModelsHint')}<br />
          {t('customModelHelp')} <a href={providerConfig.modelsUrl || providerConfig.url} target="_blank" rel="noopener noreferrer" style={{ color: C.brand }}>{providerConfig.label} ↗</a>
        </div>
      </div>
    </div>
  )

  const Study = (
    <div>
      {sectionTitle(t('setStudy'))}{modeBar}
      <div style={card}>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
          <div>
            {fieldLabel(t('questionsPerCard'))}
            <input type="number" min="1" max="10" value={activeMode.studyRules?.questionsPerCard || 3}
              onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), questionsPerCard: parseInt(e.target.value) || 3 } })}
              style={{ ...S.keyInput, width: 70 }} />
          </div>
          <div>
            {fieldLabel(t('cardsAtOnce'))}
            <input type="number" min="1" max="10" value={activeMode.studyRules?.cardsAtOnce || 3}
              onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), cardsAtOnce: parseInt(e.target.value) || 3 } })}
              style={{ ...S.keyInput, width: 70 }} />
          </div>
          {isLanguage && (
            <div>
              {fieldLabel('Learning')}
              <select value={activeMode.studyRules?.studyLanguage || 'English'}
                onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), studyLanguage: e.target.value } })}
                style={{ ...S.select, minWidth: 120 }}>
                {LANGS.filter((l) => l.code !== 'auto').map((l) => <option key={l.code} value={l.label}>{l.label}</option>)}
              </select>
            </div>
          )}
          <div>
            {fieldLabel(t('quizIn'))}
            <select value={activeMode.studyRules?.quizLanguage || activeMode.studyRules?.studyLanguage || 'English'}
              onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || (isLanguage ? defaultStudyRules : defaultGeneralStudyRules)), quizLanguage: e.target.value } })}
              style={{ ...S.select, minWidth: 120 }}>
              {LANGS.filter((l) => l.code !== 'auto').map((l) => <option key={l.code} value={l.label}>{l.label}</option>)}
            </select>
          </div>
          {isLanguage && (
            <div>
              {fieldLabel(t('grammarFeedback'))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.inkDim, cursor: 'pointer', paddingTop: 6 }}>
                <input type="checkbox" checked={activeMode.studyRules?.grammarFeedback || false}
                  onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), grammarFeedback: e.target.checked } })} />
                {activeMode.studyRules?.grammarFeedback ? t('on') : t('off')}
              </label>
            </div>
          )}
          {isLanguage && (
            <div>
              {fieldLabel('Word hints')}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.inkDim, cursor: 'pointer', paddingTop: 6 }}>
                <input type="checkbox" checked={activeMode.studyRules?.wordHints || false}
                  onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), wordHints: e.target.checked } })} />
                {activeMode.studyRules?.wordHints ? t('on') : t('off')}
              </label>
            </div>
          )}
        </div>
        <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 8, display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 8, rowGap: 3, lineHeight: 1.4 }}>
          {isLanguage ? (<>
            <span style={{ color: C.inkDim, fontWeight: 700 }}>{t('studyLearning')}</span><span>{t('studyLearningDesc')}</span>
            <span style={{ color: C.inkDim, fontWeight: 700 }}>{t('quizIn')}</span><span>{t('studyEbiSpeaksDesc')}</span>
            <span style={{ color: C.inkDim, fontWeight: 700 }}>{t('studyWordHints')}</span><span>{t('studyWordHintsDesc')}</span>
          </>) : (
            <span style={{ gridColumn: '1 / -1' }}>{t('studyEbiOnlyDesc')}</span>
          )}
        </div>
      </div>
      <div style={card}>
        {fieldLabel(t('questionPrompt'))}
        <textarea value={activeMode.studyRules?.questionPrompt || (isLanguage ? defaultStudyRules : defaultGeneralStudyRules).questionPrompt}
          onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), questionPrompt: e.target.value } })}
          style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', minHeight: 110, resize: 'vertical' }} />
        <div style={{ marginTop: 10 }}>{fieldLabel(t('ratingRules'))}
          <input value={activeMode.studyRules?.ratingRules || defaultStudyRules.ratingRules}
            onChange={(e) => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), ratingRules: e.target.value } })}
            style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box' }} />
        </div>
        {/* Question-style preferences — taught from the study feedback chat ("teach Ebi how to
            ask") or added here; each is injected into question generation for THIS mode. */}
        <div style={{ marginTop: 10 }}>
          {fieldLabel(t('qPrefsTitle'))}
          <div style={{ fontSize: 11, color: C.inkFaint, margin: '2px 0 6px', lineHeight: 1.5 }}>{t('qPrefsDesc')}</div>
          {(activeMode.studyRules?.questionPreferences || []).map((pref, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ flex: 1, fontSize: 12, color: C.inkDim, background: 'rgba(139,92,246,.07)', border: '1px solid rgba(139,92,246,.22)', borderRadius: 6, padding: '5px 9px', lineHeight: 1.5 }}>{pref}</span>
              <button onClick={() => updateActiveMode({ studyRules: { ...(activeMode.studyRules || defaultStudyRules), questionPreferences: (activeMode.studyRules?.questionPreferences || []).filter((_, k) => k !== i) } })}
                title={t('qPrefsRemove')}
                style={{ ...S.ghostBtn, fontSize: 10, padding: '4px 9px', color: C.danger, flexShrink: 0 }}>✕</button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input value={qPrefInput} onChange={(e) => setQPrefInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && qPrefInput.trim()) { const v = qPrefInput.trim(); const sr = activeMode.studyRules || defaultStudyRules; const prev = Array.isArray(sr.questionPreferences) ? sr.questionPreferences : []; if (!prev.includes(v)) updateActiveMode({ studyRules: { ...sr, questionPreferences: [...prev, v].slice(-12) } }); setQPrefInput('') } }}
              placeholder={t('qPrefsPlaceholder')} style={{ ...S.keyInput, flex: 1, fontSize: 12 }} />
            <button onClick={() => { const v = qPrefInput.trim(); if (!v) return; const sr = activeMode.studyRules || defaultStudyRules; const prev = Array.isArray(sr.questionPreferences) ? sr.questionPreferences : []; if (!prev.includes(v)) updateActiveMode({ studyRules: { ...sr, questionPreferences: [...prev, v].slice(-12) } }); setQPrefInput('') }}
              disabled={!qPrefInput.trim()}
              style={{ ...S.ghostBtn, fontSize: 11, padding: '5px 12px', opacity: qPrefInput.trim() ? 1 : 0.5 }}>{t('qPrefsAdd')}</button>
          </div>
        </div>
        {askAi('study', t('askAiStudyPlaceholder'))}
      </div>
    </div>
  )

  const Cards = (
    <div>
      {sectionTitle(t('setCards'))}{modeBar}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: ankiConnected ? C.success : ankiConnected === false ? C.warning : C.inkFaint }} />
          <span style={{ fontSize: 12, color: C.inkDim }}>{ankiConnected ? t('connected') : ankiConnected === false ? t('notConnected') : t('checkingAnki')}</span>
          {ankiConnected && ankiDecks.length > 0 && (<>
            <span style={{ fontSize: 12, color: C.inkDim, marginLeft: 4 }}>{t('deck')}:</span>
            <select value={ankiDeck} onChange={(e) => setAnkiDeck(e.target.value)} style={{ ...S.select, minWidth: 140 }}>
              {ankiDecks.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </>)}
          <button onClick={refreshAnkiConnection} style={{ ...S.getKeyLink, fontSize: 11, marginLeft: 'auto' }}>{ankiConnected === null ? t('checkingAnki') : t('refresh')}</button>
        </div>
        <div style={hint}>{t('ankiAddonNote')}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('cardFormat'))}
        {askAi('cards', t('aiEditPlaceholder'))}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '12px 0 10px' }}>
          {Object.entries(ankiFormat.fields || {}).map(([field, enabled]) => (
            <label key={field} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: enabled ? C.ink : C.inkDim, cursor: 'pointer' }}>
              <input type="checkbox" checked={enabled} onChange={() => updateActiveMode({ fields: { ...ankiFormat.fields, [field]: !enabled } })} /> {field}
            </label>
          ))}
        </div>
        {fieldLabel(t('frontTemplate'))}
        <input value={ankiFormat.frontTemplate} onChange={(e) => updateActiveMode({ frontTemplate: e.target.value })} style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', fontSize: 12, marginBottom: 8 }} />
        {fieldLabel(t('backTemplate'))}
        <textarea value={ankiFormat.backTemplate} onChange={(e) => updateActiveMode({ backTemplate: e.target.value })} style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', fontSize: 12, minHeight: 70, resize: 'vertical' }} />
        <div style={hint}>Placeholders: {'{word} {term} {partOfSpeech} {pronunciation} {translation} {synonyms} {definition} {example}'}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('tagRules'))}
        <textarea value={activeMode.tagRules || ''} onChange={(e) => updateActiveMode({ tagRules: e.target.value })}
          placeholder={t('tagRulesPlaceholder')} style={{ ...S.keyInput, width: '100%', boxSizing: 'border-box', fontSize: 12, minHeight: 80, resize: 'vertical' }} />
      </div>
    </div>
  )

  const Knowledge = (
    <div>
      {sectionTitle(t('setKnowledge'))}{modeBar}
      <div style={card}>
        <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 10 }}>{t('knowledgeIntro')}</div>
        {/* Big-KB status: warn when it's giant with no navigable TOC (Ebi can only see the first
            slice); reassure when a TOC was found (Ebi navigates it section by section). */}
        {knowledgeStatus?.big && !knowledgeStatus?.hasToc && (
          <div style={{ padding: '8px 12px', marginBottom: 10, borderRadius: RADIUS.sm, background: 'rgba(232,147,12,.12)', border: '1px solid rgba(232,147,12,.35)', color: C.ink, fontSize: 11, lineHeight: 1.5 }}>
            ⚠️ {t('knowledgeBigNoToc').replace('{kb}', Math.round(knowledgeStatus.chars / 1024).toLocaleString())}
          </div>
        )}
        {knowledgeStatus?.big && knowledgeStatus?.hasToc && (
          <div style={{ padding: '8px 12px', marginBottom: 10, borderRadius: RADIUS.sm, background: C.successTint, border: '1px solid rgba(24,169,87,.25)', color: C.inkDim, fontSize: 11, lineHeight: 1.5 }}>
            📖 {t('knowledgeBigToc').replace('{kb}', Math.round(knowledgeStatus.chars / 1024).toLocaleString()).replace('{n}', String(knowledgeStatus.outlineCount))}
          </div>
        )}
        <div onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setKnowledgeDragging(true) }} onDragLeave={() => setKnowledgeDragging(false)} onDrop={handleKnowledgeDrop}
          onClick={() => document.getElementById('knowledge-file-input').click()}
          style={{ padding: 18, borderRadius: RADIUS.md, textAlign: 'center', cursor: 'pointer', border: `2px dashed ${knowledgeDragging ? C.brand : C.border}`, background: knowledgeDragging ? C.brandTint2 : C.surfaceSunken, color: C.inkDim, fontSize: 12 }}>
          {knowledgeBusy ? `⏳ ${knowledgeBusy}` : knowledgeDragging ? t('dropHere') : t('dropZone')}
          <input id="knowledge-file-input" type="file" accept=".txt,.md,.pdf" multiple onChange={handleKnowledgeFileInput} style={{ display: 'none' }} />
        </div>
        {knowledgeFiles.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
            {knowledgeFiles.map((f) => (
              <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: f.disabled ? C.surfaceSunken : C.successTint, border: `1px solid ${f.disabled ? C.border : 'rgba(24,169,87,.2)'}`, borderRadius: RADIUS.sm, fontSize: 12 }}>
                <span style={{ flex: 1, color: f.disabled ? C.inkFaint : C.ink, textDecoration: f.disabled ? 'line-through' : 'none' }}>{f.name}</span>
                <span style={{ color: C.inkFaint, fontSize: 10 }}>{(f.size / 1024).toFixed(1)}KB</span>
                <button onClick={() => toggleKnowledgeFile(f.name)} style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 7px' }}>{f.disabled ? t('enable') : t('disable')}</button>
                <button onClick={() => { if (confirm(`Delete "${f.name}"?`)) deleteKnowledgeFile(f.name) }} style={{ ...S.ghostBtn, fontSize: 10, padding: '2px 7px', color: C.danger, borderColor: 'rgba(229,57,46,.25)' }}>{t('delete')}</button>
              </div>
            ))}
          </div>
        ) : <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 8 }}>{t('noFiles')}</div>}
      </div>
    </div>
  )

  // ── Audio (pronunciation) — GLOBAL ──
  const pron = pronunciationCfg || { defaultRegions: {}, editions: {}, ttsUrl: '', ttsVoices: {}, embedInAnki: true }
  const setPron = (patch) => setPronunciationCfg((prev) => ({ ...prev, ...patch }))
  const audioLangs = LANGS.filter((l) => l.code !== 'auto').map((l) => ({ label: l.label, iso1: langInfo(l.label)?.iso1 })).filter((l) => l.iso1)
  const Audio = (
    <div>
      {sectionTitle(t('setAudio'))}
      <div style={card}>
        <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 4 }}>{t('audioIntro')}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('audioRegions'))}
        <div style={{ fontSize: 11, color: C.inkFaint, marginBottom: 10, lineHeight: 1.5 }}>{t('audioRegionsDesc')}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 18px' }}>
          {audioLangs.map((l) => (
            <div key={l.iso1 + l.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ flex: 1, fontSize: 12, color: C.ink }}>{l.label}</span>
              <input value={pron.defaultRegions?.[l.iso1] || ''} placeholder={t('audioRegionAny')} maxLength={2}
                onChange={(e) => setPron({ defaultRegions: { ...pron.defaultRegions, [l.iso1]: e.target.value.toLowerCase().replace(/[^a-z]/g, '') } })}
                style={{ ...S.keyInput, width: 52, fontSize: 12, padding: '4px 8px', textAlign: 'center' }} />
            </div>
          ))}
        </div>
        <div style={hint}>{t('audioRegionsHint')}</div>
      </div>
      <div style={card}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: C.ink, fontWeight: 700 }}>
          <input type="checkbox" checked={pron.embedInAnki !== false} onChange={(e) => setPron({ embedInAnki: e.target.checked })} />
          {t('audioEmbed')}
        </label>
        <div style={hint}>{t('audioEmbedDesc')}</div>
      </div>
      <div style={card}>
        {fieldLabel(t('audioTtsUrl'))}
        <input value={pron.ttsUrl || ''} onChange={(e) => setPron({ ttsUrl: e.target.value })}
          placeholder="http://localhost:8880" style={{ ...S.keyInput, width: '100%', fontSize: 12 }} />
        <div style={hint}>{t('audioTtsUrlDesc')}</div>
      </div>
    </div>
  )

  const Overlay = (
    <div>
      {sectionTitle(t('setOverlay'))}{modeBar}
      <div style={card}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.ink, cursor: 'pointer' }}>
          <input type="checkbox" checked={activeMode.areaSelectTransparent !== false}
            onChange={() => updateActiveMode({ areaSelectTransparent: !(activeMode.areaSelectTransparent !== false) })} />
          {t('overlayTransparent')}
        </label>
        <div style={hint}>{t('overlayTransparentHint')}</div>
      </div>
    </div>
  )

  const Modes = (
    <div>
      {sectionTitle(t('setModes'))}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {modes.map((m) => (
            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button onClick={() => { if (m.id === activeModeId) setEditingModeName(m.id); else { setActiveModeId(m.id); saveModes(modes, m.id) } }}
                title={`${m.description || m.name}`}
                style={{ padding: '5px 12px', borderRadius: RADIUS.pill, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                  background: m.id === activeModeId ? C.brandTint : C.surfaceAlt, color: m.id === activeModeId ? C.brand : C.inkDim,
                  border: m.id === activeModeId ? `1px solid ${C.brandRing}` : `1px solid ${C.border}`, fontWeight: m.id === activeModeId ? 700 : 500 }}>
                {m.type === 'language' ? '\u{1F310}' : '\u{1F4DA}'} {m.name}
              </button>
              {modes.length > 1 && (
                <span onClick={() => { if (confirm(`Delete mode "${m.name}"?`)) deleteMode(m.id) }} style={{ cursor: 'pointer', color: C.inkFaint, fontSize: 14, padding: '0 2px' }}>&times;</span>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={modeEditInput} onChange={(e) => setModeEditInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && modeEditInput.trim()) { createMode(modeEditInput.trim()); setModeEditInput('') } }}
            placeholder={t('createModePlaceholder')} style={{ ...S.keyInput, flex: 1 }} disabled={modeCreating} />
          <button onClick={() => { if (modeEditInput.trim()) { createMode(modeEditInput.trim()); setModeEditInput('') } }}
            disabled={modeCreating || !modeEditInput.trim()} style={{ ...S.keyDone, opacity: modeCreating || !modeEditInput.trim() ? 0.5 : 1 }}>{modeCreating ? t('creating') : t('create')}</button>
        </div>
        <button onClick={addDefaultMode} style={{ ...S.ghostBtn, fontSize: 11, color: C.success, borderColor: 'rgba(24,169,87,.3)', marginTop: 10 }}>+ {t('defaultMode')}</button>
      </div>
    </div>
  )

  const panes = { general: General, models: AIModels, audio: Audio, study: Study, cards: Cards, knowledge: Knowledge, overlay: Overlay, modes: Modes }

  return (
    // The body has CSS zoom:1.35, which also scales this fixed backdrop — so 100vw/100vh
    // render at 135% and its flex-centering lands off-screen (modal pushed right + clipped).
    // Cancel the zoom on the backdrop so it overlays exactly one visual viewport, and divide
    // the modal's viewport caps by 1.35 so it fits on small laptop screens. (Same /1.35
    // convention as the app root in App.jsx.)
    <div style={{ ...S.backdrop, width: 'calc(100vw / 1.35)', height: 'calc(100vh / 1.35)' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="settings-modal" style={{
        display: 'flex', width: 'min(900px, calc(94vw / 1.35))', height: 'min(640px, calc(86vh / 1.35))',
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: RADIUS.lg,
        boxShadow: SHADOW.xl, overflow: 'hidden', animation: 'pop .18s cubic-bezier(.34,1.56,.64,1)', cursor: 'default',
      }}>
        {/* Sidebar */}
        <div style={{ width: 200, flexShrink: 0, background: C.surfaceSunken, borderRight: `1px solid ${C.border}`, padding: '14px 10px', overflowY: 'auto' }}>
          <div style={{ fontSize: 15, fontWeight: 800, fontFamily: FONT.display, color: C.ink, padding: '2px 8px 12px' }}>⚙ {t('settingsTitle')}</div>
          {NAV.map((grp) => (
            <div key={grp.group} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: C.inkFaint, padding: '4px 8px' }}>{grp.group}</div>
              {grp.items.map((it) => (
                <button key={it.id} onClick={() => setCategory(it.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '8px 10px', borderRadius: RADIUS.sm, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 13, fontWeight: category === it.id ? 700 : 600, marginBottom: 2,
                  background: category === it.id ? C.brandTint : 'transparent',
                  color: category === it.id ? C.brand : C.inkDim,
                }}>
                  <span style={{ width: 16, textAlign: 'center' }}>{it.icon}</span>{it.label}
                </button>
              ))}
            </div>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 14px 0' }}>
            <button onClick={onClose} style={{ ...S.ghostBtn, fontSize: 12, padding: '4px 12px' }}>{t('close')}</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 24px' }}>
            {panes[category] || General}
          </div>
        </div>
      </div>
    </div>
  )
}
