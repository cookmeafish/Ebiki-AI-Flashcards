// Always mounted: tells Ebi's Help what the learner does in Legends (map, level, raids, the screen right now), on
// every screen, so Ebi can talk about it anywhere. The facts are built by helpContext.js (no answers while a
// question runs).
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useFeatureCtx, featureCfg } from '../registry'
import { useLegendsMap, readRaid, configureLegends, onRaidSaved, LEGENDS_ID } from './store'
import { useLearner } from '../kit/learnerStore'
import { buildLegendsHelpText, legendsLive, onLegendsLive, legendsSecretHeld, legendsWhere } from './helpContext'
import { raidCatalogText, raidCatalogMaxFor } from './bestiaryHelp'
import { todayKey } from './raid'

// The effect names in the raid catalog come from every boss's fx file (fx/index.js, a large module with all the
// effects' drawings). Loaded once, a moment after start, so it stays out of the startup bundle; the catalog waits for it
// (never raw fx keys in Help's text).
const FX_LOAD_DELAY_MS = 2500
let fxModule = null
const loadFx = () => import('./fx').then((m) => { fxModule = m; return m })

export default function HelpBridge() {
  const ctx = useFeatureCtx()
  // Always mounted: the Legends store learns the app's writer freeze here (raids from the Practice tile, Study's item
  // tallies), not only once the Legends screen has been opened.
  if (ctx) configureLegends(ctx)
  const modeId = ctx?.subject?.modeId
  const { map, loaded } = useLegendsMap(modeId)
  const { model: learner } = useLearner(modeId)
  const live = useSyncExternalStore(onLegendsLive, legendsLive)
  const [raid, setRaid] = useState(null)
  const [raidRead, setRaidRead] = useState(false) // the raid state was read (else its progress is unknown, not "never fought")
  const [raidSaves, setRaidSaves] = useState(0)
  useEffect(() => onRaidSaved(() => setRaidSaves((n) => n + 1)), [])
  // The raid state: on a mode change, whenever the Legends screen changes view, and after a raid was saved (from the
  // Practice tile no Legends view changes).
  useEffect(() => {
    let stop = false
    setRaid(null)
    setRaidRead(false)
    if (modeId == null) return undefined
    readRaid(modeId).then((r) => { if (!stop && r.ok) { setRaid(r.value); setRaidRead(true) } }).catch(() => {})
    return () => { stop = true }
  }, [modeId, live.view, raidSaves])
  const set = ctx?.help?.set
  const isLanguage = !!ctx?.subject?.isLanguage
  const tab = ctx?.activeTab || ''
  useEffect(() => {
    if (!set) return
    if (!loaded) { set('legends', null); return }
    // Never let a damaged map take the app down: this runs on every screen (Mounts have no error boundary).
    let text = ''
    try { text = buildLegendsHelpText({ map, learner, raid, live, isLanguage, today: todayKey(), onLegends: tab === 'legends', held: legendsSecretHeld() }) } catch { text = '' }
    set('legends', text ? { screen: 'legends', text, ...(tab === 'legends' ? { where: legendsWhere(live), depth: 1 } : {}) } : null)
  }, [set, loaded, map, learner, raid, live, isLanguage, tab])
  // The raid bosses for questions from ANY screen ("which raid boss is next", "what does the Lich do", "how do I beat
  // the Hydra", "what family is X in"): the rules, the player's own raid progress and every boss, in the app language.
  const t = ctx?.t
  // The loadout the raid intro would bring (features.legends.raidLoadout); a key so a new array each render re-runs
  // nothing.
  const loadoutRaw = ctx ? featureCfg(ctx, LEGENDS_ID).raidLoadout : undefined
  const loadoutKey = Array.isArray(loadoutRaw) ? loadoutRaw.join(',') : '*'
  // The whole catalog where raids are played or browsed; a compact one (every boss still named) elsewhere.
  const catalogMax = raidCatalogMaxFor(tab)
  const [fx, setFx] = useState(() => fxModule)
  useEffect(() => {
    if (fx) return undefined
    let stop = false
    const timer = setTimeout(() => { loadFx().then((m) => { if (!stop) setFx(m) }, () => {}) }, FX_LOAD_DELAY_MS)
    return () => { stop = true; clearTimeout(timer) }
  }, [fx])
  useEffect(() => {
    if (!set || !fx) return
    let text = ''
    const loadout = loadoutKey === '*' ? undefined : loadoutKey.split(',').filter(Boolean)
    try { text = raidCatalogText({ t, raid, known: raidRead, today: todayKey(), loadout, max: catalogMax, fxName: (ab, key) => fx.fxLabel(t, ab, key) }) } catch { text = '' }
    set('raid-bosses', text ? { screen: '', text } : null)
  }, [set, t, raid, raidRead, loadoutKey, fx, catalogMax])
  useEffect(() => () => { set?.('legends', null); set?.('raid-bosses', null) }, [set])
  return null
}
