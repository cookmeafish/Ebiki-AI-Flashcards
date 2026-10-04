// Right rail: a column of cards contributed by features (railCards slot). Empty = not rendered.
// No divider (UI overhaul, docs/ui-overhaul.md): the cards float on the page with their own shadows.
// Collapsible like the sidebar (onToggle): collapsed it is a slim strip holding only the toggle.
import { FeatureSlot, SLOT } from '../features'
import { C, FONT, RADIUS } from '../config/tokens'
import { SHELL } from './layout'

const STRIP = 52 // collapsed width

export default function Rail({ registry, collapsed, onToggle, toggleLabel }) {
  if (!registry.slot(SLOT.RAIL).length) return null
  const toggle = onToggle && (
    <button type="button" onClick={onToggle} aria-label={toggleLabel} aria-expanded={!collapsed}
      className={collapsed ? 'click-dim tip tip-l tip-b' : 'click-dim'} data-tip={collapsed ? toggleLabel : undefined}
      style={{
        alignSelf: collapsed ? 'center' : 'flex-end', display: 'flex', alignItems: 'center', gap: 8, height: 34,
        padding: collapsed ? '0 10px' : '0 12px', borderRadius: RADIUS.md, border: '1px solid transparent',
        background: 'transparent', color: C.inkFaint, cursor: 'pointer', flexShrink: 0,
        fontFamily: FONT.body, fontWeight: 800, fontSize: 12,
      }}>
      <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{collapsed ? '«' : '»'}</span>
      {!collapsed && <span>{toggleLabel}</span>}
    </button>
  )
  if (collapsed) {
    return (
      <aside style={{ width: STRIP, flexShrink: 0, boxSizing: 'border-box', padding: `${SHELL.gap + 8}px 0`, display: 'flex', flexDirection: 'column' }}>
        {toggle}
      </aside>
    )
  }
  return (
    <aside style={{
      width: SHELL.railWidth, flexShrink: 0, boxSizing: 'border-box', padding: `${SHELL.gap + 8}px ${SHELL.gap + 4}px ${SHELL.gap * 2}px ${SHELL.gap / 2}px`,
      overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: SHELL.gap,
    }}>
      {toggle}
      <FeatureSlot registry={registry} name={SLOT.RAIL} />
    </aside>
  )
}
