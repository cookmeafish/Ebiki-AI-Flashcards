// A Discover suggestion reply, shaped for the panel. Pure, tested (suggestion.test.js).
//
// Text fields as TEXT: an object ("translation": {"en": ...}) rendered raw threw "Objects are not valid as a
// React child" and blanked the app. A reply that is a LIST of suggestions or wraps the item ({"suggestion":
// {...}}) uses its first item: both read as unusable and showed an error although the item was right there.
const TEXT_FIELDS = ['term', 'translation', 'draftMeaning', 'why', 'partOfSpeech', 'difficulty', 'domain']
const WRAPPERS = ['suggestion', 'item', 'result', 'data']

export const asText = (v) => (v == null ? ''
  : typeof v === 'string' ? v
    : Array.isArray(v) ? v.map(asText).filter(Boolean).join(', ')
      : typeof v === 'object' ? asText(Object.values(v).find((x) => typeof x === 'string') ?? '')
        : String(v))

const isObj = (x) => !!x && typeof x === 'object' && !Array.isArray(x)

export function shapeSuggestion(reply) {
  let s = reply
  if (Array.isArray(s)) s = s.find(isObj) || null
  if (isObj(s) && !('term' in s)) {
    const inner = WRAPPERS.map((k) => s[k]).map((v) => (Array.isArray(v) ? v.find(isObj) : v)).find((v) => isObj(v) && 'term' in v)
    if (inner) s = inner
  }
  if (!isObj(s)) return null
  return { ...s, ...Object.fromEntries(TEXT_FIELDS.map((k) => [k, asText(s[k]).trim()])) }
}
