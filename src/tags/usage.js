// Usage tags — the three things a language learner must know about a word BEFORE memorizing it:
//   region-*   WHERE it is used (all regions of the language, or specific countries/areas)
//   freq-*     HOW OFTEN natives actually reach for it (top everyday vocabulary … rare)
//   register-* WHAT CONTEXTS it is restricted to (literary, political, legal, slang, …)
//
// Why this is a module and not prose in a prompt: a learner who is shown only "anegada = flooded"
// memorizes a word natives mostly meet in writing, and says it out loud. The definition is
// incomplete without where + how often, so every surface that shows a word must be able to show
// these, and every generator must be asked for them in the SAME vocabulary.
//
// PURE (no React, no app imports) so it can be unit-tested — see usage.test.js.

// Frequency, ordered from most to least common. The index IS the rarity, so "be conservative"
// is expressible as a max() — see reconcileUsageTags.
export const FREQ_SCALE = ['freq-core', 'freq-common', 'freq-uncommon', 'freq-rare']

// CLOSED register vocabulary. Deliberately not free text: these become real Anki tags, and a model
// left to invent them mints "register-formal-literary-ish" and pollutes the tag tree forever.
// Absence of a register tag MEANS neutral — nothing is emitted for ordinary words.
export const REGISTERS = [
  'register-formal', 'register-informal', 'register-literary', 'register-poetic',
  'register-slang', 'register-vulgar', 'register-childish', 'register-archaic',
  'register-technical', 'register-academic', 'register-legal', 'register-political',
  'register-medical', 'register-business', 'register-journalistic', 'register-military',
  'register-religious',
]

export const isRegionTag = (t) => String(t || '').startsWith('region-')
export const isFreqTag = (t) => String(t || '').startsWith('freq-')
export const isRegisterTag = (t) => String(t || '').startsWith('register-')
export const isUsageTag = (t) => isRegionTag(t) || isFreqTag(t) || isRegisterTag(t)

// Usage tags LEAD the tag row in the order a learner reads them: where → how often → what context.
const tagRank = (t) => (isRegionTag(t) ? 0 : isFreqTag(t) ? 1 : isRegisterTag(t) ? 2 : 3)
// Stable: non-usage tags keep their original relative order.
export const sortTagsUsageFirst = (tags) => [...(tags || [])].sort((a, b) => tagRank(a) - tagRank(b))

// Models paraphrase tag names no matter how closed the list is. Fold the near-misses onto the
// real vocabulary rather than letting "register-politics" and "region-usa" fragment the tag tree.
const FREQ_ALIASES = {
  'freq-everyday': 'freq-core', 'freq-basic': 'freq-core', 'freq-very-common': 'freq-core',
  'freq-verycommon': 'freq-core', 'freq-high': 'freq-core', 'freq-frequent': 'freq-common',
  'freq-moderate': 'freq-common', 'freq-medium': 'freq-common', 'freq-low': 'freq-uncommon',
  'freq-infrequent': 'freq-uncommon', 'freq-very-rare': 'freq-rare', 'freq-veryrare': 'freq-rare',
}
const REGISTER_ALIASES = {
  'register-neutral': null, // neutral is the ABSENCE of a tag, never a tag itself
  'register-standard': null, 'register-general': null, 'register-common': null,
  'register-literature': 'register-literary', 'register-poetry': 'register-poetic',
  'register-colloquial': 'register-informal', 'register-casual': 'register-informal',
  'register-familiar': 'register-informal', 'register-jargon': 'register-technical',
  'register-scientific': 'register-technical', 'register-science': 'register-technical',
  'register-scholarly': 'register-academic', 'register-politics': 'register-political',
  'register-law': 'register-legal', 'register-juridical': 'register-legal',
  'register-medicine': 'register-medical', 'register-commercial': 'register-business',
  'register-press': 'register-journalistic', 'register-news': 'register-journalistic',
  'register-obsolete': 'register-archaic', 'register-dated': 'register-archaic',
  'register-offensive': 'register-vulgar', 'register-crude': 'register-vulgar',
}
const REGION_ALIASES = {
  'region-all': 'region-global', 'region-universal': 'region-global',
  'region-everywhere': 'region-global', 'region-worldwide': 'region-global',
  'region-international': 'region-global', 'region-latin-america': 'region-latam',
  'region-latinamerica': 'region-latam', 'region-hispanoamerica': 'region-latam',
  'region-usa': 'region-us', 'region-united-states': 'region-us', 'region-america': 'region-us',
  'region-britain': 'region-uk', 'region-united-kingdom': 'region-uk', 'region-england': 'region-uk',
}

