// The ONE door to the card store. App code calls `srs.<method>(...)` and never knows which program keeps
// the cards: Anki today (./anki), anything else tomorrow. To swap it: implement ./contract.js (start from
// ./template.js), `registerBackend(yours)`, then `selectBackend('<id>')` before the app first uses it.
import { REQUIRED_METHODS, OPTIONAL_METHODS, missingMethods } from './contract'
import { ankiBackend } from './anki'

export { sanitizeCardHtml, escapeStrayLt, isHtmlTagName } from './html'
export { setTranslator } from './i18n'
export { oneStepInterval, STORE_DOWN_CODES, CHANGE_MAYBE_APPLIED, isStoreDown } from './contract'

const backends = new Map()
let active = null

export function registerBackend(backend) {
  const missing = missingMethods(backend)
  if (missing.length) throw new Error(`card backend "${backend?.id}" is missing: ${missing.join(', ')}`)
  if (!backend.id) throw new Error('card backend needs an id')
  backends.set(backend.id, backend)
  return backend
}

export function selectBackend(id) {
  const b = backends.get(id)
  if (!b) throw new Error(`unknown card backend "${id}"`)
  active = b
  return b
}

export const activeBackend = () => active
export const backendIds = () => [...backends.keys()]
// Does the active store support an optional ability ('cloudSync' | 'files' | 'setup')? The UI hides
// what doesn't apply (the AnkiWeb sign-in banner, the add-on installer) when this is false.
export const hasCapability = (name) => !!active?.capabilities?.[name]

// What a missing optional method does: nothing harmful, and nothing that looks like success where the
// caller relies on the answer (a file store that doesn't exist must fail, so readers fall back to local).
const DEFAULTS = {
  sync: async () => {},
  syncSoon: () => {},
  cloudAuthState: async () => 'unknown',
  storeFile: async () => { throw new Error('this card store keeps no files') },
  readFile: async () => { throw new Error('this card store keeps no files') },
  blobFileName: (kind, key) => `ebiki-${kind}__${key}.json`,
  legacyBlobFileName: () => null,
  setupStatus: async () => null,
  installConnector: async () => ({ ok: false, error: 'nothing to install' }),
  focusApp: async () => ({ ok: false }),
  startApp: async () => ({ ok: false }),
}

// Late-bound: each call goes to whichever backend is active at call time.
export const srs = Object.freeze(Object.fromEntries([
  ...REQUIRED_METHODS.map((m) => [m, (...args) => active[m](...args)]),
  ...Object.keys(OPTIONAL_METHODS).map((m) => [m, (...args) => (typeof active[m] === 'function' ? active[m] : DEFAULTS[m])(...args)]),
]))

registerBackend(ankiBackend)
selectBackend('anki')
