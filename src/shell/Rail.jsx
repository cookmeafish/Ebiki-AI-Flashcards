// Right rail: a column of cards contributed by features (railCards slot). Empty = not rendered.
// No divider (UI overhaul, docs/ui-overhaul.md): the cards float on the page with their own shadows.
import { FeatureSlot, SLOT } from '../features'
import { SHELL } from './layout'

export default function Rail({ registry }) {
  if (!registry.slot(SLOT.RAIL).length) return null
  return (
    <aside style={{
      width: SHELL.railWidth, flexShrink: 0, boxSizing: 'border-box', padding: `${SHELL.gap + 8}px ${SHELL.gap + 4}px ${SHELL.gap * 2}px ${SHELL.gap / 2}px`,
      overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: SHELL.gap,
    }}>
      <FeatureSlot registry={registry} name={SLOT.RAIL} />
    </aside>
  )
}
