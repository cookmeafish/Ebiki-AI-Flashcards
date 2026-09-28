// Copies the launcher's text (the `ln_*` keys of src/i18n/locales/<code>.js) into scripts/launcher-strings.json,
// because the launcher, installer, splash and app window run before (or without) the app and cannot read the
// locale files. The locale files stay the ONE place to edit; run `npm run i18n:launcher` afterwards
// (src/i18n/locales.test.js fails while this copy is stale).
import fs from 'fs'
import path from 'path'
import { fileURLToPath, pathToFileURL } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const OUT = path.join(root, 'scripts', 'launcher-strings.json')
const PREFIX = 'ln_'

export async function buildLauncherStrings() {
  const { LANGUAGES, FALLBACK_LANGUAGE } = await import(pathToFileURL(path.join(root, 'src/i18n/languages.js')).href)
  const langs = {}
  for (const l of LANGUAGES) {
    langs[l.code] = Object.fromEntries(Object.entries(l.strings).filter(([k]) => k.startsWith(PREFIX)))
  }
  return JSON.stringify({ fallback: FALLBACK_LANGUAGE, langs }, null, 1) + '\n'
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  fs.writeFileSync(OUT, await buildLauncherStrings(), 'utf8') // UTF-8, no BOM
  console.log('wrote', path.relative(root, OUT))
}
