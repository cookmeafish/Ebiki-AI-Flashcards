// Dev-only pronunciation harness: renders src/components/Pronunciation.jsx for a few words, compact and full,
// plus a popup that can close mid-fetch and a player whose word changes (the tapped-word popup reuses one).
// Every embed request the app would make is logged to window.__embeds. See index.html for the query switches.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT } from '../../src/i18n'
import Pronunciation from '../../src/components/Pronunciation'

const q = new URLSearchParams(location.search)
const ZOOM = Number(q.get('zoom')) || 1
document.documentElement.dataset.theme = q.get('light') ? 'light' : 'dark'
document.documentElement.style.setProperty('--app-zoom', String(ZOOM))
document.body.style.zoom = String(ZOOM)
const t = makeT(q.get('lang') || 'en')
const LANG = 'Spanish'
window.__embeds = []
const onNative = (word) => (r, opts) => window.__embeds.push({ word, source: r.source, file: r.fileName, approximate: !!r.approximate, replace: !!opts?.replace })

function Row({ word, compact = true }) {
  return (
    <div data-row={word} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--c-border)', borderRadius: 10, background: 'var(--c-surface)' }}>
      <span style={{ fontWeight: 700, minWidth: 90 }}>{word}</span>
      <Pronunciation word={word} lang={LANG} config={{}} t={t} compact={compact} noteId={word.length} onNative={onNative(word)} />
    </div>
  )
}

function Popup() {
  const [open, setOpen] = useState(false)
  return (
    <div data-popup="" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <button type="button" data-toggle-popup="" onClick={() => setOpen((o) => !o)}>{open ? 'close popup' : 'open popup'}</button>
      {open && <span data-popup-body="" style={{ padding: 6, border: '1px dashed var(--c-border)' }}>lento <Pronunciation word="lento" lang={LANG} config={{}} t={t} compact /></span>}
    </div>
  )
}

function Switcher() {
  const words = ['rojo', 'verde']
  const [i, setI] = useState(0)
  return (
    <div data-switcher="" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
      <button type="button" data-next-word="" onClick={() => setI((n) => (n + 1) % words.length)}>next word</button>
      <span data-switch-word="">{words[i]}</span>
      <Pronunciation word={words[i]} lang={LANG} config={{}} t={t} compact />
    </div>
  )
}

function App() {
  return (
    <div style={{ padding: 20, display: 'grid', gap: 10, maxWidth: 560 }}>
      <style>{PALETTE_CSS}</style>
      <Row word="perro" />
      <Row word="gato" />
      <Row word="casa" compact={false} />
      <Row word="papá" />
      <Row word="nadaxyz" />
      <Popup />
      <Switcher />
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
