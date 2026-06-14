// Discover Mode panel — adaptive new-card discovery. Shows the learner's estimated level,
// a setup screen (word/phrase choice for languages, a focus/chat box for any subject), then
// proposes one new item at a time. Make a card, mark it known, skip, or move on. All logic
// lives in App.jsx; this is presentational.

const C = {
  blue: '#58a6ff', purple: '#d2a8ff', green: '#7ee787', orange: '#ffa657',
  red: '#f85149', dim: '#7d8590', text: '#e6edf3',
}

function StatusLine({ status }) {
  const labels = { thinking: 'Thinking of a good suggestion…', searching: 'Searching the web to verify…', verifying: 'Checking the facts…' }
  return <div style={{ fontSize: 12, color: C.dim, padding: '20px 0' }}>{labels[status] || 'Working…'}</div>
}

function LevelBadge({ profile }) {
  if (!profile?.level) return null
  const { scale, estimate, confidence } = profile.level
  const label = scale === 'CEFR' ? estimate
    : scale === 'domain-coverage' ? `${estimate || 'in progress'}`
    : estimate
  return (
    <span style={{ fontSize: 11, color: C.blue, background: 'rgba(88,166,255,0.12)', border: '1px solid rgba(88,166,255,0.25)', borderRadius: 5, padding: '3px 8px', fontWeight: 600 }}>
      Level: {label}{typeof confidence === 'number' ? ` · ${Math.round(confidence * 100)}% sure` : ''}
    </span>
  )
}

