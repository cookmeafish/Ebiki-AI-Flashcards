import { describe, it, expect } from 'vitest'
import { choiceCheckItems, applyChoiceCheck, checkChoices } from './choiceCheck'

const typed = { kind: 'typed', prompt: 'How do you say "good morning"?', accepted: ['buenos días'], alt: { choices: ['bien dicho', 'buenos días', 'buen día', 'bajo dos'], answerIdx: 1, spare: ['bello día'] } }
const choice = { kind: 'choice', prompt: 'Which port does SSH use?', choices: ['21', '22', '23', '80'], answerIdx: 1 }
const open = { kind: 'typed', prompt: 'Explain', open: true, accepted: [] }

describe('the option check in fights and quizzes', () => {
  it('asks about every question with options (typed alt and choice), never an open one', () => {
    const { at, items } = choiceCheckItems([typed, open, choice])
    expect(at).toEqual([0, 2])
    expect(items[0]).toMatchObject({ answer: 'buenos días', options: typed.alt.choices })
  })
  it('swaps a flagged option for a spare, or marks the options unusable', () => {
    const fixes = applyChoiceCheck([typed, choice], [0, 1], new Map([[0, new Set(['buen día'])], [1, new Set(['21', '23'])]]))
    expect(fixes.get(0).alt.choices).toEqual(['bien dicho', 'buenos días', 'bello día', 'bajo dos'])
    expect(fixes.get(1).choices).toEqual(['22', '80']) // one wrong option left: still offered, never one also right
    const gone = applyChoiceCheck([choice], [0], new Map([[0, new Set(['21', '23', '80'])]])).get(0)
    expect(gone.choices).toBe(null) // unusable as it is: fresh options are asked for (checkChoices), else it goes
    expect(gone.needChoices).toMatchObject({ answer: '22' })
    const one = applyChoiceCheck([choice], [0], new Map([[0, new Set(['21'])]]))
    expect(one.get(0).choices).toEqual(['22', '23', '80'])
  })
  it('one call for the batch; a failed call changes nothing', async () => {
    const ai = { call: async () => '{"flagged":[{"i":0,"options":["buen día"]}]}', json: (r) => JSON.parse(r) }
    const got = await checkChoices(ai, [typed, choice], { isLanguage: true, job: 'raid.check' })
    expect(got.get(0).alt.choices).toContain('bello día')
    expect(got.has(1)).toBe(false)
    const broken = { call: async () => { throw new Error('down') }, json: (r) => r }
    expect((await checkChoices(broken, [typed], {})).size).toBe(0)
  })
})

