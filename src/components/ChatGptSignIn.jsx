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

// ONE TAB PER COMPANY (the owner: "each provider has its own login with subscription if they support it"). A
// subscription sign-in is a way to pay INSIDE its company's tab (`subscriptionOf` in PROVIDERS), never a tab of its own
// and never offered under another company. Pure helpers, used by Settings and onboarding alike.
export const companyTabs = (providers) => Object.entries(providers).filter(([, p]) => !p.subscriptionOf)
// The tab a provider id lives in ('chatgpt' → 'openai').
export const companyOf = (providers, id) => providers[id]?.subscriptionOf || id
// The subscription provider of a company, if it has one ('openai' → 'chatgpt').
export const subscriptionFor = (providers, company) => Object.entries(providers).find(([, p]) => p.subscriptionOf === company)?.[0] || null

// Inside a company's tab: how to use it. With a subscription sign-in: "API key" or "<plan> (sign in)". Without: one
// line saying why that company needs a key (their own rules), named for THAT company only.
// Where each company says so (checked 2026-11-14, docs/plans/2026-11-14-subscription-sign-in.md): the learner can read
// the rule for themselves instead of taking the app's word.
export const NO_SUB_SOURCE = {
  anthropic: 'https://code.claude.com/docs/en/legal-and-compliance',
  gemini: 'https://geminicli.com/docs/resources/tos-privacy',
  grok: 'https://x.ai/news/grok-opencode', // the page naming the few tools that may sign in (no way for other apps)
}
export function SubscriptionNote({ t, providers, provider, onPick }) {
  const company = companyOf(providers, provider)
  const sub = subscriptionFor(providers, company)
  if (!sub) return (
    <div data-subscription-note={company} style={{ fontSize: 11.5, color: C.inkDim, lineHeight: 1.45, marginTop: 10 }}>
      {t(`cg_noSub_${company}`)}
      {NO_SUB_SOURCE[company] && <> <a href={NO_SUB_SOURCE[company]} target="_blank" rel="noopener noreferrer" style={{ color: C.brandText, fontWeight: 700, whiteSpace: 'nowrap' }}>{t('cg_source')} ↗</a></>}
    </div>
  )
  const seg = (id, label) => (
    <button key={id} type="button" role="radio" aria-checked={provider === id} onClick={() => onPick?.(id)} className={provider === id ? 'ui-tab ui-tab-current' : 'ui-tab'}
      style={{ ...S.ghostBtn, fontSize: 12.5, padding: '6px 12px', fontWeight: 700, cursor: provider === id ? 'default' : 'pointer', color: provider === id ? C.ink : C.inkDim, background: provider === id ? C.surfaceAlt : C.surface }}>{label}</button>
  )
  return (
    <div data-subscription-note={company} style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: C.inkDim, marginBottom: 6 }}>{t('cg_howToUse', { company: providers[company]?.label || company })}</div>
      <div role="radiogroup" aria-label={t('cg_howToUse', { company: providers[company]?.label || company })} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {seg(company, `🔑 ${t('cg_useKey')}`)}
        {seg(sub, `💳 ${t('cg_usePlan', { plan: providers[sub].label })}`)}
      </div>
    </div>
  )
}

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
          {/* Honest status: this sign-in passed its tests against a stand-in server only, never a real account yet. */}
          <div data-chatgpt-unverified="" style={{ fontSize: 11.5, color: C.warning, marginTop: 8, lineHeight: 1.4 }}>{t('cg_unverified')}</div>
        </>
      )}
      {errKey && !waiting && <div style={{ fontSize: 12, color: C.danger, fontWeight: 700, marginTop: 8 }}>{t(errKey)}</div>}
      <div style={{ fontSize: 11, color: C.inkFaint, marginTop: 10, lineHeight: 1.4 }}>{t('cg_privacy')}</div>
    </div>
  )
}
