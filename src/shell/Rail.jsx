// Right rail: a column of cards contributed by features (railCards slot). Empty = not rendered.
import { C } from '../config/tokens'
import { FeatureSlot, SLOT } from '../features'
import { SHELL } from './layout'

export default function Rail({ registry }) {
  if (!registry.slot(SLOT.RAIL).length) return null
  return (
    <aside style={{
      width: SHELL.railWidth, flexShrink: 0, boxSizing: 'border-box', padding: `${SHELL.gap}px ${SHELL.gap}px ${SHELL.gap * 2}px`,
      overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: SHELL.gap, borderLeft: `2px solid ${C.border}`,
    }}>
      <FeatureSlot registry={registry} name={SLOT.RAIL} />
    </aside>
  )
}
