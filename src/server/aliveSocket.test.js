import { describe, it, expect } from 'vitest'
import http from 'http'
import net from 'net'
import { acceptKey, textFrame, createAliveSocket, ALIVE_PATH } from './aliveSocket'

describe('alive socket', () => {
  it('computes the RFC 6455 accept key', () => {
    expect(acceptKey('dGhlIHNhbXBsZSBub25jZQ==')).toBe('s3pPLMBiTxaQ9kYGzzhZRbK+xOo=')
  })
  it('builds an unmasked text frame', () => {
    expect([...textFrame('ping')]).toEqual([0x81, 4, 0x70, 0x69, 0x6e, 0x67])
  })

  const serve = (allowed) => new Promise((resolve) => {
    const server = http.createServer((req, res) => res.end('ok'))
    const alive = createAliveSocket(server, allowed)
    server.listen(0, '127.0.0.1', () => resolve({ server, alive, port: server.address().port }))
  })
  const upgrade = (port, path, extra = '') => new Promise((resolve) => {
    const s = net.connect(port, '127.0.0.1', () => s.write(`GET ${path} HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n${extra}\r\n`))
    let got = Buffer.alloc(0)
    s.on('data', (b) => { got = Buffer.concat([got, b]) })
    setTimeout(() => resolve({ s, text: () => got.toString('latin1'), bytes: () => got }), 150)
  })

  it('answers the handshake and delivers pings; refuses what the /api guard refuses', async () => {
    const { server, alive, port } = await serve((h) => !h.origin)
    const ok = await upgrade(port, ALIVE_PATH)
    expect(ok.text()).toMatch(/^HTTP\/1\.1 101/)
    expect(alive.open).toBe(1)
    alive.ping()
    await new Promise((r) => setTimeout(r, 100))
    expect(ok.bytes().subarray(-6)).toEqual(textFrame('ping'))
    const bad = await upgrade(port, ALIVE_PATH, 'Origin: http://evil.example\r\n')
    expect(bad.text()).toMatch(/^HTTP\/1\.1 403/)
    expect(alive.open).toBe(1)
    ok.s.destroy(); bad.s.destroy()
    await new Promise((r) => setTimeout(r, 100))
    expect(alive.open).toBe(0)
    server.close()
  })

  it('leaves other upgrades (Vite HMR) alone', async () => {
    const { server, alive, port } = await serve(() => true)
    const other = await upgrade(port, '/')
    expect(other.text()).toBe('')
    expect(alive.open).toBe(0)
    other.s.destroy()
    server.close()
  })
})
