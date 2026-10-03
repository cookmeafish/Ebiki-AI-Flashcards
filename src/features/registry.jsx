// The feature framework. A feature is ONE folder (src/features/<id>/) exporting a descriptor; the list in
// ./index.js is the only place it is named. App.jsx never imports a feature: it renders SLOTS and emits
// EVENTS, so deleting a feature is deleting its folder and its line in ./index.js.
//
// Descriptor (every key optional except id):
//   id            unique, lowercase
//   optional      true = OFF until the user switches it on (Settings > Optional features); needs locale keys
//                 `<prefix>_name` / `<prefix>_desc` named by nameKey / descKey
//   (text)        a feature has NO strings of its own: its UI text lives in src/i18n/locales/<code>.js under a
//                 section named after the feature, with the feature's key prefix
//   defaults      the feature's settings, stored under config.json `features[id]`
//   Mount         component rendered once app-wide (background work, modals, overlays)
//   headerItems   [{ id, order, Component }] small items in the header
//   railCards     [{ id, order, Component }] cards in the right-hand rail
//   navItems      [{ id, order, icon, art?, labelKey, Screen, rail?, visible?(ctx) }] whole screens in the sidebar
//                 (visible gets { registry, featureSettings } and hides the entry while false)
//   settingsCards [{ id, section, order, Component }] cards in Settings (section: 'general' for now)
//   practiceActivities [{ id, order, icon, titleKey, descKey, Screen, Badge? }] tiles in the Practice hub;
//                 Screen gets { onExit, params }, Badge renders a small count (or nothing)
//   chatMenuItems [{ id, order, icon, labelKey, onPick(ctx), visible?(ctx) }] entries in the Chat "+" menu
//   on            { [EVENTS.X]: (payload, ctx) => void } reactions to app facts
//
// Components receive nothing; they read the shared context with useFeatureCtx().
import { createContext, useContext, Fragment, useEffect, useSyncExternalStore } from 'react'

export const SLOT = {
  MOUNT: 'Mount',
  HEADER: 'headerItems',
  RAIL: 'railCards',
  NAV: 'navItems',
  SETTINGS: 'settingsCards',
  PRACTICE: 'practiceActivities', // tiles in the Practice hub (if the practice feature is installed)
  CHAT_MENU: 'chatMenuItems',     // entries in the Chat "+" menu
}

const ID_RE = /^[a-z][a-z0-9-]*$/

export function createRegistry(features) {
  const seen = new Set()
  for (const f of features) {
    if (!f || !ID_RE.test(f.id || '')) throw new Error(`feature needs a lowercase id: ${f?.id}`)
    if (seen.has(f.id)) throw new Error(`duplicate feature id "${f.id}"`)
    seen.add(f.id)
  }
  const byOrder = (a, b) => (a.order ?? 100) - (b.order ?? 100)
  // Which optional features the user switched on (App installs this from config each render).
  let isOn = () => false
  const active = () => features.filter((f) => !f.optional || isOn(f.id))
  return {
    features,
    optional: () => features.filter((f) => f.optional),
    setEnabled(fn) { if (typeof fn === 'function') isOn = fn },
    isActive: (id) => active().some((f) => f.id === id),
    // Every entry of a slot across ACTIVE features, in display order, each tagged with its feature id.
    slot(name, filter) {
      return active().flatMap((f) => (Array.isArray(f[name]) ? f[name] : []).map((item) => ({ ...item, feature: f.id })))
        .filter((item) => !filter || filter(item)).sort(byOrder)
    },
    mounts: () => active().filter((f) => f.Mount).map((f) => ({ id: f.id, Mount: f.Mount })),
    defaults: (id) => features.find((f) => f.id === id)?.defaults || {},
    // Announce an app fact to every ACTIVE feature that reacts to it. A throwing handler never breaks the app.
    emit(event, payload, ctx) {
      for (const f of active()) {
        const h = f.on?.[event]
        if (typeof h !== 'function') continue
        try { h(payload || {}, ctx) } catch (e) { console.warn(`[feature ${f.id}] ${event} failed:`, e?.message || e) }
      }
    },
  }
}

