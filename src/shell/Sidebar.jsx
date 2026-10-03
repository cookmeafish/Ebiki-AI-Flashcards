// Left navigation, Duolingo style: big rounded rows with an icon and an uppercase label; the current
// screen is outlined in the brand color. Collapses to icons on narrow windows, or when the user collapses it with the
// toggle at the bottom (onToggle; null while a narrow window forces icon-only).
import { C, FONT, RADIUS } from '../config/tokens'
import { SHELL } from './layout'

const ROW_H = 46
const ICON_SIZE = 22
const ART_SIZE = 28 // a drawn icon (public/assets/nav/<art>.svg) fills its square, an emoji does not

export default function Sidebar({ items, active, onPick, collapsed, onToggle, toggleLabel }) {
  return (
    <nav aria-label="Ebiki" style={{
      width: collapsed ? SHELL.sidebarCollapsed : SHELL.sidebarWidth, flexShrink: 0, boxSizing: 'border-box',
      padding: '14px 10px', borderRight: `2px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6,
      overflowY: 'auto', background: C.bg,
    }}>
      {items.map((it) => {
        const on = it.id === active
        return (
          <button key={it.id} onClick={() => !on && onPick(it.id)} aria-current={on ? 'page' : undefined} aria-label={it.label}
            className={on ? 'ui-tab-current' : 'click-dim'}
            data-tip={collapsed ? it.label : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, height: ROW_H, padding: collapsed ? 0 : '0 14px',
              justifyContent: collapsed ? 'center' : 'flex-start', boxSizing: 'border-box', width: '100%',
              borderRadius: RADIUS.md, border: `2px solid ${on ? C.brand : 'transparent'}`,
              background: on ? C.brandTint : 'transparent', color: on ? C.brand : C.inkDim, cursor: on ? 'default' : 'pointer',
              fontFamily: FONT.body, fontWeight: 800, fontSize: 14, letterSpacing: '.06em', textTransform: 'uppercase',
            }}>
            {it.art
              ? <img src={`/assets/nav/${it.art}.svg`} alt="" aria-hidden="true" draggable={false} width={ART_SIZE} height={ART_SIZE} style={{ flexShrink: 0, display: 'block' }} />
              : <span style={{ fontSize: ICON_SIZE, lineHeight: 1, width: ICON_SIZE + 6, textAlign: 'center' }}>{it.icon}</span>}
            {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.label}</span>}
          </button>
        )
      })}
      {onToggle && (
        <button type="button" onClick={onToggle} aria-label={toggleLabel} aria-expanded={!collapsed}
          className="click-dim" data-tip={collapsed ? toggleLabel : undefined}
          style={{
            marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 14, height: ROW_H - 8, padding: collapsed ? 0 : '0 14px', width: '100%', boxSizing: 'border-box', flexShrink: 0,
            borderRadius: RADIUS.md, border: '2px solid transparent', background: 'transparent', color: C.inkFaint,
            cursor: 'pointer', fontFamily: FONT.body, fontWeight: 800, fontSize: 12, letterSpacing: '.06em', textTransform: 'uppercase',
          }}>
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1, width: ICON_SIZE + 6, textAlign: 'center' }}>{collapsed ? '»' : '«'}</span>
          {!collapsed && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{toggleLabel}</span>}
        </button>
      )}
    </nav>
  )
}
