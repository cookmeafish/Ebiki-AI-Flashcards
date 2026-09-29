// The raid as a Practice hub activity (the map header opens the same screen).
import { useFeatureCtx } from '../registry'
import RaidRun from './RaidRun'

export default function RaidTile({ onExit }) {
  const ctx = useFeatureCtx()
  return ctx ? <RaidRun key={ctx.subject.modeId} ctx={ctx} onExit={onExit} /> : null
}
