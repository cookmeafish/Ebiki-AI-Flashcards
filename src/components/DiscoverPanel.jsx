// Discover Mode panel — adaptive new-card discovery. Shows the learner's estimated level,
// a setup screen (word/phrase choice for languages, a focus/chat box for any subject), then
// proposes one new item at a time. Make a card, mark it known, skip, or move on. All logic
// lives in App.jsx; this is presentational.

const C = {
  blue: 'var(--c-brand)', info: 'var(--c-info)', purple: 'var(--c-purple)', green: 'var(--c-success)', orange: 'var(--c-warning)',
  red: 'var(--c-danger)', dim: 'var(--c-ink-dim)', text: 'var(--c-ink)',
}

function StatusLine({ status }) {
  const labels = { thinking: 'Thinking of a good suggestion…', searching: 'Searching the web to verify…', verifying: 'Checking the facts…' }
  return <div style={{ fontSize: 12, color: C.dim, padding: '20px 0' }}>{labels[status] || 'Working…'}</div>
}

function LevelBadge({ profile, t }) {
  if (!profile?.level) return null
  const { scale, estimate, confidence } = profile.level
  const label = scale === 'CEFR' ? estimate
    : scale === 'domain-coverage' ? `${estimate || 'in progress'}`
    : estimate
  return (
    <span style={{ fontSize: 11, color: C.blue, background: 'rgba(223,37,64,0.12)', border: '1px solid rgba(223,37,64,0.25)', borderRadius: 5, padding: '3px 8px', fontWeight: 600 }}>
      {t('d_level')} {label}{typeof confidence === 'number' ? ` · ${Math.round(confidence * 100)}% sure` : ''}
    </span>
  )
}

