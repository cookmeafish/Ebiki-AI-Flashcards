// Ebi Studio: turns one raw model reply into what the chat shows and the proposal under review.
// Pure (no React, no DOM) so the rules are tested: studioReply.test.js.
//
// Returns { display, spec, cutOff }:
//   spec   - the parsed <mode>{json}</mode> proposal (an object with a name), null when the reply carries a
//            block that cannot be used, undefined when it carries none (the previous proposal stays).
//   cutOff - the reply held a proposal that was cut off or unreadable: the caller shows studioCutOff and
//            drops the older proposal, so its Apply never sits under a reply that looks new.
//   display - the text without the block, with dashes and shrimp emoji removed (the prompt forbids both;
//            prompts leak). Line-aware like Help: a dash never joins two lines, a digit range keeps a hyphen.
// `edit`: an edit keeps the mode's own name when the proposal leaves it out (buildModeFromSpec), so there a
// proposal only needs one real config key; a NEW mode cannot be made without a name.
const SPEC_KEYS = ['name', 'description', 'fields', 'frontTemplate', 'backTemplate', 'tagRules', 'studyRules', 'chatSuggestions', 'mnemonicHints', 'tagCategories', 'discoverKinds', 'type']
export function studioReply(raw, parseAiJson, { edit = false } = {}) {
  let display = String(raw || '')
  let spec, cutOff = false
  const m = display.match(/<mode>([\s\S]*?)<\/mode>/i)
  if (m) {
    let parsed = null
    try { parsed = parseAiJson(m[1]) } catch { parsed = null }
    const usable = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      && (edit ? SPEC_KEYS.some((k) => parsed[k] != null && parsed[k] !== '') : !!parsed.name)
    if (usable) spec = parsed
    else { spec = null; cutOff = true }
    display = display.replace(/<mode>[\s\S]*?<\/mode>/i, '').trim()
  } else if (/<mode>/i.test(display)) {
    display = display.replace(/<mode>[\s\S]*$/i, '').trim()
    spec = null; cutOff = true
  }
  display = display
    .replace(/(\d)[ \t]*[—–][ \t]*(\d)/g, '$1-$2')
    .replace(/(^|\n)[ \t]*[—–][ \t]*/g, '$1')
    .replace(/[ \t]*[—–][ \t]*(?=\n|$)/g, '')
    .replace(/[ \t]*[—–][ \t]*/g, ', ')
    .replace(/[🦐🦞🦀]️?/gu, '')
  return { display, spec, cutOff }
}
