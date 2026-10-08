// Dev-only harness for the usage-tag chips: the App chip row (same markup as App.jsx renderUsageTagChips),
// the lookup popup's "other tags" row and the Discover card row, for every chip family, unconfirmed tags and a
// long row that must wrap. See index.html for the query switches.
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT, loadLocale } from '../../src/i18n'
import { sortTagsUsageFirst, usageTagStyle, usageTagTip, isUsageTag } from '../../src/tags/usage'

const q = new URLSearchParams(location.search)
const ZOOM = Number(q.get('zoom')) || 1
const LANG = q.get('lang') || 'en'
document.documentElement.dataset.theme = q.get('light') ? 'light' : 'dark'
document.documentElement.style.setProperty('--app-zoom', String(ZOOM))
document.body.style.zoom = String(ZOOM)

const SR_ONLY = { position: 'absolute', width: 1, height: 1, margin: -1, padding: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0 }

function Chips({ t, tags, unverified = [], size = 9 }) {
  return (
    <div data-row="" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
      {sortTagsUsageFirst(tags).map((tag, ti) => {
        const unconfirmed = isUsageTag(tag) && unverified.includes(tag)
        const tip = usageTagTip(tag, { unverified: unconfirmed, t })
        return (
          <span key={ti} data-chip={tag} data-unconfirmed={unconfirmed ? '1' : undefined} className={tip ? 'tip tip-r' : undefined} data-tip={tip || undefined}
            style={{ fontSize: size, padding: '1px 5px', borderRadius: 3, background: 'rgba(125,133,144,.15)', color: 'var(--c-ink-dim)', ...usageTagStyle(tag, { unverified: unconfirmed }) }}>
            {tag}{unconfirmed ? ' ?' : ''}{tip && <span style={SR_ONLY}>{`: ${tip}`}</span>}
          </span>
        )
      })}
    </div>
  )
}

const ALL = ['adjetivo', 'register-literary', 'freq-uncommon', 'region-spain', 'region-mexico', 'ebiki', 'clima', 'register-slang']
const SAFE = ['freq-core', 'region-global', 'sustantivo']
const LONG = ['region-latam', 'freq-rare', 'register-journalistic', 'register-political', 'sustantivo', 'tema::politica::elecciones', 'nivel-b2', 'ebiki', 'lg-area-3', 'verbo-irregular']

function App({ t }) {
  return (
    <div style={{ padding: 16, display: 'grid', gap: 16, maxWidth: 520 }}>
      <style>{PALETTE_CSS}</style>
      <section data-surface="study" style={{ background: 'var(--c-surface)', padding: 12, borderRadius: 12 }}>
        <div style={{ fontWeight: 800, marginBottom: 6 }}>¿Cómo se dice «flooded»?</div>
        <Chips t={t} tags={ALL.filter(isUsageTag)} />
      </section>
      <section data-surface="popup" style={{ background: 'var(--c-surface)', padding: 12, borderRadius: 12 }}>
        <Chips t={t} tags={['region-spain', 'region-mexico', 'freq-uncommon', 'register-literary']} unverified={['region-mexico', 'freq-uncommon']} />
        <div style={{ marginTop: 6 }}><Chips t={t} tags={['adjetivo', 'clima']} /></div>
      </section>
      <section data-surface="learn" style={{ background: 'var(--c-surface)', padding: 12, borderRadius: 12 }}>
        <Chips t={t} tags={SAFE} size={9.5} />
      </section>
      <section data-surface="narrow" style={{ background: 'var(--c-surface)', padding: 12, borderRadius: 12, width: 200 }}>
        <Chips t={t} tags={LONG} />
      </section>
    </div>
  )
}

loadLocale(LANG).catch(() => {}).finally(() => {
  createRoot(document.getElementById('root')).render(<App t={makeT(LANG)} />)
  window.__ready = true
})
