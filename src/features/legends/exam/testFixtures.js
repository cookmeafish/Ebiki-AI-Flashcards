// TEST DATA ONLY (imported by the exam tests, never by the app). Everything here is INVENTED and on pottery, a subject
// no course teaches: illustrative, not a course fact. The question is the design's D2.1 example
// (docs/plans/2026-11-16-exam-format-questions.md); the package is a tiny course built around it.

export const POTTERY_CARDS = {
  crazing: { id: 'i9-2-4be07a13', kind: 'term', front: 'Crazing', section: '9.2',
    back: 'Definition: A network of fine cracks in a fired coating that stays attached to the clay under it.\nExample: A mug comes out of the kiln with fine cracks across its shiny surface but nothing has flaked off.\nCategory: 9.2 Faults > After firing\nKey Points: The coating shrank more than the clay; cracks only, no flakes; compare shivering, where flakes lift off' },
  shivering: { id: 'i9-2-90c1d2e4', kind: 'term', front: 'Shivering', section: '9.2',
    back: 'Definition: A fault where the fired coating lifts off the clay in flakes, often at rims and edges.\nExample: Thin flakes of coating come away from the rim of a bowl a few days after firing.\nCategory: 9.2 Faults > After firing\nKey Points: The clay shrank more than the coating; flakes lift off; the opposite fit problem to crazing' },
  crawling: { id: 'i9-2-17f3a6b0', kind: 'term', front: 'Crawling', section: '9.2',
    back: 'Definition: A fault where the coating pulls back during firing and leaves bare patches of clay.\nExample: A plate shows islands of coating with bare clay between them.\nCategory: 9.2 Faults > During firing\nKey Points: Bare patches, not cracks; often from dust or oil on the clay before coating' },
  kiln: { id: 'i9-2-5a6b7c8d', kind: 'term', front: 'Kiln log', section: '9.2',
    back: 'Definition: A written log of each firing: the date, the peak temperature and how long it took to cool.\nExample: A potter checks the kiln log to see whether a batch cooled too fast.\nCategory: 9.2 Faults > Records\nKey Points: A cooling time that is too short points to a fast cool; COE (coefficient of expansion) explains fit faults' },
  brief: { id: 'i9-2-00000001', kind: 'brief', front: 'Firing faults', section: '9.2',
    back: 'Definition: The faults a fired piece can show and how to tell them apart.\nCategory: 9.2 Faults\nKey Points: Cracks, flakes, bare patches, holes' },
}

// Lesson order: crazing and shivering first, then crawling, then the kiln log.
export const potteryPackage = () => ({
  id: 'pottery-test', title: 'Pottery (invented test course)', version: '1',
  areas: [{
    id: 'pot-d9', number: '9.0', title: 'Glazes and firing', weight: 100,
    sections: [{ id: '9.2', title: 'Tell firing faults apart', short: 'Firing faults', brief: POTTERY_CARDS.brief.id }],
    items: Object.values(POTTERY_CARDS).map((c) => ({ ...c })),
    lessons: [
      { section: '9.2', title: 'After firing', itemIds: [POTTERY_CARDS.crazing.id, POTTERY_CARDS.shivering.id] },
      { section: '9.2', title: 'During firing', itemIds: [POTTERY_CARDS.crawling.id] },
      { section: '9.2', title: 'Records', itemIds: [POTTERY_CARDS.kiln.id] },
    ],
    acronyms: [{ id: 'acr-coe', acronym: 'COE', expansions: ['Coefficient of expansion'], tier: 'must', uses: 1 }],
  }],
})

export const POTTERY_HEADINGS = new Set(['Faults after the final firing', 'Faults during firing', 'Kiln records'])

// The design's D2.1 example (its cardSig is filled by the caller: the doc's "1r8k2mz" is illustrative).
export const potteryExample = () => ({
  id: 'i9-2-4be07a13.7', item: 'i9-2-4be07a13', obj: '9.2', slot: 7, rev: 1, cardSig: '1r8k2mz',
  kind: 'scenario', level: 2, pick: 1, word: 'MOST', neg: false,
  stem: 'A potter unloads a batch of mugs after the final firing. Several mugs show a network of fine cracks across the shiny coating, while the fired clay under it is sound and nothing has flaked away.',
  bullets: [],
  ask: 'Which of the following faults does this MOST likely describe?',
  artifact: null,
  options: [
    { t: 'Shivering', ok: false, partly: true, item: 'i9-2-90c1d2e4', why: 'Shivering also comes from a poor fit between coating and clay, but it lifts flakes off the piece, and here nothing has flaked away.' },
    { t: 'Crawling', ok: false, item: 'i9-2-17f3a6b0', why: 'Crawling leaves bare patches where the coating pulled back. The stem describes cracks, not bare patches.' },
    { t: 'Crazing', ok: true, item: 'i9-2-4be07a13', why: 'A network of fine cracks in a coating that stays attached to sound clay is crazing.' },
    { t: 'Pinholing', ok: false, item: null, why: 'Pinholing is small round holes left by escaping gas. It makes no cracks.' },
  ],
  detail: 'a network of fine cracks across the shiny coating',
  runner: 0, edge: 'Both come from a coating and clay that shrink by different amounts. Cracks with nothing flaked away point to crazing.',
  explain: 'The coating shrank more than the clay as the kiln cooled, so it cracked while staying attached.',
  source: { card: 'keyPoints', chapter: 'Faults after the final firing' },
})

// A level 1 definition question on the same card (lesson ready).
export const potteryLevel1 = () => ({
  id: 'i9-2-4be07a13.0', item: 'i9-2-4be07a13', obj: '9.2', slot: 0, rev: 1, cardSig: '1r8k2mz',
  kind: 'definition', level: 1, pick: 1, word: '', neg: false,
  stem: '', bullets: [],
  ask: 'Which of the following faults is a network of fine cracks in a coating that stays attached?',
  artifact: null,
  options: [
    { t: 'Crazing', ok: true, item: 'i9-2-4be07a13', why: 'Fine cracks in a coating that stays on the clay are crazing.' },
    { t: 'Shivering', ok: false, item: 'i9-2-90c1d2e4', why: 'Shivering lifts the coating off in flakes instead of cracking it in place.' },
    { t: 'Pinholing', ok: false, item: null, why: 'Pinholing is small round holes, not a network of cracks.' },
    { t: 'Blistering', ok: false, item: null, why: 'Blistering is raised bubbles in the coating, not cracks.' },
  ],
  detail: '', runner: null, edge: null,
  explain: 'Crazing is cracking in place: the coating shrank more than the clay.',
  source: { card: 'definition', chapter: 'Faults after the final firing' },
})
