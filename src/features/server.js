// SERVER halves of features, for vite.config.js. The page never imports this file.
// A server part declares:
//   dataEntries  folders/files it keeps in the DATA folder (backed up, merged on join/return, offline-copied)
//   dataRoutes   its /api paths that read the data folder (fronted by the unreachable-share guard)
//   localFiles   machine-local files in the app folder (watch-ignored; list them in .gitignore too)
//   register(server, helpers)  adds its /api routes
// Removing a feature: delete its line here along with its folder and its line in ./index.js.
import featureData from './storage-server.js' // framework: the generic JSON store every feature can use
import game from './game/server.js'

export const SERVER_FEATURES = [featureData, game]

export const featureDataEntries = () => SERVER_FEATURES.flatMap((f) => f.dataEntries || [])
export const featureDataRoutes = () => SERVER_FEATURES.flatMap((f) => f.dataRoutes || [])
export const featureLocalFiles = () => SERVER_FEATURES.flatMap((f) => f.localFiles || [])
export function registerFeatureRoutes(server, helpers) {
  for (const f of SERVER_FEATURES) {
    try { f.register(server, helpers) } catch (e) { console.error(`[feature ${f.id}] server routes failed:`, e.message) }
  }
}
