// The /api cross-site guard. Every real caller must pass (the app page and overlay are same-origin;
// the Electron main process, the launch scripts and curl send no Origin), and a request another
// website makes the browser send, or a DNS-rebound hostname, must not.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'ebiki-guard-'))
process.env.EBIKI_DATA_DIR = DIR
process.env.EBIKI_ENV_DIR = DIR
const { apiRequestAllowed } = await import('../../vite.config.js')

describe('apiRequestAllowed', () => {
  it('lets every real caller through', () => {
    expect(apiRequestAllowed({ host: 'localhost:3000', origin: 'http://localhost:3000' })).toBe(true) // app page POST
    expect(apiRequestAllowed({ host: 'localhost:3000' })).toBe(true)                                 // same-origin GET, Electron main, PowerShell
    expect(apiRequestAllowed({ host: 'localhost' })).toBe(true)                                      // launch.sh's raw request
    expect(apiRequestAllowed({ host: '127.0.0.1:3000', origin: 'http://127.0.0.1:3000' })).toBe(true)
    expect(apiRequestAllowed({ host: '[::1]:3000', origin: 'http://[::1]:3000' })).toBe(true)
    expect(apiRequestAllowed({})).toBe(true)                                                         // HTTP/1.0, no headers
  })

  it('refuses a request another website makes the browser send', () => {
    expect(apiRequestAllowed({ host: 'localhost:3000', origin: 'https://evil.example' })).toBe(false)
    expect(apiRequestAllowed({ host: 'localhost:3000', origin: 'http://localhost:5173' })).toBe(false) // another local app
    expect(apiRequestAllowed({ host: 'localhost:3000', origin: 'null' })).toBe(false)                   // sandboxed frame
  })

  it('refuses a DNS-rebound hostname even when Origin matches it', () => {
    expect(apiRequestAllowed({ host: 'evil.example:3000', origin: 'http://evil.example:3000' })).toBe(false)
    expect(apiRequestAllowed({ host: 'evil.example:3000' })).toBe(false)
  })
})

describe('Sec-Fetch-Site', () => {
  // An <img> or <script> tag on another site sends NO Origin, but the browser still labels it.
  it('refuses a cross-site or same-site request that carries no Origin', () => {
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'cross-site' })).toBe(false)
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'same-site' })).toBe(false) // localhost:5173 -> :3000
  })
  it('lets the app itself and a typed URL through', () => {
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'same-origin' })).toBe(true)
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'none' })).toBe(true)
  })
})

describe('same-origin subresources', () => {
  it('refuses an <img>/<audio> pointed at the API from inside the app, keeps fetch and typed URLs', () => {
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'image' })).toBe(false)
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'audio' })).toBe(false)
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'empty' })).toBe(true)
    expect(apiRequestAllowed({ host: 'localhost:3000', 'sec-fetch-site': 'none', 'sec-fetch-dest': 'document' })).toBe(true)
  })
})