export default function DiscoverPanel(props) {
  const {
    profile, profileLoading, suggestion, suggestionLoading, status, sources, error,
    webVerify, setWebVerify, card, cardLoading, cardSaving, ledger, deck, apiKey,
    ankiConnected, onReanalyze, onMakeCard, onSaveCard, onCancelCard, onKnow, onSkip,
    onNotInterested, onNext, setCard,
    started, config, setConfig, onStart, onAdjust, isLanguage, modeName, modeDescription,
  } = props

  if (!apiKey) {
    return <div style={{ fontSize: 12, color: C.orange, padding: '16px 0' }}>Add an API key in settings to use Discover.</div>
  }

  const cardedCount = ledger?.carded?.length || 0
  const knownCount = ledger?.known?.length || 0

  const focusPlaceholder = isLanguage
    ? 'Optional: focus the AI, e.g. "cooking vocabulary", "past-tense verbs", "travel phrases"'
    : `Optional: tell the AI what to focus on for ${modeName}${modeDescription ? ` (${modeDescription})` : ''}, e.g. specific topics or the kind of cards you want`

  return (
    <div>
      {/* Profile header */}
      <div style={{ border: '1px solid rgba(88,166,255,0.18)', borderRadius: 6, padding: '10px 12px', background: 'rgba(88,166,255,0.04)', marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: profile?.summary ? 8 : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <LevelBadge profile={profile} />
            <span style={{ fontSize: 11, color: C.dim }}>Deck: <strong style={{ color: C.text }}>{deck || '—'}</strong></span>
            <span style={{ fontSize: 11, color: C.dim }}>{cardedCount} made · {knownCount} known</span>
          </div>
          <button onClick={onReanalyze} disabled={profileLoading}
            style={{ background: 'rgba(110,118,129,0.15)', color: C.dim, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 5, padding: '5px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit', opacity: profileLoading ? 0.5 : 1 }}>
            {profileLoading ? 'Analyzing…' : 'Re-analyze level'}
          </button>
        </div>
        {profile?.summary && <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.5 }}>{profile.summary}</div>}
        {profileLoading && !profile && <div style={{ fontSize: 12, color: C.dim }}>Analyzing your level from your cards and history…</div>}
      </div>

      {error && <div style={{ fontSize: 11, color: C.red, marginBottom: 10 }}>{error}</div>}

      {/* ── Setup screen (before starting) ─────────────────────────────────── */}
      {!started && (
        <div style={{ border: '1px solid #2a3040', borderRadius: 6, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>What should Discover suggest?</div>

          {isLanguage && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 600 }}>Suggest</div>
              <div style={{ display: 'flex', gap: 4, background: 'rgba(110,118,129,0.12)', borderRadius: 6, padding: 3, width: 'fit-content' }}>
                {[['word', 'Words'], ['phrase', 'Phrases'], ['both', 'Both']].map(([k, label]) => (
                  <button key={k} onClick={() => setConfig({ ...config, itemType: k })}
                    style={{ background: config.itemType === k ? 'rgba(88,166,255,0.18)' : 'transparent', color: config.itemType === k ? C.blue : C.dim, border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: C.dim, marginBottom: 6, fontWeight: 600 }}>Focus (optional)</div>
            <textarea value={config.focus} onChange={(e) => setConfig({ ...config, focus: e.target.value })}
              placeholder={focusPlaceholder}
              style={{ width: '100%', boxSizing: 'border-box', minHeight: 60, resize: 'vertical', background: 'rgba(0,0,0,0.2)', color: C.text, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 5, padding: 8, fontSize: 12, fontFamily: 'inherit' }} />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.dim, marginBottom: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={webVerify} onChange={(e) => setWebVerify(e.target.checked)} />
            Verify facts with web search (slower, avoids mistakes)
          </label>

          <button onClick={onStart} disabled={profileLoading}
            style={{ background: 'rgba(88,166,255,0.15)', color: C.blue, border: '1px solid rgba(88,166,255,0.3)', borderRadius: 5, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: profileLoading ? 0.5 : 1 }}>
            {profileLoading ? 'Analyzing level…' : 'Start discovering'}
          </button>
        </div>
      )}

      {/* ── Suggestion loop (after starting) ───────────────────────────────── */}
      {started && (<>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.dim, cursor: 'pointer' }}>
            <input type="checkbox" checked={webVerify} onChange={(e) => setWebVerify(e.target.checked)} />
            Verify facts with web search
          </label>
          <button onClick={onAdjust}
            style={{ background: 'transparent', color: C.dim, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 5, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
            ⚙ Adjust
          </button>
        </div>

        {(suggestionLoading || status) && !suggestion && <StatusLine status={status} />}

        {!suggestionLoading && !suggestion && (
          <div style={{ fontSize: 12, color: C.dim, padding: '12px 0' }}>
            No suggestion. <button onClick={onNext} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, padding: 0, textDecoration: 'underline' }}>Get one</button>
          </div>
        )}

        {suggestion && (
          <div style={{ border: '1px solid rgba(126,231,135,0.2)', borderRadius: 6, padding: '14px 16px', background: 'rgba(126,231,135,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{suggestion.term}</span>
              {suggestion.partOfSpeech && <span style={{ fontSize: 12, color: C.dim }}>({suggestion.partOfSpeech})</span>}
              {suggestion.difficulty && <span style={{ fontSize: 10, color: C.purple, background: 'rgba(210,168,255,0.12)', borderRadius: 4, padding: '2px 6px' }}>{suggestion.difficulty}</span>}
              {webVerify && 'verified' in suggestion && (
                <span style={{ fontSize: 10, color: suggestion.verified ? C.green : C.orange }}>{suggestion.verified ? '✓ verified' : '⚠ unverified'}</span>
              )}
            </div>
            {suggestion.translation && <div style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>→ {suggestion.translation}</div>}
            {suggestion.draftMeaning && <div style={{ fontSize: 12, color: C.dim, lineHeight: 1.5, marginBottom: 8 }}>{suggestion.draftMeaning}</div>}
            {suggestion.why && <div style={{ fontSize: 11, color: C.dim, fontStyle: 'italic', marginBottom: 8 }}>Why: {suggestion.why}</div>}

            {sources?.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {sources.map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer"
                    style={{ fontSize: 10, color: C.blue, background: 'rgba(88,166,255,0.1)', borderRadius: 4, padding: '2px 6px', textDecoration: 'none', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.title || s.url}
                  </a>
                ))}
              </div>
            )}

            {card ? (
              <div style={{ borderTop: '1px solid rgba(110,118,129,0.2)', paddingTop: 10, marginTop: 6 }}>
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>FRONT</div>
                <textarea value={card.front} onChange={(e) => setCard({ ...card, front: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', color: C.text, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 4, padding: 8, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }} rows={1} />
                <div style={{ fontSize: 10, color: C.dim, marginBottom: 4 }}>BACK</div>
                <textarea value={card.back} onChange={(e) => setCard({ ...card, back: e.target.value })}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', color: C.text, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 4, padding: 8, fontSize: 12, fontFamily: 'inherit', resize: 'vertical', marginBottom: 8, boxSizing: 'border-box' }} rows={5} />
                {card.tags?.length > 0 && <div style={{ fontSize: 10, color: C.dim, marginBottom: 10 }}>Tags: {card.tags.join(', ')}</div>}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={onSaveCard} disabled={cardSaving || ankiConnected === false}
                    style={{ background: 'rgba(126,231,135,0.15)', color: C.green, border: '1px solid rgba(126,231,135,0.3)', borderRadius: 5, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (cardSaving || ankiConnected === false) ? 0.5 : 1 }}>
                    {cardSaving ? 'Saving…' : `Save to ${deck || 'Anki'}`}
                  </button>
                  <button onClick={onCancelCard} disabled={cardSaving}
                    style={{ background: 'transparent', color: C.dim, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 5, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  {ankiConnected === false && <span style={{ fontSize: 10, color: C.orange }}>Open Anki to save</span>}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid rgba(110,118,129,0.2)', paddingTop: 12, marginTop: 4 }}>
                <button onClick={onMakeCard} disabled={cardLoading}
                  style={{ background: 'rgba(88,166,255,0.15)', color: C.blue, border: '1px solid rgba(88,166,255,0.3)', borderRadius: 5, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: cardLoading ? 0.5 : 1 }}>
                  {cardLoading ? 'Building…' : 'Make Card'}
                </button>
                <button onClick={onKnow} disabled={cardLoading}
                  style={{ background: 'rgba(126,231,135,0.1)', color: C.green, border: '1px solid rgba(126,231,135,0.25)', borderRadius: 5, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  I Know This
                </button>
                <button onClick={onSkip} disabled={cardLoading}
                  style={{ background: 'transparent', color: C.dim, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 5, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Skip
                </button>
                <button onClick={onNotInterested} disabled={cardLoading}
                  style={{ background: 'transparent', color: C.dim, border: '1px solid rgba(110,118,129,0.25)', borderRadius: 5, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Not Interested
                </button>
                <button onClick={onNext} disabled={cardLoading} title="Skip without recording"
                  style={{ background: 'transparent', color: C.dim, border: 'none', borderRadius: 5, padding: '7px 10px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', marginLeft: 'auto' }}>
                  Next ▸
                </button>
              </div>
            )}
          </div>
        )}
      </>)}
    </div>
  )
}
