// CLAUDE.md "Onboarding" (owner, 2026-11-14): every big feature the user must set up before it works is offered in
// the onboarding wizard as well as in Settings, through one shared component. This test fails when Settings offers a
// setup the wizard does not.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { PROVIDERS } from '../config/providers'

const DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
const read = (f) => fs.readFileSync(path.join(DIR, f), 'utf8')
const settings = read('SettingsModal.jsx')
const wizard = read('OnboardingWizard.jsx')
const importsOf = (src) => [...src.matchAll(/^import\s+[^;]*?from\s+'\.\/([\w-]+)'/gm)].map((m) => m[1])

// Known setup surfaces: how Settings shows it, how the wizard must show it.
const SETUP = [
  { what: 'how Ebiki opens (app window or browser)', settings: /<LaunchModeCard\b|<LaunchModeOptions\b/, wizard: /<LaunchModeOptions\b/ },
  { what: 'the AI provider picker', settings: /Object\.entries\(PROVIDERS\)/, wizard: /Object\.entries\(PROVIDERS\)/ },
  { what: 'the ChatGPT plan sign-in', settings: /<ChatGptSignIn\b/, wizard: /<ChatGptSignIn\b/ },
  { what: 'which subscriptions can be used (note)', settings: /<SubscriptionNote\b/, wizard: /<SubscriptionNote\b/ },
]
// A component file whose name says it sets something up: if Settings imports one, the wizard must too.
const SETUP_NAME = /SignIn|Connect|Setup|LaunchMode|Provider|Account|Login/

describe('onboarding offers every setup Settings offers', () => {
  for (const s of SETUP) {
    it(s.what, () => {
      expect(s.settings.test(settings), `Settings no longer shows ${s.what}: update this test`).toBe(true)
      expect(s.wizard.test(wizard), `${s.what} is in Settings but not in OnboardingWizard.jsx`).toBe(true)
    })
  }
  it('a setup component imported by Settings is imported by the wizard too', () => {
    const wizardImports = new Set(importsOf(wizard))
    const missing = importsOf(settings).filter((f) => SETUP_NAME.test(f) && !wizardImports.has(f))
    expect(missing, 'add an onboarding step for these (CLAUDE.md "Onboarding")').toEqual([])
  })
  it('a sign-in provider gets its sign-in panel in both places instead of a key box', () => {
    const signIn = Object.entries(PROVIDERS).filter(([, p]) => p.signIn)
    expect(signIn.length).toBeGreaterThan(0)
    for (const src of [settings, wizard]) expect(src).toMatch(/providerConfig\.signIn\s*\?/)
  })
})
