// Tier 1 — native-speaker recordings from Wiktionary editions / Wikimedia Commons.
// Candidates come from TWO sources per edition, unioned (live probes showed EACH source
// misses files the other finds: es media-list under-reports template-nested audio; the
// wikitext regex can miss CJK/odd names that media-list reports). Attribution is fetched
// from the Commons imageinfo API and is MANDATORY — a file with no license metadata is
// skipped (CC-BY-SA: no credit, no playback).
import { langInfo } from './langcodes'
import { pickAudioFiles, unionCandidates, normalizeFileName, STRONG_SCORE, looksLikePronunciationPage } from './matcher'

// Filenames in wikitext: letters of any script, digits, spaces, parens, hyphens…
const WIKITEXT_AUDIO_RE = /[^|=[\]{}<>\n:]{2,120}?\.(?:ogg|oga|wav|mp3|opus|flac)/gi
const API_HEADERS = { 'Api-User-Agent': 'Ebiki/1.0 (local flashcard study app)' }

// Wikimedia rate-limits request bursts hard (429) — e.g. a user clicking 🔊 down a deck
// list. Space requests out (~350ms) and retry ONCE after a 429 with a backoff.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let nextSlot = 0
const politeFetch = async (url) => {
  const wait = Math.max(0, nextSlot - Date.now())
  nextSlot = Date.now() + wait + 350
  if (wait) await sleep(wait)
  let r = await fetch(url, { headers: API_HEADERS })
  if (r.status === 429) {
    await sleep(2500)
    nextSlot = Date.now() + 350
    r = await fetch(url, { headers: API_HEADERS })
  }
  return r
}

const fetchMediaList = async (edition, title) => {
  try {
    const r = await politeFetch(`https://${edition}.wiktionary.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`)
    if (!r.ok) return []
    const j = await r.json()
    return (j.items || [])
      .filter((i) => i.type === 'audio' || /\.(ogg|oga|wav|mp3|opus|flac)$/i.test(i.title || ''))
      .map((i) => i.title)
  } catch { return [] }
}

const fetchWikitextFiles = async (edition, title) => {
  try {
    const r = await politeFetch(`https://${edition}.wiktionary.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=wikitext&format=json&origin=*`)
    if (!r.ok) return []
    const j = await r.json()
    const wt = j.parse?.wikitext?.['*'] || ''
    return [...new Set((wt.match(WIKITEXT_AUDIO_RE) || []).map((s) => s.trim()))]
  } catch { return [] }
}

// Source B — direct Commons file search (CirrusSearch). Recordings frequently exist on
// Commons with NO Wiktionary page linking them (verified live: es.wiktionary "paraguas"
// links no audio, yet Commons holds "LL-Q1321 (spa)-Eavqwiki-paraguas.wav"). Runs only
// when every edition page came up empty.
const searchCommonsFiles = async (word) => {
  try {
    const r = await politeFetch(`https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`intitle:${word} filetype:audio`)}&srnamespace=6&srlimit=20&format=json&origin=*`)
    if (!r.ok) return []
    const j = await r.json()
    return (j.query?.search || []).map((x) => x.title)
  } catch { return [] }
}

const stripHtml = (s) => String(s || '').replace(/<[^>]*>/g, '').trim()

// Commons metadata for one file: playable URL + author/license/file-page link.
// Falls back to the edition's own API for locally-hosted files (rare). Returns null
// when there is no usable attribution — the caller must then try the next candidate.
const fetchFileInfo = async (fileName, edition) => {
  const query = async (host) => {
    try {
      const r = await politeFetch(`https://${host}/w/api.php?action=query&titles=${encodeURIComponent('File:' + fileName)}&prop=imageinfo%7Ccategories&iiprop=url%7Cextmetadata&clshow=!hidden&cllimit=100&format=json&origin=*`)
      if (!r.ok) return null
      const j = await r.json()
      const page = Object.values(j.query?.pages || {})[0]
      if (!page?.imageinfo?.[0]) return null
      return { info: page.imageinfo[0], categories: (page.categories || []).map((c) => c.title) }
    } catch { return null }
  }
  const hit = (await query('commons.wikimedia.org')) || (edition ? await query(`${edition}.wiktionary.org`) : null)
  const info = hit?.info
  if (!info?.url) return null
  const meta = info.extmetadata || {}
  const author = stripHtml(meta.Artist?.value)
  const license = stripHtml(meta.LicenseShortName?.value || meta.License?.value)
  if (!author && !license) return null // no attribution → do not play (hard requirement)
  return {
    url: info.url,
    categories: hit.categories || [],
    attribution: { author: author || 'Unknown author', license: license || 'see file page', sourceUrl: info.descriptionurl || `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName)}` },
  }
}