// FOCUS HOLDS: a feature running something the user is concentrating on (a quiz, a call) holds focus, and
// anything that would pop up (a celebration) waits until nothing holds it. Study's own question phase is
// ctx.busy; this covers everything features add.
let holds = 0
const holdListeners = new Set()
const setHolds = (n) => { holds = Math.max(0, n); for (const l of holdListeners) l() }
export function useFocusHold(active = true) {
  useEffect(() => {
    if (!active) return
    setHolds(holds + 1)
    return () => setHolds(holds - 1)
  }, [active])
}
// ACTIVITY BUSY: a practice activity says whether leaving it now would lose something (a call, a workout, unsaved
// results). useActivityBusy(busy) both REPORTS (the activity takes part) and sets the flag; the hub asks "Leave this
// activity?" on Back only while one is busy. An activity that never calls it is always asked about (the safe default).
let activityReporters = 0
let activityBusy = 0
export function useActivityBusy(busy) {
  useEffect(() => { activityReporters++; return () => { activityReporters-- } }, [])
  useEffect(() => {
    if (!busy) return
    activityBusy++
    return () => { activityBusy-- }
  }, [busy])
}
// true = nothing to lose: the open activity reports, and nothing in it is running.
export const activityIdle = () => activityReporters > 0 && activityBusy <= 0

// INTENTS: "open <target> with these params" without features importing each other. ctx.open(navId, payload)
// leaves one here and switches the screen; the screen takes it on mount (or live, if already open).
const intents = new Map()
const intentListeners = new Set()
export function requestIntent(target, payload) {
  intents.set(target, payload || {})
  for (const l of intentListeners) l(target)
}
export function takeIntent(target) {
  const p = intents.get(target)
  intents.delete(target)
  return p || null
}
export function useIntent(target, onIntent) {
  useEffect(() => {
    const pending = takeIntent(target)
    if (pending) onIntent(pending)
    const l = (tg) => { if (tg === target) { const p = takeIntent(target); if (p) onIntent(p) } }
    intentListeners.add(l)
    return () => intentListeners.delete(l)
  }, [target]) // eslint-disable-line react-hooks/exhaustive-deps
}

// BACK / FORWARD for feature screens and sub-views: useNavEntry(key, value, apply, opts) (src/nav/react.js documents
// it). A user change of `value` is a history entry; Back restores it through apply(). Keys are '<feature>.<what>'.
// ctx.nav has back() / forward() / canGoBack() for buttons that should act like the device's Back.
export { useNavEntry } from '../nav/react'

export const useFocusHeld = () => useSyncExternalStore((fn) => { holdListeners.add(fn); return () => holdListeners.delete(fn) }, () => holds > 0)

// The shared context App.jsx provides: generic app services only (t, keys, active mode, navigation,
// settings storage). Features must not need anything more specific than this.
export const FeatureContext = createContext(null)
export const useFeatureCtx = () => useContext(FeatureContext)

// Settings for one feature: its defaults overlaid with what config.json holds.
export function featureCfg(ctx, id) {
  return { ...(ctx?.registry?.defaults(id) || {}), ...(ctx?.featureSettings?.[id] || {}) }
}

// Render a slot's components in order, each given `props` (e.g. Settings passes its card styles).
// Unknown or empty slots render nothing.
export function FeatureSlot({ registry, name, filter, wrap, props }) {
  const items = registry.slot(name, filter)
  if (!items.length) return null
  return items.map(({ id, feature, Component }) => {
    if (!Component) return null
    const el = <Component key={`${feature}:${id}`} {...(props || {})} />
    return wrap ? <Fragment key={`${feature}:${id}`}>{wrap(el, { id, feature })}</Fragment> : el
  })
}
