// THE BUILT APP'S LIVENESS SOCKET (node only; tested in aliveSocket.test.js). The dev server asks open pages "anyone
// there?" before it acts on a silence (vite.config.js, auto-exit). Dev pages hear it on Vite's HMR socket; the BUILT
// app has none, so its pages open this tiny WebSocket at ALIVE_PATH and the server writes "ping" down it. A WebSocket,
// never a held HTTP request (an event stream): a browser allows only 6 HTTP connections per host, and every tab
// holding one open made other /api calls queue. Server to page only: the page never sends anything but a close.
import crypto from 'crypto'

export const ALIVE_PATH = '/api/alive-ws'
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

export const acceptKey = (key) => crypto.createHash('sha1').update(String(key) + GUID).digest('base64')
// One unmasked text frame (server frames are never masked); short payloads only.
export function textFrame(text) {
  const body = Buffer.from(String(text), 'utf8')
  if (body.length > 125) throw new Error('frame too long')
  return Buffer.concat([Buffer.from([0x81, body.length]), body])
}
const CLOSE_FRAME = Buffer.from([0x88, 0x00])

// Hooks the socket onto `httpServer` ('upgrade' for ALIVE_PATH only: Vite's HMR keeps its own). `allowed(headers)` =
// the /api guard (loopback host, same origin). Returns { ping() } writing to every open page.
export function createAliveSocket(httpServer, allowed) {
  const sockets = new Set()
  httpServer?.on('upgrade', (req, socket) => {
    if ((req.url || '').split('?')[0] !== ALIVE_PATH) return // someone else's (Vite's HMR)
    const key = req.headers['sec-websocket-key']
    if (!key || !allowed(req.headers) || String(req.headers.upgrade || '').toLowerCase() !== 'websocket') {
      try { socket.end('HTTP/1.1 403 Forbidden\r\n\r\n') } catch { /* gone */ }
      return
    }
    socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${acceptKey(key)}\r\n\r\n`)
    sockets.add(socket)
    const drop = () => sockets.delete(socket)
    socket.on('close', drop)
    socket.on('error', drop)
    socket.on('end', drop)
    // The page's only message is a close (opcode 8): answer it and let go.
    socket.on('data', (buf) => { if (buf.length && (buf[0] & 0x0f) === 0x8) { try { socket.end(CLOSE_FRAME) } catch { /* gone */ } drop() } })
  })
  const frame = textFrame('ping')
  return {
    ping() { for (const s of sockets) { try { s.write(frame) } catch { sockets.delete(s) } } },
    get open() { return sockets.size },
  }
}
