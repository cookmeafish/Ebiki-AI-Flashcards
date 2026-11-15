// "Use your ChatGPT plan": the ONE sign-in panel, shown by the onboarding provider step AND Settings > AI & cost
// (CLAUDE.md "Onboarding": a feature that needs setup is offered in both, with the same words). Wording follows
// OpenAI's Sign in with ChatGPT UI guidelines ("Continue with ChatGPT", "Using ChatGPT plan", "Manage usage").
// The button is a LINK to /api/chatgpt/start (the server answers with a redirect to OpenAI): the app window hands any
// link to the real browser, and a browser tab opens it in a new tab, so the sign-in happens where the user's own
// OpenAI session is. Tokens never come here: `status` is the server's public status.
import { C, FONT } from '../config/tokens'
import { S } from '../styles/theme'

// The server's sign-in errors, in words. Anything unknown reads as "did not finish".
const ERROR_KEY = { denied: 'cg_errDenied', noPlan: 'cg_errNoPlan', timeout: 'cg_errTimeout', port: 'cg_errPort' }

export const SubscriptionNote = ({ t }) => (
  <div data-subscription-note="" style={{ fontSize: 11.5, color: C.inkDim, lineHeight: 1.45, marginTop: 10 }}>{t('cg_subscriptionNote')}</div>
)

export default function ChatGptSignIn({ t, status, waiting, onSignIn, onSignOut, onCancel, signingOut }) {
  const st = status || {}
  const signedIn = !!st.signedIn
  const btn = {
    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 10, textDecoration: 'none',
    // OpenAI's black or white button: the page's ink on its surface, so it is the dark button in the light theme and the
    // light one in the dark theme (never a fixed black that vanished on the dark page).
    background: C.ink, color: C.surface, fontWeight: 700, fontSize: 14, fontFamily: FONT.body, border: `1px solid ${C.ink}`,
  }
  const link = { color: C.brandText, fontSize: 12, fontWeight: 700 }
  const errKey = !signedIn && st.error ? (ERROR_KEY[st.error] || 'cg_errFailed') : (signedIn && !st.planUsage ? 'cg_errNoPlan' : '')

  return (
    <div data-chatgpt-signin="" style={{ textAlign: 'left' }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, fontFamily: FONT.display }}>{t('cg_title')}</div>
      {signedIn ? (
        <>
          <div style={{ fontSize: 13, color: C.success, fontWeight: 700, marginTop: 6 }}>✓ {st.email ? t('cg_signedInAs', { email: st.email }) : t('cg_signedIn')}</div>
          {st.planUsage && <div style={{ fontSize: 12, color: C.inkDim, marginTop: 4 }}>{t('cg_usingPlan')}</div>}
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
            <a href={st.manageUrl || 'https://chatgpt.com/settings/usage'} target="_blank" rel="noopener noreferrer" style={link}>{t('cg_manageUsage')} ↗</a>
            <button type="button" disabled={signingOut} onClick={onSignOut} style={{ ...S.ghostBtn, fontSize: 12, color: C.inkDim, ...(signingOut ? { opacity: 0.5, cursor: 'default' } : {}) }}>{t('cg_signOut')}</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 12.5, color: C.inkDim, marginTop: 6, lineHeight: 1.45 }}>{t('cg_body')}</div>
          {st.needsSignIn && <div style={{ fontSize: 12, color: C.warning, marginTop: 8 }}>{t('cg_signedOutElsewhere')}</div>}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
            <a href="/api/chatgpt/start" target="_blank" rel="noopener" onClick={onSignIn} className="btn-press" style={btn} data-chatgpt-continue="">
              {t('cg_continue')}
            </a>
            {waiting && <button type="button" onClick={onCancel} style={{ ...S.ghostBtn, fontSize: 12, color: C.inkDim }}>{t('cg_cancel')}</button>}
          </div>
          {waiting && <div style={{ fontSize: 12, color: C.inkDim, marginTop: 8 }}>{t('cg_waiting')}</div>}
        </>
      )}
      {errKey && !waiting && <div style={{ fontSize: 12, color: C.danger, fontWeight: 700, marginTop: 8 }}>{t(errKey)}</div>}
      <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 10, lineHeight: 1.4 }}>{t('cg_privacy')}</div>
    </div>
  )
}