describe('fresh options: a fight question never goes typed only on the first answer', () => {
  const perro = { kind: 'typed', prompt: 'How do you say "the dog"?', accepted: ['el perro'], alt: { choices: ['el perro', 'perro', 'los perros', 'El Perro'], answerIdx: 0 } }
  const json = (s) => JSON.parse(s)
  const stubAi = (fresh, { flag = () => false } = {}) => {
    const calls = []
    return {
      calls,
      json,
      call: async (system, user) => {
        if (/earlier wrong options were all rejected/.test(system)) { calls.push({ kind: 'fresh', user }); return JSON.stringify(fresh(user)) }
        calls.push({ kind: 'check', user })
        const rows = [...user.matchAll(/^(\d+)\. Question:[\s\S]*?Wrong options: (.+)$/gm)].map((m) => ({ i: +m[1], opts: [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]) }))
        return JSON.stringify({ flagged: rows.map((r) => ({ i: r.i, options: r.opts.filter(flag) })).filter((r) => r.options.length) })
      },
    }
  }
  it('a question the code guard emptied (fightChoices) gets fresh options from ONE call, told what was rejected', async () => {
    const { withPoolChoices } = await import('./fightChoices')
    const q = withPoolChoices(perro, { card: { front: 'el perro', back: 'the dog' }, pool: [], isLanguage: true })
    expect(q.alt).toBeUndefined()
    expect(q.needChoices.rejected.map((r) => r.option)).toEqual(['perro', 'los perros', 'El Perro'])
    const ai = stubAi(() => ({ options: [{ i: 0, wrong: ['el gato', 'perro', 'la casa', 'el perro'] }] }))
    const out = await checkChoices(ai, [q], { isLanguage: true, learnLang: 'Spanish' })
    const got = out.get(0)
    expect([...got.alt.choices].sort()).toEqual(['el gato', 'el perro', 'la casa']) // "perro" (rejected, also right) never back
    expect(got.alt.choices[got.alt.answerIdx]).toBe('el perro')
    expect(got.needChoices).toBeUndefined()
    expect(got.typedOnly).toBeUndefined()
    const fresh = ai.calls.filter((c) => c.kind === 'fresh')
    expect(fresh).toHaveLength(1)
    expect(fresh[0].user).toMatch(/Rejected options \(never again\): "perro"/)
  })
  it('a typed question whose options the CHECK flagged all gets fresh ones, and they are checked too', async () => {
    const q = { kind: 'typed', prompt: 'How do you say "good morning"?', accepted: ['buenos días'], alt: { choices: ['buenos días', 'buen día', 'buen dia', 'buenas'], answerIdx: 0 } }
    const ai = stubAi(() => ({ options: [{ i: 0, wrong: ['bien dicho', 'bajo dos', 'buenas tardes'] }] }), { flag: (o) => /^buen|^buenas$/.test(o) })
    const got = (await checkChoices(ai, [q], { isLanguage: true })).get(0)
    expect([...got.alt.choices].sort()).toEqual(['bajo dos', 'bien dicho', 'buenos días'])
  })
  it('the retry brings nothing fair: the question goes typed only (`typedOnly`), never with an option that is also right', async () => {
    const { withPoolChoices } = await import('./fightChoices')
    const q = withPoolChoices(perro, { card: { front: 'el perro', back: 'the dog' }, pool: [], isLanguage: true })
    const ai = stubAi(() => ({ options: [{ i: 0, wrong: ['perro', 'los perros', 'el perrito'] }] }))
    const got = (await checkChoices(ai, [q], { isLanguage: true })).get(0)
    expect(got.alt).toBeUndefined()
    expect(got.typedOnly).toBe(true)
    expect(got.needChoices).toBeUndefined()
  })
  it('a failed retry call (error, junk) is typed only too; a choice-only question is never sent', async () => {
    const { withPoolChoices } = await import('./fightChoices')
    const q = withPoolChoices(perro, { card: { front: 'el perro', back: 'the dog' }, pool: [], isLanguage: true })
    const broken = { json: JSON.parse, call: async () => { throw new Error('API 500') } }
    expect((await checkChoices(broken, [q], { isLanguage: true })).get(0).typedOnly).toBe(true)
    const junk = { json: JSON.parse, call: async () => 'not json' }
    expect((await checkChoices(junk, [q], { isLanguage: true })).get(0).typedOnly).toBe(true)
  })
})

describe('fresh options for a choice-only question (Legends lessons)', () => {
  const json = JSON.parse
  it('gets new options, or is unusable (null) when none come back fair', async () => {
    const ok = { json, call: async (system, user) => (/earlier wrong options were all rejected/.test(system) ? JSON.stringify({ options: [{ i: 0, wrong: ['25', '110', '443'] }] }) : /Wrong options: "21", "23", "80"/.test(user) ? JSON.stringify({ flagged: [{ i: 0, options: ['21', '23', '80'] }] }) : JSON.stringify({ flagged: [] })) }
    const got = (await checkChoices(ok, [choice])).get(0)
    expect([...got.choices].sort()).toEqual(['110', '22', '25', '443'])
    expect(got.choices[got.answerIdx]).toBe('22')
    const bad = { json, call: async (system) => (/earlier wrong options were all rejected/.test(system) ? JSON.stringify({ options: [{ i: 0, wrong: ['22', '21'] }] }) : JSON.stringify({ flagged: [{ i: 0, options: ['21', '23', '80'] }] })) }
    expect((await checkChoices(bad, [choice])).get(0)).toBe(null)
  })
})

