// vitest setup (vite.config.js `test.setupFiles`): the app fetches non-English locales on demand, but tests call
// makeT('es') etc. synchronously, so every language is registered up front here.
import { LANGUAGES } from './languages.js'
import { registerLocale } from './index.js'

for (const l of LANGUAGES) registerLocale(l.code, l.strings)
