import { describe, it, expect } from 'vitest'
import { parseTalkReply, hintGivesAway, GOAL_TAG } from './prompt'
import { parseScene } from '../kit/scene'

const spanish = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', rules: '' }
const immersion = { ...spanish, userLang: 'Spanish' }
const chinese = { ...spanish, name: 'Chinese', learnLang: 'Chinese' }
const comptia = { name: 'CompTIA', isLanguage: false, learnLang: 'English', userLang: 'English' }

describe('parseTalkReply', () => {
  it('reads the goal tag in any spacing or case and drops it', () => {
    for (const tag of [GOAL_TAG, '[goal done]', '[GOAL_DONE]', '[ Goal-Done ]', '[goal reached]']) {
      const r = parseTalkReply(`¡Perfecto, aquí tiene su café! ${tag}`)
      expect(r.reached).toBe(true)
      expect(r.text).toBe('¡Perfecto, aquí tiene su café!')
    }
    expect(parseTalkReply('Hola, ¿qué desea?').reached).toBe(false)
  })
  it('drops a leading "Ebi:" and cuts a learner line the model went on to write', () => {
    expect(parseTalkReply('Ebi: Hola, ¿cómo estás?').text).toBe('Hola, ¿cómo estás?')
    const r = parseTalkReply('Muy bien. ¿Y tú?\nLearner: Bien, gracias.\nEbi: Me alegro.')
    expect(r.text).toBe('Muy bien. ¿Y tú?')
    expect(parseTalkReply('Sure.\n\nStudent: ok [GOAL-DONE]').text).toBe('Sure.')
  })
  it('never throws on odd replies', () => {
    for (const v of [null, undefined, 42, {}, '', '   ', 'Learner: hi']) {
      const r = parseTalkReply(v)
      expect(typeof r.text).toBe('string')
      expect(typeof r.reached).toBe('boolean')
    }
    expect(parseTalkReply('Learner: hi').text).toBe('Learner: hi') // nothing before it: kept, never emptied
  })
})

describe('hintGivesAway with the partner\'s lines', () => {
  const items = [{ id: 'a', front: '¿Cómo estás?' }]
  const partner = ['Buenos días, señor. ¿Qué le pongo hoy?']
  it('refuses a hint that copies 3+ words of the partner line', () => {
    expect(hintGivesAway('Answer "qué le pongo" back to him.', spanish, items, partner)).toBe(true)
    expect(hintGivesAway('Tell him what you want to drink.', spanish, items, partner)).toBe(false)
    expect(hintGivesAway('Greet him back: buenos días.', spanish, items, partner)).toBe(false) // 2 words only
  })
  it('skips the partner check with full immersion and for general subjects', () => {
    expect(hintGivesAway('Dile qué le pongo hoy.', immersion, items, partner)).toBe(false)
    expect(hintGivesAway('Explain "the default gateway is" here.', comptia, [], ['The default gateway is wrong.'])).toBe(false)
  })
  it('matches unspaced scripts by a 4-character run', () => {
    const zhPartner = ['你今天想喝什么茶呢？']
    expect(hintGivesAway('Say 想喝什么茶 back.', chinese, [], zhPartner)).toBe(true)
    expect(hintGivesAway('Tell her which tea you like.', chinese, [], zhPartner)).toBe(false)
  })
  it('keeps the practice phrase check and tolerates odd input', () => {
    expect(hintGivesAway('Say ¿Cómo estás?', spanish, items, [])).toBe(true)
    expect(hintGivesAway('Ask how he is.', spanish, [null, {}], [null, 3])).toBe(false)
  })
})

describe('parseScene with messy replies', () => {
  it('keeps a usable story and drops junk lines and questions', () => {
    const s = parseScene({
      title: ['x'], cast: { A: { n: 1 }, B: 'Luis' },
      lines: [{ speaker: 'a', text: 'Hola' }, null, { speaker: 'Z', text: 'Narración' }, { speaker: 'B', text: { t: 1 } }, { speaker: 'B', text: 'Adiós' }],
      questions: [null, 'x', { type: 'choice', question: '¿Quién?', choices: ['A', 'B'], answer: 1 }],
    })
    expect(s.title).toBe('')
    expect(s.cast).toEqual({ A: 'A', B: 'Luis' })
    expect(s.lines.map((l) => l.speaker)).toEqual(['A', 'N', 'B'])
    expect(s.questions).toHaveLength(1)
  })
  it('refuses too few lines', () => {
    expect(parseScene({ lines: [{ speaker: 'A', text: 'Hola' }] })).toBe(null)
    expect(parseScene(null)).toBe(null)
  })
})
