import { describe, it, expect } from 'vitest'
import { SHELL, isPhoneWidth } from './layout'

describe('shell breakpoints', () => {
  it('a phone-width window gets the bottom bar, a tablet keeps the side column', () => {
    expect(isPhoneWidth(390)).toBe(true)          // a phone at zoom 1
    expect(isPhoneWidth(390 / 1.35)).toBe(true)   // a phone at the default zoom
    expect(isPhoneWidth(820 / 1.35)).toBe(false)  // a tablet at the default zoom: icon column
    expect(isPhoneWidth(SHELL.phoneBelow)).toBe(false)
  })
  it('the bar breakpoint sits below the icon-only one and the rail one', () => {
    expect(SHELL.phoneBelow).toBeLessThan(SHELL.collapseBelow)
    expect(SHELL.collapseBelow).toBeLessThan(SHELL.railHideBelow)
  })
})
