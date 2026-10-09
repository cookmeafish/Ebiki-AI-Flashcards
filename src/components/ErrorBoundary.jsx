import React from 'react'
import { isLocaleLoaded, loadLocale, makeT } from '../i18n'
import { apiFetch, platform } from '../platform'

// The last language this browser used (App keeps it in localStorage): the crash screen has no App state to read.
// Locales load on demand, so a crash before the chosen one arrived would show English: fetch it, then re-render.
const crashLang = () => { try { return localStorage.getItem('ebiki-app-language') || 'en' } catch { return 'en' } }
const crashT = () => { try { return makeT(crashLang()) } catch { return makeT('en') } }

// Last line of defence for a RENDER crash. With no boundary, one exception thrown while rendering
// blanked the whole window, and when the data that caused it was saved (a chat, a study session, a
// mode config) it blanked it again on every launch with nothing on screen to say why.
//
// The fallback is self-contained on purpose: App's <style> block (and with it every --c-* colour)
// unmounts with App, so colours are inline, picked from the theme attribute that stays on <html>.
// It also keeps the /api/alive heartbeat going: that lives in App, and without it a server started
// by the shortcut would shut itself down under this screen and "Reload" would find nothing.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
    this.beat = null
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[Ebiki] render crash:', error, info?.componentStack)
    try {
      const lang = crashLang()
      if (!isLocaleLoaded(lang)) loadLocale(lang).then((ok) => { if (ok && this.state.error) this.forceUpdate() }).catch(() => {})
    } catch { /* stays in English */ }
    const isOverlay = new URLSearchParams(window.location.search).has('overlay')
    if (!isOverlay && !this.beat) {
      // Same contract as App's heartbeat: beat, answer the server's HMR ping (it asks before acting on a
      // silence, and a throttled background tab showing this screen must still count as open), and say
      // goodbye on close so a shortcut-started server exits promptly.
      this.sendBeat = () => { apiFetch('/api/alive', { method: 'POST' }).catch(() => {}) }
      this.bye = (e) => { if (e && e.persisted) return; try { platform.beacon('/api/bye', '') } catch { /* leaving anyway */ } }
      this.sendBeat()
      this.beat = setInterval(this.sendBeat, 5000)
      this.stopPings = platform.serverPings(this.sendBeat)
      window.addEventListener('pagehide', this.bye)
    }
    // A crashed overlay would otherwise be an invisible full-screen window swallowing clicks.
    if (isOverlay) {
      const show = () => { try { document.body.style.opacity = '1' } catch { /* nothing to show */ } }
      show()
      // Every later Alt+Q hides the page again before showing the window, and App (whose listeners showed it) is
      // gone: show this screen on each capture, or the overlay is an invisible window eating every click.
      if (!this.showAgain) {
        this.showAgain = show
        window.addEventListener('overlay-reset', show)
        window.addEventListener('overlay-capture', show)
      }
    }
  }

  componentWillUnmount() {
    if (this.beat) clearInterval(this.beat)
    if (this.stopPings) this.stopPings()
    if (this.bye) window.removeEventListener('pagehide', this.bye)
    if (this.showAgain) { window.removeEventListener('overlay-reset', this.showAgain); window.removeEventListener('overlay-capture', this.showAgain) }
  }

  render() {
    if (!this.state.error) return this.props.children
    const dark = document.documentElement.getAttribute('data-theme') === 'dark'
    const c = dark
      ? { bg: '#0f1720', card: '#16212c', ink: '#e8eef4', dim: '#9fb0c0', border: '#2a3a4a' }
      : { bg: '#f3f8fb', card: '#ffffff', ink: '#16202a', dim: '#5a6b7a', border: '#d6e2ea' }
    const btn = { font: 'inherit', fontSize: 14, fontWeight: 700, padding: '9px 16px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${c.border}`, background: c.card, color: c.ink }
    const reload = (clearSaved) => {
      if (clearSaved) {
        // What most often re-crashes on the next launch: the saved study session and the open chat.
        try { localStorage.removeItem('ebiki-study-session') } catch { /* storage unavailable */ }
        try { localStorage.removeItem('ebiki-chat-session') } catch { /* storage unavailable */ }
      }
      window.location.reload()
    }
    const t = crashT()
    return (
      <div style={{ minHeight: '100vh', background: c.bg, color: c.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: 'Nunito, system-ui, sans-serif' }}>
        <div style={{ maxWidth: 480, width: '100%', background: c.card, border: `1px solid ${c.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{t('crash_title')}</div>
          <div style={{ fontSize: 14, color: c.dim, lineHeight: 1.5, marginBottom: 16 }}>
            {t('crash_body')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={{ ...btn, background: '#DF2540', color: '#fff', border: 'none' }} onClick={() => reload(false)}>{t('start_reload')}</button>
            <button style={btn} onClick={() => reload(true)}>{t('crash_reloadClean')}</button>
          </div>
          <div style={{ fontSize: 12, color: c.dim, marginTop: 16, wordBreak: 'break-word' }}>{String(this.state.error?.message || this.state.error)}</div>
        </div>
      </div>
    )
  }
}
