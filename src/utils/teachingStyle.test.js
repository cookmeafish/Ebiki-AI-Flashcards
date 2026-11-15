// THE TEACHING STYLE RULE (owner, 2026-11-14: Ebi's teaching is fluff free, straight to the point, efficient, accurate
// and easy to understand). Every prompt that writes a question, an explanation, a lesson or a teaching reply carries
// TEACHING_STYLE_RULE, and the review pass rejects padded or hard-to-follow questions. A new teaching prompt goes here.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { TEACHING_STYLE_RULE, QUESTION_CHECK_RULES } from './questionTier'
import { buildQuizPrompt, buildRaidPrompt, buildPlacementPrompt, buildAreaPrompt, buildQuizCheckPrompt } from '../features/legends/prompt'
import { buildExplainPrompt } from '../features/kit/fightJudge'
import { buildLearnChatPrompt } from '../features/kit/learnIt'

const all = (p) => `${p.system || ''}\n${p.user || ''}`
const spanish = { name: 'Spanish', isLanguage: true, learnLang: 'Spanish', userLang: 'English', description: '' }
const comptia = { name: 'CompTIA Security+', isLanguage: false, userLang: 'English', description: 'SY0-701' }
const area = { id: 'a1', title: 'Controls', theme: 'Security controls', motif: 'city', palette: 'sunset', items: [], frozen: false, status: 'open' }
const items = [{ id: 'i1', kind: 'term', front: 'Preventive control', back: 'Stops an incident before it happens.' }, { id: 'i2', kind: 'term', front: 'Detective control', back: 'Finds an incident while or after it happens.' }]
const q = { prompt: 'Which control type stops an incident before it happens?', accepted: ['preventive'], target: 'Preventive control' }

describe('the teaching style rule', () => {
  it('says the owner\'s rule in plain words', () => {
    expect(TEACHING_STYLE_RULE).toMatch(/fluff free/)
    expect(TEACHING_STYLE_RULE).toMatch(/straight to the point/)
    expect(TEACHING_STYLE_RULE).toMatch(/Accuracy first/)
    expect(TEACHING_STYLE_RULE).not.toMatch(/—/)
  })
  it('the review pass rejects padded or hard-to-follow questions (but keeps a needed cue)', () => {
    expect(QUESTION_CHECK_RULES).toMatch(/padded or hard to follow/)
    expect(QUESTION_CHECK_RULES).toMatch(/NOT padding/)
    expect(all(buildQuizCheckPrompt(comptia, items, [q]))).toContain('padded or hard to follow')
  })
  const prompts = {
    'Legends lesson quiz': () => buildQuizPrompt(comptia, area, { kind: 'learn' }, { choiceItems: items }),
    'Legends boss quiz': () => buildQuizPrompt(spanish, area, { kind: 'boss' }, { typedItems: items }),
    'raid questions': () => buildRaidPrompt(comptia, [{ front: 'Preventive control', back: 'Stops an incident.' }]),
    'placement questions': () => buildPlacementPrompt(comptia, 2, 5),
    'Legends lesson content': () => buildAreaPrompt(comptia, area),
    'answer explanation': () => buildExplainPrompt(comptia, q, 'detective', { verdict: 'miss' }),
    'Learn it chat': () => buildLearnChatPrompt(comptia, items[0], [{ role: 'user', content: 'why?' }]),
  }
  for (const [name, build] of Object.entries(prompts)) {
    it(`${name} carries it`, () => { expect(all(build())).toContain(TEACHING_STYLE_RULE) })
  }
  it('Study\'s question writer, Fix question and Learn-it (App.jsx) carry it', () => {
    const app = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', 'App.jsx'), 'utf8')
    expect(app.match(/\$\{TEACHING_STYLE_RULE\}/g)?.length || 0).toBeGreaterThanOrEqual(3)
  })
})
