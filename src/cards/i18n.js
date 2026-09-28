// App-written error text in the app language for every card backend: App.jsx installs its t() once
// (these messages reach the screen as {msg}).
let translate = null
export const setTranslator = (fn) => { translate = typeof fn === 'function' ? fn : null }
export const tr = (key, en) => { try { const v = translate?.(key); return v && v !== key ? v : en } catch { return en } }
