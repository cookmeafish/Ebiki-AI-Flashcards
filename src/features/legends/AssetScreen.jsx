// The asset view as its own sidebar screen (the owner: "make asset viewer available from the sidebar"). Shown in the
// sidebar only while cheat mode is on (index.js `visible`), like the ⚡ button in the map header. Back goes to Legends.
import { useFeatureCtx } from '../registry'
import AssetView from './AssetView'
import { cheatsOn } from './CheatUI'

export default function AssetScreen() {
  const ctx = useFeatureCtx()
  if (!cheatsOn(ctx)) return null
  return <AssetView ctx={ctx} onBack={() => ctx.setActiveTab?.('legends')} />
}