// Ranked-candidate cache per word|lang|region, so cycling through speakers ("↻ different
// voice") re-uses one gathered list instead of re-scraping pages on every click.
// `includedSearch` marks whether the Commons direct search was already merged in.
const candidateCache = new Map()

const gatherEditionCandidates = async (editions, titles) => {
  for (const edition of editions) {
    for (const title of titles) {
      const [ml, wt] = await Promise.all([fetchMediaList(edition, title), fetchWikitextFiles(edition, title)])
      const candidates = unionCandidates(ml, wt)
      if (candidates.length) return { files: candidates, edition }
    }
  }
  return { files: [], edition: null }
}

// `variant` picks the n-th ranked recording (wrapping), so a user can cycle through
// DIFFERENT SPEAKERS of the same word. variant 0 = the best match (original behavior);
// any variant>0 request also merges the Commons search results in for a richer list.
export async function resolveWiktionary({ word, lang, region = '', config = {}, variant = 0 }) {
  const info = langInfo(lang)
  if (!info || !word) return null
  // Edition priority is config-driven; default = the language's own edition, then English
  // (which often carries audio for foreign entries — confirmed live for ja via en).
  const editions = [...new Set(config.editions?.[info.iso1] || [info.iso1, 'en'])]
  const titles = [...new Set([word.trim(), word.trim().toLowerCase()])]

  const cacheKey = `${word.trim().toLowerCase()}|${info.iso1}|${region}`.toLowerCase()
  let entry = candidateCache.get(cacheKey)
  if (!entry || (variant > 0 && !entry.includedSearch)) {
    const base = entry?.gathered ? { files: entry.raw, edition: entry.edition } : await gatherEditionCandidates(editions, titles)
    let raw = base.files
    let includedSearch = entry?.includedSearch || false
    // Source B: merge the Commons-wide search when the pages had nothing — or when the
    // user asks for alternate voices (more speakers live outside the dictionary pages).
    if (!raw.length || variant > 0) {
      raw = unionCandidates(raw, await searchCommonsFiles(word.trim()))
      includedSearch = true
    }
    const ranked = pickAudioFiles(raw, { iso1: info.iso1, iso3: info.iso3, region, word })
    // ↻ cycling walks this whole list, so keep it CLEAN: only language-confirmed files
    // (word-only recordings first, then phrases — the ranking already orders that).
    // Weak no-language-info candidates are kept ONLY when nothing better exists, and
    // they must additionally pass the pronunciation-category gate below.
    const strong = ranked.filter((c) => c.score >= STRONG_SCORE)
    entry = { files: strong.length ? strong : ranked, raw, edition: base.edition, includedSearch, gathered: true }
    if (candidateCache.size > 200) candidateCache.clear()
    candidateCache.set(cacheKey, entry)
  }

  const files = entry.files
  if (!files.length) return null
  const start = ((variant % files.length) + files.length) % files.length
  // Try from the requested variant onward until one has usable attribution.
  for (let i = 0; i < files.length; i++) {
    const idx = (start + i) % files.length
    const cand = files[idx]
    const fileInfo = await fetchFileInfo(cand.file, entry.edition)
    if (!fileInfo) continue
    // Filename gave no language evidence (bare "Perro.ogg" could be a BARK, not a person
    // saying "perro") → its Commons categories must prove it's a pronunciation recording.
    if (cand.score < STRONG_SCORE && !looksLikePronunciationPage(fileInfo.categories)) continue
    return {
      kind: 'url', source: 'wiktionary', audioUrl: fileInfo.url,
      fileName: normalizeFileName(cand.file), attribution: fileInfo.attribution,
      variant: idx, variantCount: files.length,
    }
  }
  return null
}
