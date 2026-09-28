// Launcher text for Node-side callers: electron/main.cjs (the app window's holding page) and, as a command,
// launch.sh / setup.sh:   node scripts/launcher-i18n.cjs ln_updateCouldNot [name=value ...]
// The text lives in src/i18n/locales/<code>.js (the ONE place for UI text); scripts/launcher-strings.json is its
// generated copy (npm run i18n:launcher). Language: applang.json (the app language, written by the server) ->
// the system language -> English. Never throws.
const fs = require('fs')
const path = require('path')

const APP = path.resolve(__dirname, '..')

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')) } catch { return null }
}

// "es_ES.UTF-8", "zh-CN", "ja" -> "es", "zh", "ja"
const baseCode = (loc) => String(loc || '').trim().toLowerCase().split(/[-_.@]/)[0]

function systemLocale() {
  return process.env.LC_ALL || process.env.LC_MESSAGES || process.env.LANG
    || (() => { try { return Intl.DateTimeFormat().resolvedOptions().locale } catch { return '' } })()
}

// { lang, t(key, vars) }. `preferred`: a system locale the caller knows better (Electron's app.getLocale()).
function launcherText(preferred) {
  const all = readJson(path.join(__dirname, 'launcher-strings.json')) || { fallback: 'en', langs: {} }
  const langs = all.langs || {}
  const fallback = all.fallback || 'en'
  const saved = readJson(path.join(APP, 'applang.json'))?.lang
  const lang = [saved, baseCode(preferred), baseCode(systemLocale())].find((l) => l && langs[l]) || fallback
  const dict = langs[lang] || {}
  const base = langs[fallback] || {}
  const t = (key, vars = {}) => {
    const raw = dict[key] ?? base[key] ?? key
    return String(raw).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m))
  }
  return { lang, t }
}

module.exports = { launcherText }

if (require.main === module) {
  const [key, ...pairs] = process.argv.slice(2)
  const vars = Object.fromEntries(pairs.map((p) => { const i = p.indexOf('='); return [p.slice(0, i), p.slice(i + 1)] }))
  process.stdout.write(key ? launcherText().t(key, vars) : '')
}
