// Legends art gallery: every boss and banner in one place, shown through the app's own components (the real intro
// card, the fight arena size, the map icon, the banner), with a place to note what is good, bad or to change.
// Feedback stays in this browser (localStorage) until "Copy my feedback" puts it on the clipboard as plain text.
import { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { PALETTE_CSS } from '../../src/config/palette'
import { makeT } from '../../src/i18n'
import { BossIntro } from '../../src/features/legends/BossArena'
import { AreaArt, BossArt } from '../../src/features/legends/art'
import { MOTIFS, PALETTES } from '../../src/features/legends/map'
import { CATALOG } from './catalog'

const STORE = 'ebiki-legends-art-feedback'
const MAP_W = 620, MAP_H = 132 // the map's banner box (MapView: MAX_W wide, AreaArt height 132)
const VERDICTS = [
  { key: 'good', label: 'Good', color: 'var(--c-success)' },
  { key: 'change', label: 'Change', color: 'var(--c-warning)' },
  { key: 'bad', label: 'Bad', color: 'var(--c-danger)' },
]
const readStore = () => { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {} } catch { return {} } }
const writeStore = (v) => { try { localStorage.setItem(STORE, JSON.stringify(v)) } catch { /* private window: kept in memory only */ } }
const pad = (n) => String(n).padStart(2, '0')

const CSS = `
${PALETTE_CSS}
body { background: var(--c-bg); color: var(--c-ink); }
.g-top { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 10px; align-items: center; padding: 10px 18px;
  background: var(--c-glass-strong); border-bottom: 2px solid var(--c-border); backdrop-filter: blur(6px); }
.g-title { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 22px; margin-right: auto; }
.g-btn { font: inherit; font-weight: 800; font-size: 13px; padding: 7px 12px; border-radius: 10px; cursor: pointer;
  border: 2px solid var(--c-border-strong); border-bottom-width: 4px; background: var(--c-surface); color: var(--c-ink); }
.g-btn.on { background: var(--c-brand); color: #fff; border-color: var(--c-brand-dark); }
.g-sel { font: inherit; font-weight: 700; font-size: 13px; padding: 6px 8px; border-radius: 10px; border: 2px solid var(--c-border-strong);
  background: var(--c-surface); color: var(--c-ink); }
.g-lineup { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 18px; }
.g-chip { display: grid; justify-items: center; gap: 2px; padding: 6px; border-radius: 12px; border: 2px solid var(--c-border);
  background: var(--c-surface); cursor: pointer; font-size: 11px; font-weight: 800; color: var(--c-ink-dim); text-decoration: none; }
.g-card { margin: 14px 18px 24px; padding: 16px; border-radius: 18px; background: var(--c-surface); border: 2px solid var(--c-border);
  display: grid; gap: 14px; scroll-margin-top: 70px; }
.g-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 10px; }
.g-num { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 26px; color: var(--c-brand); }
.g-name { font-family: 'Baloo 2', sans-serif; font-weight: 800; font-size: 22px; }
.g-motif { font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--c-ink-faint); }
.g-text { font-size: 13.5px; line-height: 1.45; color: var(--c-ink-dim); }
.g-row { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; }
.g-cell { display: grid; gap: 6px; justify-items: center; font-size: 11px; font-weight: 800; color: var(--c-ink-faint); text-transform: uppercase; letter-spacing: .06em; }
.g-fb { display: grid; gap: 6px; padding: 10px; border-radius: 12px; background: var(--c-surface-sunken); border: 1px solid var(--c-border); min-width: 260px; flex: 1 1 260px; }
.g-fb textarea { font: inherit; font-size: 13px; min-height: 58px; padding: 8px; border-radius: 8px; border: 1px solid var(--c-border-strong);
  background: var(--c-surface); color: var(--c-ink); resize: vertical; }
.g-missing { padding: 30px; border-radius: 12px; border: 2px dashed var(--c-border-strong); color: var(--c-ink-faint); font-weight: 800; }
`

function Verdict({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {VERDICTS.map((v) => (
        <button key={v.key} className="g-btn" onClick={() => onChange(value === v.key ? '' : v.key)}
          style={value === v.key ? { background: v.color, color: '#fff', borderColor: v.color } : { color: v.color }}>{v.label}</button>
      ))}
    </div>
  )
}

function Feedback({ label, id, fb, setFb }) {
  const cur = fb[id] || {}
  const set = (patch) => setFb({ ...fb, [id]: { ...cur, ...patch } })
  return (
    <div className="g-fb">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <b style={{ fontSize: 13 }}>{label}</b>
        <Verdict value={cur.verdict || ''} onChange={(verdict) => set({ verdict })} />
      </div>
      <textarea placeholder="What is good, what is bad, what to change..." value={cur.note || ''} onChange={(e) => set({ note: e.target.value })} />
    </div>
  )
}

