// Legends' part of the app-wide learner context (kit/learnerContext.js): map progress (areas and steps cleared,
// stars, the starting level) and the daily raid (boss, trophies). The same facts Ebi's Help gets (helpContext.js),
// without item fronts (a front can be the answer of a question on another screen) and without the level line (the
// context has its own level part).
import { registerLearnerContextSource } from '../kit/learnerContext'
import { loadMap, readRaid } from './store'
import { buildLegendsHelpText, legendsSecretHeld } from './helpContext'
import { todayKey } from './raid'

registerLearnerContextSource('legends', async (ctx, modeId) => {
  if (modeId == null) return null
  const [m, r] = await Promise.all([loadMap(modeId), readRaid(modeId)])
  if (!m.ok && !r.ok) return { ok: false, title: 'Legends' }
  const map = m.ok ? m.value : null
  const raid = r.ok ? r.value : null
  if (!map?.areas?.length && !raid) return null
  const text = buildLegendsHelpText({ map, learner: null, raid, isLanguage: !!ctx?.subject?.isLanguage, today: todayKey(), onLegends: false, held: legendsSecretHeld() })
  return { title: 'Legends (adventure map and raids)', text: text.split('\n').filter((l) => !/^Legends learner level:/.test(l)).join('\n') }
})
