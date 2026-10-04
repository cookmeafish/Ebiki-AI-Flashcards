import { describe, it, expect, vi } from 'vitest'
import { makeT } from '../../i18n'
import { raidCatalogText, raidBossFacts, raidProgressText, bestiaryHelpText, familyOf, CATALOG_MAX, BESTIARY_MAX } from './bestiaryHelp'
import { RAID_ORDER, raidBossIndex, raidWhere } from './raid'
import { legendsWhere } from './helpContext'
import { screenWhere, buildSystemPrompt } from '../../components/HelpChat'

// HelpChat renders replies with Markdown (DOMPurify needs a DOM); only its prompt builder is tested here.
vi.mock('../../components/Markdown', () => ({ default: () => null }))

const LANGS = ['en', 'es', 'zh', 'ja']
const en = makeT('en')
const raidOn = (motif) => ({ boss: raidBossIndex(motif), day: { date: '2026-10-03', hp: 20, damage: 6, attempts: 2 }, trophies: [{ motif: 'chronos', date: '2026-10-01' }, { motif: 'glutton', date: '2026-09-01' }] })

describe('raid boss catalog (every screen)', () => {
  it("names the current and next boss, today's wounds and the trophies", () => {
    const text = raidCatalogText({ t: en, raid: raidOn('hydra'), today: '2026-10-03' })
    expect(text).toMatch(/current boss #20 The Tide Hydra of 26, today health 14\/20 after 2 attempt\(s\)/)
    expect(text).toMatch(/Next after a win: #21 The Mirror Knight/)
    expect(text).toMatch(/Raid trophies: 2 \(The Hourglass Colossus, glutton \(retired\)\)/)
    // The current boss in full: every effect with what sets it off and what it does.
    expect(text).toMatch(/Current boss in full:\n#20 The Tide Hydra \(hydra\): ability "Many Heads"/)
    expect(text).toMatch(/trigger: Miss a question\. Effect: 2 heads grow back \(at most 6\)/)
    // Every boss in progression order, with its family.
    RAID_ORDER.forEach((m, i) => expect(text).toContain(`- #${i + 1} `))
    expect(text).toMatch(/#12 The Lich Sovereign: .*Raise Dead.* · family: The Crypt/)
  })
  it('stays inside its budget in every language and never shows a raw key', () => {
    for (const l of LANGS) {
      for (const m of RAID_ORDER) {
        const text = raidCatalogText({ t: makeT(l), raid: raidOn(m), today: '2026-10-03' })
        expect(text.length).toBeLessThanOrEqual(CATALOG_MAX)
        expect(text).not.toMatch(/lg_[a-zA-Z]+_/)
      }
    }
  })
  it('when the budget runs out, the bosses far ahead lose their rule first', () => {
    const text = raidCatalogText({ t: en, raid: raidOn('hydra'), today: '2026-10-03' })
    const line = (n) => text.split('\n').find((l) => l.startsWith(`- #${n} `))
    expect(line(21)).toMatch(/ability "Prism": Each card/) // the next boss keeps its rule
    expect(line(19)).not.toMatch(/ability "/) // the farthest ahead (wrapping) is the first to be shortened
  })
  it('a raid never fought, and one that could not be read', () => {
    expect(raidProgressText(en, null)).toMatch(/not started.*#1 The Hourglass Colossus/)
    expect(raidCatalogText({ t: en, raid: null, known: false })).toMatch(/could not be read/)
    expect(raidCatalogText({ t: en, raid: null })).toMatch(/Current boss in full:\n#1 The Hourglass Colossus/)
  })
  it('a boss in full carries its lore; families name what it is made from', () => {
    const lich = raidBossFacts(en, 'lich', { full: true })
    expect(lich).toMatch(/family: The Crypt \(made from graveyard \+ library\)/)
    expect(lich).toMatch(/Lore: /)
    expect(familyOf('puppeteer').madeFrom).toEqual(['showman'])
    expect(raidBossFacts(en, 'puppeteer')).toMatch(/made from The Infernal Impresario/)
  })
  it("effect names come from the caller (the fight's floater text)", () => {
    expect(raidBossFacts(en, 'hydra', { full: true, fxName: (ab, fx) => `<${ab}:${fx}>` })).toMatch(/- <heads:grow>: trigger/)
  })
})

describe('the bestiary on screen', () => {
  it('a raid boss: rules, effects, lore, the phase shown and the effect just played', () => {
    const text = bestiaryHelpText({ t: en, tab: 'raids', motif: 'chimera', phase: 2, shot: 'aim' })
    expect(text).toMatch(/"Raid bosses" tab/)
    expect(text).toMatch(/On screen: raid boss #7 Chimera Rex \(chimera\)/)
    expect(text).toMatch(/aim \[the player's choice: a button\]/)
    expect(text).toMatch(/Lore: /)
    expect(text).toMatch(/phase 2 of 3; the effect "aim" was just played/)
  })
  it("a Legends stage names the areas of the player's map it guards", () => {
    const map = { areas: [{ title: 'Numbers', motif: 'clockwork', bossName: 'Tick-Tock', status: 'open' }, { title: 'Food', motif: 'garden' }] }
    expect(bestiaryHelpText({ t: en, tab: 'legends', motif: 'clockwork', map })).toMatch(/guards: "Numbers" \(boss "Tick-Tock"\), open/)
    expect(bestiaryHelpText({ t: en, tab: 'legends', motif: 'clockwork', map })).toMatch(/family: The Sands of Time/)
    expect(bestiaryHelpText({ t: en, tab: 'legends', motif: 'ice', map: null })).toMatch(/No area/)
  })
  it('families, Ebi drafts and a test fight', () => {
    expect(bestiaryHelpText({ t: en, tab: 'families' })).toMatch(/- The Theater: The Grand Marionettist <- The Infernal Impresario; The Infernal Impresario <- stage \+ carnival/)
    expect(bestiaryHelpText({ t: en, tab: 'ebi', ebiPick: 'Sleek' })).toMatch(/Showing: Sleek/)
    const fight = bestiaryHelpText({ t: en, tab: 'raids', motif: 'hydra', testFight: 'lich' })
    expect(fight).toMatch(/TEST FIGHT against raid boss #12 The Lich Sovereign/)
    expect(fight).toMatch(/Never give the answer/)
  })
  it('stays inside its budget in every language', () => {
    for (const l of LANGS) {
      const t = makeT(l)
      for (const tab of ['families', 'ebi']) expect(bestiaryHelpText({ t, tab }).length).toBeLessThanOrEqual(BESTIARY_MAX)
      for (const m of RAID_ORDER) {
        const text = bestiaryHelpText({ t, tab: 'raids', motif: m })
        expect(text.length).toBeLessThanOrEqual(BESTIARY_MAX)
        expect(text).not.toMatch(/lg_[a-zA-Z]+_/)
      }
    }
  })
})

describe('what part of the screen Help names', () => {
  it('Legends, raids and the bestiary name themselves', () => {
    expect(legendsWhere({ view: 'map' })).toBe('the Legends map')
    expect(legendsWhere({ view: 'node', node: { kind: 'boss', title: 'Gate' }, area: { title: 'Numbers' } })).toBe('a Legends step running: boss fight "Gate" in area "Numbers"')
    expect(legendsWhere({ view: 'assets' })).toMatch(/bestiary/)
    expect(raidWhere({ view: 'fight', boss: 'The Lich', test: true })).toMatch(/raid TEST fight against The Lich .*: fight running/)
    expect(raidWhere({ view: 'intro', boss: 'The Lich' })).toBe('the daily raid against The Lich: intro card')
  })
  it('the deepest entry on the screen in view wins; other screens never count', () => {
    const fc = [
      { id: 'legends', text: 'x', screen: 'legends', where: 'the Legends map', depth: 1 },
      { id: 'raid', text: 'y', screen: 'legends', where: 'the daily raid against X: fight running', depth: 3 },
      { id: 'bestiary', text: 'z', screen: 'assets', where: 'the bestiary', depth: 2 },
      { id: 'raid-bosses', text: 'catalog', screen: '' },
    ]
    expect(screenWhere(fc, 'legends')).toMatch(/daily raid/)
    expect(screenWhere(fc, 'assets')).toBe('the bestiary')
    expect(screenWhere(fc, 'study')).toBe('')
  })
  it('the Help prompt names the screen part and carries the catalog in the background', () => {
    const fc = [
      { id: 'bestiary', text: 'BESTIARY FACTS', screen: 'assets', where: 'the bestiary (asset view), Raid bosses tab: #7 Chimera Rex', depth: 2 },
      { id: 'raid-bosses', text: 'CATALOG FACTS', screen: '' },
    ]
    const p = buildSystemPrompt({ activeTab: 'assets', featureContext: fc })
    expect(p).toMatch(/RIGHT NOW the user is looking at the BESTIARY \/ ASSET VIEW screen.*, and on it: the bestiary \(asset view\), Raid bosses tab: #7 Chimera Rex\./)
    expect(p).toMatch(/ON SCREEN NOW \(bestiary\)[^\n]*\nBESTIARY FACTS/)
    expect(p).toMatch(/BACKGROUND, raid-bosses[^\n]*\nCATALOG FACTS/)
    const study = buildSystemPrompt({ activeTab: 'study', featureContext: fc })
    expect(study).not.toMatch(/and on it:/)
    expect(study).toMatch(/BACKGROUND, bestiary/)
  })
})