const clean = (t) => String(t || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/-+/g, '-')

// Canonicalize ONE tag. Returns null for a tag that should be dropped (unknown register, junk).
export const normalizeUsageTag = (tag) => {
  const t = clean(tag)
  if (!t) return null
  if (isFreqTag(t)) {
    const mapped = FREQ_ALIASES[t] ?? t
    return FREQ_SCALE.includes(mapped) ? mapped : null
  }
  if (isRegisterTag(t)) {
    const mapped = Object.prototype.hasOwnProperty.call(REGISTER_ALIASES, t) ? REGISTER_ALIASES[t] : t
    return mapped && REGISTERS.includes(mapped) ? mapped : null
  }
  if (isRegionTag(t)) {
    const mapped = REGION_ALIASES[t] ?? t
    // A bare "region-" carries no claim; any other slug is a real place we keep as-is.
    return mapped.length > 'region-'.length ? mapped : null
  }
  return t
}

// Canonicalize a whole tag list: fold aliases, drop junk, dedupe, and resolve two structural
// contradictions a model can emit — several freq tags at once (keep the most conservative, i.e.
// the RAREST, so nothing over-claims commonness) and "region-global" sitting beside specific
// regions (the specific claim is the narrower, honest one, so global goes).
export const normalizeUsageTags = (tags) => {
  const out = []
  let freq = null
  for (const raw of tags || []) {
    const t = normalizeUsageTag(raw)
    if (!t) continue
    if (isFreqTag(t)) {
      if (freq === null || FREQ_SCALE.indexOf(t) > FREQ_SCALE.indexOf(freq)) freq = t
      continue
    }
    if (!out.includes(t)) out.push(t)
  }
  const regions = out.filter(isRegionTag)
  const withoutGlobal = regions.length > 1 && regions.includes('region-global')
    ? out.filter((t) => t !== 'region-global')
    : out
  return sortTagsUsageFirst(freq ? [...withoutGlobal, freq] : withoutGlobal)
}

const regionsOf = (tags) => (tags || []).filter(isRegionTag)
const freqOf = (tags) => (tags || []).find(isFreqTag) || null
const registersOf = (tags) => (tags || []).filter(isRegisterTag)

// THE ANTI-HALLUCINATION STEP. Two model passes answer the same question INDEPENDENTLY (pass B
// never sees pass A's answer, so it cannot rubber-stamp it) and this function reconciles them in
// CODE rather than asking a third model to judge. A guessed tag rarely survives two independent
// samples; one that does is at least a consistent belief rather than a coin flip.
//
// Doctrine, per family:
//   freq     — disagreement resolves to the LESS common value. Over-claiming "everyday" for a
//              literary word is the harmful direction (the learner says it out loud); under-
//              claiming only makes them cautious. Two or more steps apart = genuine confusion,
//              so the conservative value ships but is flagged unverified.
//   region   — identical sets agree. "global" vs specific regions resolves to the SPECIFIC ones:
//              global ⊇ specific, so both passes DO back those regions, and the narrower claim is
//              the honest one (same demote doctrine the prompts carry). Disjoint sets = neither
//              can back the other, so the union ships flagged.
//   register — survives ONLY if both passes name it. A register claim that only one pass makes is
//              exactly the confident-sounding guess this whole mechanism exists to delete.
//
// Returns { tags, unverified } — unverified tags still RENDER (hiding a disagreement is its own
// dishonesty), just marked so the learner knows the two checks did not line up.
export const reconcileUsageTags = (a, b) => {
  const A = normalizeUsageTags(a)
  const B = normalizeUsageTags(b)
  const tags = []
  const unverified = []
  const add = (t, ok) => { if (t && !tags.includes(t)) { tags.push(t); if (!ok) unverified.push(t) } }

  // region
  const rA = regionsOf(A)
  const rB = regionsOf(B)
  if (!rA.length && !rB.length) {
    // nothing claimed by either pass
  } else if (!rA.length || !rB.length) {
    for (const t of (rA.length ? rA : rB)) add(t, false) // only one pass had an opinion
  } else if (rA.includes('region-global') && rB.includes('region-global')) {
    add('region-global', true)
  } else if (rA.includes('region-global') || rB.includes('region-global')) {
    for (const t of (rA.includes('region-global') ? rB : rA)) add(t, true) // demote to the specific set
  } else {
    const inter = rA.filter((t) => rB.includes(t))
    if (inter.length) for (const t of inter) add(t, true)
    else for (const t of [...rA, ...rB]) add(t, false)
  }

  // freq
  const fA = freqOf(A)
  const fB = freqOf(B)
  if (fA && fB) {
    const iA = FREQ_SCALE.indexOf(fA)
    const iB = FREQ_SCALE.indexOf(fB)
    add(FREQ_SCALE[Math.max(iA, iB)], Math.abs(iA - iB) < 2)
  } else if (fA || fB) {
    add(fA || fB, false)
  }

  // register — intersection only
  const gA = registersOf(A)
  const gB = registersOf(B)
  for (const t of gA) if (gB.includes(t)) add(t, true)

  return { tags: sortTagsUsageFirst(tags), unverified }
}

