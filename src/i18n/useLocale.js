// The language the UI can show right now, for a wanted language that may still be loading (React).
// Returns [shown, settled]:
//   shown    the wanted code once its strings are in; until then the LAST language that was ready (a switch keeps
//            the old language on screen for the moment the new one takes, never English or raw keys), or null
//            before any was. A language that fails to load shows the fallback.
//   settled  true once the wanted language is in or has failed (the App's first paint waits for it).
import { useEffect, useState } from 'react'
import { isLocaleLoaded, loadLocale, FALLBACK_LANGUAGE } from './index.js'

export function useLocale(lang) {
  const [state, setState] = useState(() => ({ shown: isLocaleLoaded(lang) ? lang : null, for: isLocaleLoaded(lang) ? lang : null }))
  useEffect(() => {
    if (isLocaleLoaded(lang)) { setState({ shown: lang, for: lang }); return undefined }
    let live = true
    loadLocale(lang).then((ok) => { if (live) setState({ shown: ok ? lang : FALLBACK_LANGUAGE, for: lang }) })
    return () => { live = false }
  }, [lang])
  // An already loaded language shows at once, not one render later.
  if (isLocaleLoaded(lang)) return [lang, true]
  return [state.shown, state.for === lang]
}