function ThemeCard({ item, t, palette, replay, fb, setFb, exists }) {
  const area = { id: item.motif, title: item.lair.split(':')[0], motif: item.motif, palette }
  const [own, setOwn] = useState(0)
  const tag = `#${pad(item.n)}`
  return (
    <section className="g-card" id={`t${pad(item.n)}`}>
      <div className="g-head">
        <span className="g-num">{tag}</span><span className="g-name">{item.boss}</span><span className="g-motif">{item.motif}</span>
        <button className="g-btn" style={{ marginLeft: 'auto' }} onClick={() => setOwn((n) => n + 1)}>▶ Replay entrance</button>
      </div>
      <div className="g-text"><b>Boss:</b> {item.idea}<br /><b>Entrance:</b> {item.entrance}<br /><b>Banner:</b> {item.lair}</div>
      {!exists.boss || !exists.area ? <div className="g-missing">Missing file: {!exists.boss && `bosses/${item.motif}.svg `}{!exists.area && `areas/${item.motif}.svg`}</div> : null}
      <div className="g-row">
        <div style={{ flex: '1 1 380px', minWidth: 320, maxWidth: 560 }}>
          <BossIntro key={`${replay}-${own}`} t={t} area={area} name={item.boss} total={10} onFight={() => setOwn((n) => n + 1)} />
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="g-row">
            <div className="g-cell"><BossArt area={area} size={120} animated="idle" />Fight (idle)</div>
            <div className="g-cell"><BossArt area={area} size={64} />Map icon</div>
            <div className="g-cell"><BossArt area={area} size={64} locked />Locked</div>
          </div>
          <Feedback label={`${tag} Boss`} id={`${item.motif}:boss`} fb={fb} setFb={setFb} />
        </div>
      </div>
      <div className="g-row">
        <div style={{ flex: '0 1 620px', display: 'grid', gap: 8, maxWidth: MAP_W }}>
          <div className="g-cell" style={{ justifyItems: 'stretch' }}><AreaArt area={area} height={MAP_H} width={MAP_W} />Banner exactly as on the map ({MAP_W} x {MAP_H}, idle motion)</div>
          <div className="g-cell" style={{ justifyItems: 'stretch' }}><AreaArt area={area} height={Math.round(MAP_W * 140 / 400)} width={MAP_W} animated={false} />The whole drawing (still)</div>
        </div>
        <Feedback label={`${tag} Banner`} id={`${item.motif}:area`} fb={fb} setFb={setFb} />
      </div>
    </section>
  )
}

function Gallery() {
  const t = useMemo(() => makeT('en'), [])
  const [dark, setDark] = useState(false)
  const [palette, setPalette] = useState('') // '' = each theme's own mood
  const [replay, setReplay] = useState(0)
  const [fb, setFbState] = useState(readStore)
  const [copied, setCopied] = useState('')
  const [exists, setExists] = useState({})
  const setFb = (v) => { setFbState(v); writeStore(v) }
  useEffect(() => { document.documentElement.dataset.theme = dark ? 'dark' : 'light' }, [dark])
  useEffect(() => {
    let live = true
    Promise.all(CATALOG.flatMap((c) => ['bosses', 'areas'].map((k) => fetch(`/assets/legends/${k}/${c.motif}.svg`, { method: 'HEAD' })
      .then((r) => [`${c.motif}:${k}`, r.ok && (r.headers.get('content-type') || '').includes('svg')]).catch(() => [`${c.motif}:${k}`, false]))))
      .then((pairs) => { if (live) setExists(Object.fromEntries(pairs)) })
    return () => { live = false }
  }, [])
  const notInCatalog = MOTIFS.filter((m) => !CATALOG.some((c) => c.motif === m))
  const copy = async () => {
    const lines = ['Legends art feedback']
    for (const c of CATALOG) {
      for (const [part, label] of [['boss', 'boss'], ['area', 'banner']]) {
        const f = fb[`${c.motif}:${part}`]
        if (!f || (!f.verdict && !(f.note || '').trim())) continue
        lines.push(`#${pad(c.n)} ${c.motif} ${label} (${c.boss}): ${(f.verdict || 'note').toUpperCase()}${(f.note || '').trim() ? `. ${f.note.trim()}` : ''}`)
      }
    }
    const text = lines.length > 1 ? lines.join('\n') : 'Legends art feedback: nothing noted yet.'
    try { await navigator.clipboard.writeText(text); setCopied('Copied. Paste it into the chat.') } catch { setCopied('Could not copy: select the text below.'); console.log(text) }
    setTimeout(() => setCopied(''), 4000)
  }
  const noted = Object.values(fb).filter((f) => f && (f.verdict || (f.note || '').trim())).length
  return (
    <>
      <style>{CSS}</style>
      <div className="g-top">
        <span className="g-title">Legends art gallery · {CATALOG.length} themes</span>
        <button className={`g-btn${dark ? '' : ' on'}`} onClick={() => setDark(false)}>☀ Light</button>
        <button className={`g-btn${dark ? ' on' : ''}`} onClick={() => setDark(true)}>☾ Dark</button>
        <select className="g-sel" value={palette} onChange={(e) => setPalette(e.target.value)}>
          <option value="">Palette: each theme's own</option>
          {PALETTES.map((p) => <option key={p} value={p}>Palette: {p}</option>)}
        </select>
        <button className="g-btn" onClick={() => setReplay((n) => n + 1)}>▶ Replay all</button>
        <button className="g-btn on" onClick={copy}>📋 Copy my feedback ({noted})</button>
        {copied && <span style={{ fontWeight: 800, color: 'var(--c-success)' }}>{copied}</span>}
      </div>
      {notInCatalog.length > 0 && <div className="g-missing" style={{ margin: 18 }}>Motifs missing from the catalog: {notInCatalog.join(', ')}</div>}
      <div className="g-lineup">
        {CATALOG.map((c) => (
          <a key={c.motif} className="g-chip" href={`#t${pad(c.n)}`}>
            <BossArt area={{ motif: c.motif, palette: palette || c.palette }} size={72} />#{pad(c.n)} {c.motif}
          </a>
        ))}
      </div>
      {CATALOG.map((c) => (
        <ThemeCard key={c.motif} item={c} t={t} palette={palette || c.palette} replay={replay} fb={fb} setFb={setFb}
          exists={{ boss: exists[`${c.motif}:bosses`] !== false, area: exists[`${c.motif}:areas`] !== false }} />
      ))}
    </>
  )
}

createRoot(document.getElementById('root')).render(<Gallery />)