// Chip styling, shared by every tag surface. GREEN = safe to use (everywhere / everyday),
// AMBER = heads-up (restricted place, rare, or context-bound), GRAY DASHED = the two checks
// disagreed. Same visual grammar the region chips already established.
const GREEN_TAGS = new Set(['region-global', 'freq-core', 'freq-common'])
export const usageTagStyle = (tag, opts = {}) => {
  if (opts.unverified) {
    return { background: 'rgba(125,133,144,.10)', color: 'var(--c-ink-dim)', border: '1px dashed rgba(125,133,144,.45)', fontWeight: 700 }
  }
  if (!isUsageTag(tag)) return {}
  return GREEN_TAGS.has(tag)
    ? { background: 'rgba(24,169,87,.12)', color: 'var(--c-success)', border: '1px solid rgba(24,169,87,.35)', fontWeight: 700 }
    : { background: 'rgba(232,147,12,.12)', color: 'var(--c-warning)', border: '1px solid rgba(232,147,12,.35)', fontWeight: 700 }
}

// Human explanation for the chip tooltip — the chip name alone ("freq-uncommon") does not tell a
// learner what to DO with it. Language-neutral phrasing; no em dashes (project-wide rule).
const FREQ_TIPS = {
  'freq-core': 'Top everyday vocabulary. Natives use this constantly, so it is safe to use freely.',
  'freq-common': 'Common in everyday speech. You can use this without sounding unusual.',
  'freq-uncommon': 'Natives know it but rarely reach for it in everyday speech. Recognize it; prefer a more common word when speaking.',
  'freq-rare': 'Rare. Mostly literature, specialized fields or older texts. Using it in conversation will sound out of place.',
}
const REGISTER_TIPS = {
  'register-formal': 'Formal contexts. Sounds stiff in casual conversation.',
  'register-informal': 'Casual speech. Avoid in formal writing.',
  'register-literary': 'Mostly literary and written. Would stand out in everyday conversation.',
  'register-poetic': 'Poetic. Reserved for verse and elevated style.',
  'register-slang': 'Slang. Very informal and can date quickly.',
  'register-vulgar': 'Vulgar or offensive. Know it, but be careful using it.',
  'register-childish': 'Child or baby talk.',
  'register-archaic': 'Archaic. Found in older texts, not in current speech.',
  'register-technical': 'Technical jargon within a specific field.',
  'register-academic': 'Academic and scholarly writing.',
  'register-legal': 'Legal language.',
  'register-political': 'Political discourse and reporting.',
  'register-medical': 'Medical language.',
  'register-business': 'Business and commercial contexts.',
  'register-journalistic': 'Press and news writing.',
  'register-military': 'Military contexts.',
  'register-religious': 'Religious contexts.',
}
export const usageTagTip = (tag, opts = {}) => {
  const t = clean(tag)
  let base = ''
  if (t === 'region-global') base = 'Used and understood by natives across every region of this language.'
  else if (isRegionTag(t)) {
    const place = t.slice('region-'.length).replace(/-/g, ' ')
    base = `Used in ${place}. Speakers elsewhere may not use it or may say something different.`
  } else if (isFreqTag(t)) base = FREQ_TIPS[t] || 'How often natives actually use this word.'
  else if (isRegisterTag(t)) base = REGISTER_TIPS[t] || 'The context this word is restricted to.'
  else return ''
  return opts.unverified
    ? `${base} · Not confirmed: two independent checks disagreed on this one, so treat it as a rough guide.`
    : base
}
