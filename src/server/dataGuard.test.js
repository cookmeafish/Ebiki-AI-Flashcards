import { describe, it, expect } from 'vitest'
import { guardMode } from './dataGuard.js'

// A server whose reachability answer is cached: `cached` is what dataMode() says until invalidated.
const server = ({ cached = 'online', afterProbe = 'offline', present = true } = {}) => {
  const s = { calls: 0, probes: 0, invalidated: 0, stale: true }
  s.dataMode = async () => { s.calls++; return s.stale ? cached : afterProbe }
  s.freshProbe = async () => { s.probes++; return present }
  s.invalidate = () => { s.invalidated++; s.stale = false }
  return s
}

describe('guardMode', () => {
  it('a write to a share that vanished inside the cache window goes offline, never "online"', async () => {
    const s = server({ present: false })
    expect(await guardMode({ isWrite: true, shared: true, ...s })).toBe('offline')
    expect(s.invalidated).toBe(1)
  })

  it('and answers down when there is no local snapshot (503, nothing written)', async () => {
    const s = server({ present: false, afterProbe: 'down' })
    expect(await guardMode({ isWrite: true, shared: true, ...s })).toBe('down')
  })

  it('a write to a share that is really there stays online after one fresh probe', async () => {
    const s = server({ present: true })
    expect(await guardMode({ isWrite: true, shared: true, ...s })).toBe('online')
    expect(s.probes).toBe(1); expect(s.invalidated).toBe(0)
  })

  it('reads keep using the cached answer (no extra probe per GET)', async () => {
    const s = server({ present: false })
    expect(await guardMode({ isWrite: false, shared: true, ...s })).toBe('online')
    expect(s.probes).toBe(0)
  })

  it('the app folder (not shared) and offline mode need no fresh probe', async () => {
    const local = server({ present: false })
    expect(await guardMode({ isWrite: true, shared: false, ...local })).toBe('online')
    const off = server({ cached: 'offline', present: false })
    expect(await guardMode({ isWrite: true, shared: true, ...off })).toBe('offline')
    expect(local.probes + off.probes).toBe(0)
  })
})