export default function DiscoverPanel(props) {
  const {
    t = (k) => k,
    profile, profileLoading, suggestion, suggestionLoading, status, sources, error,
    webVerify, setWebVerify, card, cardLoading, cardSaving, ledger, deck, apiKey,
    ankiConnected, onReanalyze, onMakeCard, onSaveCard, onCancelCard, onKnow, onSkip,
    onNext, setCard,
    started, config, setConfig, onStart, onAdjust, isLanguage, modeName, modeDescription,
    decks = [], onDeckChange, customKinds = null,
  } = props

  if (!apiKey) {
    return <div style={{ fontSize: 12, color: C.orange, padding: '16px 0' }}>{t('d_addApiKey')}</div>
  }

  const cardedCount = ledger?.carded?.length || 0
  const knownCount = ledger?.known?.length || 0

  const focusPlaceholder = isLanguage
    ? 'Optional: focus the AI, e.g. "cooking vocabulary", "past-tense verbs", "travel phrases"'
    : `Optional: tell the AI what to focus on for ${modeName}${modeDescription ? ` (${modeDescription})` : ''}, e.g. specific topics or the kind of cards you want`

  // What kinds of items Discover can propose — richer than the old Words/Phrases/Both.
  // General modes prefer their AI-generated subject-specific categories (customKinds, created
  // once per mode); the static set is the fallback until those exist.
  const typeOptions = isLanguage
    ? [['word', t('d_words')], ['phrase', t('d_phrases')], ['idiom', t('d_idioms')], ['verb', t('d_verbs')], ['grammar', t('d_grammar')], ['both', t('d_any')]]
    : (Array.isArray(customKinds) && customKinds.length > 0)
      ? [...customKinds.map((k) => [k.key, k.label]), ['both', t('d_any')]]
      : [['term', t('d_terms')], ['acronym', t('d_acronyms')], ['comparison', t('d_comparisons')], ['scenario', t('d_scenarios')], ['both', t('d_any')]]
  const diffOptions = [['easier', t('d_diffEasier')], ['level', t('d_diffLevel')], ['stretch', t('d_diffStretch')]]
  const itemType = config.itemType || 'both'
  const difficulty = config.difficulty || 'stretch'
  const typeLabel = (typeOptions.find(([k]) => k === itemType) || [])[1]
  const diffLabel = (diffOptions.find(([k]) => k === difficulty) || [])[1]

  const chipRow = (options, current, onPick) => (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', background: 'rgba(81,98,108,0.12)', borderRadius: 6, padding: 3, width: 'fit-content' }}>
      {options.map(([k, label]) => (
        <button key={k} onClick={() => onPick(k)} className={current === k ? 'ui-tab-current' : undefined}
          style={{ background: current === k ? 'rgba(223,37,64,0.18)' : 'transparent', color: current === k ? C.blue : C.dim, border: 'none', borderRadius: 4, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: current === k ? 'default' : 'pointer', fontFamily: 'inherit' }}>
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <div>
      {/* Profile header */}
      <div style={{ border: '1px solid rgba(223,37,64,0.18)', borderRadius: 6, padding: '10px 12px', background: 'rgba(223,37,64,0.04)', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: profile?.summary ? 8 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <LevelBadge profile={profile} t={t} />
            <span style={{ fontSize: 11, color: C.dim, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {t('deck')}:
              {onDeckChange && decks.length > 0 ? (
                <select value={deck || ''} onChange={(e) => onDeckChange(e.target.value)}
                  style={{ background: 'var(--c-surface)', color: C.text, border: '1px solid var(--c-border)', borderRadius: 5, padding: '3px 6px', fontSize: 11, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', maxWidth: 200 }}>
                  {!deck && <option value="">—</option>}
                  {deck && !decks.includes(deck) && <option value={deck}>{deck}</option>}
                  {decks.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : (
                <strong style={{ color: C.text }}>{deck || '—'}</strong>
              )}
            </span>
            <span style={{ fontSize: 11, color: C.dim }}>{cardedCount} {t('d_made')} · {knownCount} {t('d_known')}</span>
          </div>
          <button onClick={onReanalyze} disabled={profileLoading}
            style={{ background: 'rgba(81,98,108,0.15)', color: C.dim, border: '1px solid rgba(81,98,108,0.25)', borderRadius: 5, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: profileLoading ? 0.5 : 1 }}>
            {profileLoading ? t('d_analyzing') : t('d_reanalyze')}
          </button>
        </div>
        {profile?.summary && <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>{profile.summary}</div>}
        {profileLoading && !profile && <div style={{ fontSize: 12, color: C.dim }}>Analyzing your level from your cards and history…</div>}
      </div>

      {error && <div style={{ fontSize: 11, color: C.red, marginBottom: 10 }}>{error}</div>}

      {/* ── Setup screen (before starting) ─────────────────────────────────── */}
      {!started && (
        <div style={{ border: '1px solid var(--c-border)', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>{t('d_whatSuggest')}</div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 600 }}>{t('d_suggest')}</div>
            {chipRow(typeOptions, itemType, (k) => setConfig({ ...config, itemType: k }))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 600 }}>{t('d_difficulty')}</div>
            {chipRow(diffOptions, difficulty, (k) => setConfig({ ...config, difficulty: k }))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 600 }}>{t('d_focusOptional')}</div>
            <textarea value={config.focus} onChange={(e) => setConfig({ ...config, focus: e.target.value })}
              placeholder={focusPlaceholder}
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 60, resize: 'vertical', background: 'var(--c-surface)', color: C.text, border: '1px solid rgba(81,98,108,0.25)', borderRadius: 5, padding: 8, fontSize: 12, fontFamily: 'inherit' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.dim, marginBottom: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={webVerify} onChange={(e) => setWebVerify(e.target.checked)} />
            {t('d_verifyWeb')}
          </label>

          <button onClick={onStart} disabled={profileLoading}
            style={{ background: 'rgba(223,37,64,0.15)', color: C.blue, border: '1px solid rgba(223,37,64,0.3)', borderRadius: 5, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: profileLoading ? 0.5 : 1 }}>
            {profileLoading ? t('d_analyzingLevel') : t('d_startDiscovering')}
          </button>
        </div>
      )}

      {/* ── Suggestion loop (after starting) ───────────────────────────────── */}
      {started && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.dim, cursor: 'pointer' }}>
              <input type="checkbox" checked={webVerify} onChange={(e) => setWebVerify(e.target.checked)} />
              {t('d_verifyWebShort')}
            </label>
            {/* Current setup at a glance — type · difficulty · focus */}
            <span style={{ fontSize: 10, color: C.dim, border: '1px solid var(--c-border)', borderRadius: 999, padding: '2px 8px' }}>{typeLabel}</span>
            <span style={{ fontSize: 10, color: C.dim, border: '1px solid var(--c-border)', borderRadius: 999, padding: '2px 8px' }}>{diffLabel}</span>
            {config.focus?.trim() && (
              <span title={config.focus} style={{ fontSize: 10, color: C.purple, border: '1px solid rgba(139,92,246,.3)', borderRadius: 999, padding: '2px 8px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🎯 {config.focus}</span>
            )}
          </div>
          <button onClick={onAdjust}
            style={{ background: 'transparent', color: C.dim, border: '1px solid rgba(81,98,108,0.25)', borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            {t('d_adjust')}
          </button>
        </div>

        {(suggestionLoading || status) && !suggestion && <StatusLine status={status} />}

        {!suggestionLoading && !suggestion && (
          <div style={{ fontSize: 12, color: C.dim, padding: '12px 0' }}>
            No suggestion. <button onClick={onNext} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0, textDecoration: 'underline' }}>Get one</button>
          </div>
        )}

        {suggestion && (
          <div style={{ border: '1px solid rgba(24,169,87,0.2)', borderRadius: 6, padding: '14px 16px', background: 'rgba(24,169,87,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{suggestion.term}</span>
              {suggestion.partOfSpeech && <span style={{ fontSize: 12, color: C.dim }}>({suggestion.partOfSpeech})</span>}
              {suggestion.difficulty && <span style={{ fontSize: 10, color: C.purple, background: 'rgba(139,92,246,0.12)', borderRadius: 4, padding: '2px 6px' }}>{suggestion.difficulty}</span>}
              {webVerify && 'verified' in suggestion && (
                <span style={{ fontSize: 10, color: suggestion.verified ? C.green : C.orange }}>{suggestion.verified ? '✓ verified' : '⚠ unverified'}</span>
              )}
            </div>
            {suggestion.translation && <div style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>→ {suggestion.translation}</div>}
            {suggestion.draftMeaning && <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5, marginBottom: 8 }}>{suggestion.draftMeaning}</div>}
            {suggestion.why && <div style={{ fontSize: 11, color: C.dim, fontStyle: 'italic', marginBottom: 8 }}>{t('d_why')} {suggestion.why}</div>}

            {sources?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, color: C.blue, background: 'rgba(223,37,64,0.1)', borderRadius: 4, padding: '2px 6px', textDecoration: 'none', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title || s.url}
                  </a>
                ))}
              </div>
            )}

            {card ? (
              <div style={{ borderTop: '1px solid rgba(81,98,108,0.2)', paddingTop: 10, marginTop: 6 }}>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>FRONT</div>
                <textarea value={card.front} onChange={(e) => setCard({ ...card, front: e.target.value })}
                  style={{ width: '100%', background: 'var(--c-surface)', color: C.text, border: '1px solid rgba(81,98,108,0.25)', borderRadius: 4, padding: 8, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }} rows={1} />
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>BACK</div>
                <textarea value={card.back} onChange={(e) => setCard({ ...card, back: e.target.value })}
                  style={{ width: '100%', background: 'var(--c-surface)', color: C.text, border: '1px solid rgba(81,98,108,0.25)', borderRadius: 4, padding: 8, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }} rows={5} />
                {card.tags?.length > 0 && (
                  <div style={{ fontSize: 10, color: C.dim, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                    Tags:
                    {/* region-* first + highlighted, matching the App-side tag chips (green=global, amber=regional) */}
                    {[...card.tags].sort((a, b) => (String(b).startsWith('region-') ? 1 : 0) - (String(a).startsWith('region-') ? 1 : 0)).map((tag, i) => (
                      <span key={i} style={{ padding: '1px 6px', borderRadius: 3, background: 'rgba(81,98,108,0.12)', ...(String(tag).startsWith('region-')
                        ? { fontWeight: 700, ...(tag === 'region-global'
                            ? { background: 'rgba(24,169,87,.12)', color: C.green, border: '1px solid rgba(24,169,87,.35)' }
                            : { background: 'rgba(232,147,12,.12)', color: C.orange, border: '1px solid rgba(232,147,12,.35)' }) }
                        : {}) }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={onSaveCard} disabled={cardSaving || ankiConnected === false}
                    style={{ background: 'rgba(24,169,87,0.15)', color: C.green, border: '1px solid rgba(24,169,87,0.3)', borderRadius: 5, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (cardSaving || ankiConnected === false) ? 0.5 : 1 }}>
                    {cardSaving ? t('d_saving') : `${t('d_saveTo')} ${deck || 'Anki'}`}
                  </button>
                  <button onClick={onCancelCard} disabled={cardSaving}
                    style={{ background: 'transparent', color: C.dim, border: '1px solid rgba(81,98,108,0.25)', borderRadius: 5, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>{t('cancel')}</button>
                  {ankiConnected === false && <span style={{ fontSize: 10, color: C.orange }}>{t('d_openAnki')}</span>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid rgba(81,98,108,0.2)', paddingTop: 12, marginTop: 4 }}>
                <button onClick={onMakeCard} disabled={cardLoading}
                  style={{ background: 'rgba(45,134,201,0.15)', color: C.info, border: '1px solid rgba(45,134,201,0.35)', borderRadius: 5, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: cardLoading ? 0.5 : 1 }}>
                  {cardLoading ? t('d_building') : t('d_makeCard')}
                </button>
                <button onClick={onKnow} disabled={cardLoading}
                  style={{ background: 'rgba(24,169,87,0.1)', color: C.green, border: '1px solid rgba(24,169,87,0.25)', borderRadius: 5, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t('d_iKnowThis')}
                </button>
                <button onClick={onSkip} disabled={cardLoading}
                  style={{ background: 'transparent', color: C.dim, border: '1px solid rgba(81,98,108,0.25)', borderRadius: 5, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {t('d_skip')}
                </button>
                <button onClick={onNext} disabled={cardLoading} title="Skip without recording"
                  style={{ background: 'transparent', color: C.dim, border: 'none', borderRadius: 5, padding: '7px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                  {t('d_next')}
                </button>
              </div>
            )}
          </div>
        )}
      </>)}
    </div>
  )
}
