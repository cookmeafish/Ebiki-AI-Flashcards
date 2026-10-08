// Text keys the app BUILDS at run time (t(`lg_pow_${id}`), t('tab_' + id), tCount(t, `game_q_${kind}`, n) ...) are
// invisible to i18n-coverage.test.js, which only reads literal keys. Each family below is checked against the list
// its ids really come from, so a new power, raid boss, quest, band or verdict without its text fails here instead of
// showing a raw key on screen. locales.test.js keeps every locale's keys equal to English, so English is checked
// here and every language follows.
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { LANGUAGES } from './languages'
import { RAID_ORDER, RAID_ABILITY } from '../features/legends/raid'
import { POWER_IDS, POWERS } from '../features/legends/powers'
import { POWER_FX, POWER_PROC } from '../features/legends/impact/PowerFx'
import { NODE_KINDS, CODEX_TIERS } from '../features/legends/map'
import { HEADS } from '../features/legends/abilities/chimera'
import { REASON_KEYS, GOAL_KEYS } from '../features/legends/Questionnaire'
import { LANGUAGE_BANDS, GENERAL_BANDS } from '../features/kit/learner'
import { contextSources } from '../features/kit/learnerContext'
import { GOALS, TIERS as GAME_TIERS, questKinds } from '../features/game/engine'
import { SCORE_AXES } from '../features/roleplay/scoring'
import { VERDICTS } from '../features/ebi-call/grades'
import { CAUSES } from '../features/leech-doctor/leeches'
import { ROLE_STAKES } from '../config/modelAdvisor'
import { POS_COLORS } from '../config/prompts'
import { CORE_NAV } from '../shell/layout'

const en = LANGUAGES.find((l) => l.code === 'en').strings
const SRC = path.resolve(__dirname, '..')
// A literal list kept inside a component (not exported): read from its source so it can't drift from the test.
function literalList(file, name) {
  const src = fs.readFileSync(path.join(SRC, file), 'utf8')
  const m = src.match(new RegExp(`const ${name} = (\\[[^\\]]*\\]|\\{[\\s\\S]*?\\n\\})`))
  if (!m) throw new Error(`${name} not found in ${file}`)
  return m[1].startsWith('[') ? [...m[1].matchAll(/['"]([\w-]+)['"]/g)].map((x) => x[1]) : [...m[1].matchAll(/^\s*([A-Za-z]\w*)\s*:/gm)].map((x) => x[1])
}
const missing = (keys) => keys.filter((k) => en[k] == null)

const abilities = [...new Set(Object.values(RAID_ABILITY).filter(Boolean))]
const FULL_SNAPSHOT = {
  deck: { ok: true, studied: 1, new: 1 }, study: { sessions: 1 }, chats: { items: [1] }, slips: { count: 1 },
  discover: { profile: {} }, practice: { count: 1 }, extra: [{ ok: true, text: 'x' }],
}

const FAMILIES = {
  'raid boss names and lore': RAID_ORDER.flatMap((m) => [`lg_raidBoss_${m}`, `lg_raidLore_${m}`]),
  'raid abilities': abilities.flatMap((a) => [`lg_ability_${a}`, `lg_abilityDesc_${a}`, `lg_abilityLine_${a}`]),
  'power names and tips': POWER_IDS.flatMap((id) => [`lg_pow_${id}`, `lg_powDesc_${id}`]),
  // Shield, Sharpen and Ward are the powers that stay armed as `true` (RaidRun's armed line shows lg_powUp_<id>).
  'armed power lines': POWER_IDS.filter((id) => !POWERS[id].window && ['shield', 'sharpen', 'ward'].includes(id)).map((id) => `lg_powUp_${id}`),
  'power cast and hit labels': [...Object.values(POWER_FX).map((s) => s.label), ...Object.values(POWER_PROC).map((s) => s.label)].filter(Boolean),
  'Chimera head buttons and bars': HEADS.flatMap((h) => [`lg_act_aim_${h}`, `lg_hud_head_${h}`]),
  'map step kinds': [...NODE_KINDS, 'weak'].map((k) => `lg_kind_${k}`),
  'codex tiers': CODEX_TIERS.map((k) => `lg_tier_${k}`),
  'learner bands': [...LANGUAGE_BANDS, ...GENERAL_BANDS].map((b) => `lg_band_${b.key}`),
  'evidence sources': contextSources(FULL_SNAPSHOT).map((id) => `lg_src_${id}`),
  'questionnaire answers': [...REASON_KEYS.map((r) => `lg_reason_${r.key}`), ...GOAL_KEYS.flatMap((g) => [`game_goal_${g.key}`, `lg_goalDesc_${g.key}`])],
  'map edit marks': literalList('features/legends/EditPanel.jsx', 'KIND').map((k) => `lg_edit_${k}`),
  'daily goals': GOALS.map((g) => `game_goal_${g.key}`),
  'league tiers': GAME_TIERS.map((k) => `game_tier_${k}`),
  'quests (count labels)': questKinds().flatMap((k) => [`game_q_${k}`, `game_q_${k}One`]),
  'roleplay score axes': Object.values(SCORE_AXES).flat().map((a) => `rp_axis_${a}`),
  'Ebi Call verdicts': VERDICTS.map((v) => `call_v_${v}`),
  'Leech Doctor causes': CAUSES.map((c) => `doc_cause_${c}`),
  'Discover level tiers': literalList('components/DiscoverPanel.jsx', 'TIERS').map((k) => `d_tier_${k}`),
  'AI roles in Settings': ROLE_STAKES.map((r) => `aiRole_${r.role}`),
  'parts of speech (Picture)': Object.keys(POS_COLORS).map((k) => `pos_${k}`),
  'feedback categories (Study)': literalList('App.jsx', 'FEEDBACK_CAT_ORDER').map((k) => `fbcat_${k}`),
  'rating words (Study)': ['again', 'hard', 'good', 'easy'].map((r) => `study_rate${r[0].toUpperCase()}${r.slice(1)}`),
  // Core screens only: feature screens carry their own labelKey/descKey (checked in features.test.js).
  'core sidebar screens': CORE_NAV.map((n) => n.id).flatMap((id) => [`tab_${id}`, `nav_desc_${id}`]),
}

describe('text keys built at run time', () => {
  for (const [name, keys] of Object.entries(FAMILIES)) {
    it(`${name}: every key exists`, () => {
      expect(keys.length, `${name} found no ids (did its source move?)`).toBeGreaterThan(0)
      expect(missing(keys)).toEqual([])
    })
  }
})
