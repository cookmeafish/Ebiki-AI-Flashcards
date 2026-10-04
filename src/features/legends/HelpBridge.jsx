// Always mounted: tells Ebi's Help what the learner does in Legends (map, level, raids, the screen right now), on
// every screen, so Ebi can talk about it anywhere. The facts are built by helpContext.js (no answers while a
// question runs).
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useFeatureCtx } from '../registry'
import { useLegendsMap, readRaid, configureLegends, onRaidSaved } from './store'
import { useLearner } from '../kit/learnerStore'
import { buildLegendsHelpText, legendsLive, onLegendsLive, legendsSecretHeld, legendsWhere } from './helpContext'
import { raidCatalogText } from './bestiaryHelp'
import { fxLabel } from './fx'
import { todayKey } from './raid'

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
  useEffect(() => {
    if (!set) return
    let text = ''
    try { text = raidCatalogText({ t, raid, known: raidRead, today: todayKey(), fxName: (ab, fx) => fxLabel(t, ab, fx) }) } catch { text = '' }
    set('raid-bosses', text ? { screen: '', text } : null)
  }, [set, t, raid, raidRead])
  useEffect(() => () => { set?.('legends', null); set?.('raid-bosses', null) }, [set])
  return null
}
