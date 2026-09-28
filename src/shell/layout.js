// App shell layout: left sidebar (navigation) · the screen · right rail (feature cards).
// Every size and breakpoint lives here. Widths are CSS px AFTER the body zoom (window px / zoom).
import { useEffect, useState } from 'react'

export const SHELL = {
  sidebarWidth: 200,          // full sidebar (icon + label)
  sidebarCollapsed: 68,       // icon-only sidebar
  collapseBelow: 880,         // narrower than this: icon-only sidebar
  railWidth: 300,
  railHideBelow: 1080,        // narrower than this: no rail (the screen needs the room)
  gap: 16,
}

// Core screens in sidebar order, with their icon. Features add screens through their navItems slot.
export const CORE_NAV = [
  { id: 'study', icon: '📚', order: 10 },
  { id: 'chat', icon: '💬', order: 30 },
  { id: 'deck', icon: '🗂️', order: 40 },
  { id: 'discover', icon: '🧭', order: 50 },
  { id: 'picture', icon: '📷', order: 60 },
  { id: 'stats', icon: '📊', order: 70 },
]

// Screens that show the rail (home-like screens; never mid-session, where focus matters most).
export const railWanted = (tab, { studyActive } = {}) => (tab === 'study' && !studyActive) || tab === 'stats'

// Viewport width in CSS px (after the body zoom), live.
export function useViewportWidth(getZoom) {
  const read = () => (typeof window === 'undefined' ? 1280 : window.innerWidth / ((getZoom && getZoom()) || 1))
  const [w, setW] = useState(read)
  useEffect(() => {
    const on = () => setW(read())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  return w
}