describe('fresh options keep to the prefix hint the question shows', () => {
  const json = JSON.parse
  const q = { kind: 'typed', prompt: 'Write the word for "snowfall".', accepted: ['nevada'], alt: { choices: ['nevada', 'nieve', 'neblina', 'nube'], answerIdx: 0 } }
  const ai = (wrong) => {
    let checks = 0
    return { json, call: async (system, user) => {
      if (/earlier wrong options were all rejected/.test(system)) { expect(user).toMatch(/sees the hint "n…"/); return JSON.stringify({ options: [{ i: 0, wrong }] }) }
      checks++
      return JSON.stringify({ flagged: checks === 1 ? [{ i: 0, options: ['nieve', 'neblina', 'nube'] }] : [] })
    } }
  }
  it('options sharing the hint: the hint stays', async () => {
    const got = (await checkChoices(ai(['noche', 'nido', 'casa']), [q], { isLanguage: true })).get(0)
    expect([...got.alt.choices].sort()).toEqual(['nevada', 'nido', 'noche'])
    expect(got.noHint).toBeUndefined()
  })
  it('none sharing it: the question shows no hint, never options the hint gives away', async () => {
    const got = (await checkChoices(ai(['casa', 'mesa', 'perro']), [q], { isLanguage: true })).get(0)
    expect(got.alt.choices).toHaveLength(4)
    expect(got.noHint).toBe(true)
  })
})

describe('round 3 review: the fresh options run the SAME guard', () => {
  const json = JSON.parse
  const flagAllOnce = (wrong) => {
    let checks = 0
    return { json, call: async (system) => {
      if (/earlier wrong options were all rejected/.test(system)) return JSON.stringify({ options: [{ i: 0, wrong }] })
      checks++
      return JSON.stringify({ flagged: checks === 1 ? [{ i: 0, options: ['bello día', 'buena dama', 'bajo dos'] }] : [] })
    } }
  }
  it('a retry option the DECK says means the same ("buen día" = good morning) never ships', async () => {
    const { withPoolChoices } = await import('./fightChoices')
    const pool = [{ front: 'buen día', back: 'good morning' }, { front: 'bien dicho', back: 'well said' }]
    const q0 = { kind: 'typed', prompt: 'How do you say "good morning"?', accepted: ['buenos días'], open: false, alt: { choices: ['buenos días', 'bello día', 'buena dama', 'bajo dos'], answerIdx: 0 } }
    const q = withPoolChoices(q0, { card: { front: 'buenos días', back: 'good morning' }, pool, isLanguage: true })
    expect(q._guard.entries.some((e) => e.word === 'buen día')).toBe(true)
    const got = (await checkChoices(flagAllOnce(['buen día', 'bien dicho', 'buena noche']), [q], { isLanguage: true })).get(0)
    expect(got.alt.choices).not.toContain('buen día')
    expect(got.alt.choices).toContain('buenos días')
  })
  it('a CompTIA fight keeps its choices: "RAID 6" is a fair wrong option for "RAID 5", no retry needed', async () => {
    const { withPoolChoices } = await import('./fightChoices')
    const q0 = { kind: 'typed', prompt: 'Which RAID level stripes with single parity?', accepted: ['RAID 5'], open: false, alt: { choices: ['RAID 5', 'RAID 6', 'RAID 10', 'RAID 0'], answerIdx: 0 } }
    const q = withPoolChoices(q0, { card: { front: 'RAID 5', back: 'Striping with distributed parity' }, pool: [], isLanguage: false })
    expect(q.needChoices).toBeUndefined()
    expect([...q.alt.choices].sort()).toEqual(['RAID 0', 'RAID 10', 'RAID 5', 'RAID 6'])
  })
})
