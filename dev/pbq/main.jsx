// Dev-only PBQ harness: renders src/components/PbqQuestion.jsx for every kind with the app's palette, so layout,
// keyboard and drag can be checked without generating an exercise. See index.html for the query switches.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT } from '../../src/i18n'
import PbqQuestion from '../../src/components/PbqQuestion'
import { compilePbq, gradePbq } from '../../src/pbq/engine'

const q = new URLSearchParams(location.search)
const LONG = !!q.get('long')
const REVIEW = !!q.get('review')
const ZOOM = Number(q.get('zoom')) || 1
document.documentElement.dataset.theme = q.get('light') ? 'light' : 'dark'
document.documentElement.style.setProperty('--app-zoom', String(ZOOM))
document.body.style.zoom = String(ZOOM)
const t = makeT(q.get('lang') || 'en')

const L = (s, long) => (LONG ? long : s)
const fixed = () => 0.999999 // keep the authored order so the review below is predictable
const SOURCES = [
  { kind: 'matching', title: 'Match each port to its protocol', scenario: 'A firewall review lists four open ports.', pairs: [
    ['22', L('SSH', 'Secure Shell remote administration over an encrypted channel for servers')],
    ['53', L('DNS', 'Domain Name System resolution of host names to addresses on the network')],
    ['443', L('HTTPS', 'Hypertext transfer over TLS for encrypted web browsing sessions')],
    ['3389', L('RDP', 'Remote Desktop Protocol graphical sessions to Windows workstations')],
  ], icons: { 22: '🔐' } },
  { kind: 'ordering', title: 'Order the incident response steps', scenario: 'Ransomware was just confirmed on a laptop.', steps: [
    L('Preparation', 'Prepare the response plan, contacts and tooling before any incident happens'),
    L('Identification', 'Identify and confirm the incident from alerts, logs and user reports'),
    L('Containment', 'Contain the infection by isolating the laptop from the network'),
    L('Eradication', 'Eradicate the malware and close the hole it came in through'),
    L('Recovery', 'Recover the system from clean backups and watch it closely'),
  ] },
  { kind: 'categorize', title: 'Sort each item', scenario: 'Classify these threats.', groups: {
    Malware: [L('Worm', 'Worm that spreads across the network by itself'), 'Trojan', 'Rootkit'],
    [L('Social engineering', 'Social engineering aimed at people rather than systems')]: ['Phishing', L('Tailgating', 'Tailgating through a badge door behind an employee')],
  }, icons: { Malware: '🦠', Phishing: '🎣' } },
]
const PBQS = SOURCES.map((s) => compilePbq(s, fixed).pbq)

// A review with mixed results: every item placed one step off except the first.
const reviewOf = (pbq) => {
  const n = pbq.answer.length
  const targets = pbq.kind === 'matching' ? pbq.right.length : pbq.kind === 'categorize' ? pbq.categories.length : n
  const assign = pbq.answer.map((a, i) => (i === 0 ? a : (a + 1) % targets))
  return { assign, perItem: gradePbq(pbq, assign).perItem }
}

function One({ pbq, i }) {
  const [submitted, setSubmitted] = useState(null)
  const review = REVIEW ? reviewOf(pbq) : submitted ? { assign: submitted, perItem: gradePbq(pbq, submitted).perItem } : null
  return (
    <section data-pbq={pbq.kind} style={{ border: '1px solid var(--c-border)', borderRadius: 14, padding: 14, background: 'var(--c-surface)' }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{pbq.title}</div>
      <div style={{ fontSize: 13, color: 'var(--c-ink-dim)', marginBottom: 10 }}>{pbq.scenario}</div>
      <PbqQuestion key={`${i}-${!!review}`} pbq={pbq} t={t} onSubmit={(a) => { window.__pbqSubmitted = { ...(window.__pbqSubmitted || {}), [pbq.kind]: a }; setSubmitted(a) }} review={review} />
      {submitted && <div data-score={pbq.kind} style={{ marginTop: 8, fontSize: 12 }}>{gradePbq(pbq, submitted).correct}/{pbq.answer.length}</div>}
    </section>
  )
}

createRoot(document.getElementById('root')).render(
  <>
    <style>{PALETTE_CSS}</style>
    <main style={{ maxWidth: 760, margin: '0 auto', padding: 16, display: 'grid', gap: 16 }}>
      {PBQS.map((pbq, i) => <One key={i} pbq={pbq} i={i} />)}
    </main>
  </>,
)
